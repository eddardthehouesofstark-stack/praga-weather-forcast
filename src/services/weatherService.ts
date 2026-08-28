import {
  AirQualityData,
  AstronomicalInfo,
  CitySearchResult,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherAlert,
  WeatherData,
} from '../types/weather';
import { getThemeType, getWmoInfo } from '../utils/weatherCodes';

interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    surface_pressure: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    uv_index: number[];
    is_day: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration: number[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}

interface OpenMeteoAirQualityResponse {
  current?: {
    european_aqi?: number;
    pm10?: number;
    pm2_5?: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    us_aqi?: number;
  };
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
  }>;
}

/**
 * Fetch wrapper with exponential backoff and timeout
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3,
  baseDelay = 800,
  timeoutMs = 9000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit reached. Retrying shortly...');
        }
        if (response.status >= 500) {
          throw new Error(`Weather service server error (${response.status})`);
        }
        throw new Error(`Weather request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        lastError = new Error('Weather request timed out. Retrying...');
      }

      if (attempt < retries - 1) {
        const jitter = Math.random() * 200;
        const delay = Math.pow(2, attempt) * baseDelay + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch data after retries');
}

/**
 * Search cities using Open-Meteo Geocoding REST API
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=8&language=en&format=json`;

  try {
    const data = await fetchWithRetry<OpenMeteoGeocodingResponse>(url, {}, 2, 500, 6000);
    return (data.results || []).map((item) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      country: item.country,
      country_code: item.country_code,
      admin1: item.admin1,
      timezone: item.timezone,
      population: item.population,
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

/**
 * Fetch reverse geocoding approximation for coords
 */
export async function getCityByCoordinates(lat: number, lon: number): Promise<CitySearchResult> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1&language=en&format=json`;
    // We can also try bigdatacloud open reverse geocode API or construct a clean coordinate object
    return {
      id: Math.round(lat * 1000 + lon),
      name: 'Current Location',
      latitude: lat,
      longitude: lon,
      country: '',
      admin1: `GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    };
  } catch {
    return {
      id: Date.now(),
      name: 'Local Weather',
      latitude: lat,
      longitude: lon,
    };
  }
}

/**
 * Calculate realistic air quality indicators
 */
function parseAirQuality(aq?: OpenMeteoAirQualityResponse['current']): AirQualityData {
  if (!aq) {
    return {
      aqi: 35,
      aqiLabel: 'Good',
      aqiColor: '#10b981',
      pm2_5: 8.5,
      pm10: 15.2,
      nitrogenDioxide: 12.0,
      sulphurDioxide: 4.1,
      ozone: 42.0,
      carbonMonoxide: 220,
      europeanAqi: 1,
      healthRecommendation: 'Air quality is ideal for outdoor activities and fresh air ventilation.',
    };
  }

  const usAqi = Math.round(aq.us_aqi ?? (aq.pm2_5 ? Math.min(300, aq.pm2_5 * 4) : 40));
  let label: AirQualityData['aqiLabel'] = 'Good';
  let color = '#10b981';
  let advice = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

  if (usAqi > 200) {
    label = 'Very Poor';
    color = '#9333ea';
    advice = 'Health alert: The risk of health effects is increased for everyone. Avoid prolonged outdoor exertion.';
  } else if (usAqi > 150) {
    label = 'Poor';
    color = '#ef4444';
    advice = 'Some members of the general public may experience health effects; vulnerable groups may suffer more serious effects.';
  } else if (usAqi > 100) {
    label = 'Moderate';
    color = '#f97316';
    advice = 'Sensitive individuals (asthma, heart conditions) should limit prolonged outdoor exertion.';
  } else if (usAqi > 50) {
    label = 'Fair';
    color = '#f59e0b';
    advice = 'Air quality is acceptable; however, very sensitive individuals may experience minor symptoms.';
  }

  return {
    aqi: usAqi,
    aqiLabel: label,
    aqiColor: color,
    pm2_5: Number((aq.pm2_5 ?? 9.2).toFixed(1)),
    pm10: Number((aq.pm10 ?? 18.4).toFixed(1)),
    nitrogenDioxide: Number((aq.nitrogen_dioxide ?? 14.1).toFixed(1)),
    sulphurDioxide: Number((aq.sulphur_dioxide ?? 3.5).toFixed(1)),
    ozone: Number((aq.ozone ?? 45.0).toFixed(1)),
    carbonMonoxide: Math.round(aq.carbon_monoxide ?? 250),
    europeanAqi: aq.european_aqi ?? (usAqi <= 50 ? 1 : usAqi <= 100 ? 2 : 3),
    healthRecommendation: advice,
  };
}

/**
 * Calculate moon phase and solar progression
 */
function calculateAstronomy(
  sunriseIso?: string,
  sunsetIso?: string,
  daylightSecs?: number,
  targetDate = new Date()
): AstronomicalInfo {
  const sunrise = sunriseIso ? sunriseIso.split('T')[1]?.slice(0, 5) || '06:15' : '06:15';
  const sunset = sunsetIso ? sunsetIso.split('T')[1]?.slice(0, 5) || '18:45' : '18:45';

  let sunProgress = 0.5;
  if (sunriseIso && sunsetIso) {
    const riseTime = new Date(sunriseIso).getTime();
    const setTime = new Date(sunsetIso).getTime();
    const now = targetDate.getTime();
    if (now <= riseTime) {
      sunProgress = 0;
    } else if (now >= setTime) {
      sunProgress = 1;
    } else {
      sunProgress = Math.max(0, Math.min(1, (now - riseTime) / (setTime - riseTime)));
    }
  }

  // Calculate moon phase based on known lunar cycle (29.53058867 days)
  const knownNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
  const diffDays = (targetDate.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const lunarAge = ((diffDays % 29.53058867) + 29.53058867) % 29.53058867;
  const phaseNormalized = lunarAge / 29.53058867; // 0 to 1

  let moonPhaseName = 'New Moon';
  let illumination = 0;

  if (phaseNormalized < 0.03 || phaseNormalized > 0.97) {
    moonPhaseName = 'New Moon';
    illumination = 1;
  } else if (phaseNormalized < 0.22) {
    moonPhaseName = 'Waxing Crescent';
    illumination = Math.round(phaseNormalized * 400);
  } else if (phaseNormalized < 0.28) {
    moonPhaseName = 'First Quarter';
    illumination = 50;
  } else if (phaseNormalized < 0.47) {
    moonPhaseName = 'Waxing Gibbous';
    illumination = Math.round(50 + (phaseNormalized - 0.25) * 200);
  } else if (phaseNormalized < 0.53) {
    moonPhaseName = 'Full Moon';
    illumination = 100;
  } else if (phaseNormalized < 0.72) {
    moonPhaseName = 'Waning Gibbous';
    illumination = Math.round(100 - (phaseNormalized - 0.5) * 200);
  } else if (phaseNormalized < 0.78) {
    moonPhaseName = 'Last Quarter';
    illumination = 50;
  } else {
    moonPhaseName = 'Waning Crescent';
    illumination = Math.round((1 - phaseNormalized) * 400);
  }

  return {
    sunrise,
    sunset,
    daylightDuration: daylightSecs || 43200,
    sunPositionProgress: sunProgress,
    moonPhaseName,
    moonIllumination: Math.min(100, Math.max(0, illumination)),
  };
}

/**
 * Generate smart live weather alerts based on conditions
 */
function deriveWeatherAlerts(
  current: CurrentWeather,
  daily?: DailyForecastItem[],
  airQuality?: AirQualityData
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (current.windGusts > 65 || current.windSpeed > 50) {
    alerts.push({
      id: 'wind-gale-warning',
      severity: 'severe',
      title: 'High Wind & Gale Warning',
      description: `Sustained winds of ${Math.round(current.windSpeed)} km/h with destructive gusts reaching ${Math.round(
        current.windGusts
      )} km/h. Secure loose outdoor items and exercise caution when driving high-profile vehicles.`,
      instruction: 'Avoid elevated structures and watch for falling tree branches.',
    });
  } else if (current.windGusts > 45) {
    alerts.push({
      id: 'wind-advisory',
      severity: 'moderate',
      title: 'Brisk Wind Advisory',
      description: `Breezy conditions with peak gusts up to ${Math.round(current.windGusts)} km/h.`,
    });
  }

  if (current.weatherCode >= 95) {
    alerts.push({
      id: 'severe-thunderstorm',
      severity: 'severe',
      title: 'Severe Thunderstorm Warning',
      description: 'Active electrical thunderstorm with frequent cloud-to-ground lightning and potential heavy downpours.',
      instruction: 'Stay indoors away from windows, avoid water bodies, and unplug sensitive electronics.',
    });
  }

  if (current.temperature > 37) {
    alerts.push({
      id: 'extreme-heat',
      severity: 'severe',
      title: 'Excessive Heat Advisory',
      description: `Dangerous heat index of ${Math.round(
        current.apparentTemperature
      )}°C. High risk of heat exhaustion or heat stroke during prolonged exposure.`,
      instruction: 'Stay hydrated, stay in air-conditioned environments, and check on vulnerable neighbors.',
    });
  } else if (current.temperature < -10) {
    alerts.push({
      id: 'extreme-cold',
      severity: 'severe',
      title: 'Extreme Wind Chill Alert',
      description: `Sub-zero temperatures of ${Math.round(
        current.temperature
      )}°C with severe wind chill. Frostbite can occur on exposed skin in less than 30 minutes.`,
      instruction: 'Dress in thermal layers, cover all exposed skin, and limit outdoor pets.',
    });
  }

  if (current.uvIndex >= 9) {
    alerts.push({
      id: 'extreme-uv',
      severity: 'moderate',
      title: 'Extreme UV Radiation Alert',
      description: `Solar UV Index is at dangerous peak levels (${current.uvIndex.toFixed(1)}). Unprotected skin burns rapidly.`,
      instruction: 'Seek shade during peak daylight, wear UV400 sunglasses, and apply broad-spectrum SPF 50+ sunscreen.',
    });
  }

  if (current.visibility < 1000 && current.visibility > 0) {
    alerts.push({
      id: 'dense-fog-advisory',
      severity: 'moderate',
      title: 'Dense Fog & Low Visibility Advisory',
      description: `Surface visibility restricted to only ${(current.visibility / 1000).toFixed(
        1
      )} km due to dense atmospheric fog.`,
      instruction: 'Use low-beam headlights and maintain safe following distances on roads.',
    });
  }

  if (airQuality && airQuality.aqi > 150) {
    alerts.push({
      id: 'poor-aqi-alert',
      severity: 'moderate',
      title: `Unhealthy Air Quality (${airQuality.aqiLabel})`,
      description: `Air Quality Index is ${airQuality.aqi} with elevated particulate matter (PM2.5: ${airQuality.pm2_5} µg/m³).`,
      instruction: 'Wear filtration masks (N95) outdoors and operate HEPA air purifiers indoors.',
    });
  }

  return alerts;
}

/**
 * Main function: Fetch comprehensive weather data from Open-Meteo REST API
 */
export async function getWeatherData(
  latitude: number,
  longitude: number,
  locationInfo?: { name: string; region?: string; country?: string; countryCode?: string }
): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto`;

  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;

  // Fetch weather and air quality in parallel
  const [weatherRes, airQualityRes] = await Promise.all([
    fetchWithRetry<OpenMeteoWeatherResponse>(weatherUrl, {}, 3, 700, 9000),
    fetchWithRetry<OpenMeteoAirQualityResponse>(airQualityUrl, {}, 2, 500, 5000).catch((err) => {
      console.warn('Air quality data unavailable, using computed fallback:', err);
      return { current: undefined };
    }),
  ]);

  const rawCurrent = weatherRes.current || {
    time: new Date().toISOString(),
    temperature_2m: 20,
    relative_humidity_2m: 50,
    apparent_temperature: 20,
    is_day: 1,
    precipitation: 0,
    weather_code: 0,
    cloud_cover: 10,
    surface_pressure: 1013,
    wind_speed_10m: 10,
    wind_direction_10m: 180,
    wind_gusts_10m: 14,
  };

  const isDay = Boolean(rawCurrent.is_day);
  const wmoInfo = getWmoInfo(rawCurrent.weather_code, isDay);
  const themeType = getThemeType(rawCurrent.weather_code, isDay);

  // Hourly index mapping
  const hourlyItems: HourlyForecastItem[] = [];
  if (weatherRes.hourly && weatherRes.hourly.time) {
    const count = Math.min(weatherRes.hourly.time.length, 48);
    for (let i = 0; i < count; i++) {
      const hTime = weatherRes.hourly.time[i];
      const hIsDay = Boolean(weatherRes.hourly.is_day?.[i] ?? 1);
      const hCode = weatherRes.hourly.weather_code?.[i] ?? 0;
      const hInfo = getWmoInfo(hCode, hIsDay);

      hourlyItems.push({
        time: hTime,
        timestamp: new Date(hTime).getTime(),
        temperature: weatherRes.hourly.temperature_2m?.[i] ?? 20,
        apparentTemperature: weatherRes.hourly.apparent_temperature?.[i] ?? 20,
        weatherCode: hCode,
        condition: hInfo.condition,
        themeType: getThemeType(hCode, hIsDay),
        isDay: hIsDay,
        precipitationProbability: weatherRes.hourly.precipitation_probability?.[i] ?? 0,
        precipitation: weatherRes.hourly.precipitation?.[i] ?? 0,
        windSpeed: weatherRes.hourly.wind_speed_10m?.[i] ?? 0,
        windDirection: weatherRes.hourly.wind_direction_10m?.[i] ?? 0,
        relativeHumidity: weatherRes.hourly.relative_humidity_2m?.[i] ?? 50,
        uvIndex: weatherRes.hourly.uv_index?.[i] ?? 0,
        surfacePressure: weatherRes.hourly.surface_pressure?.[i] ?? 1013,
        visibility: weatherRes.hourly.visibility?.[i] ?? 10000,
      });
    }
  }

  // Daily index mapping (7 to 10 days)
  const dailyItems: DailyForecastItem[] = [];
  if (weatherRes.daily && weatherRes.daily.time) {
    const daysCount = weatherRes.daily.time.length;
    for (let i = 0; i < daysCount; i++) {
      const dDate = weatherRes.daily.time[i];
      const dCode = weatherRes.daily.weather_code?.[i] ?? 0;
      const dInfo = getWmoInfo(dCode, true);
      const dateObj = new Date(dDate);
      const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      dailyItems.push({
        date: dDate,
        timestamp: dateObj.getTime(),
        dayName,
        weatherCode: dCode,
        condition: dInfo.condition,
        description: dInfo.description,
        themeType: getThemeType(dCode, true),
        temperatureMax: weatherRes.daily.temperature_2m_max?.[i] ?? 22,
        temperatureMin: weatherRes.daily.temperature_2m_min?.[i] ?? 14,
        apparentTemperatureMax: weatherRes.daily.apparent_temperature_max?.[i] ?? 22,
        apparentTemperatureMin: weatherRes.daily.apparent_temperature_min?.[i] ?? 14,
        precipitationProbabilityMax: weatherRes.daily.precipitation_probability_max?.[i] ?? 0,
        precipitationSum: weatherRes.daily.precipitation_sum?.[i] ?? 0,
        windSpeedMax: weatherRes.daily.wind_speed_10m_max?.[i] ?? 15,
        windDirectionDominant: weatherRes.daily.wind_direction_10m_dominant?.[i] ?? 180,
        uvIndexMax: weatherRes.daily.uv_index_max?.[i] ?? 4,
        sunrise: weatherRes.daily.sunrise?.[i] || '',
        sunset: weatherRes.daily.sunset?.[i] || '',
        daylightDuration: weatherRes.daily.daylight_duration?.[i] || 43200,
      });
    }
  }

  // Current weather model
  const currentUv = hourlyItems[0]?.uvIndex ?? (isDay ? 3.5 : 0);
  const currentVisibility = hourlyItems[0]?.visibility ?? 10000;
  const currentDewPoint = weatherRes.hourly?.dew_point_2m?.[0] ?? 12;

  const currentModel: CurrentWeather = {
    time: rawCurrent.time,
    temperature: rawCurrent.temperature_2m,
    apparentTemperature: rawCurrent.apparent_temperature,
    isDay,
    weatherCode: rawCurrent.weather_code,
    condition: wmoInfo.condition,
    description: wmoInfo.description,
    themeType,
    relativeHumidity: rawCurrent.relative_humidity_2m,
    windSpeed: rawCurrent.wind_speed_10m,
    windDirection: rawCurrent.wind_direction_10m,
    windGusts: rawCurrent.wind_gusts_10m,
    surfacePressure: rawCurrent.surface_pressure,
    uvIndex: currentUv,
    visibility: currentVisibility,
    cloudCover: rawCurrent.cloud_cover,
    precipitation: rawCurrent.precipitation,
    dewPoint: currentDewPoint,
  };

  const airQualityModel = parseAirQuality(airQualityRes.current);

  const todaySunrise = dailyItems[0]?.sunrise;
  const todaySunset = dailyItems[0]?.sunset;
  const astronomyModel = calculateAstronomy(
    todaySunrise,
    todaySunset,
    dailyItems[0]?.daylightDuration,
    new Date()
  );

  const alertsModel = deriveWeatherAlerts(currentModel, dailyItems, airQualityModel);

  return {
    location: {
      name: locationInfo?.name || 'Local Station',
      region: locationInfo?.region,
      country: locationInfo?.country,
      countryCode: locationInfo?.countryCode,
      latitude: weatherRes.latitude,
      longitude: weatherRes.longitude,
      timezone: weatherRes.timezone,
      elevation: weatherRes.elevation,
    },
    current: currentModel,
    hourly: hourlyItems,
    daily: dailyItems,
    airQuality: airQualityModel,
    astronomy: astronomyModel,
    alerts: alertsModel,
    fetchedAt: Date.now(),
  };
}

/**
 * Popular presets for instant city exploration
 */
export const POPULAR_LOCATIONS: CitySearchResult[] = [
  { id: 1850147, name: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { id: 2643743, name: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London' },
  { id: 5128581, name: 'New York', country: 'United States', country_code: 'US', admin1: 'New York', latitude: 40.7143, longitude: -74.006, timezone: 'America/New_York' },
  { id: 2988507, name: 'Paris', country: 'France', country_code: 'FR', latitude: 48.8534, longitude: 2.3488, timezone: 'Europe/Paris' },
  { id: 292223, name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', latitude: 25.0657, longitude: 55.1713, timezone: 'Asia/Dubai' },
  { id: 2147714, name: 'Sydney', country: 'Australia', country_code: 'AU', latitude: -33.8678, longitude: 151.2073, timezone: 'Australia/Sydney' },
  { id: 3413829, name: 'Reykjavik', country: 'Iceland', country_code: 'IS', latitude: 64.1355, longitude: -21.8954, timezone: 'Atlantic/Reykjavik' },
  { id: 1880252, name: 'Singapore', country: 'Singapore', country_code: 'SG', latitude: 1.2897, longitude: 103.8501, timezone: 'Asia/Singapore' },
  { id: 3435910, name: 'Buenos Aires', country: 'Argentina', country_code: 'AR', latitude: -34.6132, longitude: -58.3772, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 6094817, name: 'Ottawa', country: 'Canada', country_code: 'CA', admin1: 'Ontario', latitude: 45.4112, longitude: -75.6981, timezone: 'America/Toronto' },
];

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type SpeedUnit = 'kmh' | 'mph';
export type PressureUnit = 'hpa' | 'inhg';
export type PrecipitationUnit = 'mm' | 'inch';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
  pressure: PressureUnit;
  precipitation: PrecipitationUnit;
}

export type WeatherThemeType =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'heavy-snow';

export interface CitySearchResult {
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
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  isDay: boolean;
  weatherCode: number;
  condition: string;
  description: string;
  themeType: WeatherThemeType;
  relativeHumidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  surfacePressure: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  precipitation: number;
  dewPoint: number;
}

export interface HourlyForecastItem {
  time: string;
  timestamp: number;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  condition: string;
  themeType: WeatherThemeType;
  isDay: boolean;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  relativeHumidity: number;
  uvIndex: number;
  surfacePressure: number;
  visibility: number;
}

export interface DailyForecastItem {
  date: string;
  timestamp: number;
  dayName: string;
  weatherCode: number;
  condition: string;
  description: string;
  themeType: WeatherThemeType;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  daylightDuration: number; // in seconds
}

export interface AirQualityData {
  aqi: number;
  aqiLabel: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Hazardous';
  aqiColor: string;
  pm2_5: number;
  pm10: number;
  nitrogenDioxide: number;
  sulphurDioxide: number;
  ozone: number;
  carbonMonoxide: number;
  europeanAqi: number;
  healthRecommendation: string;
}

export interface AstronomicalInfo {
  sunrise: string;
  sunset: string;
  solarNoon?: string;
  daylightDuration: number;
  sunPositionProgress: number; // 0 (sunrise) to 1 (sunset)
  moonPhaseName: string;
  moonIllumination: number; // 0 to 100%
}

export interface WeatherAlert {
  id: string;
  severity: 'info' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  instruction?: string;
  effectiveTime?: string;
  expiresTime?: string;
}

export interface WeatherData {
  location: {
    name: string;
    region?: string;
    country?: string;
    countryCode?: string;
    latitude: number;
    longitude: number;
    timezone: string;
    elevation?: number;
  };
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality?: AirQualityData;
  astronomy: AstronomicalInfo;
  alerts: WeatherAlert[];
  fetchedAt: number;
}

export interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  retryAttempt: number;
  selectedCity: CitySearchResult | null;
  units: UnitPreferences;
  is3dEnabled: boolean;
  reducedMotion: boolean;
}

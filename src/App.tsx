import React, { useCallback, useEffect, useState } from 'react';
import {
  CitySearchResult,
  UnitPreferences,
  WeatherData,
} from './types/weather';
import {
  getCityByCoordinates,
  getWeatherData,
  POPULAR_LOCATIONS,
} from './services/weatherService';
import { ThreeWeatherCanvas } from './components/canvas/ThreeWeatherCanvas';
import { Header } from './components/common/Header';
import { SearchBar } from './components/common/SearchBar';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { ErrorDisplay } from './components/common/ErrorDisplay';
import { WeatherAlertsBanner } from './components/sections/WeatherAlertsBanner';
import { CurrentWeatherSection } from './components/sections/CurrentWeatherSection';
import { HourlyForecastSection } from './components/sections/HourlyForecastSection';
import { DailyForecastSection } from './components/sections/DailyForecastSection';
import { WeatherMetricsGrid } from './components/sections/WeatherMetricsGrid';
import { ScrollNavRail } from './components/common/ScrollNavRail';
import { Globe, MapPin, Sparkles } from 'lucide-react';

export default function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null);

  // Unit preferences state (with persistence)
  const [units, setUnits] = useState<UnitPreferences>(() => {
    try {
      const saved = localStorage.getItem('aetheria_weather_units');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      temperature: 'celsius',
      speed: 'kmh',
      pressure: 'hpa',
      precipitation: 'mm',
    };
  });

  // 3D Canvas and reduced-motion states
  const [is3dEnabled, setIs3dEnabled] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Save unit preferences
  useEffect(() => {
    try {
      localStorage.setItem('aetheria_weather_units', JSON.stringify(units));
    } catch {}
  }, [units]);

  // Fetch weather data for target city coordinates
  const fetchWeather = useCallback(
    async (city: CitySearchResult, silent = false) => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsRefreshing(true);
      }

      try {
        const data = await getWeatherData(city.latitude, city.longitude, {
          name: city.name,
          region: city.admin1,
          country: city.country,
          countryCode: city.country_code,
        });

        setWeatherData(data);
        setSelectedCity(city);
        setError(null);
        setRetryAttempt(0);
      } catch (err: any) {
        console.error('Failed to fetch weather:', err);
        setError(err.message || 'Unable to retrieve real-time meteorological data.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Handle GPS location detection
  const handleUseCurrentLocation = useCallback(() => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      // Fall back to default location
      fetchWeather(POPULAR_LOCATIONS[0]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsCity = await getCityByCoordinates(latitude, longitude);
        setIsLocating(false);
        fetchWeather(gpsCity);
      },
      (err) => {
        console.warn('Geolocation denied or failed, falling back to default:', err.message);
        setIsLocating(false);
        // Fall back gracefully to Tokyo / New York
        fetchWeather(POPULAR_LOCATIONS[0]);
      },
      { timeout: 7000, enableHighAccuracy: false }
    );
  }, [fetchWeather]);

  // Initial startup: detect location or load default
  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  // Unit toggles
  const handleToggleTempUnit = () => {
    setUnits((prev) => ({
      ...prev,
      temperature: prev.temperature === 'celsius' ? 'fahrenheit' : 'celsius',
    }));
  };

  const handleToggleSpeedUnit = () => {
    setUnits((prev) => ({
      ...prev,
      speed: prev.speed === 'kmh' ? 'mph' : 'kmh',
    }));
  };

  const handleManualRefresh = () => {
    if (selectedCity) {
      fetchWeather(selectedCity, true);
    } else if (weatherData) {
      fetchWeather(
        {
          id: 1,
          name: weatherData.location.name,
          latitude: weatherData.location.latitude,
          longitude: weatherData.location.longitude,
          country: weatherData.location.country,
          country_code: weatherData.location.countryCode,
          admin1: weatherData.location.region,
        },
        true
      );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* 3D WebGL Canvas Layer */}
      {weatherData && (
        <ThreeWeatherCanvas
          themeType={weatherData.current.themeType}
          isDay={weatherData.current.isDay}
          windSpeed={weatherData.current.windSpeed}
          is3dEnabled={is3dEnabled}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Top Application Header */}
      <Header
        units={units}
        onToggleTempUnit={handleToggleTempUnit}
        onToggleSpeedUnit={handleToggleSpeedUnit}
        is3dEnabled={is3dEnabled}
        onToggle3d={() => setIs3dEnabled((prev) => !prev)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((prev) => !prev)}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 pb-16">
        {/* Prominent Global Search Bar */}
        <div className="pt-6 pb-2 px-4 sm:px-6">
          <SearchBar
            onSelectCity={(city) => fetchWeather(city)}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
            isLoadingWeather={isLoading}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Floating Side Navigation Rail */}
        {weatherData && !isLoading && !error && (
          <ScrollNavRail reducedMotion={reducedMotion} />
        )}

        {/* Dynamic Weather Alerts Banner */}
        {weatherData && !isLoading && (
          <WeatherAlertsBanner alerts={weatherData.alerts} />
        )}

        {/* Loading State */}
        {isLoading && <SkeletonLoader />}

        {/* Error State with Retry Button */}
        {!isLoading && error && (
          <ErrorDisplay
            message={error}
            onRetry={() => (selectedCity ? fetchWeather(selectedCity) : handleUseCurrentLocation())}
            isRetrying={isLoading}
            retryAttempt={retryAttempt}
          />
        )}

        {/* Active Weather Dashboard Sections */}
        {!isLoading && !error && weatherData && (
          <div className="space-y-4">
            {/* 1. HERO CURRENT CONDITIONS */}
            <CurrentWeatherSection
              data={weatherData}
              units={units}
              reducedMotion={reducedMotion}
            />

            {/* 2. HOURLY 24-HOUR FORECAST & CURVE */}
            <HourlyForecastSection
              hourly={weatherData.hourly}
              units={units}
              timezone={weatherData.location.timezone}
              reducedMotion={reducedMotion}
            />

            {/* 3. 7-DAY EXTENDED 3D FLIP FORECAST */}
            <DailyForecastSection
              daily={weatherData.daily}
              units={units}
              timezone={weatherData.location.timezone}
              reducedMotion={reducedMotion}
            />

            {/* 4. METEOROLOGICAL TELEMETRY & AQI */}
            <WeatherMetricsGrid
              data={weatherData}
              units={units}
              reducedMotion={reducedMotion}
            />
          </div>
        )}
      </main>

      {/* Futuristic Status Footer */}
      <footer className="relative z-20 py-6 border-t border-white/10 bg-slate-950/70 backdrop-blur-xl text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-slate-300">Open-Meteo REST Weather Service</span>
            <span>•</span>
            <span>Zero-API-Key Direct Sync</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {weatherData && (
              <span>
                Coordinates: {weatherData.location.latitude.toFixed(4)}°N,{' '}
                {weatherData.location.longitude.toFixed(4)}°E
              </span>
            )}
            <span>© {new Date().getFullYear()} Aetheria 3D</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

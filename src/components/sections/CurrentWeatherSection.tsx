import React from 'react';
import {
  MapPin,
  Wind,
  Droplets,
  Sun,
  Eye,
  Gauge,
  CloudRain,
  Compass,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { UnitPreferences, WeatherData } from '../../types/weather';
import {
  formatPressure,
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
  getWindDirectionText,
} from '../../utils/unitConverter';
import { WeatherIcon } from '../common/WeatherIcon';
import { Card3D } from '../common/Card3D';

interface CurrentWeatherSectionProps {
  data: WeatherData;
  units: UnitPreferences;
  reducedMotion: boolean;
}

export const CurrentWeatherSection: React.FC<CurrentWeatherSectionProps> = ({
  data,
  units,
  reducedMotion,
}) => {
  const { current, location, daily } = data;
  const todayForecast = daily[0];

  return (
    <section
      id="current-weather-section"
      className="relative z-10 w-full pt-6 pb-8 transition-transform duration-500"
      style={{ perspective: '1200px' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main 3D Hero Weather Card */}
        <Card3D
          id="hero-weather-card"
          intensity={12}
          reducedMotion={reducedMotion}
          className="p-6 sm:p-8 md:p-10 border border-white/15 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Radial Backlight */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          {/* Top Location & Condition Metadata */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {location.name}
                  </h2>
                  {location.countryCode && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-md bg-white/10 border border-white/15 text-slate-300">
                      {location.countryCode}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {[location.region, location.country].filter(Boolean).join(', ') ||
                    `Coordinates: ${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
                </p>
              </div>
            </div>

            {/* Condition Pill Badge */}
            <div className="flex items-center gap-3 self-start md:self-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <WeatherIcon themeType={current.themeType} isDay={current.isDay} size={28} />
              <div>
                <div className="text-sm font-bold text-slate-100">{current.condition}</div>
                <div className="text-xs text-slate-400 capitalize">
                  {current.isDay ? 'Daytime' : 'Night'}
                </div>
              </div>
            </div>
          </div>

          {/* Center Temperature & Dynamic Atmosphere Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-center">
            {/* Left: Huge 3D Temperature Readout */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-['Outfit'] select-none drop-shadow-sm">
                  {formatTemperature(current.temperature, units.temperature).replace(/[°CF]/g, '')}
                </span>
                <span className="text-4xl sm:text-5xl font-light text-cyan-400">
                  {units.temperature === 'celsius' ? '°C' : '°F'}
                </span>
              </div>

              {/* Feels like & Daily Range */}
              <div className="flex items-center gap-4 mt-2 flex-wrap text-sm">
                <div className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="text-slate-500">Feels like:</span>
                  <span className="font-bold text-white">
                    {formatTemperature(current.apparentTemperature, units.temperature)}
                  </span>
                </div>

                {todayForecast && (
                  <div className="flex items-center gap-3 text-slate-300 font-medium">
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-rose-300">
                      <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
                      {formatTemperature(todayForecast.temperatureMax, units.temperature)}
                    </span>
                    <span className="flex items-center gap-1 text-sky-300">
                      <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                      {formatTemperature(todayForecast.temperatureMin, units.temperature)}
                    </span>
                  </div>
                )}
              </div>

              {/* Atmospheric Description */}
              <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-lg leading-relaxed">
                {current.description}.
              </p>
            </div>

            {/* Right: Quick Live Atmospheric Grid */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Wind Speed */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Wind</span>
                  <Wind className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-base font-bold text-white">
                  {formatWindSpeed(current.windSpeed, units.speed)}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>{getWindDirectionText(current.windDirection)} ({current.windDirection}°)</span>
                </div>
              </div>

              {/* Humidity */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Humidity</span>
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-base font-bold text-white">{current.relativeHumidity}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Dew Point: {formatTemperature(current.dewPoint, units.temperature)}
                </div>
              </div>

              {/* UV Index */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>UV Index</span>
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-base font-bold text-white">{current.uvIndex.toFixed(1)}</div>
                <div className="text-[11px] text-amber-400/90 mt-0.5">
                  {current.uvIndex >= 6 ? 'High Exposure' : 'Low to Mod'}
                </div>
              </div>

              {/* Pressure */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Pressure</span>
                  <Gauge className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-base font-bold text-white">
                  {formatPressure(current.surfacePressure, units.pressure)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {current.surfacePressure > 1015 ? 'High / Fair' : 'Stable'}
                </div>
              </div>

              {/* Visibility */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Visibility</span>
                  <Eye className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-white">
                  {formatVisibility(current.visibility, units.speed)}
                </div>
                <div className="text-[11px] text-emerald-400/90 mt-0.5">
                  {current.visibility > 8000 ? 'Clear Range' : 'Hazy / Low'}
                </div>
              </div>

              {/* Precipitation */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition duration-200">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Precipitation</span>
                  <CloudRain className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-base font-bold text-white">{current.precipitation} mm</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {current.precipitation > 0 ? 'Active Shower' : 'Dry Surface'}
                </div>
              </div>
            </div>
          </div>
        </Card3D>
      </div>
    </section>
  );
};

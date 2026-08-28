import React from 'react';
import {
  Wind,
  Sun,
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Eye,
  Cloud,
  Compass,
  Activity,
  ShieldAlert,
  Moon,
  Sparkles,
} from 'lucide-react';
import { UnitPreferences, WeatherData } from '../../types/weather';
import {
  formatPressure,
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
  getPressureTendency,
  getUvCategory,
  getWindDirectionText,
} from '../../utils/unitConverter';
import { Card3D } from '../common/Card3D';

interface WeatherMetricsGridProps {
  data: WeatherData;
  units: UnitPreferences;
  reducedMotion: boolean;
}

export const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({
  data,
  units,
  reducedMotion,
}) => {
  const { current, airQuality, astronomy } = data;
  const uvCategory = getUvCategory(current.uvIndex);
  const pressureStatus = getPressureTendency(current.surfacePressure);

  // Calculate daylight duration in hours & minutes
  const daylightHours = Math.floor(astronomy.daylightDuration / 3600);
  const daylightMins = Math.round((astronomy.daylightDuration % 3600) / 60);

  return (
    <section
      id="weather-metrics-section"
      className="relative z-10 w-full py-8 transition-transform duration-500"
      style={{ perspective: '1200px' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Atmospheric & Environmental Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Live scientific metrics, solar trajectory, and air quality indices
            </p>
          </div>
        </div>

        {/* 6-Card High-Density 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. WIND & DIRECTION COMPASS */}
          <Card3D
            id="metric-wind-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">Wind & Gusts</span>
              <Wind className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-center justify-between my-4">
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {formatWindSpeed(current.windSpeed, units.speed)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Gusts up to{' '}
                  <span className="text-white font-semibold">
                    {formatWindSpeed(current.windGusts, units.speed)}
                  </span>
                </div>
              </div>

              {/* 3D Rotating Wind Compass Dial */}
              <div className="relative w-18 h-18 rounded-full border-2 border-white/15 bg-slate-950/80 flex items-center justify-center shadow-inner">
                <span className="absolute top-1 text-[9px] font-bold text-slate-400">N</span>
                <span className="absolute right-1 text-[9px] font-bold text-slate-400">E</span>
                <span className="absolute bottom-1 text-[9px] font-bold text-slate-400">S</span>
                <span className="absolute left-1 text-[9px] font-bold text-slate-400">W</span>

                {/* Compass Needle */}
                <div
                  className="w-1.5 h-12 relative transition-transform duration-700 ease-out"
                  style={{
                    transform: `rotate(${current.windDirection}deg)`,
                  }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[18px] border-b-rose-500 mx-auto" />
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[18px] border-t-slate-400 mx-auto" />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
              <span>Blowing from:</span>
              <span className="font-bold text-cyan-300">
                {getWindDirectionText(current.windDirection)} ({current.windDirection}°)
              </span>
            </div>
          </Card3D>

          {/* 2. SOLAR ARC & ASTRONOMY */}
          <Card3D
            id="metric-solar-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Solar Trajectory & Moon
              </span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>

            {/* Visual Solar Arc Curve */}
            <div className="relative h-20 w-full mt-3 flex items-center justify-center">
              <svg viewBox="0 0 200 80" className="w-full h-full">
                {/* Arc path */}
                <path
                  d="M 20 70 A 80 50 0 0 1 180 70"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
                {/* Sun indicator circle on arc */}
                {(() => {
                  const t = astronomy.sunPositionProgress; // 0 to 1
                  const angle = Math.PI - t * Math.PI;
                  const cx = 100 + 80 * Math.cos(angle);
                  const cy = 70 - 50 * Math.sin(angle);
                  return (
                    <>
                      <circle cx={cx} cy={cy} r="7" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
                      <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Sunrise</div>
                  <div className="text-xs font-bold text-white font-mono">{astronomy.sunrise}</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <Sunset className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Sunset</div>
                  <div className="text-xs font-bold text-white font-mono">{astronomy.sunset}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Daylight: {daylightHours}h {daylightMins}m</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Moon className="w-3 h-3 text-indigo-300" />
                {astronomy.moonPhaseName} ({astronomy.moonIllumination}%)
              </span>
            </div>
          </Card3D>

          {/* 3. AIR QUALITY INDEX (AQI) */}
          <Card3D
            id="metric-aqi-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Air Quality Index
              </span>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {airQuality?.aqi ?? 32}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md mt-1"
                  style={{
                    backgroundColor: `${airQuality?.aqiColor || '#10b981'}20`,
                    color: airQuality?.aqiColor || '#10b981',
                  }}
                >
                  {airQuality?.aqiLabel || 'Good'}
                </div>
              </div>

              {/* Pollutants Mini Grid */}
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] text-slate-400">PM2.5</div>
                  <div className="text-xs font-bold text-white font-mono">{airQuality?.pm2_5} µg</div>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] text-slate-400">PM10</div>
                  <div className="text-xs font-bold text-white font-mono">{airQuality?.pm10} µg</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-xl border border-white/10">
              {airQuality?.healthRecommendation || 'Air quality is satisfactory with low health risks.'}
            </p>
          </Card3D>

          {/* 4. UV RADIATION & EXPOSURE */}
          <Card3D
            id="metric-uv-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                UV Radiation
              </span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>

            <div className="flex items-baseline gap-3 my-3">
              <div className="text-3xl font-extrabold text-white">
                {current.uvIndex.toFixed(1)}
              </div>
              <span
                className="text-xs font-bold uppercase px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${uvCategory.color}20`,
                  color: uvCategory.color,
                }}
              >
                {uvCategory.label}
              </span>
            </div>

            {/* Visual UV Scale Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-600 rounded-full"
                style={{ width: `${Math.min(100, (current.uvIndex / 12) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              {uvCategory.advice}
            </p>
          </Card3D>

          {/* 5. HUMIDITY & DEW POINT */}
          <Card3D
            id="metric-humidity-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Humidity & Dew Point
              </span>
              <Droplets className="w-4 h-4 text-blue-400" />
            </div>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {current.relativeHumidity}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Dew Point:{' '}
                  <span className="text-white font-semibold">
                    {formatTemperature(current.dewPoint, units.temperature)}
                  </span>
                </div>
              </div>

              {/* Circular gauge approximation */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Droplets className="w-7 h-7" />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
              <span>Comfort Level:</span>
              <span className="font-bold text-sky-300">
                {current.relativeHumidity < 30
                  ? 'Dry Air'
                  : current.relativeHumidity > 70
                  ? 'Humid & Moist'
                  : 'Comfortable'}
              </span>
            </div>
          </Card3D>

          {/* 6. PRESSURE & CLOUD COVER */}
          <Card3D
            id="metric-pressure-card"
            intensity={10}
            reducedMotion={reducedMotion}
            className="p-5 border border-white/15 bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs pb-3 border-b border-white/10">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                Barometer & Cloudiness
              </span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-3xl font-extrabold text-white">
                  {formatPressure(current.surfacePressure, units.pressure)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Cloud Cover:{' '}
                  <span className="text-white font-semibold">{current.cloudCover}%</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Cloud className="w-7 h-7" />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
              <span>Barometer State:</span>
              <span className="font-bold text-purple-300 truncate max-w-[180px]">
                {pressureStatus}
              </span>
            </div>
          </Card3D>
        </div>
      </div>
    </section>
  );
};

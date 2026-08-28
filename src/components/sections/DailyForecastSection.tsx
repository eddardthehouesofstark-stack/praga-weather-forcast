import React, { useState } from 'react';
import {
  Calendar,
  RotateCw,
  Sunrise,
  Sunset,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  ChevronDown,
} from 'lucide-react';
import { DailyForecastItem, UnitPreferences } from '../../types/weather';
import {
  formatDayTitle,
  formatPrecipitation,
  formatTemperature,
  formatWindSpeed,
} from '../../utils/unitConverter';
import { WeatherIcon } from '../common/WeatherIcon';
import { Card3D } from '../common/Card3D';

interface DailyForecastSectionProps {
  daily: DailyForecastItem[];
  units: UnitPreferences;
  timezone?: string;
  reducedMotion: boolean;
}

export const DailyForecastSection: React.FC<DailyForecastSectionProps> = ({
  daily,
  units,
  timezone,
  reducedMotion,
}) => {
  // Track flipped card states
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleFlip = (index: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Find absolute min and max across all 7 days for normalized thermal range bar
  const allMins = daily.map((d) => d.temperatureMin);
  const allMaxs = daily.map((d) => d.temperatureMax);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const globalRange = Math.max(1, globalMax - globalMin);

  return (
    <section
      id="daily-forecast-section"
      className="relative z-10 w-full py-8 transition-transform duration-500"
      style={{ perspective: '1200px' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Card3D
          id="daily-forecast-container"
          intensity={6}
          reducedMotion={reducedMotion}
          className="p-6 sm:p-8 border border-white/15 bg-slate-900/80 shadow-2xl"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">7-Day Extended Forecast</h3>
                <p className="text-xs text-slate-400">Click or tap any day card to flip for detailed astronomical data</p>
              </div>
            </div>

            <div className="text-xs font-mono text-cyan-300/80 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 self-start sm:self-auto">
              Interactive 3D Flip Cards
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 pt-6">
            {daily.slice(0, 7).map((day, idx) => {
              const isFlipped = Boolean(flippedCards[idx]);
              const { formattedDate } = formatDayTitle(day.date, timezone);

              // Percentage offsets for temperature bar
              const leftPercent = ((day.temperatureMin - globalMin) / globalRange) * 100;
              const rightPercent = ((day.temperatureMax - globalMin) / globalRange) * 100;
              const barWidth = Math.max(15, rightPercent - leftPercent);

              return (
                <div
                  key={`${day.date}-${idx}`}
                  id={`daily-card-${idx}`}
                  style={{ perspective: '1000px' }}
                  className="h-[260px] cursor-pointer group"
                  onClick={() => toggleFlip(idx)}
                >
                  <div
                    className={`relative w-full h-full duration-500 transition-transform ${
                      reducedMotion ? '' : 'transform-style-preserve-3d'
                    } ${isFlipped && !reducedMotion ? 'rotate-y-180' : ''}`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* FRONT SIDE OF CARD */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl p-4 flex flex-col justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 transition duration-300 shadow-lg backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">
                            {idx === 0 ? 'Today' : day.dayName}
                          </div>
                          <div className="text-[11px] text-slate-400">{formattedDate}</div>
                        </div>
                        <RotateCw className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                      </div>

                      {/* Center Icon & Condition */}
                      <div className="flex flex-col items-center my-2">
                        <div className="transform transition duration-300 group-hover:scale-110">
                          <WeatherIcon themeType={day.themeType} isDay={true} size={32} />
                        </div>
                        <span className="text-xs text-slate-300 font-medium text-center line-clamp-1 mt-1">
                          {day.condition}
                        </span>
                      </div>

                      {/* Temperature Range & Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-sky-300">
                            {formatTemperature(day.temperatureMin, units.temperature)}
                          </span>
                          <span className="text-rose-300">
                            {formatTemperature(day.temperatureMax, units.temperature)}
                          </span>
                        </div>

                        {/* Visual Range bar */}
                        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${barWidth}%`,
                            }}
                          />
                        </div>

                        {/* Rain likelihood */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Droplets className="w-3 h-3 text-cyan-400" />
                            {day.precipitationProbabilityMax}%
                          </span>
                          <span>{formatPrecipitation(day.precipitationSum, units.precipitation)}</span>
                        </div>
                      </div>
                    </div>

                    {/* BACK SIDE OF CARD (FLIPPED DETAILS) */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl p-4 flex flex-col justify-between bg-slate-900/95 border border-cyan-500/30 shadow-xl backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-cyan-300">{day.dayName} Details</span>
                        <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                      </div>

                      <div className="space-y-2 text-[11px] text-slate-300 my-auto">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Sunrise className="w-3 h-3 text-amber-400" /> Sunrise
                          </span>
                          <span className="font-mono text-white">
                            {day.sunrise ? day.sunrise.split('T')[1]?.slice(0, 5) : '--:--'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Sunset className="w-3 h-3 text-rose-400" /> Sunset
                          </span>
                          <span className="font-mono text-white">
                            {day.sunset ? day.sunset.split('T')[1]?.slice(0, 5) : '--:--'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Wind className="w-3 h-3 text-cyan-400" /> Max Wind
                          </span>
                          <span className="text-white">
                            {formatWindSpeed(day.windSpeedMax, units.speed)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Sun className="w-3 h-3 text-amber-400" /> UV Peak
                          </span>
                          <span className="font-bold text-amber-300">{day.uvIndexMax.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-center text-cyan-300/80 bg-white/5 py-1 rounded-lg">
                        Tap again to flip back
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card3D>
      </div>
    </section>
  );
};

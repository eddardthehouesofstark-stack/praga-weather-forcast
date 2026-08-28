import React, { useRef, useState } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Eye,
} from 'lucide-react';
import { HourlyForecastItem, UnitPreferences } from '../../types/weather';
import {
  formatPressure,
  formatTemperature,
  formatTimeHour,
  formatWindSpeed,
} from '../../utils/unitConverter';
import { WeatherIcon } from '../common/WeatherIcon';
import { Card3D } from '../common/Card3D';

interface HourlyForecastSectionProps {
  hourly: HourlyForecastItem[];
  units: UnitPreferences;
  timezone?: string;
  reducedMotion: boolean;
}

export const HourlyForecastSection: React.FC<HourlyForecastSectionProps> = ({
  hourly,
  units,
  timezone,
  reducedMotion,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);
  const displayHours = hourly.slice(0, 24);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Compute min and max temps for normalized SVG temperature line graph
  const temps = displayHours.map((h) => h.temperature);
  const minTemp = Math.min(...temps, 0);
  const maxTemp = Math.max(...temps, 25);
  const tempRange = Math.max(1, maxTemp - minTemp);

  const selectedHour = displayHours[selectedHourIndex] || displayHours[0];

  return (
    <section
      id="hourly-forecast-section"
      className="relative z-10 w-full py-8 transition-transform duration-500"
      style={{ perspective: '1200px' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Card3D
          id="hourly-forecast-card"
          intensity={8}
          reducedMotion={reducedMotion}
          className="p-6 sm:p-8 border border-white/15 bg-slate-900/80 shadow-2xl"
        >
          {/* Header & Carousel Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Hourly Forecast</h3>
                <p className="text-xs text-slate-400">24-Hour continuous atmospheric progression</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="hourly-prev-button"
                type="button"
                onClick={() => handleScroll('left')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition active:scale-95"
                aria-label="Scroll hourly forecast left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="hourly-next-button"
                type="button"
                onClick={() => handleScroll('right')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition active:scale-95"
                aria-label="Scroll hourly forecast right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG Temperature Curve Graph */}
          <div className="pt-6 pb-2">
            <div className="relative h-28 w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${displayHours.length * 60} 100`}
                className="w-full h-full preserve-3d"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                {/* Draw Smooth Polyline / Area */}
                {(() => {
                  const points = displayHours.map((h, i) => {
                    const x = i * 60 + 30;
                    const normalized = (h.temperature - minTemp) / tempRange;
                    const y = 80 - normalized * 55;
                    return { x, y };
                  });

                  const pathD = points.reduce((acc, pt, i, arr) => {
                    if (i === 0) return `M ${pt.x} ${pt.y}`;
                    const prev = arr[i - 1];
                    const cx = (prev.x + pt.x) / 2;
                    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
                  }, '');

                  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#tempGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#lineStroke)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {points.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={selectedHourIndex === idx ? '5' : '3'}
                          className={`transition-all duration-200 cursor-pointer ${
                            selectedHourIndex === idx
                              ? 'fill-cyan-300 stroke-white stroke-2'
                              : 'fill-slate-900 stroke-sky-400 stroke-2'
                          }`}
                          onClick={() => setSelectedHourIndex(idx)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Horizontal Scrollable Hourly Cards */}
          <div
            ref={scrollContainerRef}
            id="hourly-cards-container"
            className="flex gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
          >
            {displayHours.map((item, idx) => {
              const isSelected = selectedHourIndex === idx;
              const isNow = idx === 0;

              return (
                <div
                  key={`${item.time}-${idx}`}
                  id={`hour-card-${idx}`}
                  onClick={() => setSelectedHourIndex(idx)}
                  className={`flex flex-col items-center justify-between p-3.5 rounded-2xl min-w-[94px] cursor-pointer transition-all duration-200 select-none border ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Time label */}
                  <span className="text-xs font-semibold text-slate-300">
                    {isNow ? 'Now' : formatTimeHour(item.time, timezone)}
                  </span>

                  {/* Weather Icon */}
                  <div className="my-2.5 transform transition duration-300 hover:scale-110">
                    <WeatherIcon themeType={item.themeType} isDay={item.isDay} size={24} />
                  </div>

                  {/* Temp */}
                  <span className="text-sm font-bold text-white">
                    {formatTemperature(item.temperature, units.temperature)}
                  </span>

                  {/* Rain Chance */}
                  <div className="flex items-center gap-0.5 mt-2 text-[10px] text-cyan-300 font-medium">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    <span>{item.precipitationProbability}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Hour Deep Metric Inspector */}
          {selectedHour && (
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <WeatherIcon themeType={selectedHour.themeType} isDay={selectedHour.isDay} size={22} />
                <div>
                  <div className="text-xs text-slate-400">
                    Inspecting {formatTimeHour(selectedHour.time, timezone)} ({selectedHour.condition})
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatTemperature(selectedHour.temperature, units.temperature)} • Feels like{' '}
                    {formatTemperature(selectedHour.apparentTemperature, units.temperature)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{formatWindSpeed(selectedHour.windSpeed, units.speed)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedHour.relativeHumidity}% Humidity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  <span>{selectedHour.precipitation} mm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>UV {selectedHour.uvIndex.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </Card3D>
      </div>
    </section>
  );
};

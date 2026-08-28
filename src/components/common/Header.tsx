import React, { useEffect, useState } from 'react';
import { Compass, RefreshCw, Box, Zap, Sparkles, Moon, Sun } from 'lucide-react';
import { UnitPreferences } from '../../types/weather';

interface HeaderProps {
  units: UnitPreferences;
  onToggleTempUnit: () => void;
  onToggleSpeedUnit: () => void;
  is3dEnabled: boolean;
  onToggle3d: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  units,
  onToggleTempUnit,
  onToggleSpeedUnit,
  is3dEnabled,
  onToggle3d,
  reducedMotion,
  onToggleReducedMotion,
  onRefresh,
  isRefreshing,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-30 w-full py-4 px-4 sm:px-6 md:px-8 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Live System Status */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/30 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <Compass className="w-6 h-6 text-cyan-400 animate-[spin_24s_linear_infinite]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent">
                AETHERIA 3D
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                LIVE REST v1
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Global Weather Station</span>
              <span>•</span>
              <span className="font-mono text-cyan-300/80">{timeString}</span>
            </div>
          </div>
        </div>

        {/* Global Controls & Toggles */}
        <div className="flex items-center flex-wrap justify-center gap-2">
          {/* Temperature Unit Toggle */}
          <button
            id="unit-toggle-temp"
            type="button"
            onClick={onToggleTempUnit}
            title="Toggle Temperature Unit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 transition duration-150 active:scale-95 shadow-sm"
          >
            <span className={units.temperature === 'celsius' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              °C
            </span>
            <span className="text-slate-600">/</span>
            <span className={units.temperature === 'fahrenheit' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              °F
            </span>
          </button>

          {/* Speed Unit Toggle */}
          <button
            id="unit-toggle-speed"
            type="button"
            onClick={onToggleSpeedUnit}
            title="Toggle Wind Speed Unit"
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 transition duration-150 active:scale-95 shadow-sm"
          >
            <span className="text-cyan-300">{units.speed === 'kmh' ? 'km/h' : 'mph'}</span>
          </button>

          {/* 3D Visual Engine Toggle */}
          <button
            id="toggle-3d-engine"
            type="button"
            onClick={onToggle3d}
            title={is3dEnabled ? 'Disable 3D WebGL Canvas' : 'Enable 3D WebGL Canvas'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition duration-150 active:scale-95 shadow-sm ${
              is3dEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Scene:</span>
            <span className="font-semibold">{is3dEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Motion Preference Toggle */}
          <button
            id="toggle-reduced-motion"
            type="button"
            onClick={onToggleReducedMotion}
            title={reducedMotion ? 'Enable Fluid Animations' : 'Reduce Motion (2D Mode)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition duration-150 active:scale-95 shadow-sm ${
              reducedMotion
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Motion:</span>
            <span className="font-semibold">{reducedMotion ? 'Reduced' : 'Fluid'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            id="refresh-weather-button"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Live Weather Data"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-cyan-300 transition duration-150 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

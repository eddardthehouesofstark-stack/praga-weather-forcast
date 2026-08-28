import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Moon,
  CloudMoon,
  Wind,
} from 'lucide-react';
import { WeatherThemeType } from '../../types/weather';

interface WeatherIconProps {
  themeType: WeatherThemeType;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  themeType,
  isDay = true,
  className = 'w-8 h-8',
  size,
}) => {
  switch (themeType) {
    case 'clear-day':
      return <Sun size={size} className={`${className} text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]`} />;
    case 'clear-night':
      return <Moon size={size} className={`${className} text-indigo-300 drop-shadow-[0_0_12px_rgba(165,243,252,0.4)]`} />;
    case 'partly-cloudy-day':
      return <CloudSun size={size} className={`${className} text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]`} />;
    case 'partly-cloudy-night':
      return <CloudMoon size={size} className={`${className} text-indigo-300 drop-shadow-[0_0_10px_rgba(199,210,254,0.4)]`} />;
    case 'overcast':
      return <Cloud size={size} className={`${className} text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.3)]`} />;
    case 'fog':
      return <CloudFog size={size} className={`${className} text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.3)]`} />;
    case 'drizzle':
      return <CloudDrizzle size={size} className={`${className} text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]`} />;
    case 'rain':
    case 'heavy-rain':
      return <CloudRain size={size} className={`${className} text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]`} />;
    case 'snow':
    case 'heavy-snow':
      return <Snowflake size={size} className={`${className} text-sky-100 drop-shadow-[0_0_12px_rgba(240,249,255,0.6)]`} />;
    case 'thunderstorm':
      return <CloudLightning size={size} className={`${className} text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]`} />;
    default:
      return isDay ? (
        <SunMedium size={size} className={`${className} text-amber-400`} />
      ) : (
        <Moon size={size} className={`${className} text-indigo-300`} />
      );
  }
};

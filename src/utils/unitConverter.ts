import { UnitPreferences } from '../types/weather';

export function formatTemperature(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTemperatureValue(celsius: number, unit: 'celsius' | 'fahrenheit'): number {
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function formatWindSpeed(kmh: number, unit: 'kmh' | 'mph'): string {
  if (unit === 'mph') {
    const mph = kmh * 0.621371;
    return `${Math.round(mph)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPressure(hpa: number, unit: 'hpa' | 'inhg'): string {
  if (unit === 'inhg') {
    const inhg = hpa * 0.02953;
    return `${inhg.toFixed(2)} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

export function formatPrecipitation(mm: number, unit: 'mm' | 'inch'): string {
  if (unit === 'inch') {
    const inch = mm * 0.0393701;
    return `${inch.toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatVisibility(meters: number, unit: 'kmh' | 'mph'): string {
  if (unit === 'mph') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

export function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
}

export function getUvCategory(uvIndex: number): { label: string; color: string; advice: string } {
  if (uvIndex < 3) return { label: 'Low', color: '#10b981', advice: 'No protection required for ordinary activity' };
  if (uvIndex < 6) return { label: 'Moderate', color: '#f59e0b', advice: 'Seek shade during midday hours & wear sunglasses' };
  if (uvIndex < 8) return { label: 'High', color: '#f97316', advice: 'Wear SPF 30+ sunscreen, hat, and protective clothing' };
  if (uvIndex < 11) return { label: 'Very High', color: '#ef4444', advice: 'Minimize sun exposure between 10am - 4pm' };
  return { label: 'Extreme', color: '#8b5cf6', advice: 'Take full precautions; unprotected skin burns in minutes' };
}

export function getPressureTendency(currentPressure: number, baseline = 1013.25): string {
  if (currentPressure > baseline + 4) return 'High Pressure • Stable & Clear';
  if (currentPressure < baseline - 4) return 'Low Pressure • Unsettled / Storm Prone';
  return 'Normal Pressure • Balanced Atmosphere';
}

export function formatTimeHour(isoString: string, timezone?: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  } catch {
    return isoString.split('T')[1]?.slice(0, 5) || isoString;
  }
}

export function formatDayTitle(isoDateString: string, timezone?: string): { dayName: string; formattedDate: string } {
  try {
    const date = new Date(isoDateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: timezone });
    return { dayName, formattedDate };
  } catch {
    return { dayName: 'Day', formattedDate: isoDateString };
  }
}

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { WeatherAlert } from '../../types/weather';

interface WeatherAlertsBannerProps {
  alerts: WeatherAlert[];
}

export const WeatherAlertsBanner: React.FC<WeatherAlertsBannerProps> = ({ alerts }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="weather-alerts-container" className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="space-y-3">
        {alerts.map((alert) => {
          const isExpanded = expandedId === alert.id;
          const isSevere = alert.severity === 'severe' || alert.severity === 'extreme';

          return (
            <div
              key={alert.id}
              id={`alert-card-${alert.id}`}
              className={`rounded-2xl border transition duration-200 overflow-hidden backdrop-blur-xl ${
                isSevere
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-100 shadow-lg shadow-rose-950/40'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-100 shadow-lg shadow-amber-950/30'
              }`}
            >
              <div
                onClick={() => toggleExpand(alert.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSevere ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isSevere ? (
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base">{alert.title}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          isSevere
                            ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                            : 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 line-clamp-1 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                  aria-label={isExpanded ? 'Collapse alert' : 'Expand alert details'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/10 text-xs sm:text-sm space-y-2">
                  <p className="leading-relaxed">{alert.description}</p>
                  {alert.instruction && (
                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-cyan-300">Safety Recommendation: </span>
                        <span>{alert.instruction}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { AlertOctagon, RefreshCw, WifiOff, MapPinOff } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
  retryAttempt?: number;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  isRetrying,
  retryAttempt = 0,
}) => {
  const isLocationError = message.toLowerCase().includes('location') || message.toLowerCase().includes('permission');

  return (
    <div id="error-display-card" className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 text-center shadow-2xl backdrop-blur-xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
        {isLocationError ? <MapPinOff className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Weather Stream Disrupted</h3>
      <p className="text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>

      {retryAttempt > 0 && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl mb-4 inline-block font-mono">
          Backoff retry attempt #{retryAttempt}...
        </div>
      )}

      <button
        id="error-retry-button"
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95 disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Reconnecting to Station...' : 'Try Again'}</span>
      </button>
    </div>
  );
};

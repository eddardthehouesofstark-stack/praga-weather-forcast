import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div id="weather-skeleton-loader" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
      {/* Hero Skeleton Card */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-white/10" />
              <div className="w-32 h-4 rounded-md bg-white/5" />
            </div>
          </div>
          <div className="w-32 h-10 rounded-2xl bg-white/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="w-56 h-24 rounded-2xl bg-white/10" />
            <div className="w-40 h-5 rounded-md bg-white/5" />
            <div className="w-80 h-4 rounded-md bg-white/5" />
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 h-24" />
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Skeleton */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10">
        <div className="w-44 h-6 rounded-lg bg-white/10 mb-6" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="min-w-[94px] h-32 rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>

      {/* 7-Day Forecast Skeleton */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10">
        <div className="w-48 h-6 rounded-lg bg-white/10 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-60 rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
};

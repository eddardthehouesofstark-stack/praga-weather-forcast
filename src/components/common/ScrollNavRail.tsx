import React, { useEffect, useState } from 'react';
import { Sun, Clock, Calendar, Activity } from 'lucide-react';

interface ScrollNavRailProps {
  reducedMotion: boolean;
}

const SECTIONS = [
  { id: 'current-weather-section', label: 'Current', icon: Sun },
  { id: 'hourly-forecast-section', label: 'Hourly', icon: Clock },
  { id: 'daily-forecast-section', label: '7-Day', icon: Calendar },
  { id: 'weather-metrics-section', label: 'Telemetry', icon: Activity },
];

export const ScrollNavRail: React.FC<ScrollNavRailProps> = ({ reducedMotion }) => {
  const [activeSection, setActiveSection] = useState<string>('current-weather-section');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3 }
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <nav
      id="scroll-nav-rail"
      aria-label="Section navigation"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3 p-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      {SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const isActive = activeSection === sec.id;

        return (
          <button
            key={sec.id}
            id={`nav-link-${sec.label.toLowerCase()}`}
            type="button"
            onClick={() => scrollTo(sec.id)}
            title={`Scroll to ${sec.label}`}
            className={`group relative p-2.5 rounded-xl transition duration-200 ${
              isActive
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />

            {/* Tooltip on hover */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900/90 border border-white/10 rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200">
              {sec.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

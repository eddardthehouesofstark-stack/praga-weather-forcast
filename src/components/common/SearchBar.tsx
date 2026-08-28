import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Loader2, X, Navigation, Globe } from 'lucide-react';
import { CitySearchResult } from '../../types/weather';
import { POPULAR_LOCATIONS, searchCities } from '../../services/weatherService';

interface SearchBarProps {
  onSelectCity: (city: CitySearchResult) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  isLoadingWeather: boolean;
  reducedMotion: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  onUseCurrentLocation,
  isLocating,
  isLoadingWeather,
  reducedMotion,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' or 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      const cities = await searchCities(query);
      setResults(cities);
      setIsSearching(false);
      setIsOpen(true);
      setSelectedIndex(-1);
    }, 280);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (city: CitySearchResult) => {
    onSelectCity(city);
    setQuery('');
    setIsOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1;
      setSelectedIndex(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} id="search-bar-container" className="relative w-full max-w-2xl mx-auto z-40">
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 via-sky-500/20 to-blue-600/30 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />

        <div className="relative flex items-center bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl transition duration-200">
          <div className="pl-4.5 pr-2 text-slate-400">
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            ) : (
              <Search className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
            )}
          </div>

          <input
            ref={inputRef}
            id="city-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0 || query.length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search global city, region, or coordinates..."
            className="w-full py-3.5 pr-3 text-slate-100 placeholder-slate-400 bg-transparent text-base focus:outline-none"
            autoComplete="off"
            aria-label="Search city or location"
          />

          {/* Clear query button */}
          {query && (
            <button
              id="clear-search-button"
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1.5 mr-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* GPS Current Location Button */}
          <button
            id="gps-location-button"
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating || isLoadingWeather}
            title="Use current GPS location"
            className="flex items-center gap-1.5 px-3.5 py-2 mr-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-xl transition duration-200 disabled:opacity-50 whitespace-nowrap active:scale-95"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 fill-cyan-400/20" />
                <span className="hidden sm:inline">GPS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div
          id="search-results-dropdown"
          className="absolute left-0 right-0 top-full mt-2.5 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-80 overflow-y-auto"
        >
          {results.length > 0 ? (
            results.map((city, idx) => (
              <button
                key={`${city.id}-${idx}`}
                id={`search-item-${city.id}`}
                type="button"
                onClick={() => handleSelect(city)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-4.5 py-3 text-left transition duration-150 ${
                  selectedIndex === idx ? 'bg-cyan-500/20 text-white pl-6' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-white/10 text-cyan-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <span className="truncate">{city.name}</span>
                      {city.country_code && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-400">
                          {city.country_code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {[city.admin1, city.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono shrink-0 pl-3">
                  {city.latitude.toFixed(1)}°, {city.longitude.toFixed(1)}°
                </div>
              </button>
            ))
          ) : query.length >= 2 && !isSearching ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              <Globe className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No locations found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by major city name or district</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Popular City Quick-Select Chips */}
      <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1.5 no-scrollbar mask-fade">
        <span className="text-xs font-medium text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-cyan-400" /> Explore:
        </span>
        {POPULAR_LOCATIONS.slice(0, 7).map((loc) => (
          <button
            key={loc.id}
            id={`preset-city-${loc.name.toLowerCase()}`}
            type="button"
            onClick={() => onSelectCity(loc)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition duration-150 whitespace-nowrap active:scale-95"
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
};

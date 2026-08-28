# 3D Weather Dashboard

A real-time meteorological web application combining real-time Open-Meteo REST API feeds with dynamic, hardware-accelerated **Three.js (WebGL)** atmospheric visualizations, 3D tilt and flip card interactions, and comprehensive environmental telemetry.

---

## 🌟 Key Features

### 1. Dynamic 3D WebGL Environmental Engine
- **Weather-Reactive Three.js Canvas**: Procedural 3D scene that dynamically updates based on real-time meteorological conditions and solar time (day/night):
  - ☀️ **Clear Day**: Volumetric glowing 3D sun sphere with pulsing multi-ring corona, sun rays, and floating solar dust particles.
  - 🌙 **Clear Night**: Realistic cratered 3D moon mesh with crater geometry, atmospheric glow, and twinkling deep-space starfields.
  - ☁️ **Cloudy & Overcast**: Layered drifting volumetric cloud decks with parallax depth and wind-speed reactive velocities.
  - 🌧️ **Rain & Drizzle**: Directional rain streaks with velocity mapping reacting to real-time wind speed and surface ripples.
  - ❄️ **Snow & Ice**: Organic falling 3D snowflake particles with rotational flutter and gentle ground drift.
  - ⚡ **Thunderstorm**: Procedural branching lightning discharge bolts with realistic screen-wide illumination flashes and dark storm clouds.
  - 🌫️ **Fog & Mist**: Soft volumetric fog particles creating an authentic low-visibility atmosphere.
- **Performance & Battery Preservation**: Automatically downscales or suspends rendering when disabled or in battery-saver / reduced-motion mode.

### 2. Live Meteorological Telemetry & Forecasts
- **Current Conditions Hero**: Live temperature, high/low range, "feels like" apparent temperature, weather code descriptions, and dynamic 3D tilt effects with mouse-tracked spotlight highlights.
- **24-Hour Interactive Hourly Forecast & Curve**: Horizontal scrollable forecast cards paired with a dynamic SVG bezier temperature curve and precipitation probability indicators.
- **7-Day Extended 3D Flip Forecast**: Interactive daily forecast cards featuring a 3D flip animation revealing daylight duration, sunrise/sunset times, dominant wind directions, and temperature spreads.
- **Environmental & Atmospheric Telemetry Grid**:
  - 🧭 **3D Wind Direction Compass**: Rotating needle aligned with live wind azimuth degrees and gust telemetry.
  - 🌅 **Solar Arc Trajectory & Astronomy**: Mathematical daylight arc tracking the sun's exact orbital position, sunrise/sunset times, and moon phase illumination.
  - 🛡️ **Air Quality Index (AQI)**: Breakdown of PM2.5, PM10, ozone, and health safety recommendations.
  - ☀️ **UV Radiation Gauge**: Visual exposure index and sun protection guidelines.
  - 💧 **Hygrometer & Dew Point**: Humidity level and atmospheric moisture indicators.
  - 🌪️ **Barometric Pressure**: Atmospheric surface pressure and barometric tendency tracking.
- **Severe Weather Alert System**: Automatic detection and display of critical conditions including gale-force winds, extreme temperatures, thunderstorms, and poor air quality.

### 3. Location Services & Search
- **Debounced Global Geocoding**: Instant city and region search with coordinate tracking across the globe.
- **GPS Location Detection**: One-click device geolocation resolution via browser Geolocation API with reverse geocoding fallback.
- **Quick-Access Hubs**: Preset buttons for major global meteorological hubs (Tokyo, New York, London, Paris, Sydney, Cairo, Reykjavik).

### 4. Accessibility & Customization
- **Unit Preferences**: One-click switching between Metric and Imperial standards (°C / °F, km/h / mph, hPa / inHg, mm / in) with `localStorage` persistence.
- **Reduced Motion & 2D Mode**: Respects OS `prefers-reduced-motion` settings and provides manual toggles for 2D/3D visual modes.
- **Side Navigation Rail**: Sticky floating section navigation for smooth scrolling between telemetry modules.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) (WebGL)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Services**:
  - [Open-Meteo Weather Forecast API](https://open-meteo.com/) (No API key required)
  - [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  - [BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/)

---

## 📁 Project Structure

```
├── index.html                           # HTML5 entry point & metadata
├── package.json                         # Dependencies & project scripts
├── vite.config.ts                       # Vite & Tailwind CSS plugins
├── metadata.json                        # Applet manifest & frame permissions
└── src/
    ├── main.tsx                         # React root entry point
    ├── App.tsx                          # Core application state & layout
    ├── index.css                        # Tailwind CSS imports & 3D utility classes
    ├── types/
    │   └── weather.ts                   # TypeScript types, interfaces, & WMO code mappings
    ├── services/
    │   └── weatherService.ts            # Open-Meteo REST client with exponential backoff
    ├── utils/
    │   └── unitConverter.ts             # Unit math, UV categories, wind bearings, barometric tendency
    └── components/
        ├── canvas/
        │   └── ThreeWeatherCanvas.tsx   # Three.js WebGL weather simulation engine
        ├── common/
        │   ├── Card3D.tsx               # 3D mouse parallax tilt & glare container
        │   ├── Header.tsx               # Top navigation, unit toggles, & refresh controls
        │   ├── SearchBar.tsx            # Debounced city search & GPS geolocation
        │   ├── ScrollNavRail.tsx        # Floating section anchor navigation
        │   ├── SkeletonLoader.tsx       # Shimmer loading placeholders
        │   └── ErrorDisplay.tsx         # Disruption alert with retry & backoff display
        └── sections/
            ├── CurrentWeatherSection.tsx # Hero current temperature & weather badges
            ├── HourlyForecastSection.tsx # 24-hour horizontal forecast & SVG bezier curve
            ├── DailyForecastSection.tsx  # 7-day 3D flip forecast cards
            ├── WeatherMetricsGrid.tsx   # 6-card environmental telemetry & AQI grid
            └── WeatherAlertsBanner.tsx  # Severe weather alert notifications
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Local Run

1. **Clone or navigate to the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.

4. **Production Build:**
   ```bash
   npm run build
   ```

5. **Type Check / Lint:**
   ```bash
   npm run lint
   ```

---

## 📡 API Reference & Integration

The application integrates with the public **Open-Meteo** API suite without requiring private API tokens:

- **Weather Forecast Endpoint**:
  ```
  https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto
  ```
- **Air Quality Endpoint**:
  ```
  https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone
  ```
- **Geocoding Search Endpoint**:
  ```
  https://geocoding-api.open-meteo.com/v1/search?name={query}&count=6&language=en&format=json
  ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

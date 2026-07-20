import {
  ArrowRight,
  CloudSun,
  Compass,
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Menu,
  Search,
  Sparkles,
  Wind,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InitialState, TemperatureUnit, WeatherReport } from "./types";
import {
  formatForecastDate,
  formatTemperature,
  formatToday,
  getWeatherIcon,
  getWeatherMood,
} from "./weather";

type AppProps = {
  initialState: InitialState;
};

const POPULAR_CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Antalya",
  "Londra",
  "Paris",
  "New York",
  "Tokyo",
];

const getStoredUnit = (): TemperatureUnit => {
  const value = localStorage.getItem("atmos-temperature-unit");
  return value === "f" ? "f" : "c";
};

const getRecentCities = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem("atmos-recent-cities") ?? "[]");
    return Array.isArray(value) ? value.slice(0, 4) : [];
  } catch {
    return [];
  }
};

export function App({ initialState }: AppProps) {
  const [view, setView] = useState(initialState.view);
  const [query, setQuery] = useState(initialState.query);
  const [report, setReport] = useState<WeatherReport | null>(initialState.report);
  const [error, setError] = useState<string | null>(initialState.error);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<TemperatureUnit>(getStoredUnit);
  const [recentCities, setRecentCities] = useState<string[]>(getRecentCities);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mood = getWeatherMood(report?.current.description);
  const WeatherIcon = getWeatherIcon(report?.current.description);

  const fetchWeather = useCallback(async (city: string, updateHistory = true) => {
    const cleanedCity = city.trim();
    if (!cleanedCity) {
      setError("Lütfen bir şehir adı girin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather?sehir=${encodeURIComponent(cleanedCity)}`,
        { headers: { Accept: "application/json" } },
      );
      const payload = (await response.json()) as WeatherReport & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Hava durumu bilgisi alınamadı.");
      }

      setReport(payload);
      setView("weather");
      setQuery(payload.current.city);

      const nextRecent = [
        payload.current.city,
        ...getRecentCities().filter((item) => item !== payload.current.city),
      ].slice(0, 4);
      localStorage.setItem("atmos-recent-cities", JSON.stringify(nextRecent));
      setRecentCities(nextRecent);

      if (updateHistory) {
        const url = `/hava?sehir=${encodeURIComponent(cleanedCity)}`;
        window.history.pushState({ city: cleanedCity }, "", url);
      }
    } catch (requestError) {
      setView("weather");
      setReport(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Beklenmeyen bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const city = params.get("sehir");
      if (city) {
        void fetchWeather(city, false);
      } else {
        setView("landing");
        setReport(null);
        setError(null);
        setQuery("");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fetchWeather]);

  useEffect(() => {
    document.documentElement.dataset.weather = mood;
  }, [mood]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchWeather(query);
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setView("landing");
    setReport(null);
    setError(null);
    setQuery("");
    setMobileMenuOpen(false);
  };

  const changeUnit = (nextUnit: TemperatureUnit) => {
    localStorage.setItem("atmos-temperature-unit", nextUnit);
    setUnit(nextUnit);
  };

  const focusSearch = () => {
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  return (
    <div className={`app app--${mood}`}>
      <Atmosphere mood={mood} />
      <Header
        unit={unit}
        onUnitChange={changeUnit}
        onHome={goHome}
        onSearch={focusSearch}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuChange={setMobileMenuOpen}
      />

      <main className="page-shell">
        {view === "landing" ? (
          <LandingView
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            onCitySelect={fetchWeather}
            recentCities={recentCities}
            inputRef={searchInputRef}
            loading={loading}
          />
        ) : (
          <WeatherView
            report={report}
            error={error}
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            inputRef={searchInputRef}
            unit={unit}
            WeatherIcon={WeatherIcon}
            loading={loading}
            onRetry={() => void fetchWeather(query)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Atmosphere({ mood }: { mood: string }) {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="orb orb--one" />
      <div className="orb orb--two" />
      <div className="orb orb--three" />
      <div className="grain" />
      <span className="atmosphere__label">{mood}</span>
    </div>
  );
}

type HeaderProps = {
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
  onHome: () => void;
  onSearch: () => void;
  mobileMenuOpen: boolean;
  onMobileMenuChange: (open: boolean) => void;
};

function Header({
  unit,
  onUnitChange,
  onHome,
  onSearch,
  mobileMenuOpen,
  onMobileMenuChange,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={onHome} aria-label="Atmos ana sayfa">
          <span className="brand__mark"><CloudSun size={22} strokeWidth={2.2} /></span>
          <span>ATMOS</span>
        </button>

        <nav className={`header-actions ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Ana menü">
          <button className="nav-link" onClick={onHome}>Ana sayfa</button>
          <button className="nav-link" onClick={onSearch}>Şehir ara</button>
          <div className="unit-toggle" role="group" aria-label="Sıcaklık birimi">
            <button
              className={unit === "c" ? "is-active" : ""}
              onClick={() => onUnitChange("c")}
              aria-pressed={unit === "c"}
            >
              °C
            </button>
            <button
              className={unit === "f" ? "is-active" : ""}
              onClick={() => onUnitChange("f")}
              aria-pressed={unit === "f"}
            >
              °F
            </button>
          </div>
        </nav>

        <button
          className="menu-button"
          onClick={() => onMobileMenuChange(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

type LandingProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCitySelect: (city: string) => Promise<void>;
  recentCities: string[];
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
};

function LandingView({
  query,
  onQueryChange,
  onSubmit,
  onCitySelect,
  recentCities,
  inputRef,
  loading,
}: LandingProps) {
  const cities = recentCities.length
    ? [...new Set([...recentCities, ...POPULAR_CITIES])].slice(0, 8)
    : POPULAR_CITIES;

  return (
    <section className="landing">
      <div className="landing__copy">
        <div className="eyebrow">
          <Sparkles size={15} />
          <span>Havanın ritmini yakala</span>
        </div>
        <h1>
          Gününü gökyüzüne
          <span> göre planla.</span>
        </h1>
        <p className="landing__lead">
          Dünyanın her yerinden anlık hava durumu ve üç günlük öngörü.
          Sade, hızlı ve tam ihtiyacın kadar.
        </p>

        <SearchForm
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmit}
          inputRef={inputRef}
          loading={loading}
          large
        />

        <div className="city-list" aria-label="Popüler şehirler">
          <span>{recentCities.length ? "Son aramalar" : "Hızlı seçim"}</span>
          <div>
            {cities.map((city) => (
              <button key={city} onClick={() => void onCitySelect(city)}>
                {city}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="landing__visual" aria-label="Atmos hava durumu özeti">
        <div className="date-pill">
          <span>Bugün</span>
          <strong>{formatToday()}</strong>
        </div>
        <div className="weather-orbit">
          <div className="sun-disc">
            <CloudSun size={118} strokeWidth={1.15} />
          </div>
          <div className="orbit-line orbit-line--one" />
          <div className="orbit-line orbit-line--two" />
          <div className="floating-note floating-note--top">
            <span className="status-dot" />
            Canlı veriler
          </div>
          <div className="floating-note floating-note--bottom">
            <LocateFixed size={16} />
            Dünya çapında
          </div>
        </div>
        <p className="visual-caption">Bak. Anla. Hazırlan.</p>
      </div>
    </section>
  );
}

type SearchFormProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  large?: boolean;
};

function SearchForm({
  query,
  onQueryChange,
  onSubmit,
  inputRef,
  loading,
  large = false,
}: SearchFormProps) {
  return (
    <form className={`search ${large ? "search--large" : ""}`} onSubmit={onSubmit}>
      <Search size={21} aria-hidden="true" />
      <label className="sr-only" htmlFor={large ? "hero-search" : "weather-search"}>
        Şehir adı
      </label>
      <input
        ref={inputRef}
        id={large ? "hero-search" : "weather-search"}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Şehir veya bölge ara"
        maxLength={100}
        autoComplete="address-level2"
        disabled={loading}
      />
      <button type="submit" disabled={loading} aria-label="Hava durumunu ara">
        {loading ? <span className="button-spinner" /> : <ArrowRight size={21} />}
      </button>
    </form>
  );
}

type WeatherViewProps = {
  report: WeatherReport | null;
  error: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  unit: TemperatureUnit;
  WeatherIcon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  loading: boolean;
  onRetry: () => void;
};

function WeatherView({
  report,
  error,
  query,
  onQueryChange,
  onSubmit,
  inputRef,
  unit,
  WeatherIcon,
  loading,
  onRetry,
}: WeatherViewProps) {
  if (loading && !report) return <WeatherSkeleton />;

  if (error || !report) {
    return (
      <section className="error-view">
        <SearchForm
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmit}
          inputRef={inputRef}
          loading={loading}
        />
        <div className="error-card" role="alert">
          <div className="error-card__icon"><CloudSun size={44} /></div>
          <span>Gökyüzü sessiz kaldı</span>
          <h1>{error ?? "Hava durumu bulunamadı."}</h1>
          <p>Şehir adını kontrol edebilir veya birkaç saniye sonra yeniden deneyebilirsin.</p>
          <button onClick={onRetry}>Yeniden dene <ArrowRight size={17} /></button>
        </div>
      </section>
    );
  }

  const current = report.current;
  const firstForecast = report.forecasts[0];

  return (
    <section className="weather-dashboard" aria-busy={loading}>
      <div className="dashboard-toolbar">
        <div>
          <p>{formatToday()}</p>
          <h1><MapPin size={20} /> {current.city}, {current.country}</h1>
        </div>
        <SearchForm
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSubmit}
          inputRef={inputRef}
          loading={loading}
        />
      </div>

      <div className="dashboard-grid">
        <article className="current-card glass-card">
          <div className="current-card__top">
            <div>
              <span className="card-label">Şu an</span>
              <div className="current-temperature">
                {formatTemperature(current.temperature_c, unit)}
                <small>{unit.toUpperCase()}</small>
              </div>
              <p>{current.description}</p>
            </div>
            <div className="current-icon">
              <WeatherIcon size={132} strokeWidth={1.15} />
              <span className="icon-glow" />
            </div>
          </div>
          <div className="temperature-range">
            <span>Hissedilen {formatTemperature(current.feels_like_c, unit)}</span>
            {firstForecast && (
              <span>
                ↑ {formatTemperature(firstForecast.max_temperature_c, unit)}
                <i />
                ↓ {formatTemperature(firstForecast.min_temperature_c, unit)}
              </span>
            )}
          </div>
        </article>

        <MetricsGrid report={report} unit={unit} />
      </div>

      <ForecastSection report={report} unit={unit} />
      {loading && <div className="refresh-indicator">Veriler yenileniyor…</div>}
    </section>
  );
}

function MetricsGrid({
  report,
  unit,
}: {
  report: WeatherReport;
  unit: TemperatureUnit;
}) {
  const current = report.current;
  const metrics = [
    {
      label: "Nem",
      value: `%${current.humidity_percent}`,
      detail: current.humidity_percent > 70 ? "Yüksek" : "Dengeli",
      Icon: Droplets,
    },
    {
      label: "Rüzgâr",
      value: `${current.wind_speed_kmph}`,
      suffix: "km/sa",
      detail: current.wind_direction,
      Icon: Wind,
    },
    {
      label: "Basınç",
      value: `${current.pressure_hpa}`,
      suffix: "hPa",
      detail: current.pressure_hpa > 1013 ? "Yükseliyor" : "Normal",
      Icon: Gauge,
    },
    {
      label: "Görüş",
      value: `${current.visibility_km}`,
      suffix: "km",
      detail: current.visibility_km >= 10 ? "Çok iyi" : "Sınırlı",
      Icon: Eye,
    },
    {
      label: "Rüzgâr yönü",
      value: current.wind_direction,
      detail: "Pusula",
      Icon: Compass,
    },
    {
      label: "Hissedilen",
      value: formatTemperature(current.feels_like_c, unit),
      detail: "Dış ortam",
      Icon: CloudSun,
    },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map(({ label, value, suffix, detail, Icon }) => (
        <article className="metric-card glass-card" key={label}>
          <div className="metric-card__heading">
            <span>{label}</span>
            <Icon size={18} />
          </div>
          <strong>
            {value}
            {suffix && <small>{suffix}</small>}
          </strong>
          <p>{detail}</p>
        </article>
      ))}
    </div>
  );
}

function ForecastSection({
  report,
  unit,
}: {
  report: WeatherReport;
  unit: TemperatureUnit;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const days = report.forecasts;
  const selected = days[selectedIndex] ?? days[0];
  const SelectedIcon = getWeatherIcon(selected?.description);
  const maxTemp = useMemo(
    () => Math.max(...days.map((day) => day.max_temperature_c), 1),
    [days],
  );

  const handleDayKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    setSelectedIndex((index + direction + days.length) % days.length);
  };

  if (!days.length) return null;

  return (
    <section className="forecast-section" aria-labelledby="forecast-heading">
      <div className="section-heading">
        <div>
          <span>Önümüzdeki günler</span>
          <h2 id="forecast-heading">3 günlük tahmin</h2>
        </div>
        <p>Günlük en yüksek ve en düşük değerler</p>
      </div>

      <div className="forecast-layout">
        <div className="forecast-list" role="tablist" aria-label="Tahmin günleri">
          {days.map((day, index) => {
            const Icon = getWeatherIcon(day.description);
            const active = index === selectedIndex;
            return (
              <button
                role="tab"
                aria-selected={active}
                className={active ? "is-active" : ""}
                key={day.date}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={(event) => handleDayKey(event, index)}
              >
                <span className="forecast-day">
                  <Icon size={27} />
                  <span>
                    <strong>{formatForecastDate(day.date, index)}</strong>
                    <small>{day.description}</small>
                  </span>
                </span>
                <span className="forecast-temp">
                  <strong>{formatTemperature(day.max_temperature_c, unit)}</strong>
                  <small>{formatTemperature(day.min_temperature_c, unit)}</small>
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <article className="forecast-detail glass-card" role="tabpanel">
            <div>
              <span>{formatForecastDate(selected.date, selectedIndex)}</span>
              <h3>{selected.description}</h3>
            </div>
            <SelectedIcon size={72} strokeWidth={1.3} />
            <div className="temperature-bar" aria-hidden="true">
              <span
                style={{
                  width: `${Math.max(36, (selected.max_temperature_c / maxTemp) * 100)}%`,
                }}
              />
            </div>
            <p>
              Günün en yüksek sıcaklığı{" "}
              <strong>{formatTemperature(selected.max_temperature_c, unit)}</strong>,
              en düşük sıcaklığı{" "}
              <strong>{formatTemperature(selected.min_temperature_c, unit)}</strong>.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}

function WeatherSkeleton() {
  return (
    <section className="weather-skeleton" aria-label="Hava durumu yükleniyor" role="status">
      <div className="skeleton skeleton--toolbar" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton-cards">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="skeleton skeleton--card" key={index} />
          ))}
        </div>
      </div>
      <span className="sr-only">Hava durumu yükleniyor</span>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <span>ATMOS</span>
        <p>Hava verileri wttr.in üzerinden sağlanır.</p>
      </div>
      <p>Gökyüzü değişir. Planların hazır kalır.</p>
    </footer>
  );
}

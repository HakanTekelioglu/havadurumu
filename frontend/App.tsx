import {
  ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, ChevronRight,
  Clock3, CloudOff, CloudSun, Compass, Droplets, Eye, Gauge, Globe2,
  LayoutDashboard, LoaderCircle, MapPin, Moon, RefreshCw, Search,
  SlidersHorizontal, Sun, Thermometer, Wind, X,
} from "lucide-react";
import {
  type FormEvent, type RefObject, useCallback, useEffect, useLayoutEffect,
  useRef, useState,
} from "react";
import type { InitialState, TemperatureUnit, WeatherReport } from "./types";
import {
  formatForecastDate, formatTemperature, formatToday, getWeatherIcon, getWeatherMood,
} from "./weather";
import { Badge, Button, Card, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "./ui";

type ColorTheme = "light" | "dark";
const POPULAR_CITIES = [
  { name: "İstanbul", region: "Marmara Bölgesi", color: "mint", Icon: CloudSun },
  { name: "Ankara", region: "İç Anadolu Bölgesi", color: "sand", Icon: Sun },
  { name: "İzmir", region: "Ege Bölgesi", color: "blue", Icon: Wind },
  { name: "Antalya", region: "Akdeniz Bölgesi", color: "peach", Icon: Sun },
];

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Preferences remain usable in memory. */ }
}

function getRecentCities(): string[] {
  try {
    const value: unknown = JSON.parse(readStorage("atmos-recent-cities") ?? "[]");
    return Array.isArray(value)
      ? value.filter((city): city is string => typeof city === "string" && !!city.trim()).slice(0, 4)
      : [];
  } catch { return []; }
}

export function App({ initialState }: { initialState: InitialState }) {
  const [view, setView] = useState(initialState.view);
  const [query, setQuery] = useState(initialState.query);
  const [report, setReport] = useState<WeatherReport | null>(initialState.report);
  const [error, setError] = useState<string | null>(initialState.error);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<TemperatureUnit>(() => readStorage("atmos-temperature-unit") === "f" ? "f" : "c");
  const [theme, setTheme] = useState<ColorTheme>(() => {
    const saved = readStorage("atmos-color-theme");
    return saved === "light" || saved === "dark" ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [recentCities, setRecentCities] = useState(getRecentCities);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mood = getWeatherMood(report?.current.description);

  const fetchWeather = useCallback(async (city: string, updateHistory = true) => {
    const cleanedCity = city.trim();
    if (!cleanedCity) {
      setError("Hava durumunu görmek için bir şehir adı yaz.");
      searchInputRef.current?.focus();
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    setQuery(cleanedCity);
    setView("weather");
    setReport((previous) => previous?.current.city.toLocaleLowerCase("tr-TR") === cleanedCity.toLocaleLowerCase("tr-TR") ? previous : null);
    if (updateHistory) {
      window.history.pushState({ city: cleanedCity }, "", `/hava?sehir=${encodeURIComponent(cleanedCity)}`);
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    try {
      const response = await fetch(`/api/weather?sehir=${encodeURIComponent(cleanedCity)}`, {
        headers: { Accept: "application/json" }, signal: controller.signal,
      });
      const payload = await response.json() as WeatherReport & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Hava durumu bilgisi alınamadı.");
      if (controller.signal.aborted) return;
      setReport(payload);
      setQuery(payload.current.city);
      setRecentCities((previous) => {
        const next = [payload.current.city, ...previous.filter(
          (item) => item.toLocaleLowerCase("tr-TR") !== payload.current.city.toLocaleLowerCase("tr-TR"),
        )].slice(0, 4);
        writeStorage("atmos-recent-cities", JSON.stringify(next));
        return next;
      });
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setReport(null);
      setError(requestError instanceof Error ? requestError.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const goHome = useCallback((updateHistory = true) => {
    requestRef.current?.abort();
    if (updateHistory) window.history.pushState({}, "", "/");
    setView("landing");
    setReport(null);
    setError(null);
    setQuery("");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const city = new URLSearchParams(window.location.search).get("sehir");
      if (city) void fetchWeather(city, false);
      else goHome(false);
    };
    if (initialState.view === "landing" && window.location.pathname === "/hava") {
      const city = new URLSearchParams(window.location.search).get("sehir") ?? "İstanbul";
      void fetchWeather(city, false);
    }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      requestRef.current?.abort();
    };
  }, [fetchWeather, goHome, initialState.view]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.weather = mood;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#141c19" : "#f7f9f7");
  }, [theme, mood]);

  useEffect(() => {
    document.title = report && view === "weather"
      ? `${report.current.city} ${formatTemperature(report.current.temperature_c, unit)} — Atmos`
      : "Atmos — Hava Durumu";
  }, [report, unit, view]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchWeather(query);
  };
  const changeUnit = (next: TemperatureUnit) => {
    setUnit(next);
    writeStorage("atmos-temperature-unit", next);
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    writeStorage("atmos-color-theme", next);
  };
  const searchProps = {
    query, onQueryChange: setQuery, onSubmit: handleSearch,
    inputRef: searchInputRef, loading, error: view === "landing" ? error : null,
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">İçeriğe geç</a>
      <Sidebar view={view} recentCities={recentCities} currentCity={report?.current.city ?? (view === "weather" ? query : undefined)}
        onHome={() => goHome()} onSearch={() => searchInputRef.current?.focus()}
        onCitySelect={(city) => void fetchWeather(city)} />
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>Çalışma alanın</span><ChevronRight size={14} /><strong>{view === "landing" ? "Genel bakış" : "Hava durumu"}</strong></div>
          <div className="topbar-actions">
            <span className="topbar-date"><CalendarDays size={15} />{formatToday()}</span>
            <div className="unit-toggle" role="group" aria-label="Sıcaklık birimi">
              {(["c", "f"] as const).map((value) => (
                <button key={value} type="button" onClick={() => changeUnit(value)} aria-pressed={unit === value}>°{value.toUpperCase()}</button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme}
              aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
              title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
          </div>
        </header>
        <main id="main-content" className="page-shell" tabIndex={-1}>
          {view === "landing" ? (
            <LandingView searchProps={searchProps} recentCities={recentCities} onCitySelect={(city) => void fetchWeather(city)} />
          ) : (
            <WeatherView report={report} error={error} searchProps={searchProps} unit={unit}
              onRetry={() => void fetchWeather(query, false)} onHome={() => goHome()} />
          )}
        </main>
        <footer className="site-footer"><span>Bir bakışta hava. Bir adım önde sen.</span><a href="https://wttr.in" target="_blank" rel="noreferrer">Hava verileri: wttr.in <ArrowRight size={13} /></a></footer>
      </div>
    </div>
  );
}

function Sidebar({ view, recentCities, currentCity, onHome, onSearch, onCitySelect }: {
  view: InitialState["view"]; recentCities: string[]; currentCity?: string;
  onHome: () => void; onSearch: () => void; onCitySelect: (city: string) => void;
}) {
  return (
    <aside className="sidebar" aria-label="Gezinme">
      <button className="brand" onClick={onHome} aria-label="Atmos ana sayfa">
        <span className="brand-mark"><CloudSun size={25} strokeWidth={1.8} /></span>
        <span>atmos<span className="brand-dot">.</span></span>
      </button>
      <p className="brand-caption">Hava, bir bakışta.</p>
      <nav className="primary-nav" aria-label="Ana menü">
        <span className="sidebar-label">KEŞFET</span>
        <button className={`nav-item ${view === "landing" ? "is-active" : ""}`} onClick={onHome} aria-label="Genel bakış" aria-current={view === "landing" ? "page" : undefined}><LayoutDashboard size={18} />Genel bakış</button>
        <button className="nav-item" onClick={onSearch} aria-label="Şehir ara"><Search size={18} />Şehir ara<kbd>/</kbd></button>
        {view === "weather" && <div className="nav-item is-active current-location"><MapPin size={18} /><span>{currentCity || "Hava durumu"}</span></div>}
      </nav>
      <div className="sidebar-cities">
        <span className="sidebar-label">SON ARAMALAR</span>
        {recentCities.length ? recentCities.map((city) => (
          <button className="nav-item" key={city} onClick={() => onCitySelect(city)}><Clock3 size={16} /><span>{city}</span><ChevronRight size={14} /></button>
        )) : <p className="sidebar-empty">Aradığın şehirler burada.<br />Bir sonraki bakışın daha kolay.</p>}
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="sidebar-note-icon"><Globe2 size={22} /></span><strong>Dünya kadar yakın.</strong><p>Bulunduğun yerin ya da bir sonraki durağının havasını keşfet.</p></div>
        <div className="sidebar-signature"><span className="status-dot" />Her güne hazırlıklı.</div>
      </div>
    </aside>
  );
}

type SearchFormProps = {
  query: string; onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  inputRef: RefObject<HTMLInputElement | null>; loading: boolean;
  error?: string | null; large?: boolean;
};

function SearchForm({ query, onQueryChange, onSubmit, inputRef, loading, error, large }: SearchFormProps) {
  return (
    <div className={`search-wrapper ${large ? "search-wrapper--large" : ""}`}>
      <form className="search" role="search" onSubmit={onSubmit} aria-label="Şehir hava durumu">
        <Search size={20} aria-hidden="true" />
        <label htmlFor="city-search" className="sr-only">Şehir adı</label>
        <input ref={inputRef} id="city-search" value={query} onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Bir şehir ara…" maxLength={100} autoComplete="off" spellCheck={false}
          aria-invalid={!!error} aria-describedby={error ? "search-error" : undefined} />
        {query && <button type="button" className="search-clear" aria-label="Aramayı temizle" onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}><X size={16} /></button>}
        <Button type="submit" disabled={loading || !query.trim()} aria-label="Hava durumunu ara">
          {loading ? <LoaderCircle size={18} className="spin" /> : <><span className="search-button-label">Havayı keşfet</span><ArrowRight size={18} /></>}
        </Button>
      </form>
      {error && <p id="search-error" className="search-error" role="alert">{error}</p>}
    </div>
  );
}

function LandingView({ searchProps, recentCities, onCitySelect }: {
  searchProps: SearchFormProps; recentCities: string[]; onCitySelect: (city: string) => void;
}) {
  return (
    <div className="landing page-enter">
      <div className="page-intro"><div><p className="overline">KÜÇÜK BİR BAKIŞ, DAHA İYİ BİR GÜN</p><h1>Merhaba, gökyüzü meraklısı<span className="greeting-dot">.</span></h1></div><Badge variant="outline"><span className="status-dot" />Günün için buradayız</Badge></div>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <Badge><CloudSun size={14} />Havanın ritmini yakala</Badge>
          <h2 id="hero-heading">Güzel bir gün,<br /><span>iyi bir planla başlar.</span></h2>
          <p>Şehrinin havasını öğren, önündeki günleri keşfet.<br className="desktop-break" /> Dışarıdaki dünya için ihtiyacın olan her şey, bir bakışta.</p>
          <SearchForm {...searchProps} large />
          <div className="search-hint"><Globe2 size={14} /><span>İstanbul’dan Tokyo’ya, dünyanın her yerinde.</span></div>
        </div>
        <SkyScene />
      </section>
      {recentCities.length > 0 && <div className="recent-chips"><span><Clock3 size={14} />Son baktıkların</span>{recentCities.map((city) => <Button key={city} variant="outline" size="sm" onClick={() => onCitySelect(city)}>{city}<ArrowRight size={13} /></Button>)}</div>}
      <section className="cities-section" aria-labelledby="cities-heading">
        <div className="section-heading"><div><h2 id="cities-heading">Bir şehir seç, keşfe başla</h2><p>Bir sonraki durağında hava nasıl?</p></div><span className="section-caption"><MapPin size={14} />Popüler şehirler</span></div>
        <div className="city-grid">
          {POPULAR_CITIES.map(({ name, region, color, Icon }, index) => (
            <button className={`city-card city-card--${color}`} key={name} onClick={() => onCitySelect(name)}>
              <div className="city-card-top"><span className="city-number">0{index + 1}</span><Icon size={37} strokeWidth={1.2} /></div>
              <div className="city-card-bottom"><div><strong>{name}</strong><span>{region}</span></div><span className="city-arrow"><ArrowRight size={17} /></span></div>
            </button>
          ))}
        </div>
      </section>
      <section className="features" aria-label="Atmos ile neler yapabilirsin?">
        {[
          { Icon: Globe2, title: "Sınırları aşan hava bilgisi", description: "Dünyanın dört bir yanındaki şehirleri keşfet." },
          { Icon: CalendarDays, title: "Bugünü bil, yarına hazırlan", description: "Üç günlük tahminle planlarına yön ver." },
          { Icon: SlidersHorizontal, title: "Tam senin havanda", description: "Açık veya koyu tema, Celsius veya Fahrenheit." },
        ].map(({ Icon, title, description }) => <div className="feature" key={title}><span className="feature-icon"><Icon size={20} strokeWidth={1.6} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}
      </section>
    </div>
  );
}

function SkyScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <div className="scene-header"><span>DIŞARIDA BİR DÜNYA VAR</span><span className="scene-cross">+</span></div>
      <div className="scene-art"><div className="scene-orbit scene-orbit--outer" /><div className="scene-orbit scene-orbit--inner" /><div className="scene-sun" /><div className="scene-cloud scene-cloud--back" /><div className="scene-cloud scene-cloud--front" /><span className="scene-spark scene-spark--one">✳</span><span className="scene-spark scene-spark--two">+</span></div>
      <div className="scene-footer"><div>Nereye gidersen,<br /><strong>hazırlıklı git.</strong></div><span><Compass size={23} strokeWidth={1.3} /></span></div>
    </div>
  );
}

function WeatherView({ report, error, searchProps, unit, onRetry, onHome }: {
  report: WeatherReport | null; error: string | null; searchProps: SearchFormProps;
  unit: TemperatureUnit; onRetry: () => void; onHome: () => void;
}) {
  const loading = searchProps.loading;
  return (
    <div className="weather-dashboard page-enter" aria-busy={loading}>
      <div className="dashboard-toolbar">
        <div><p className="overline">GÜNÜNÜ PLANLAMAYA BURADAN BAŞLA</p><h1>{report && !error ? <><MapPin size={23} />{report.current.city}<span className="country">{report.current.country}</span></> : "Şehrinin hava durumu"}</h1></div>
        <SearchForm {...searchProps} />
      </div>
      {loading && !report ? <WeatherSkeleton /> : error || !report ? (
        <Card className="error-card" role="alert">
          <span className="error-icon"><CloudOff size={36} strokeWidth={1.4} /></span>
          <Badge variant="outline">Küçük bir bulut çıktı</Badge>
          <h2>Hava bilgisine ulaşamadık.</h2><p>{error || "Bu şehir için hava durumu bulunamadı."}</p>
          <p className="error-hint">Şehir adını kontrol et veya biraz sonra tekrar dene.</p>
          <div className="error-actions"><Button onClick={onRetry}><RefreshCw size={16} />Yeniden dene</Button><Button variant="outline" onClick={onHome}>Ana sayfaya dön</Button></div>
        </Card>
      ) : <>
        <div className="report-meta"><Badge><span className="status-dot" />Güncel hava durumu</Badge><Button variant="ghost" size="sm" disabled={loading} onClick={onRetry}><RefreshCw size={14} className={loading ? "spin" : ""} />{loading ? "Yenileniyor…" : "Yenile"}</Button></div>
        <div className="dashboard-grid"><CurrentWeatherCard report={report} unit={unit} /><MetricsGrid report={report} unit={unit} /></div>
        <ForecastSection key={`${report.current.city}-${report.forecasts.map((day) => day.date).join()}`} report={report} unit={unit} />
        <div className="weather-note"><span className="feature-icon"><Compass size={21} /></span><div><strong>Günün için küçük bir ipucu</strong><p>{getWeatherTip(report)}</p></div><Check size={19} /></div>
      </>}
      <span className="sr-only" role="status" aria-live="polite">{loading ? "Hava durumu yükleniyor." : report && !error ? `${report.current.city}: ${formatTemperature(report.current.temperature_c, unit)}, ${report.current.description}.` : ""}</span>
    </div>
  );
}

function CurrentWeatherCard({ report, unit }: { report: WeatherReport; unit: TemperatureUnit }) {
  const current = report.current;
  const first = report.forecasts[0];
  const Icon = getWeatherIcon(current.description);
  return (
    <Card className={`current-card current-card--${getWeatherMood(current.description)}`}>
      <div className="current-heading"><span><span className="status-dot" />ŞU AN</span><span>{formatToday()}</span></div>
      <div className="current-main"><div><div className="current-temperature">{formatTemperature(current.temperature_c, unit)}<span>{unit.toUpperCase()}</span></div><h2>{current.description}</h2><p>Hissedilen {formatTemperature(current.feels_like_c, unit)}</p></div><div className="current-weather-art"><Icon size={104} strokeWidth={1.1} /></div></div>
      <div className="current-bottom"><span><MapPin size={15} />{current.city}</span>{first && <div><span><ArrowUp size={15} />{formatTemperature(first.max_temperature_c, unit)}</span><span><ArrowDown size={15} />{formatTemperature(first.min_temperature_c, unit)}</span></div>}</div>
    </Card>
  );
}

function MetricsGrid({ report, unit }: { report: WeatherReport; unit: TemperatureUnit }) {
  const current = report.current;
  const metrics = [
    { label: "Nem oranı", value: current.humidity_percent, suffix: "%", detail: current.humidity_percent > 70 ? "Yüksek nem" : current.humidity_percent < 30 ? "Düşük nem" : "Dengeli nem", Icon: Droplets, color: "blue", progress: current.humidity_percent },
    { label: "Rüzgâr hızı", value: current.wind_speed_kmph, suffix: "km/sa", detail: current.wind_speed_kmph > 40 ? "Kuvvetli rüzgâr" : current.wind_speed_kmph > 15 ? "Orta şiddette" : "Hafif esinti", Icon: Wind, color: "mint" },
    { label: "Hissedilen", value: formatTemperature(current.feels_like_c, unit), suffix: unit.toUpperCase(), detail: "Algılanan sıcaklık", Icon: Thermometer, color: "peach" },
    { label: "Görüş mesafesi", value: current.visibility_km, suffix: "km", detail: current.visibility_km >= 10 ? "Açık görüş" : "Sınırlı görüş", Icon: Eye, color: "mint" },
    { label: "Hava basıncı", value: current.pressure_hpa, suffix: "hPa", detail: current.pressure_hpa > 1013 ? "Yüksek basınç" : current.pressure_hpa < 1000 ? "Düşük basınç" : "Normal aralık", Icon: Gauge, color: "sand" },
    { label: "Rüzgâr yönü", value: current.wind_direction, detail: getWindDirection(current.wind_direction), Icon: Compass, color: "blue" },
  ];
  return <div className="metrics-grid">{metrics.map(({ label, value, suffix, detail, Icon, color, progress }) => (
    <Card className="metric-card" key={label}><div className="metric-heading"><span>{label}</span><span className={`metric-icon metric-icon--${color}`}><Icon size={17} strokeWidth={1.7} /></span></div><strong>{value}{suffix && <small>{suffix}</small>}</strong><div className="metric-detail"><span>{detail}</span>{progress !== undefined && <span className="mini-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></span>}</div></Card>
  ))}</div>;
}

function ForecastSection({ report, unit }: { report: WeatherReport; unit: TemperatureUnit }) {
  const days = report.forecasts;
  if (!days.length) return <Card className="empty-forecast"><CalendarDays size={22} /><p>Bu konum için günlük tahmin henüz bulunmuyor.</p></Card>;
  const min = Math.min(...days.map((day) => day.min_temperature_c));
  const max = Math.max(...days.map((day) => day.max_temperature_c));
  const range = Math.max(1, max - min);
  return (
    <section className="forecast-section" aria-labelledby="forecast-heading">
      <div className="section-heading"><div><h2 id="forecast-heading">Önümüzdeki günlere bir bakış</h2><p>{days.length} günlük tahminle planlarına yer aç.</p></div><span className="section-caption"><CalendarDays size={15} />Günlük tahmin</span></div>
      <Tabs defaultValue={days[0].date}>
        <TabsList className="forecast-tabs" aria-label="Tahmin günleri" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day, index) => {
            const Icon = getWeatherIcon(day.description);
            return <TabsTrigger className="forecast-tab" key={day.date} value={day.date}><div className="forecast-tab-top"><span>{formatForecastDate(day.date, index)}</span><span className="forecast-selected"><Check size={12} /></span></div><div className="forecast-tab-main"><Icon size={35} strokeWidth={1.5} /><div><strong>{formatTemperature(day.max_temperature_c, unit)}</strong><span>{formatTemperature(day.min_temperature_c, unit)}</span></div></div><span className="forecast-description">{day.description}</span><div className="temperature-track" aria-hidden="true"><span style={{ left: `${((day.min_temperature_c - min) / range) * 65}%`, width: `${Math.max(14, ((day.max_temperature_c - day.min_temperature_c) / range) * 100)}%` }} /></div></TabsTrigger>;
          })}
        </TabsList>
        {days.map((day, index) => <TabsContent className="forecast-detail" value={day.date} key={day.date}><CalendarDays size={17} /><p><strong>{formatForecastDate(day.date, index)}</strong> için beklenen hava: {day.description.toLocaleLowerCase("tr-TR")}. Sıcaklık <strong>{formatTemperature(day.min_temperature_c, unit)}</strong> ile <strong>{formatTemperature(day.max_temperature_c, unit)}</strong> arasında.</p></TabsContent>)}
      </Tabs>
    </section>
  );
}

function WeatherSkeleton() {
  return <div className="weather-skeleton" role="status" aria-label="Hava durumu yükleniyor"><div className="dashboard-grid"><Skeleton className="skeleton-current" /><div className="metrics-grid">{Array.from({ length: 6 }, (_, index) => <Skeleton className="skeleton-metric" key={index} />)}</div></div><Skeleton className="skeleton-heading" /><div className="skeleton-forecasts">{[0, 1, 2].map((index) => <Skeleton key={index} />)}</div><span className="sr-only">Hava durumu yükleniyor.</span></div>;
}

function getWindDirection(direction: string) {
  const names: Record<string, string> = { N: "Kuzey", NNE: "Kuzey-kuzeydoğu", NE: "Kuzeydoğu", ENE: "Doğu-kuzeydoğu", E: "Doğu", ESE: "Doğu-güneydoğu", SE: "Güneydoğu", SSE: "Güney-güneydoğu", S: "Güney", SSW: "Güney-güneybatı", SW: "Güneybatı", WSW: "Batı-güneybatı", W: "Batı", WNW: "Batı-kuzeybatı", NW: "Kuzeybatı", NNW: "Kuzey-kuzeybatı" };
  return names[direction.toUpperCase()] ?? "Pusula yönü";
}

function getWeatherTip(report: WeatherReport) {
  const mood = getWeatherMood(report.current.description);
  if (mood === "storm") return "Dışarı çıkmadan önce yerel hava uyarılarını kontrol etmek iyi bir fikir.";
  if (mood === "rain") return "Çantanda küçük bir şemsiyeye yer aç. Yağmura hazırlıklı olmak günü kolaylaştırır.";
  if (mood === "snow") return "Kalın bir katman ve rahat botlar, karlı bir güne güzel bir başlangıç.";
  if (mood === "fog") return "Dışarıda görüş sınırlı olabilir. Yolculuğun için biraz daha zaman ayır.";
  if (report.current.wind_speed_kmph > 35) return "Bugün rüzgâr öne çıkıyor. Açık hava planlarında bunu da hesaba kat.";
  if (report.current.temperature_c < 12) return "Hava serin; dışarı çıkarken yanına fazladan bir katman alabilirsin.";
  return "Küçük bir yürüyüşe ya da açık havada bir molaya planlarında yer açabilirsin.";
}

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type WeatherMood =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog";

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const getWeatherMood = (description = ""): WeatherMood => {
  const value = normalize(description);
  if (/(firtina|gok gurultulu|thunder|storm)/.test(value)) return "storm";
  if (/(kar|snow|sulu kar|blizzard)/.test(value)) return "snow";
  if (/(yagmur|saganak|rain|drizzle)/.test(value)) return "rain";
  if (/(sis|pus|fog|mist)/.test(value)) return "fog";
  if (/(bulut|cloud|kapali|overcast)/.test(value)) return "cloudy";
  return "clear";
};

export const getWeatherIcon = (description = ""): LucideIcon => {
  if (/(parçalı|partly)/i.test(description)) return CloudSun;
  const mood = getWeatherMood(description);
  if (mood === "storm") return CloudLightning;
  if (mood === "snow") return CloudSnow;
  if (mood === "rain") return CloudRain;
  if (mood === "fog") return CloudFog;
  if (mood === "cloudy") return Cloud;
  return Sun;
};

export const formatTemperature = (
  temperature: number,
  unit: "c" | "f",
) => {
  const value = unit === "f" ? Math.round((temperature * 9) / 5 + 32) : temperature;
  return `${value}°`;
};

export const formatForecastDate = (date: string, index: number) => {
  if (index === 0) return "Bugün";
  if (index === 1) return "Yarın";

  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(parsed);
};

export const formatToday = () =>
  new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

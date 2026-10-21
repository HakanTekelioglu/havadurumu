const unavailableMessage =
  "Hava durumu bilgisi şu anda alınamıyor. Lütfen daha sonra deneyin.";

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function text(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Missing weather text");
  }
  return value;
}

function integer(value) {
  if (!/^-?\d+$/.test(String(value))) {
    throw new Error("Invalid weather number");
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error("Invalid weather number");
  return result;
}

function localized(items) {
  return text(items?.[0]?.value);
}

function toReport(payload) {
  const current = payload.current_condition[0];
  const location = payload.nearest_area[0];
  if (!Array.isArray(payload.weather)) throw new Error("Missing forecasts");

  return {
    current: {
      city: localized(location.areaName),
      country: localized(location.country),
      temperature_c: integer(current.temp_C),
      feels_like_c: integer(current.FeelsLikeC),
      humidity_percent: integer(current.humidity),
      wind_speed_kmph: integer(current.windspeedKmph),
      wind_direction: text(current.winddir16Point),
      description: localized(current.weatherDesc),
      pressure_hpa: integer(current.pressure),
      visibility_km: integer(current.visibility),
    },
    forecasts: payload.weather.slice(0, 3).map((day) => {
      if (!Array.isArray(day.hourly) || day.hourly.length === 0) {
        throw new Error("Missing hourly forecast");
      }
      const midday = day.hourly.reduce((closest, hour) =>
        Math.abs(integer(hour.time ?? 1200) - 1200) <
        Math.abs(integer(closest.time ?? 1200) - 1200)
          ? hour
          : closest,
      );
      return {
        date: text(day.date),
        max_temperature_c: integer(day.maxtempC),
        min_temperature_c: integer(day.mintempC),
        description: localized(midday.weatherDesc),
      };
    }),
  };
}

// Cloudflare Pages runs this endpoint instead of the local Flask API.
export async function onRequestGet({ request }) {
  const query = new URL(request.url).searchParams.get("sehir") ?? "";
  const city = query.trim().replace(/\s+/gu, " ");
  const error = (message, status) => json({ error: message, query }, status);

  if (!city) return error("Lütfen bir şehir adı girin.", 400);
  if ([...city].length > 100) {
    return error("Şehir adı 100 karakterden uzun olamaz.", 400);
  }

  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=tr`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.status === 404) {
      return error("Şehir bulunamadı. Lütfen şehir adını kontrol edin.", 404);
    }
    if (!response.ok) return error(unavailableMessage, 502);
    return json(toReport(await response.json()));
  } catch {
    return error(unavailableMessage, 502);
  }
}

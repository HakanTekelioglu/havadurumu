import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestGet } from "../functions/api/weather.js";

const request = (city) => ({
  request: new Request(
    `https://atmos.example/api/weather?sehir=${encodeURIComponent(city)}`,
  ),
});

function weatherPayload() {
  return {
    current_condition: [{
      temp_C: "18", FeelsLikeC: "17", humidity: "61",
      windspeedKmph: "14", winddir16Point: "WNW",
      weatherDesc: [{ value: "Hafif yağmurlu" }],
      pressure: "1008", visibility: "9",
    }],
    nearest_area: [{
      areaName: [{ value: "Eskişehir" }],
      country: [{ value: "Türkiye" }],
    }],
    weather: Array.from({ length: 4 }, (_, index) => ({
      date: `2026-10-${21 + index}`, maxtempC: "23", mintempC: "15",
      hourly: [
        { time: "0", weatherDesc: [{ value: "Açık" }] },
        { time: "1200", weatherDesc: [{ value: "Yağmurlu" }] },
        { time: "1800", weatherDesc: [{ value: "Bulutlu" }] },
      ],
    })),
  };
}

test("invalid city input is rejected before contacting the provider", async (t) => {
  const upstream = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Provider must not be called");
  });
  for (const city of ["", " \t ", "a".repeat(101)]) {
    const response = await onRequestGet(request(city));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).query, city);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test("normalizes and encodes city, returns the frontend's report contract", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://wttr.in/New%20York?format=j1&lang=tr");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(weatherPayload());
  });
  const response = await onRequestGet(request("  New   York  "));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  const report = await response.json();
  assert.deepEqual(report.current, {
    city: "Eskişehir", country: "Türkiye", temperature_c: 18,
    feels_like_c: 17, humidity_percent: 61, wind_speed_kmph: 14,
    wind_direction: "WNW", description: "Hafif yağmurlu",
    pressure_hpa: 1008, visibility_km: 9,
  });
  assert.equal(report.forecasts.length, 3);
  assert.deepEqual(report.forecasts[0], {
    date: "2026-10-21", max_temperature_c: 23,
    min_temperature_c: 15, description: "Yağmurlu",
  });
});

test("provider 404 remains a JSON location error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 404 }));
  const response = await onRequestGet(request("Unknown"));
  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /Şehir bulunamadı/);
});

for (const [name, respond] of [
  ["provider failure", () => new Response("", { status: 503 })],
  ["non-JSON response", () => new Response("<html>error</html>")],
  ["missing fields", () => Response.json({})],
  ["invalid numbers", () => {
    const payload = weatherPayload();
    payload.current_condition[0].temp_C = "";
    return Response.json(payload);
  }],
  ["empty hourly forecast", () => {
    const payload = weatherPayload();
    payload.weather[0].hourly = [];
    return Response.json(payload);
  }],
  ["network timeout", () => { throw new DOMException("Timeout", "TimeoutError"); }],
]) {
  test(`${name} returns a controlled JSON error`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => respond());
    const response = await onRequestGet(request("İstanbul"));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).query, "İstanbul");
  });
}

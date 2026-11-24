"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { WeatherData } from "../ios-device-renderer";

export const DEFAULT_MANAGUA_WEATHER: WeatherData = {
  city: "Managua",
  temperature: 82,
  unit: "F",
  condition: "Mostly Sunny",
  high: 88,
  low: 72,
  isDay: true,
  weatherCode: 1,
  hourly: [
    { time: "Now", temp: 82, weatherCode: 1 },
    { time: "12 PM", temp: 86, weatherCode: 0 },
    { time: "1 PM", temp: 88, weatherCode: 0 },
    { time: "2 PM", temp: 87, weatherCode: 2 },
  ],
};

export const DEFAULT_MANAGUA_WEATHER_CELSIUS: WeatherData = {
  city: "Managua",
  temperature: 28,
  unit: "C",
  condition: "Mostly Sunny",
  high: 31,
  low: 22,
  isDay: true,
  weatherCode: 1,
  hourly: [
    { time: "Now", temp: 28, weatherCode: 1 },
    { time: "12 PM", temp: 30, weatherCode: 0 },
    { time: "1 PM", temp: 31, weatherCode: 0 },
    { time: "2 PM", temp: 30, weatherCode: 2 },
  ],
};

export function mapWmoToCondition(code: number, isDay = true): string {
  if (code === 0) return isDay ? "Sunny" : "Clear";
  if (code === 1) return isDay ? "Mostly Sunny" : "Mostly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return isDay ? "Sunny" : "Clear";
}

interface OpenMeteoApiResponse {
  current?: {
    time?: string;
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    is_day?: number[];
  };
}

export async function fetchLiveWeather(
  locale?: string,
  city = "Managua",
): Promise<WeatherData> {
  const isCelsius = locale?.toLowerCase().startsWith("es") ?? false;
  const unitParam = isCelsius ? "" : "&temperature_unit=fahrenheit";
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=12.1364&longitude=-86.2514&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,is_day${unitParam}&timezone=America%2FManagua`;

  const res = await fetch(endpoint, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Weather API fetch failed with status ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoApiResponse;
  if (!data?.current) {
    throw new Error("Invalid weather response payload");
  }

  const currentPrefix = data.current.time?.slice(0, 13);
  const foundIndex = currentPrefix
    ? (data.hourly?.time?.findIndex((t) => t.startsWith(currentPrefix)) ?? -1)
    : -1;
  const startIndex = foundIndex >= 0 ? foundIndex : new Date().getHours();

  const hourlyOffsets = [0, 1, 2, 3];
  const hourlyData = hourlyOffsets.map((offset, i) => {
    const idx = (startIndex + offset) % (data.hourly?.time?.length ?? 24);
    const temp =
      data.hourly?.temperature_2m?.[idx] ?? data.current!.temperature_2m;
    const code = data.hourly?.weather_code?.[idx] ?? data.current!.weather_code;
    const isDay =
      data.hourly?.is_day?.[idx] !== undefined
        ? Boolean(data.hourly.is_day[idx])
        : Boolean(data.current!.is_day);

    let timeDisplay = "Now";
    if (i > 0) {
      if (data.hourly?.time?.[idx]) {
        const d = new Date(data.hourly.time[idx]);
        timeDisplay = d.toLocaleTimeString(locale ?? "en-US", {
          hour: "numeric",
          hour12: true,
        });
      } else {
        timeDisplay = new Date(
          Date.now() + offset * 3600 * 1000,
        ).toLocaleTimeString(locale ?? "en-US", {
          hour: "numeric",
          hour12: true,
        });
      }
    }

    return {
      time: timeDisplay,
      temp: Math.round(temp),
      weatherCode: code,
      isDay,
    };
  });

  return {
    city,
    temperature: Math.round(data.current.temperature_2m),
    unit: isCelsius ? "C" : "F",
    condition: mapWmoToCondition(
      data.current.weather_code,
      Boolean(data.current.is_day),
    ),
    high: Math.round(
      data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 5,
    ),
    low: Math.round(
      data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 5,
    ),
    isDay: Boolean(data.current.is_day),
    weatherCode: data.current.weather_code,
    hourly: hourlyData,
  };
}

export function useLiveWeather(
  locale?: string,
  city = "Managua",
  queryClient?: QueryClient,
): WeatherData {
  const isCelsius = locale?.toLowerCase().startsWith("es") ?? false;
  const fallback = isCelsius
    ? DEFAULT_MANAGUA_WEATHER_CELSIUS
    : DEFAULT_MANAGUA_WEATHER;

  const { data } = useQuery(
    {
      queryKey: ["live-weather", city, locale ?? "en", isCelsius],
      queryFn: () => fetchLiveWeather(locale, city),
      staleTime: 1000 * 60 * 15, // 15-minute freshness cache
      gcTime: 1000 * 60 * 60, // 1-hour cache lifetime
      refetchOnWindowFocus: false,
      retry: 1,
      placeholderData: fallback,
    },
    queryClient,
  );

  return data ?? fallback;
}

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  DEFAULT_MANAGUA_WEATHER,
  DEFAULT_MANAGUA_WEATHER_CELSIUS,
  mapWmoToCondition,
  fetchLiveWeather,
  useLiveWeather,
} from "./use-live-weather";

describe("use-live-weather", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("Default constants", () => {
    it("has valid DEFAULT_MANAGUA_WEATHER in Fahrenheit", () => {
      expect(DEFAULT_MANAGUA_WEATHER.city).toBe("Managua");
      expect(DEFAULT_MANAGUA_WEATHER.unit).toBe("F");
      expect(DEFAULT_MANAGUA_WEATHER.temperature).toBe(82);
      expect(DEFAULT_MANAGUA_WEATHER.hourly).toHaveLength(4);
    });

    it("has valid DEFAULT_MANAGUA_WEATHER_CELSIUS in Celsius", () => {
      expect(DEFAULT_MANAGUA_WEATHER_CELSIUS.city).toBe("Managua");
      expect(DEFAULT_MANAGUA_WEATHER_CELSIUS.unit).toBe("C");
      expect(DEFAULT_MANAGUA_WEATHER_CELSIUS.temperature).toBe(28);
      expect(DEFAULT_MANAGUA_WEATHER_CELSIUS.hourly).toHaveLength(4);
    });
  });

  describe("mapWmoToCondition", () => {
    it("maps WMO code 0 correctly for day and night", () => {
      expect(mapWmoToCondition(0, true)).toBe("Sunny");
      expect(mapWmoToCondition(0, false)).toBe("Clear");
    });

    it("maps WMO code 1 correctly for day and night", () => {
      expect(mapWmoToCondition(1, true)).toBe("Mostly Sunny");
      expect(mapWmoToCondition(1, false)).toBe("Mostly Clear");
    });

    it("maps cloudy, fog, rain, snow and thunderstorm codes", () => {
      expect(mapWmoToCondition(2)).toBe("Partly Cloudy");
      expect(mapWmoToCondition(3)).toBe("Overcast");
      expect(mapWmoToCondition(45)).toBe("Foggy");
      expect(mapWmoToCondition(61)).toBe("Rain");
      expect(mapWmoToCondition(71)).toBe("Snow");
      expect(mapWmoToCondition(95)).toBe("Thunderstorm");
    });

    it("falls back to Sunny/Clear for unknown codes", () => {
      expect(mapWmoToCondition(999, true)).toBe("Sunny");
      expect(mapWmoToCondition(999, false)).toBe("Clear");
    });
  });

  describe("fetchLiveWeather", () => {
    it("fetches and transforms open-meteo response successfully", async () => {
      const mockApiResponse = {
        current: {
          temperature_2m: 84.6,
          weather_code: 1,
          is_day: 1,
        },
        daily: {
          temperature_2m_max: [90.2],
          temperature_2m_min: [74.1],
        },
        hourly: {
          temperature_2m: new Array(24).fill(85),
          weather_code: new Array(24).fill(1),
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await fetchLiveWeather("en", "Managua");

      expect(result.city).toBe("Managua");
      expect(result.temperature).toBe(85);
      expect(result.unit).toBe("F");
      expect(result.condition).toBe("Mostly Sunny");
      expect(result.high).toBe(90);
      expect(result.low).toBe(74);
      expect(result.isDay).toBe(true);
      expect(result.hourly).toHaveLength(4);
    });

    it("handles Celsius when locale is Spanish", async () => {
      const mockApiResponse = {
        current: {
          temperature_2m: 29.3,
          weather_code: 0,
          is_day: 1,
        },
        daily: {
          temperature_2m_max: [32.1],
          temperature_2m_min: [23.5],
        },
        hourly: {
          temperature_2m: new Array(24).fill(29),
          weather_code: new Array(24).fill(0),
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await fetchLiveWeather("es-NI", "Managua");

      expect(result.unit).toBe("C");
      expect(result.temperature).toBe(29);
      expect(result.condition).toBe("Sunny");
    });

    it("throws when API returns non-ok status", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(fetchLiveWeather("en", "Managua")).rejects.toThrow(
        "Weather API fetch failed with status 503",
      );
    });

    it("throws when current payload is missing", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(fetchLiveWeather("en", "Managua")).rejects.toThrow(
        "Invalid weather response payload",
      );
    });
  });

  describe("useLiveWeather hook", () => {
    it("returns placeholder data initially and updates when query succeeds", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const mockApiResponse = {
        current: {
          temperature_2m: 79.2,
          weather_code: 2,
          is_day: 1,
        },
        daily: {
          temperature_2m_max: [84.1],
          temperature_2m_min: [70.5],
        },
        hourly: {
          temperature_2m: new Array(24).fill(79),
          weather_code: new Array(24).fill(2),
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLiveWeather("en", "Managua"), {
        wrapper,
      });

      // Initially has fallback
      expect(result.current.city).toBe("Managua");
      expect(result.current.unit).toBe("F");

      // Await query completion
      await waitFor(() => {
        expect(result.current.temperature).toBe(79);
      });

      expect(result.current.condition).toBe("Partly Cloudy");
      expect(result.current.high).toBe(84);
      expect(result.current.low).toBe(71);
    });

    it("provides Celsius placeholder data for Spanish locale", () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      global.fetch = jest
        .fn()
        .mockImplementation(() => new Promise(() => undefined));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLiveWeather("es", "Managua"), {
        wrapper,
      });

      expect(result.current.unit).toBe("C");
      expect(result.current.temperature).toBe(28);
    });
  });
});

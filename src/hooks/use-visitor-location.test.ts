import { renderHook } from "@testing-library/react";

import { useVisitorLocation } from "./use-visitor-location";

jest.mock("@/trpc/react", () => ({
  api: {
    geo: {
      getVisitorLocation: {
        useQuery: jest.fn(),
      },
    },
  },
}));

import { api } from "@/trpc/react";

const useQuery = api.geo.getVisitorLocation.useQuery as jest.Mock;

describe("useVisitorLocation", () => {
  it("returns null while the query has no data", () => {
    useQuery.mockReturnValue({ data: undefined, status: "pending" });
    const { result } = renderHook(() => useVisitorLocation());
    expect(result.current).toEqual({ location: null, status: "pending" });
  });

  it("returns the visitor location when loaded", () => {
    const location = { lat: 52.3, lon: 4.9, city: "Amsterdam" };
    useQuery.mockReturnValue({ data: location, status: "success" });
    const { result } = renderHook(() => useVisitorLocation());
    expect(result.current.location).toEqual(location);
  });
});

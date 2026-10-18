import { getCompanyInitials, getNameInitials } from "./cv-initials";

describe("cv-initials", () => {
  describe("getCompanyInitials", () => {
    it("returns two letters for single word companies", () => {
      expect(getCompanyInitials("Imagemaker")).toBe("IM");
      expect(getCompanyInitials("Contollo")).toBe("CO");
    });

    it("returns first letter of first two words", () => {
      expect(getCompanyInitials("Claro Nicaragua")).toBe("CN");
      expect(getCompanyInitials("Walmart Global Tech")).toBe("WG");
    });

    it("handles empty or whitespace strings", () => {
      expect(getCompanyInitials("")).toBe("CO");
      expect(getCompanyInitials("   ")).toBe("CO");
    });
  });

  describe("getNameInitials", () => {
    it("returns first and last word initials for full names", () => {
      expect(getNameInitials("Jesús Enmanuel Hernández González")).toBe("JG");
      expect(getNameInitials("Jane Doe")).toBe("JD");
    });

    it("returns first two letters for single word names", () => {
      expect(getNameInitials("Jesús")).toBe("JE");
    });

    it("handles empty names", () => {
      expect(getNameInitials("")).toBe("CV");
    });
  });
});

import {
  generateILovePdfToken,
  testILovePdfConnection,
  convertOfficeToPdf,
} from "./ilovepdf-service";

describe("iLovePDF Service", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("generateILovePdfToken", () => {
    it("generates a valid 3-part HS256 JWT containing public key as issuer", () => {
      const token = generateILovePdfToken("pub_12345", "sec_67890");
      const parts = token.split(".");
      expect(parts).toHaveLength(3);

      const header = JSON.parse(
        Buffer.from(parts[0]!, "base64url").toString("utf-8"),
      );
      expect(header.alg).toBe("HS256");
      expect(header.typ).toBe("JWT");

      const payload = JSON.parse(
        Buffer.from(parts[1]!, "base64url").toString("utf-8"),
      );
      expect(payload.iss).toBe("pub_12345");
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });
  });

  describe("testILovePdfConnection", () => {
    it("returns success: true when iLovePDF start task succeeds", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ server: "api25.ilovepdf.com", task: "task_abc123" }),
      } as unknown as Response);

      const result = await testILovePdfConnection("pub_12345", "sec_67890");
      expect(result.success).toBe(true);
    });

    it("returns success: false with error message when iLovePDF returns an error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          name: "Unauthorized",
          message: "Invalid public key or token signature",
        }),
      } as unknown as Response);

      const result = await testILovePdfConnection("pub_bad", "sec_bad");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid public key");
    });
  });

  describe("convertOfficeToPdf", () => {
    it("executes the start -> upload -> process -> download workflow", async () => {
      const mockPdfBytes = Buffer.from("%PDF-1.4 mock content");
      let step = 0;

      global.fetch = jest.fn().mockImplementation((url: string) => {
        step++;
        if (url.includes("/v1/start/officepdf")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ server: "api01.ilovepdf.com", task: "tsk_99" }),
          });
        }
        if (url.includes("/v1/upload")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ server_filename: "srv_file_01.docx" }),
          });
        }
        if (url.includes("/v1/process")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: "TaskSuccess" }),
          });
        }
        if (url.includes("/v1/download/tsk_99")) {
          const slice = mockPdfBytes.buffer.slice(
            mockPdfBytes.byteOffset,
            mockPdfBytes.byteOffset + mockPdfBytes.byteLength,
          );
          return Promise.resolve({
            ok: true,
            arrayBuffer: async () => slice,
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const docx = Buffer.from("mock docx binary");
      const pdf = await convertOfficeToPdf(docx, {
        publicKey: "pub_test",
        secretKey: "sec_test",
      });

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.toString()).toBe("%PDF-1.4 mock content");
      expect(step).toBe(4);
    });
  });
});

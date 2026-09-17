import { parseBambooHrDetail } from "./parse-bamboohr-page";

const SAMPLE_DETAIL_JSON = JSON.stringify({
  result: {
    jobOpening: {
      jobOpeningName: "Desarrollador FullStack",
      departmentLabel: "Proyectos",
      employmentStatusLabel: "Full-Time",
      atsLocation: {
        country: "Colombia",
        city: "Bogotá",
        state: "Cundinamarca",
      },
      description:
        "<p><strong>OBJETIVO:</strong> Diseñar y desarrollar soluciones web.</p><ul><li>Exp con React y Node.js</li><li>AWS y Azure</li></ul>",
      isRemote: true,
    },
  },
});

const SAMPLE_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:site_name" content="GSD PLUS"/>
  <meta property="og:title" content="Desarrollador FullStack"/>
  <meta property="og:description" content="OBJETIVO: Diseñar y desarrollar soluciones web."/>
  <script id="poData" type="application/json">{"site":{"logo":{"alt":"GSD PLUS"}}}</script>
</head>
<body></body>
</html>
`;

describe("parseBambooHrDetail", () => {
  it("extracts all fields from JSON detail and HTML page", () => {
    const listing = parseBambooHrDetail(
      SAMPLE_DETAIL_JSON,
      "gsdplus",
      SAMPLE_PAGE_HTML,
    );

    expect(listing.position).toBe("Desarrollador FullStack");
    expect(listing.companyName).toBe("GSD PLUS");
    expect(listing.location).toBe("Bogotá, Cundinamarca, Colombia (Remote)");
    expect(listing.description).toContain("OBJETIVO: Diseñar y desarrollar");
    expect(listing.description).toContain("- Exp con React y Node.js");
    expect(listing.sourceType).toBe("bamboohr");
  });

  it("extracts company name from poData if og:site_name is missing", () => {
    const htmlWithPoDataOnly = `
      <html>
        <script id="poData" type="application/json">{"site":{"logo":{"alt":"Acme Corp"}}}</script>
      </html>
    `;
    const listing = parseBambooHrDetail(
      SAMPLE_DETAIL_JSON,
      "acme",
      htmlWithPoDataOnly,
    );
    expect(listing.companyName).toBe("Acme Corp");
  });

  it("falls back to formatted subdomain if company name is not found in HTML", () => {
    const listing = parseBambooHrDetail(SAMPLE_DETAIL_JSON, "cool-startup", "");
    expect(listing.companyName).toBe("Cool Startup");
  });

  it("falls back to OpenGraph meta if JSON detail fails or is empty", () => {
    const listing = parseBambooHrDetail("{}", "gsdplus", SAMPLE_PAGE_HTML);
    expect(listing.position).toBe("Desarrollador FullStack");
    expect(listing.companyName).toBe("GSD PLUS");
    expect(listing.description).toBe(
      "OBJETIVO: Diseñar y desarrollar soluciones web.",
    );
  });
});

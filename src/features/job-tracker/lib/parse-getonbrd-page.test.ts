import { parseGetOnBrdPage } from "./parse-getonbrd-page";

const SAMPLE_GETONBRD_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Full-Stack Developer – Node.js / TypeScript / React / AWS at Cencosud (via BC Tecnología) - Remote"/>
  <meta property="og:description" content="Trabajo remoto Full time: Para este cargo buscamos experiencia sólida y autonomía"/>
</head>
<body class="perma jobs-show">
  <div itemprop="hiringOrganization" itemscope itemtype="http://schema.org/Organization">
    <div class="gb-company-logo">
      <a class="gb-company-logo__link" href="/companies/bctecnologia">
        <img alt="BC Tecnología" class="gb-company-logo__img" src="https://example.com/logo.png" />
      </a>
    </div>
    <h3>
      <strong itemprop="name">BC Tecnología</strong>
    </h3>
  </div>

  <h1 class="gb-landing-cover__title">
    <span itemprop="title">
      Full-Stack Developer – Node.js / TypeScript / React / AWS
    </span>
  </h1>

  <h2 class="size1 mb-3">
    <span itemprop="jobLocation" itemscope itemtype="http://schema.org/Place">
      <span class="location">
        <i class="icon icon-wifi"></i>
        Remote
      </span>
    </span>
  </h2>

  <div id="job-body" itemprop="description">
    <div class="gb-landing-section pb0">
      <div class="gb-container gb-container--medium">
        <div class="mb4">
          <div class="gb-rich-txt">
            <p>En BC Tecnología somos una consultora de TI.</p>
            <p class="r6f68259c">Apply to this job without intermediaries on Get on Board.</p>
          </div>
        </div>
        <div class="mb4">
          <h3 class="font-black mb2">Principales funciones</h3>
          <div class="gb-rich-txt">
            <p>Buscamos un/a Fullstack Developer.</p>
            <ul>
              <li>Desarrollar y mantener servicios con Node.js y TypeScript.</li>
              <li>Desarrollar interfaces web utilizando React.</li>
            </ul>
          </div>
        </div>
        <p class="u82f1d4ad">GETONBRD Job ID: 63563</p>
      </div>
    </div>
  </div>
  <div class="js-hide-fixed-actions"></div>
  <div id="js-apply-section"></div>
</body>
</html>
`;

describe("parseGetOnBrdPage", () => {
  it("extracts position, company, location, and cleaned description", () => {
    const listing = parseGetOnBrdPage(SAMPLE_GETONBRD_HTML);

    expect(listing.position).toBe(
      "Full-Stack Developer – Node.js / TypeScript / React / AWS",
    );
    expect(listing.companyName).toBe("BC Tecnología");
    expect(listing.location).toBe("Remote");
    expect(listing.description).toContain(
      "En BC Tecnología somos una consultora",
    );
    expect(listing.description).toContain("Principales funciones");
    expect(listing.description).toContain(
      "- Desarrollar y mantener servicios con Node.js y TypeScript.",
    );
    expect(listing.description).not.toContain(
      "Apply to this job without intermediaries",
    );
    expect(listing.description).not.toContain("GETONBRD Job ID");
    expect(listing.sourceType).toBe("getonbrd");
  });

  it("falls back to OpenGraph meta if markup is minimal", () => {
    const minimalHtml = `
      <html>
        <head>
          <meta property="og:title" content="Backend Go Developer at MercadoLibre" />
          <meta property="og:description" content="Looking for Senior Go Developer" />
        </head>
        <body>
          <div class="location">Santiago, Chile</div>
        </body>
      </html>
    `;
    const listing = parseGetOnBrdPage(minimalHtml);
    expect(listing.position).toBe("Backend Go Developer");
    expect(listing.companyName).toBe("MercadoLibre");
    expect(listing.location).toBe("Santiago, Chile");
    expect(listing.description).toBe("Looking for Senior Go Developer");
  });
});

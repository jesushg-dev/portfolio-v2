import type {
  DevicePalette,
  DrawDeviceScreen,
  DrawDeviceLayers,
} from "./ios-device-renderer";
const formatTimezoneClock = (timeZone?: string) => {
  try {
    return new Date().toLocaleTimeString("en-GB", {
      timeZone: timeZone || "America/Managua",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }
};
export const drawHeroScreen: DrawDeviceScreen = (
  ctx,
  _width,
  _height,
  tools,
  mode,
  profile,
) => {
  const { fillRound, text, portrait, gradient, roundRect: rr, palette } = tools;
  ctx.clearRect(0, 0, 900, 1912);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, 900, 1912);
  const g = ctx.createRadialGradient(520, 1730, 80, 510, 1590, 1300);
  g.addColorStop(0, palette.muted);
  g.addColorStop(0.5, palette.background);
  g.addColorStop(1, palette.background);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 900, 1912);
  text(84, 89, "9:41", "bold 34px system-ui");
  text(685, 86, "▂▄▆  ▰", "bold 32px system-ui");
  fillRound(340, 43, 220, 69, 34, "#030506");
  if (mode === 1) {
    text(
      450,
      400,
      new Date().toLocaleDateString(profile.locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      "31px system-ui",
      palette.secondaryText,
      "center",
    );
    text(
      450,
      583,
      "09:41",
      "bold 170px system-ui",
      palette.foreground,
      "center",
    );
    fillRound(56, 1270, 788, 245, 42, palette.card);
    portrait(92, 1313, 110, 110, 55);
    text(236, 1368, profile.name, "bold 46px system-ui");
    text(236, 1425, profile.subtitle, "32px system-ui", palette.secondaryText);
    text(
      236,
      1476,
      "Fullstack · Remote",
      "29px system-ui",
      palette.secondaryText,
    );
  } else if (mode === 2) {
    portrait(56, 190, 392, 392, 64);
    const lg = gradient(190, 582, palette.primary, palette.accent);
    rr(472, 190, 372, 392, 64);
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 4;
    for (const r of [50, 95, 140]) {
      ctx.beginPath();
      ctx.arc(700, 400, r, 0, 7);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(700, 400, 17, 0, 7);
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(700, 400, 6, 0, 7);
    ctx.fillStyle = palette.foreground;
    ctx.fill();
    const cityName = profile.location?.split(",")[0]?.trim() || "Managua";
    const regionName =
      profile.locationSubtitle ??
      (profile.location?.includes(",")
        ? profile.location.split(",").slice(1).join(",").trim()
        : "Nicaragua · UTC−6");
    text(
      502,
      272,
      formatTimezoneClock(profile.timezone),
      "bold 58px system-ui",
      palette.onPrimary,
    );
    text(502, 492, cityName, "bold 48px system-ui", palette.onPrimary);
    text(502, 536, regionName, "27px system-ui", palette.onPrimary);
    [
      ["♫", "Spotify"],
      [">_", "Terminal"],
      ["▦", "Projects"],
      ["CV", "CV"],
      ["API", "API"],
      ["✎", "Blog"],
      ["AI", "AI"],
      ["{ }", "Code"],
    ].forEach(([glyph, label], i) => {
      const x = 72 + (i % 4) * 198,
        y = 622 + Math.floor(i / 4) * 223;
      fillRound(x, y, 155, 155, 37, i % 2 ? palette.primary : palette.accent);
      text(
        x + 78,
        y + 95,
        glyph,
        glyph === "♫" ? "bold 91px system-ui" : "bold 62px system-ui",
        palette.onPrimary,
        "center",
      );
      text(
        x + 78,
        y + 188,
        label,
        "bold 26px system-ui",
        palette.foreground,
        "center",
      );
    });
    fillRound(56, 1085, 788, 236, 45, palette.card);
    text(90, 1150, "I build scalable", "bold 52px system-ui");
    text(90, 1213, "full-stack products.", "bold 52px system-ui");
    text(
      90,
      1270,
      "From interface to cloud.",
      "35px system-ui",
      palette.secondaryText,
    );
    fillRound(56, 1340, 372, 270, 44, palette.card);
    fillRound(462, 1340, 382, 270, 44, palette.card);
    text(93, 1400, "EXPERIENCE", "bold 29px system-ui", palette.secondaryText);
    text(93, 1522, String(profile.years ?? ""), "bold 122px system-ui");
    text(480, 1400, "FOCUS", "bold 29px system-ui", palette.secondaryText);
    text(480, 1512, profile.focusTitle ?? "Fullstack", "bold 56px system-ui");
    text(
      480,
      1570,
      profile.focusSubtitle ?? "React · NestJS",
      "26px system-ui",
      palette.secondaryText,
    );
    fillRound(60, 1660, 780, 136, 45, palette.card);
    for (let i = 0; i < 4; i++) {
      fillRound(
        93 + i * 184,
        1687,
        117,
        86,
        24,
        i === 0 ? palette.primary : palette.muted,
      );
      text(
        152 + i * 184,
        1745,
        ["✉", "in", "▤", "◉"][i],
        "bold 52px system-ui",
        palette.foreground,
        "center",
      );
    }
  }

  fillRound(325, 1855, 250, 11, 9, palette.foreground);
};

export const DEFAULT_HERO_SERVICES: [string, string][] = [
  ["Auth", "NestJS"],
  ["Orders", "NestJS"],
  ["Payments", ".NET"],
  ["Notify", "Node.js"],
];

function plate(
  kind: "api" | "infra",
  palette: DevicePalette,
  services: readonly [string, string][] = DEFAULT_HERO_SERVICES,
) {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1912;
  const g = c.getContext("2d");
  if (!g) return c;
  g.fillStyle = palette.background;
  g.fillRect(0, 0, 900, 1912);
  g.fillStyle = palette.border;
  for (let x = 40; x < 900; x += 40)
    for (let y = 40; y < 1912; y += 40) g.fillRect(x, y, 3, 3);
  g.textAlign = "center";
  const bx = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string | null,
    stroke: string,
    lw: number,
    dash?: number[],
  ) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    g.setLineDash(dash ?? []);
    g.lineWidth = lw || 3;
    g.strokeStyle = stroke;
    g.stroke();
    g.setLineDash([]);
  };
  const tx = (t: string, x: number, y: number, f: string, col?: string) => {
    g.font = f;
    g.fillStyle = col ?? palette.foreground;
    g.fillText(t, x, y);
  };
  const ln = (...p: [number, number][]) => {
    g.beginPath();
    p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineWidth = 5;
    g.strokeStyle = palette.primary;
    g.stroke();
  };
  const activeServices =
    services.length > 0 ? services.slice(0, 4) : DEFAULT_HERO_SERVICES;
  if (kind === "api") {
    bx(130, 1060, 640, 110, 28, palette.muted, palette.primary, 6);
    tx("API Gateway", 450, 1128, "bold 54px system-ui");
    ln([450, 1170], [450, 1210]);
    ln([136, 1210], [764, 1210]);
    activeServices.forEach(([n, t], i) => {
      const x = 36 + i * 214;
      ln([x + 100, 1210], [x + 100, 1250]);
      bx(x, 1250, 200, 220, 28, palette.card, palette.primary, 3);
      tx(n, x + 100, 1310, "bold 38px system-ui");
      tx(t, x + 100, 1354, "28px system-ui", palette.secondaryText);
      bx(x + 18, 1384, 164, 56, 28, null, palette.primary, 3);
      tx("MongoDB", x + 100, 1421, "26px system-ui", palette.secondaryText);
      ln([x + 100, 1470], [x + 100, 1560]);
    });
    bx(36, 1560, 828, 110, 28, palette.muted, palette.primary, 6);
    tx("Event bus", 450, 1630, "bold 50px system-ui");
  } else {
    bx(40, 1430, 820, 450, 36, null, palette.primary, 4, [18, 14]);
    tx("Azure", 450, 1510, "bold 58px system-ui");
    activeServices.forEach(([n], i) => {
      const x = 60 + i * 200;
      bx(x, 1560, 180, 140, 24, palette.card, palette.primary, 3);
      tx(n.toLowerCase(), x + 90, 1620, "bold 32px system-ui");
      tx("Docker", x + 90, 1664, "26px system-ui", palette.secondaryText);
    });
    bx(60, 1740, 780, 110, 28, palette.muted, palette.primary, 5);
    tx("MongoDB · one DB per service", 450, 1808, "bold 40px system-ui");
  }
  return c;
}

export const drawHeroLayers: DrawDeviceLayers = (palette, profile) => {
  const services =
    profile?.services && profile.services.length > 0
      ? profile.services
      : DEFAULT_HERO_SERVICES;
  return [plate("api", palette, services), plate("infra", palette, services)];
};

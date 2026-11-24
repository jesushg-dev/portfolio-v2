import type {
  DevicePalette,
  DrawDeviceScreen,
  DrawDeviceLayers,
  PhoneProfile,
} from "./ios-device-renderer";

const formatTimezoneClock = (timeZone?: string) => {
  try {
    return new Date().toLocaleTimeString("en-GB", {
      timeZone: timeZone ?? "America/Managua",
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

/**
 * Checks if the current palette is a dark theme.
 */
function isDarkPalette(palette: DevicePalette): boolean {
  // Check if background starts with dark value (e.g. #0 or rgb with low numbers)
  const bg = palette.background.trim().toLowerCase();
  if (bg.startsWith("#")) {
    const hex = bg.slice(1);
    if (hex.length >= 3) {
      const r = parseInt(
        hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2),
        16,
      );
      return r < 128;
    }
  }
  return true;
}

/**
 * Dynamic Island capsule at the top center with front camera lens and FaceID sensors.
 */
function drawDynamicIsland(ctx: CanvasRenderingContext2D) {
  // Capsule container: 250px wide, 70px tall, 35px border radius
  ctx.beginPath();
  ctx.roundRect(325, 42, 250, 70, 35);
  ctx.fillStyle = "#000000";
  ctx.fill();

  // FaceID / sensor dot (left side)
  ctx.beginPath();
  ctx.arc(395, 77, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();

  // Front camera lens assembly (right side)
  ctx.beginPath();
  ctx.arc(522, 77, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#070e17";
  ctx.fill();

  // Subtle dark blue / teal anti-reflective lens coating ring
  ctx.beginPath();
  ctx.arc(522, 77, 11, 0, Math.PI * 2);
  ctx.fillStyle = "#0d1b2a";
  ctx.fill();

  // Mini specular reflection highlight
  ctx.beginPath();
  ctx.arc(525, 74, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(125, 211, 252, 0.45)";
  ctx.fill();
}

/**
 * Real iOS 18 Status Bar: time on left, cellular signal + Wi-Fi + battery on right.
 */
function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  palette: DevicePalette,
  timeStr: string,
) {
  ctx.fillStyle = palette.foreground;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Left: Time (e.g. 9:41)
  ctx.font =
    "bold 34px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui";
  ctx.fillText(timeStr, 86, 78);

  // Small location arrow next to time
  ctx.save();
  ctx.translate(178, 77);
  ctx.rotate(-Math.PI / 4);
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(8, 9);
  ctx.lineTo(0, 6);
  ctx.lineTo(-8, 9);
  ctx.closePath();
  ctx.fillStyle = palette.foreground;
  ctx.fill();
  ctx.restore();

  // Right: 4 Cellular signal bars
  const barX = 696;
  const barBaseY = 92;
  const barHeights = [9, 15, 21, 27];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(barX + i * 10, barBaseY - barHeights[i], 6, barHeights[i], 2);
    ctx.fillStyle = palette.foreground;
    ctx.fill();
  }

  // Right: Wi-Fi symbol (3 curved arcs)
  const wifiCenterX = 758;
  const wifiCenterY = 88;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = palette.foreground;
  ctx.lineCap = "round";

  // Dot
  ctx.beginPath();
  ctx.arc(wifiCenterX, wifiCenterY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = palette.foreground;
  ctx.fill();

  // Middle arc
  ctx.beginPath();
  ctx.arc(wifiCenterX, wifiCenterY + 2, 11, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  // Outer arc
  ctx.beginPath();
  ctx.arc(wifiCenterX, wifiCenterY + 2, 19, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  // Right: Battery capsule with terminal nub and level
  const bx = 800;
  const by = 65;
  const bw = 54;
  const bh = 27;
  const br = 7;

  // Outer border
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = palette.foreground;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, br);
  ctx.stroke();

  // Terminal nub
  ctx.beginPath();
  ctx.roundRect(bx + bw + 2, by + 8, 4, 11, 2);
  ctx.fillStyle = palette.foreground;
  ctx.fill();

  // Battery charge level (~85% full)
  ctx.beginPath();
  ctx.roundRect(bx + 3.5, by + 3.5, 38, bh - 7, 4.5);
  ctx.fillStyle = palette.foreground;
  ctx.fill();
}

/**
 * Authentic iOS 18 wallpaper with deep organic glass curves and ambient glow.
 */
function drawWallpaper(
  ctx: CanvasRenderingContext2D,
  palette: DevicePalette,
  isDark: boolean,
) {
  // Base background
  ctx.fillStyle = isDark ? "#080c14" : "#f1f5f9";
  ctx.fillRect(0, 0, 900, 1912);

  if (isDark) {
    // Ambient radial glow top-center
    const topGlow = ctx.createRadialGradient(450, 200, 50, 450, 300, 700);
    topGlow.addColorStop(0, "rgba(59, 130, 246, 0.22)");
    topGlow.addColorStop(0.5, "rgba(30, 58, 138, 0.12)");
    topGlow.addColorStop(1, "transparent");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, 900, 1912);

    // Glowing organic ribbon 1 (indigo / blue)
    const ribbon1 = ctx.createRadialGradient(250, 800, 100, 300, 850, 600);
    ribbon1.addColorStop(0, "rgba(99, 102, 241, 0.28)");
    ribbon1.addColorStop(0.5, "rgba(79, 70, 229, 0.1)");
    ribbon1.addColorStop(1, "transparent");
    ctx.fillStyle = ribbon1;
    ctx.fillRect(0, 0, 900, 1912);

    // Glowing organic ribbon 2 (purple / violet bottom right)
    const ribbon2 = ctx.createRadialGradient(650, 1400, 120, 600, 1350, 700);
    ribbon2.addColorStop(0, "rgba(168, 85, 247, 0.24)");
    ribbon2.addColorStop(0.6, "rgba(126, 34, 206, 0.08)");
    ribbon2.addColorStop(1, "transparent");
    ctx.fillStyle = ribbon2;
    ctx.fillRect(0, 0, 900, 1912);

    // Subtle curved contour ribbons (as seen in iOS 18 wallpaper)
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.ellipse(450, 956, 380, 700, Math.PI / 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.ellipse(450, 956, 420, 750, Math.PI / 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else {
    // Light mode organic ambient glow
    const lightGlow = ctx.createRadialGradient(450, 600, 100, 450, 700, 800);
    lightGlow.addColorStop(0, "rgba(224, 231, 255, 0.65)");
    lightGlow.addColorStop(0.5, "rgba(241, 245, 249, 0.4)");
    lightGlow.addColorStop(1, "transparent");
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, 900, 1912);

    // Light subtle curved contour ribbons
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
    ctx.beginPath();
    ctx.ellipse(450, 956, 380, 700, Math.PI / 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Weather icon graphic for Apple Weather widget (Sun, Sun+Cloud, Moon, Rain, etc.).
 */
function drawWeatherGraphic(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  code = 1,
  isDay = true,
) {
  ctx.save();
  const r = size / 2;

  // Day: Clear / Mostly Sunny
  if (isDay && (code === 0 || code === 1)) {
    // Sun outer atmospheric glow
    const sunGlow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.15);
    sunGlow.addColorStop(0, "rgba(251, 191, 36, 0.95)");
    sunGlow.addColorStop(0.6, "rgba(245, 158, 11, 0.45)");
    sunGlow.addColorStop(1, "transparent");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Solid golden sun disc
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    if (code === 1) {
      // Mostly Sunny: Small soft white cloud in bottom-left
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy + r * 0.35, r * 0.32, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.05, cy + r * 0.22, r * 0.38, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.42, cy + r * 0.38, r * 0.26, 0, Math.PI * 2);
      ctx.roundRect(cx - r * 0.35, cy + r * 0.38, r * 0.8, r * 0.28, r * 0.14);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Night: Clear / Mostly Clear
  if (!isDay && (code === 0 || code === 1)) {
    // Crescent Moon (Apple SF Symbol moon.stars.fill style)
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Dark cutout for authentic crescent curve
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx + r * 0.12, cy - r * 0.18, r * 0.54, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // 4-point twinkling diamond stars (exact iOS Weather symbol signature)
    const drawDiamondStar = (sx: number, sy: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy - size);
      ctx.quadraticCurveTo(sx, sy, sx + size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + size);
      ctx.quadraticCurveTo(sx, sy, sx - size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - size);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fill();
    };

    drawDiamondStar(cx + r * 0.42, cy - r * 0.35, r * 0.22);
    drawDiamondStar(cx + r * 0.62, cy + r * 0.15, r * 0.16);

    if (code === 1) {
      // Mostly clear night: soft little cloud
      ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
      ctx.beginPath();
      ctx.arc(cx - r * 0.2, cy + r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.15, cy + r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return;
  }

  // Partly Cloudy / Overcast (code 2 or 3)
  if (code === 2 || code === 3) {
    if (code === 2 && isDay) {
      // Sun peek behind cloud
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(cx + r * 0.25, cy - r * 0.2, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Main White Cloud
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy + r * 0.1, r * 0.35, 0, Math.PI * 2);
    ctx.arc(cx, cy - r * 0.1, r * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy + r * 0.12, r * 0.3, 0, Math.PI * 2);
    ctx.roundRect(cx - r * 0.4, cy + r * 0.12, r * 0.85, r * 0.35, r * 0.16);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Rain / Showers / Storm
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy, r * 0.35, 0, Math.PI * 2);
  ctx.arc(cx, cy - r * 0.18, r * 0.45, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.4, cy + r * 0.02, r * 0.3, 0, Math.PI * 2);
  ctx.roundRect(cx - r * 0.4, cy + r * 0.02, r * 0.85, r * 0.32, r * 0.16);
  ctx.fill();

  // Raindrops
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.25, cy + r * 0.45);
  ctx.lineTo(cx - r * 0.32, cy + r * 0.72);
  ctx.moveTo(cx, cy + r * 0.48);
  ctx.lineTo(cx - r * 0.07, cy + r * 0.75);
  ctx.moveTo(cx + r * 0.25, cy + r * 0.45);
  ctx.lineTo(cx + r * 0.18, cy + r * 0.72);
  ctx.stroke();
  ctx.restore();
}

/**
 * Authentic Apple iOS Weather Widget (2x2 square widget matching official Apple design).
 * Displays live city + navigation location arrow, large temperature, weather condition icon,
 * condition text, and High/Low.
 */
function drawWeatherWidget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  profile: PhoneProfile,
) {
  const weather = profile.weather ?? {
    city: profile.location?.split(",")[0]?.trim() ?? "Managua",
    temperature: 77,
    unit: "F",
    condition: "Mostly Sunny",
    high: 88,
    low: 72,
    isDay: true,
    weatherCode: 1,
  };

  const isDay = weather.isDay ?? true;
  const code = weather.weatherCode ?? 1;

  // Background: Apple Weather Atmospheric Gradient (borderless squircle)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (!isDay) {
    // Night: Deep twilight navy gradient matching iOS Weather
    bgGrad.addColorStop(0, "#1c2236");
    bgGrad.addColorStop(0.55, "#151a2b");
    bgGrad.addColorStop(1, "#101422");
  } else if (code >= 51) {
    // Rain/Storm: Moody atmospheric slate
    bgGrad.addColorStop(0, "#334155");
    bgGrad.addColorStop(0.55, "#1e293b");
    bgGrad.addColorStop(1, "#0f172a");
  } else if (code === 2 || code === 3) {
    // Partly Cloudy / Overcast: Daylight soft blue
    bgGrad.addColorStop(0, "#60a5fa");
    bgGrad.addColorStop(0.55, "#3b82f6");
    bgGrad.addColorStop(1, "#2563eb");
  } else {
    // Clear / Sunny: Vibrant iOS sky blue gradient
    bgGrad.addColorStop(0, "#38bdf8");
    bgGrad.addColorStop(0.5, "#0ea5e9");
    bgGrad.addColorStop(1, "#0284c7");
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.restore();

  const cityName =
    weather.city ?? profile.location?.split(",")[0]?.trim() ?? "Managua";

  const padX = 32;

  // 1. City Name (Top-Left) with Apple Navigation Location Pointer Arrow
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font =
    "bold 32px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui";
  ctx.fillText(cityName, x + padX, y + 30);

  // Draw location navigation arrow right after city name (SF Symbol location.fill)
  const cityWidth = ctx.measureText(cityName).width;
  const arrowX = x + padX + cityWidth + 9;
  const arrowY = y + 36;
  ctx.translate(arrowX, arrowY);
  ctx.beginPath();
  ctx.moveTo(12, 0); // top-right tip
  ctx.lineTo(1, 5); // left wing
  ctx.lineTo(6, 6.5); // inner notch
  ctx.lineTo(7.5, 12); // bottom wing
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fill();
  ctx.restore();

  // 2. Large Temperature (Thin SF Pro Display 300)
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font =
    "300 98px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui";
  ctx.fillText(`${weather.temperature}°`, x + padX, y + 68);
  ctx.restore();

  // 3. Weather Condition Graphic (Left-aligned bottom section)
  const iconCX = x + padX + 22;
  const iconCY = y + 214;
  drawWeatherGraphic(ctx, iconCX, iconCY, 26, code, isDay);

  // 4. Condition Name (e.g. Clear, Helder, Mostly Sunny)
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font =
    "600 25px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(weather.condition, x + padX, y + 252);

  // 5. High / Low
  const isMetricOrLatin =
    profile.locale?.startsWith("es") || profile.locale?.startsWith("nl");
  const hlText = isMetricOrLatin
    ? `Max:${weather.high}°  Min:${weather.low}°`
    : `H:${weather.high}°  L:${weather.low}°`;

  ctx.font =
    "500 22px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fillText(hlText, x + padX, y + 288);
  ctx.restore();
}

/**
 * Authentic iOS Photo Widget showcasing the user's portrait picture (unobstructed, borderless).
 */
function drawPhotoWidget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  portrait: (x: number, y: number, w: number, h: number, r: number) => void,
  isDark: boolean,
) {
  // Base background: seamless dark wallpaper squircle gradient (no hard borders)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (isDark) {
    bgGrad.addColorStop(0, "#1e293b");
    bgGrad.addColorStop(1, "#0a0f1d");
  } else {
    bgGrad.addColorStop(0, "#f1f5f9");
    bgGrad.addColorStop(1, "#cbd5e1");
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.restore();

  // Render the user's portrait - completely unobstructed
  ctx.save();
  portrait(x, y, w, h, r);
  ctx.restore();

  // Subtle bottom caption overlay: "Featured Photo" (Apple Photos widget signature)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  const overlayGrad = ctx.createLinearGradient(x, y + h - 50, x, y + h);
  overlayGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  overlayGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(x, y + h - 50, w, 50);

  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font =
    "500 20px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillText("Featured Photo", x + 24, y + h - 18);
  ctx.restore();
}

/**
 * Draws an authentic iOS squircle app icon container with smooth rounded corners.
 */
function drawAppTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Draws the small label underneath each app icon.
 */
function drawAppLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  bottomY: number,
  color: string,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font =
    "600 26px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = color;
  ctx.fillText(label, centerX, bottomY);
}

// ---------------------------------------------------------------------------
// Precision Vector Glyphs for Authentic iOS Apps
// ---------------------------------------------------------------------------

function drawSpotifyIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  drawAppTile(ctx, x, y, size, 36, "#121212");
  const cx = x + size / 2;
  const cy = y + size / 2;

  // Vibrant green Spotify disc
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.fillStyle = "#1ed760";
  ctx.fill();

  // 3 Black curved sound arcs
  ctx.strokeStyle = "#121212";
  ctx.lineCap = "round";

  // Arc 1 (top large)
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy + 34, 46, -Math.PI * 0.72, -Math.PI * 0.28);
  ctx.stroke();

  // Arc 2 (middle)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy + 24, 34, -Math.PI * 0.73, -Math.PI * 0.27);
  ctx.stroke();

  // Arc 3 (bottom small)
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 23, -Math.PI * 0.74, -Math.PI * 0.26);
  ctx.stroke();
}

function drawCVIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#2563eb");
  g.addColorStop(1, "#1d4ed8");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  const pw = 68;
  const ph = 86;
  const fold = 20;

  // White paper sheet with folded upper right corner
  ctx.beginPath();
  ctx.moveTo(-pw / 2, -ph / 2);
  ctx.lineTo(pw / 2 - fold, -ph / 2);
  ctx.lineTo(pw / 2, -ph / 2 + fold);
  ctx.lineTo(pw / 2, ph / 2);
  ctx.lineTo(-pw / 2, ph / 2);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Fold flap
  ctx.beginPath();
  ctx.moveTo(pw / 2 - fold, -ph / 2);
  ctx.lineTo(pw / 2 - fold, -ph / 2 + fold);
  ctx.lineTo(pw / 2, -ph / 2 + fold);
  ctx.closePath();
  ctx.fillStyle = "#bfdbfe";
  ctx.fill();

  // "CV" text inside paper
  ctx.fillStyle = "#1d4ed8";
  ctx.font =
    "bold 28px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CV", 0, 8);
  ctx.restore();
}

function drawBlogIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#8b5cf6");
  g.addColorStop(1, "#ec4899");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  // Fountain pen body & nib
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(16, -10);
  ctx.lineTo(16, 26);
  ctx.lineTo(-16, 26);
  ctx.lineTo(-16, -10);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Nib slit
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(0, -14);
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Nib breather hole
  ctx.beginPath();
  ctx.arc(0, -12, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#8b5cf6";
  ctx.fill();
  ctx.restore();
}

function drawLinkedInIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  drawAppTile(ctx, x, y, size, 36, "#0a66c2");
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = "#ffffff";
  ctx.font =
    "bold 88px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("in", cx, cy + 4);
}

function drawMailIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#38bdf8");
  g.addColorStop(1, "#0284c7");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // White folded envelope
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx - 42, cy - 28, 84, 56, 12);
  ctx.fill();

  // Flap folds
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 24);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx + 38, cy - 24);
  ctx.stroke();
}

function drawTerminalIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  drawAppTile(ctx, x, y, size, 36, "#18181b");
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = "#22c55e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 56px monospace, 'SF Pro Text', system-ui";
  ctx.fillText(">_", cx, cy);
}

function drawProjectsIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#38bdf8");
  g.addColorStop(1, "#0284c7");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Folder tab & body
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx - 38, cy - 24, 34, 16, 6);
  ctx.roundRect(cx - 38, cy - 14, 76, 48, 10);
  ctx.fill();
}

function drawCodeIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, "#6366f1");
  g.addColorStop(1, "#4338ca");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 60px monospace, 'SF Pro Display', system-ui";
  ctx.fillText("{ }", cx, cy);
}

/**
 * iOS Medium 2×4 Widget: Profile Highlights & Professional Engineering Summary
 * Borderless, frosted glass, authentic typography & badge pills.
 */
function drawProfessionalWidget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  profile: PhoneProfile | undefined,
  palette: DevicePalette,
  isDark: boolean,
) {
  // 1. Frosted widget background - BORDERLESS (no stroke per user requirement)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (isDark) {
    bgGrad.addColorStop(0, "rgba(22, 28, 42, 0.94)");
    bgGrad.addColorStop(1, "rgba(13, 17, 28, 0.97)");
  } else {
    bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    bgGrad.addColorStop(1, "rgba(244, 246, 250, 0.92)");
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle interior glass highlight (top sheen)
  const sheenGrad = ctx.createLinearGradient(x, y, x, y + 100);
  sheenGrad.addColorStop(
    0,
    isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.8)",
  );
  sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 100, [r, r, 0, 0]);
  ctx.fill();

  const padX = 42;

  // 2. Top Header Row: Section tag + Experience counter
  const headerY = y + 54;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font =
    "bold 22px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
  ctx.fillText("PROFILE HIGHLIGHTS", x + padX, headerY);

  ctx.textAlign = "right";
  ctx.font =
    "600 24px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = palette.secondaryText;
  const expText = profile?.years
    ? `${profile.years}+ Years Experience`
    : "6+ Years Experience";
  ctx.fillText(expText, x + w - padX, headerY);

  // 3. Hero Statement
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const subtitleTrimmed = profile?.subtitle?.trim();
  const titleText =
    (subtitleTrimmed !== "" ? subtitleTrimmed : undefined) ??
    profile?.focusTitle ??
    "Senior Software Engineer";
  const titleFontSize = titleText.length > 22 ? 34 : 38;
  ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui`;
  ctx.fillStyle = palette.foreground;
  ctx.fillText(titleText, x + padX, y + 130);

  // 4. Subtitle
  ctx.font =
    "400 24px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillStyle = palette.secondaryText;
  const subtitleText =
    profile?.focusSubtitle ??
    "From interface architecture to cloud microservices.";
  ctx.fillText(subtitleText, x + padX, y + 178);

  // 5. Tech Stack Capsules / Pills (Row of 3 rounded capsules with auto-fitting)
  let pills = ["Full-Stack", "React / Next.js", "Cloud Architecture"];
  const roleText = (
    profile?.subtitle ??
    profile?.focusTitle ??
    ""
  ).toLowerCase();
  if (roleText.includes("backend")) {
    pills = ["Backend Core", "Node.js / .NET", "Distributed Systems"];
  } else if (roleText.includes("frontend")) {
    pills = ["Frontend Core", "React / Next.js", "Design Systems"];
  }

  const pillY = y + 242;
  const pillH = 54;
  const pillR = 16;
  const pillGap = 16;
  const totalAvailW = w - padX * 2;
  const pillW = Math.floor(
    (totalAvailW - pillGap * (pills.length - 1)) / pills.length,
  );

  pills.forEach((label, idx) => {
    const px = x + padX + idx * (pillW + pillGap);
    ctx.beginPath();
    ctx.roundRect(px, pillY, pillW, pillH, pillR);
    ctx.fillStyle = isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.06)";
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dynamic font scaling ensuring generous margins inside each capsule
    let fontSize = 20;
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui`;
    let textW = ctx.measureText(label).width;
    while (textW > pillW - 28 && fontSize > 14) {
      fontSize -= 1;
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui`;
      textW = ctx.measureText(label).width;
    }

    ctx.fillStyle = palette.foreground;
    ctx.fillText(label, px + pillW / 2, pillY + pillH / 2);
  });

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Frosted Dock & Dock Apps (Phone, Safari, Messages, Music)
// ---------------------------------------------------------------------------

function drawPhoneDockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#4ade80");
  g.addColorStop(1, "#16a34a");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Phone receiver angled at 45°
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-12, -34, 24, 68, 12);
  ctx.fill();

  // Ear and mic bulbs
  ctx.beginPath();
  ctx.arc(-14, -22, 12, 0, Math.PI * 2);
  ctx.arc(-14, 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSafariDockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  drawAppTile(ctx, x, y, size, 36, "#ffffff");
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = 50;

  // Blue compass dial
  const cg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  cg.addColorStop(0, "#38bdf8");
  cg.addColorStop(1, "#0284c7");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();

  // Dial ticks
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(angle) * (r - 10),
      cy + Math.sin(angle) * (r - 10),
    );
    ctx.lineTo(cx + Math.cos(angle) * (r - 3), cy + Math.sin(angle) * (r - 3));
    ctx.stroke();
  }

  // Compass needle (angled at 45°)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);

  // Red north needle
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(0, -r + 14);
  ctx.lineTo(10, 0);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();

  // White south needle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, r - 14);
  ctx.lineTo(10, 0);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();

  // Center pivot pin
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

function drawMessagesDockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#4ade80");
  g.addColorStop(1, "#16a34a");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // White speech bubble
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(cx - 40, cy - 30, 80, 56, 26);
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 18);
  ctx.lineTo(cx - 36, cy + 34);
  ctx.lineTo(cx - 14, cy + 24);
  ctx.closePath();
  ctx.fill();
}

function drawMusicDockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + size);
  g.addColorStop(0, "#fb7185");
  g.addColorStop(1, "#e11d48");
  drawAppTile(ctx, x, y, size, 36, g);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // White double eighth musical notes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  // Left note head
  ctx.ellipse(cx - 20, cy + 22, 12, 9, -Math.PI / 6, 0, Math.PI * 2);
  // Right note head
  ctx.ellipse(cx + 18, cy + 14, 12, 9, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Vertical note stems
  ctx.fillRect(cx - 12, cy - 24, 5, 44);
  ctx.fillRect(cx + 26, cy - 32, 5, 44);

  // Connecting top beam
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 14);
  ctx.lineTo(cx + 31, cy - 22);
  ctx.lineTo(cx + 31, cy - 32);
  ctx.lineTo(cx - 12, cy - 24);
  ctx.closePath();
  ctx.fill();
}

/**
 * Frosted Search capsule pill and pagination dots.
 */
function drawSearchPill(
  ctx: CanvasRenderingContext2D,
  palette: DevicePalette,
  isDark: boolean,
) {
  // Pagination dots: ● ○
  const dotY = 1465;
  ctx.beginPath();
  ctx.arc(438, dotY, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = palette.foreground;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(462, dotY, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.25)";
  ctx.fill();

  // Frosted Search Capsule Pill
  const px = 360;
  const py = 1505;
  const pw = 180;
  const ph = 54;
  const pr = 27;

  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, pr);
  ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)";
  ctx.fill();

  // Magnifying glass icon inside Search pill
  const mx = px + 44;
  const my = py + 27;
  ctx.strokeStyle = palette.foreground;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(mx, my - 2, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(mx + 6, my + 4);
  ctx.lineTo(mx + 13, my + 11);
  ctx.stroke();

  // Search text
  ctx.fillStyle = palette.foreground;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font =
    "500 26px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui";
  ctx.fillText("Search", mx + 24, my);
}

/**
 * Frosted Glass Dock with the 4 canonical bottom iOS apps: Phone, Safari, Messages, Music.
 */
function drawDock(ctx: CanvasRenderingContext2D, isDark: boolean) {
  const dockX = 44;
  const dockY = 1630;
  const dockW = 812;
  const dockH = 194;
  const dockR = 56;

  // Frosted glass capsule background
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, dockR);
  ctx.fillStyle = isDark
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(255, 255, 255, 0.7)";
  ctx.fill();

  // 4 Dock apps (Phone, Safari, Messages, Music)
  const iconSize = 144;
  const iconY = dockY + 25;
  const colX = [74, 273, 472, 671];

  drawPhoneDockIcon(ctx, colX[0], iconY, iconSize);
  drawSafariDockIcon(ctx, colX[1], iconY, iconSize);
  drawMessagesDockIcon(ctx, colX[2], iconY, iconSize);
  drawMusicDockIcon(ctx, colX[3], iconY, iconSize);
}

/**
 * Standard iOS Home Indicator bar at the very bottom center.
 */
function drawHomeIndicator(
  ctx: CanvasRenderingContext2D,
  palette: DevicePalette,
) {
  ctx.beginPath();
  ctx.roundRect(290, 1878, 320, 10, 5);
  ctx.fillStyle = palette.foreground;
  ctx.globalAlpha = 0.75;
  ctx.fill();
  ctx.globalAlpha = 1.0;
}

// ---------------------------------------------------------------------------
// Main Screen Texture Renderer
// ---------------------------------------------------------------------------

export const drawHeroScreen: DrawDeviceScreen = (
  ctx,
  _width,
  _height,
  tools,
  mode,
  profile,
) => {
  const { text, portrait, palette } = tools;
  const isDark = isDarkPalette(palette);

  ctx.clearRect(0, 0, 900, 1912);

  // 1. Wallpaper background
  drawWallpaper(ctx, palette, isDark);

  // 2. Status Bar and Dynamic Island
  const clockTime = formatTimezoneClock(profile.timezone);
  drawStatusBar(ctx, palette, clockTime);
  drawDynamicIsland(ctx);

  if (mode === 1) {
    // -----------------------------------------------------------------------
    // Mode 1: iOS Lock Screen
    // -----------------------------------------------------------------------

    // Padlock icon
    ctx.save();
    ctx.translate(450, 240);
    ctx.strokeStyle = palette.foreground;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    // Shackle
    ctx.beginPath();
    ctx.arc(0, -10, 12, Math.PI, 0);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 24, 6);
    ctx.fillStyle = palette.foreground;
    ctx.fill();
    ctx.restore();

    // Date
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(profile.locale ?? "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    text(
      450,
      370,
      dateFormatted,
      "500 32px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
      palette.secondaryText,
      "center",
    );

    // Clock (Huge bold iOS font)
    text(
      450,
      560,
      clockTime,
      "bold 164px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui",
      palette.foreground,
      "center",
    );

    // Profile / Notification Card (Frosted iOS notification banner)
    const cardY = 1260;
    const cardH = 250;
    ctx.beginPath();
    ctx.roundRect(56, cardY, 788, cardH, 44);
    ctx.fillStyle = isDark
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(255, 255, 255, 0.85)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.08)";
    ctx.stroke();

    // User portrait avatar
    portrait(92, cardY + 45, 110, 110, 55);

    // Profile text
    text(
      236,
      cardY + 76,
      profile.name ?? "Jehg",
      "bold 44px -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui",
    );
    text(
      236,
      cardY + 130,
      profile.subtitle ?? "Fullstack Systems & Web",
      "30px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
      palette.secondaryText,
    );
    text(
      236,
      cardY + 180,
      "Fullstack · Remote · Available",
      "26px -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui",
      "#22c55e",
    );

    // Bottom Lock Screen Circular Buttons (Flashlight & Camera)
    const btnY = 1710;
    const btnR = 48;

    // Flashlight button (left)
    ctx.beginPath();
    ctx.arc(106, btnY, btnR, 0, Math.PI * 2);
    ctx.fillStyle = isDark
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(0, 0, 0, 0.12)";
    ctx.fill();
    ctx.fillStyle = palette.foreground;
    ctx.beginPath();
    ctx.roundRect(96, btnY - 18, 20, 36, 5);
    ctx.fill();

    // Camera button (right)
    ctx.beginPath();
    ctx.arc(794, btnY, btnR, 0, Math.PI * 2);
    ctx.fillStyle = isDark
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(0, 0, 0, 0.12)";
    ctx.fill();
    ctx.fillStyle = palette.foreground;
    ctx.beginPath();
    ctx.roundRect(778, btnY - 14, 32, 28, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(794, btnY, 7, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#090d16" : "#ffffff";
    ctx.fill();
  } else if (mode === 2) {
    // -----------------------------------------------------------------------
    // Mode 2: iOS 17/18 SpringBoard Home Screen
    // -----------------------------------------------------------------------

    // 1. Two Top Widgets (2x2): User Photo Widget & Personal Status Widget
    const widgetY = 175;
    const widgetSize = 360;

    // Left Widget: The User's Photo Widget (prominent portrait image)
    drawPhotoWidget(
      ctx,
      64,
      widgetY,
      widgetSize,
      widgetSize,
      58,
      portrait,
      isDark,
    );
    const photosLabel = profile.locale?.startsWith("nl")
      ? "Foto's"
      : profile.locale?.startsWith("es")
        ? "Fotos"
        : "Photos";
    drawAppLabel(
      ctx,
      photosLabel,
      64 + widgetSize / 2,
      widgetY + widgetSize + 10,
      palette.foreground,
    );

    // Right Widget: Authentic Apple iOS Weather Widget (borderless, with live forecast)
    drawWeatherWidget(ctx, 476, widgetY, widgetSize, widgetSize, 58, profile);
    const weatherLabel = profile.locale?.startsWith("nl")
      ? "Weer"
      : profile.locale?.startsWith("es")
        ? "Clima"
        : "Weather";
    drawAppLabel(
      ctx,
      weatherLabel,
      476 + widgetSize / 2,
      widgetY + widgetSize + 10,
      palette.foreground,
    );

    // 2. Curated Functional Professional Shortcuts (2 Rows of 4 apps, matching official iOS grid)
    // Column positions: 74, 273, 472, 671 (Left margin 74, gap 44, icon size 155)
    const colX = [74, 273, 472, 671];
    const iconSize = 155;

    // Row 0 (y = 620 so Spotify aligns with .spotifyApp click area!)
    const r0Y = 620;
    drawSpotifyIcon(ctx, colX[0], r0Y, iconSize);
    drawAppLabel(
      ctx,
      "Spotify",
      colX[0] + iconSize / 2,
      r0Y + iconSize + 10,
      palette.foreground,
    );

    drawTerminalIcon(ctx, colX[1], r0Y, iconSize);
    drawAppLabel(
      ctx,
      "Terminal",
      colX[1] + iconSize / 2,
      r0Y + iconSize + 10,
      palette.foreground,
    );

    drawProjectsIcon(ctx, colX[2], r0Y, iconSize);
    drawAppLabel(
      ctx,
      "Projects",
      colX[2] + iconSize / 2,
      r0Y + iconSize + 10,
      palette.foreground,
    );

    drawCVIcon(ctx, colX[3], r0Y, iconSize);
    drawAppLabel(
      ctx,
      "CV",
      colX[3] + iconSize / 2,
      r0Y + iconSize + 10,
      palette.foreground,
    );

    // Row 1 (y = 835)
    const r1Y = 835;
    drawBlogIcon(ctx, colX[0], r1Y, iconSize);
    drawAppLabel(
      ctx,
      "Blog",
      colX[0] + iconSize / 2,
      r1Y + iconSize + 10,
      palette.foreground,
    );

    drawCodeIcon(ctx, colX[1], r1Y, iconSize);
    drawAppLabel(
      ctx,
      "Code",
      colX[1] + iconSize / 2,
      r1Y + iconSize + 10,
      palette.foreground,
    );

    drawLinkedInIcon(ctx, colX[2], r1Y, iconSize);
    drawAppLabel(
      ctx,
      "LinkedIn",
      colX[2] + iconSize / 2,
      r1Y + iconSize + 10,
      palette.foreground,
    );

    drawMailIcon(ctx, colX[3], r1Y, iconSize);
    drawAppLabel(
      ctx,
      "Mail",
      colX[3] + iconSize / 2,
      r1Y + iconSize + 10,
      palette.foreground,
    );

    // 3. Medium 2×4 Widget: Profile Highlights & Engineering Focus (y = 1060)
    drawProfessionalWidget(
      ctx,
      64,
      1060,
      772,
      360,
      58,
      profile,
      palette,
      isDark,
    );

    // 4. Search Pill and Pagination Dots
    drawSearchPill(ctx, palette, isDark);

    // 5. Frosted Glass Dock with Phone, Safari, Messages, Music
    drawDock(ctx, isDark);
  }

  // 6. iOS Home Indicator Bar
  drawHomeIndicator(ctx, palette);
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
    stroke?: string | null,
    lw?: number,
    dash?: number[],
  ) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke && lw && lw > 0) {
      g.setLineDash(dash ?? []);
      g.lineWidth = lw;
      g.strokeStyle = stroke;
      g.stroke();
      g.setLineDash([]);
    }
  };
  const tx = (t: string, x: number, y: number, f: string, col?: string) => {
    g.font = f;
    g.fillStyle = col ?? palette.foreground;
    g.fillText(t, x, y);
  };
  const ln = (...p: [number, number][]) => {
    g.beginPath();
    p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineWidth = 2;
    g.strokeStyle = "rgba(255, 255, 255, 0.16)";
    g.stroke();
  };
  const activeServices =
    services.length > 0 ? services.slice(0, 4) : DEFAULT_HERO_SERVICES;
  if (kind === "api") {
    // API Gateway container - borderless frosted block
    bx(130, 1060, 640, 110, 28, "rgba(255, 255, 255, 0.08)");
    tx("API Gateway", 450, 1128, "bold 54px system-ui");
    ln([450, 1170], [450, 1210]);
    ln([136, 1210], [764, 1210]);
    activeServices.forEach(([n, t], i) => {
      const x = 36 + i * 214;
      ln([x + 100, 1210], [x + 100, 1250]);
      bx(x, 1250, 200, 220, 28, "rgba(255, 255, 255, 0.06)");
      tx(n, x + 100, 1310, "bold 38px system-ui");
      tx(t, x + 100, 1354, "28px system-ui", palette.secondaryText);
      bx(x + 18, 1384, 164, 56, 28, "rgba(255, 255, 255, 0.1)");
      tx("MongoDB", x + 100, 1421, "26px system-ui", palette.secondaryText);
      ln([x + 100, 1470], [x + 100, 1560]);
    });
    // Event bus container - borderless frosted block
    bx(36, 1560, 828, 110, 28, "rgba(255, 255, 255, 0.08)");
    tx("Event bus", 450, 1630, "bold 50px system-ui");
  } else {
    // Cloud Infrastructure container
    bx(40, 1430, 820, 450, 36, "rgba(255, 255, 255, 0.04)");
    tx("Azure", 450, 1510, "bold 58px system-ui");
    activeServices.forEach(([n], i) => {
      const x = 60 + i * 200;
      bx(x, 1560, 180, 140, 24, "rgba(255, 255, 255, 0.06)");
      tx(n.toLowerCase(), x + 90, 1620, "bold 32px system-ui");
      tx("Docker", x + 90, 1664, "26px system-ui", palette.secondaryText);
    });
    // Database layer container - borderless frosted block
    bx(60, 1740, 780, 110, 28, "rgba(255, 255, 255, 0.08)");
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

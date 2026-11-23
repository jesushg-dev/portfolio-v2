import {
  createPhone,
  type PhoneProfile,
  type DevicePalette,
  type DrawDeviceScreen,
  type DrawDeviceLayers,
} from "./ios-device-renderer";
export interface ContactPhoneProfile extends PhoneProfile {
  location: string;
  addLabel: string;
  channels: string[];
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const remSize = (n: number) =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) * n;
const closedPhonePause = 280;
const contactHandoffDuration = 680;
const hingeCloseDuration = 520;
const phoneDockDuration = 200;
export function mountContactScene(
  csS: HTMLElement,
  cv3: HTMLCanvasElement,
  profile: ContactPhoneProfile,
) {
  if (
    typeof window !== "undefined" &&
    !window.matchMedia("(min-width:64rem)").matches
  ) {
    return;
  }
  let canvasOn = false;
  const root = csS.closest<HTMLElement>("[data-blog-contact-story]");
  if (!root) return;
  const backdrop = root;
  const bg = root.querySelector<HTMLElement>("[data-phone-origin]"),
    blogSection = bg?.closest("section"),
    blogHeading = blogSection?.querySelector("#blog-heading"),
    container = root.querySelector<HTMLElement>("[data-contact-container]"),
    stageNode = csS.querySelector<HTMLElement>(".cs-stage");
  if (!container || !stageNode) return;
  const contactLayout = container.querySelector<HTMLElement>(
    "[data-contact-layout]",
  );
  const directContact =
    contactLayout?.querySelector<HTMLElement>("#direct-contact");
  const pn = stageNode.querySelector<HTMLElement>(".cs-panel"),
    hd = csS.querySelector<HTMLElement>(".cs-head"),
    HO = () => parseFloat(getComputedStyle(stageNode).top) || 0;
  const title = container.querySelector<HTMLElement>(
    "[data-contact-title] > div",
  );
  const screenNode = pn?.querySelector<HTMLElement>(".cs-screen");
  const linkLayer = root.querySelector<HTMLElement>(".cs-blog-links");
  if (!pn || !hd || !title || !linkLayer || !screenNode) return;
  const screen = screenNode;
  const panel = pn,
    heading = hd,
    landingTitle = title,
    links = linkLayer,
    contactContainer = container,
    stage = stageNode;
  const movingTitle = landingTitle.cloneNode(true) as HTMLElement;
  movingTitle
    .querySelectorAll("[id]")
    .forEach((node) => node.removeAttribute("id"));
  heading.replaceChildren(movingTitle);
  const leaves = Array.from(links.querySelectorAll<HTMLElement>("[data-leaf]"));
  const postLinks = Array.from(
    bg?.querySelectorAll<HTMLAnchorElement>("h3 a, h4 a") ?? [],
    (original, i) => {
      const link = document.createElement("a");
      link.href = original.href;
      link.textContent = original.textContent;
      link.className = "cs-post-link";
      leaves[i === 0 ? 0 : 1].appendChild(link);
      return link;
    },
  );
  const sm = (a: number, b: number, x: number) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    },
    mx = (a: number, b: number, t: number) => a + (b - a) * t;
  const mkMini = () => {
    const w = document.createElement("div");
    w.className = "cs-mini";
    w.inert = true;
    w.setAttribute("aria-hidden", "true");
    const i = document.createElement("div");
    i.className = "cs-mi";
    if (bg) {
      i.replaceChildren(...Array.from(bg.childNodes, (n) => n.cloneNode(true)));
      i.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
    }
    w.appendChild(i);
    return w;
  };
  {
    const lk = panel.querySelector(".cs-lock");
    if (lk) lk.insertBefore(mkMini(), lk.firstChild);
  }
  const mkFold = (src: HTMLElement | null) => {
    if (!src) return null;
    const w = document.createElement("div");
    w.className = "cs-fold";
    w.inert = true;
    w.setAttribute("aria-hidden", "true");
    const s = document.createElement("div");
    s.className = "cs-fs";
    const half = (k: string) => {
      const h = document.createElement("div");
      h.className = "cs-half";
      h.inert = true;
      const f = document.createElement("div");
      f.className = src.className + " cs-face " + k;
      f.replaceChildren(
        ...Array.from(src.childNodes, (n) => n.cloneNode(true)),
      );
      f.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
      const z = document.createElement("div");
      z.className = "cs-bz " + k;
      h.appendChild(z);
      h.appendChild(f);
      if (k === "l") {
        const d = document.createElement("div");
        d.className = "cs-sd";
        h.appendChild(d);
      }
      s.appendChild(h);
      return h;
    };
    const r = half("r");
    const l = half("l");
    const b = document.createElement("div");
    b.className = "cs-back";
    b.insertBefore(mkMini(), b.firstChild);
    l.appendChild(b);
    w.appendChild(s);
    panel.appendChild(w);
    return { w, s, l, r };
  };
  function fitFold(
    c: ReturnType<typeof mkFold>,
    ow: number,
    oh: number,
    PW: number,
    PH: number,
    op: number,
    f: number,
  ) {
    if (!c) return;
    const sc = Math.min(1, PW / (ow * (1 - 0.5 * f)), PH / oh),
      cx = 0.5 + 0.25 * f;
    c.s.style.width = ow + "px";
    c.s.style.height = oh + "px";
    c.s.style.transform = `translate(${(PW / 2 - cx * ow * sc).toFixed(1)}px,${((PH - oh * sc) / 2).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    c.l.style.setProperty("--fa", clamp(f * 2).toFixed(3));
    c.s.style.setProperty(
      "--ms",
      ((ow * 0.5 - remSize(1.375)) / remSize(30)).toFixed(4),
    );
    c.s.style.setProperty("--cbl", (CUR.l / sc).toFixed(1) + "px");
    c.s.style.setProperty("--cbr", (CUR.r / sc).toFixed(1) + "px");
    c.l.style.transform = `translateZ(${(remSize(0.125) * f).toFixed(1)}px) rotateY(${(180 * f).toFixed(1)}deg)`;
    c.w.style.opacity = op.toFixed(3);
    c.w.style.visibility = op > 0.002 ? "visible" : "hidden";
  }
  const CUR = { l: remSize(2.375), r: remSize(2.375) };
  const lyBlog = mkFold(bg);
  const duoScreen: DrawDeviceScreen = (c, w, h, u) => {
    const palette = u.palette;
    c.clearRect(0, 0, w, h);
    c.fillStyle = palette.background;
    c.fillRect(0, 0, w, h);
    const rg = c.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.62);
    rg.addColorStop(
      0,
      "color-mix(in srgb, " + palette.primary + " 26%, transparent)",
    );
    rg.addColorStop(1, "transparent");
    c.fillStyle = rg;
    c.fillRect(0, 0, w, h);
    u.text(86, 104, "9:41", "bold 38px system-ui", palette.foreground);
    c.fillStyle = palette.foreground;
    for (let i = 0; i < 4; i++)
      c.fillRect(w - 330 + i * 17, 102 - 8 - i * 7, 11, 8 + i * 7);
    u.fillRound(w - 236, 80, 52, 24, 7, palette.foreground);
    c.beginPath();
    c.arc(w - 96, 94, 27, 0, 7);
    c.fillStyle = "#000";
    c.fill();
    u.portrait(w / 2 - 130, 300, 260, 260, 130);
    u.text(
      w / 2,
      672,
      profile.name,
      "bold 64px system-ui",
      palette.foreground,
      "center",
    );
    u.text(
      w / 2,
      736,
      profile.subtitle,
      "35px system-ui",
      palette.secondaryText,
      "center",
    );
    u.text(
      w / 2,
      788,
      profile.location,
      "30px system-ui",
      palette.secondaryText,
      "center",
    );
    const icon = (cx: number, cy: number, kind: string) => {
      u.fillRound(cx - 84, cy - 84, 168, 168, 50, palette.muted);
      c.save();
      c.translate(cx - 44, cy - 44);
      c.scale(88 / 24, 88 / 24);
      c.lineWidth = 1.7;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = palette.foreground;
      if (kind === "m") {
        c.beginPath();
        c.roundRect(3, 5, 18, 14, 3);
        c.stroke();
        c.stroke(new Path2D("m4 7.5 8 5.5 8-5.5"));
      } else
        c.stroke(
          new Path2D(
            "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z",
          ),
        );
      c.restore();
    };
    profile.channels.forEach((channel, i) => {
      const x = w / 2 + (i - (profile.channels.length - 1) / 2) * 206;
      if (channel === "linkedin") {
        u.fillRound(x - 84, 846, 168, 168, 50, palette.muted);
        u.text(
          x,
          958,
          "in",
          "bold 70px system-ui",
          palette.foreground,
          "center",
        );
      } else icon(x, 930, channel === "email" ? "m" : "p");
    });
    u.fillRound(96, 1240, w - 192, 128, 64, palette.primary);
    u.text(
      w / 2,
      1325,
      profile.addLabel,
      "bold 48px system-ui",
      palette.onPrimary,
      "center",
    );
    u.fillRound(w / 2 - 130, h - 62, 260, 11, 6, palette.foreground);
  };
  const P3 = { s: 1, x: 0, y: 0, open: 1, rx: 0, ry: 0 };
  const blogTex: DrawDeviceLayers = (palette: DevicePalette) => {
    /* Pantalla abierta CONTINUA: el lienzo `fu` es toda la pantalla (izq|der) sin bordes en el centro.
    Medidas en px del cuerpo 904x678 (igual que el blog 2D) convertidas con K. */
    const c0 = bg?.children[0],
      c1 = bg?.children[1];
    const tx = (e: Element | null | undefined) =>
      e ? (e.textContent ?? "").replace(/\s+/g, " ").trim() : "";
    const A = [
      tx(c0?.querySelector("p span")),
      tx(c0?.querySelector("p")),
      tx(c0?.querySelector("h3")),
      tx(c0?.querySelector(".line-clamp-3")),
      tx(c0?.querySelector("span.text-primary")),
    ];
    const B = [
      tx(c1?.querySelector("h3")),
      ...Array.from(c1?.querySelectorAll("li") ?? []).flatMap((li) => [
        tx(li.querySelector("p")),
        tx(li.querySelector("h4")),
        tx(li.querySelector(".line-clamp-2")),
      ]),
    ];
    const coverRegion = c0?.querySelector("[data-phone-cover]");
    const coverStyle = coverRegion && getComputedStyle(coverRegion);
    const featuredCard = coverRegion?.parentElement;
    const featuredSurface = featuredCard
      ? getComputedStyle(featuredCard).backgroundColor
      : palette.card;
    const latestSurface = c1
      ? getComputedStyle(c1).backgroundColor
      : featuredSurface;
    const card = featuredSurface,
      ink = palette.foreground,
      mut = palette.secondaryText,
      acc = palette.primary,
      lnc = palette.border,
      from = coverStyle?.getPropertyValue("--tw-gradient-from").trim(),
      to = coverStyle?.getPropertyValue("--tw-gradient-to").trim(),
      g1 = from?.length ? from : palette.primary,
      g2 = to?.length ? to : palette.accent;
    const SANS = "Inter,system-ui,sans-serif",
      MONO = '"JetBrains Mono",ui-monospace,Menlo,monospace';
    const W = 1000,
      Ht = 1479,
      K = 2.3073,
      F = 18.39,
      fu = document.createElement("canvas");
    function placeLink(
      index: number,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      const link = postLinks[index];
      if (!link) return;
      const offset = index === 0 ? 0 : W;
      link.style.left = (((x - F) * K - offset) / W) * 100 + "%";
      link.style.top = (((y - F) * K) / Ht) * 100 + "%";
      link.style.width = ((w * K) / W) * 100 + "%";
      link.style.height = (Math.min(h * K, Ht - (y - F) * K) / Ht) * 100 + "%";
    }
    fu.width = 2 * W;
    fu.height = Ht;
    const context = fu.getContext("2d");
    if (!context) return [fu, fu];
    const c = context;
    {
      const L = 2074,
        gr = c.createLinearGradient(
          W - (0.342 * L) / 2,
          Ht / 2 - (0.94 * L) / 2,
          W + (0.342 * L) / 2,
          Ht / 2 + (0.94 * L) / 2,
        );
      gr.addColorStop(0, palette.muted);
      gr.addColorStop(1, palette.background);
      c.fillStyle = gr;
      c.fillRect(0, 0, 2 * W, Ht);
    }
    c.setTransform(K, 0, 0, K, -F * K, -F * K);
    const rr = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      f: string,
    ) => {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
      c.fillStyle = f;
      c.fill();
    };
    const txt = (
      t: string,
      x: number,
      top: number,
      w: number,
      size: number,
      lh: number,
      wt: number,
      ff: string,
      col: string,
      mxl: number,
      ls?: string,
    ) => {
      c.font = wt + " " + size + "px " + ff;
      c.fillStyle = col;
      c.textAlign = "left";
      c.textBaseline = "alphabetic";
      try {
        c.letterSpacing = ls ?? "0px";
      } catch {
        /* letter spacing is optional */
      }
      const base = (lh - size) / 2 + size * 0.8;
      let l = "",
        lines = [];
      for (const wd of String(t).split(" ")) {
        const tt = l ? l + " " + wd : wd;
        if (c.measureText(tt).width > w && l) {
          lines.push(l);
          l = wd;
        } else l = tt;
      }
      lines.push(l);
      if (mxl && lines.length > mxl) {
        lines = lines.slice(0, mxl);
        lines[mxl - 1] = lines[mxl - 1].replace(/\s*\S*$/, "") + "…";
      }
      lines.forEach((q, i) => c.fillText(q, x, top + i * lh + base));
      try {
        c.letterSpacing = "0px";
      } catch {
        /* letter spacing is optional */
      }
      return top + lines.length * lh;
    };
    const M = 36.3,
      GAP = 20,
      HX = 452,
      cw = HX - GAP / 2 - M,
      ch = 678 - 2 * M,
      CY = M,
      PAD = 32;
    placeLink(0, M, CY, cw, ch);
    rr(M, CY, cw, ch, 32, card);
    c.save();
    c.beginPath();
    c.roundRect(M, CY, cw, ch, 32);
    c.clip();
    const hh = (cw * 9) / 16,
      hl = (cw + hh) * 0.7071,
      hcx = M + cw / 2,
      hcy = CY + hh / 2,
      hg = c.createLinearGradient(
        hcx - hl * 0.3536,
        hcy - hl * 0.3536,
        hcx + hl * 0.3536,
        hcy + hl * 0.3536,
      );
    hg.addColorStop(0, g1);
    hg.addColorStop(1, g2);
    c.fillStyle = hg;
    c.fillRect(M, CY, cw, hh);
    c.restore();
    const gx = M + cw * 0.1,
      gy = CY + hh * 0.1,
      gw = cw * 0.8,
      gh = hh * 0.8;
    rr(gx, gy, gw, gh, 16, "rgba(255,255,255,.15)");
    const cover = coverRegion?.querySelector("img");
    if (
      cover?.complete &&
      cover.naturalWidth &&
      new URL(cover.currentSrc, location.href).origin === location.origin
    ) {
      c.save();
      c.beginPath();
      c.roundRect(gx, gy, gw, gh, 16);
      c.clip();
      const scale = Math.max(gw / cover.naturalWidth, gh / cover.naturalHeight);
      const imageWidth = cover.naturalWidth * scale;
      const imageHeight = cover.naturalHeight * scale;
      c.drawImage(
        cover,
        gx + (gw - imageWidth) / 2,
        gy + (gh - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );
      c.restore();
    } else {
      c.strokeStyle = "rgba(255,255,255,.2)";
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1, 16);
      c.stroke();
      const ix = gx + gw * 0.08,
        iw = gw * 0.84,
        sy = gy + (gh - 83) / 2;
      rr(ix, sy, iw * 0.4, 10, 5, "rgba(255,255,255,.8)");
      rr(ix, sy + 22, iw * 0.8, 6, 3, "rgba(255,255,255,.4)");
      rr(ix, sy + 40, iw * 0.6, 6, 3, "rgba(255,255,255,.4)");
      {
        c.font = "500 10px " + MONO;
        try {
          c.letterSpacing = "1px";
        } catch {
          /* letter spacing is optional */
        }
        const p = (A[0] ?? "").toUpperCase(),
          pw = c.measureText(p).width + 24;
        rr(ix, sy + 62, pw, 21, 10.5, "rgba(255,255,255,.2)");
        c.fillStyle = "#fff";
        c.textBaseline = "alphabetic";
        c.fillText(p, ix + 12, sy + 62 + 10.5 + 3.4);
        try {
          c.letterSpacing = "0px";
        } catch {
          /* letter spacing is optional */
        }
      }
    }
    let ty = CY + hh + PAD;
    const tw = cw - 2 * PAD,
      tl = M + PAD;
    ty =
      txt(
        (A[1] || "").toUpperCase(),
        tl,
        ty,
        tw,
        11,
        13,
        400,
        MONO,
        mut,
        1,
        "1.54px",
      ) + 12;
    ty = txt(A[2], tl, ty, tw, 30, 37.5, 600, SANS, ink, 4, "-0.75px") + 12;
    ty = txt(A[3], tl, ty, tw, 15, 24.375, 400, SANS, mut, 3) + 20;
    txt(A[4], tl, ty, tw, 15, 19, 500, SANS, acc, 1);
    const RX = HX + GAP / 2;
    rr(RX, CY, cw, ch, 32, latestSurface);
    let y =
      txt(
        (B[0] || "").toUpperCase(),
        RX + PAD,
        CY + PAD,
        cw - 2 * PAD,
        11,
        13,
        400,
        MONO,
        mut,
        1,
        "1.54px",
      ) + 20;
    const n = Math.floor((B.length - 1) / 3);
    for (let i = 0; i < n; i++) {
      const o = 1 + i * 3;
      if (i > 0) {
        c.fillStyle = lnc;
        c.fillRect(RX + PAD, y, cw - 2 * PAD, 1);
        y += 1 + 20;
      }
      const rowTop = y;
      y =
        txt(
          (B[o] || "").toUpperCase(),
          RX + PAD,
          y,
          cw - 2 * PAD,
          11,
          13,
          400,
          MONO,
          mut,
          1,
          "1.54px",
        ) + 8;
      y =
        txt(
          B[o + 1],
          RX + PAD,
          y,
          cw - 2 * PAD,
          18,
          24.75,
          600,
          SANS,
          ink,
          3,
          "-0.18px",
        ) + 6;
      y =
        txt(B[o + 2], RX + PAD, y, cw - 2 * PAD, 15, 22.5, 400, SANS, mut, 2) +
        (i < n - 1 ? 20 : 0);
      placeLink(i + 1, RX + PAD, rowTop, cw - 2 * PAD, y - rowTop);
    }
    const mk = (m: number) => {
      const o = document.createElement("canvas");
      o.width = W;
      o.height = Ht;
      const x = o.getContext("2d");
      if (!x) return o;
      if (m < 0) {
        x.translate(W, 0);
        x.scale(-1, 1);
      }
      x.drawImage(fu, m < 0 ? 0 : W, 0, W, Ht, 0, 0, W, Ht);
      return o;
    };
    return [mk(-1), mk(1)];
  };
  const controls = {
    panel: panel,
    active: false,
    width: 1,
    height: 1,
    left: 0,
    top: 0,
    leaves,
    blogActive: false,
  };
  const end3d =
    matchMedia("(min-width:64rem)").matches && bg
      ? createPhone(
          {
            fold: () => P3.open,
            pose: () => P3,
            layers: blogTex,
            canvas: cv3,
            portraitImage: panel.querySelector<HTMLImageElement>(".cs-av img"),
            mode: () => 3,
            start: 0.95,
            duo: true,
            sw: 970,
            sh: 1500,
            screen: duoScreen,
            controls,
            rot: () => [P3.rx, P3.ry, 0],
          },
          profile,
        )
      : null;
  let alive = true;
  const cover = bg?.querySelector("img");
  const repaintCover = () => end3d?.retex();
  cover?.addEventListener("load", repaintCover);
  void document.fonts?.ready.then(() => {
    if (alive) end3d?.retex();
  });
  let handoffStartedAt: number | undefined;
  let handoffScroll: number | undefined;
  let contactLift = 0;
  let renderedProgress = 0;
  let lastCloseFrame: number | undefined;
  function csUpdate(now = performance.now()) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const unit = (n: number) => n * rem;
    const vh = innerHeight,
      W = stage.clientWidth,
      H = stage.clientHeight,
      mob = W < unit(48),
      stacked = mob && (W < unit(36) || H > unit(25)),
      top0 = HO(),
      sY = scrollY,
      st = stage.getBoundingClientRect(),
      rc = csS.getBoundingClientRect(),
      landing = landingTitle.getBoundingClientRect(),
      blogEnd = blogSection?.getBoundingClientRect().bottom,
      bR = bg ? bg.getBoundingClientRect() : null;
    const desktop = innerWidth >= unit(64);
    const fo2 = !!(end3d && desktop && bR && bR.width > unit(35));
    const foldOffset =
      bR && desktop
        ? ((blogHeading?.getBoundingClientRect().top ?? bR.top) +
            (blogEnd ?? bR.bottom) -
            vh) /
          2
        : (bR?.bottom ?? rc.top) - vh * 0.85;
    const foldStart = sY + foldOffset;
    const foldDistance = Math.min(unit(24), vh * 0.44);
    const scrollProgress = clamp((sY - foldStart) / foldDistance);
    const skipHandoff =
      Boolean(contactLayout?.contains(document.activeElement)) ||
      (scrollProgress === 1 && landing.bottom <= top0);
    const openHeight = Math.min(H * 0.8, unit(47.5));
    const openBottom = bR
      ? bR.top + (bR.height + openHeight) / 2 - foldOffset
      : 0;
    const unshiftedHeadingTop = landing.top + contactLift;
    // Keep the Duo open until the heading reaches its lower edge.
    const closeFrom = fo2
      ? Math.max(
          0.36,
          Math.min(
            0.6,
            (unshiftedHeadingTop + sY - foldStart + unit(4.25) - openBottom) /
              foldDistance,
          ),
        )
      : 0.3;
    const closeTo = fo2 ? closeFrom + 0.26 : 0.62;
    if (
      fo2 &&
      !skipHandoff &&
      scrollProgress > renderedProgress &&
      scrollProgress > closeFrom
    ) {
      const elapsed = Math.min(100, now - (lastCloseFrame ?? now));
      const closing = renderedProgress < closeTo;
      const phaseStart = closing ? closeFrom : closeTo;
      const phaseEnd = closing ? closeTo : 1;
      const duration = closing ? hingeCloseDuration : phoneDockDuration;
      renderedProgress = Math.min(
        scrollProgress,
        phaseEnd,
        Math.max(renderedProgress, phaseStart) +
          ((phaseEnd - phaseStart) * elapsed) / duration,
      );
      lastCloseFrame = renderedProgress < scrollProgress ? now : undefined;
      if (lastCloseFrame !== undefined) schedule();
    } else {
      renderedProgress = scrollProgress;
      lastCloseFrame = undefined;
    }
    if (scrollProgress < 0.84) {
      handoffStartedAt = undefined;
      handoffScroll = undefined;
    } else if (skipHandoff) {
      handoffStartedAt = now - closedPhonePause - contactHandoffDuration;
    } else if (
      renderedProgress === 1 &&
      handoffStartedAt === undefined &&
      !panel.querySelector(":focus-visible")
    ) {
      handoffStartedAt = now;
      handoffScroll = sY;
    }
    const elapsed = handoffStartedAt === undefined ? 0 : now - handoffStartedAt;
    const settle = skipHandoff
      ? 1
      : sm(
          closedPhonePause,
          closedPhonePause + contactHandoffDuration,
          elapsed,
        );
    const nextLift =
      settle > 0 && handoffScroll !== undefined
        ? settle *
          Math.max(
            0,
            landing.top + contactLift + sY - handoffScroll - top0 - unit(3),
          )
        : 0;
    const liftChange = nextLift - contactLift;
    contactLift = nextLift;
    contactContainer.style.top = contactLift ? -contactLift + "px" : "";
    contactContainer.style.marginBottom = contactContainer.style.top;
    if (handoffStartedAt !== undefined && settle < 1) schedule();
    const m = handoffStartedAt === undefined ? renderedProgress : 1,
      c0 = fo2 ? 0.58 : 0.55,
      c1 = fo2 ? 0.66 : 0.82,
      g = sm(fo2 ? closeTo - 0.06 : 0.3, fo2 ? 1 : 0.85, m),
      f = fo2 ? sm(closeFrom, closeTo, m) : 0,
      q = fo2
        ? [0.74, 0.88, 0.74, 0.83, 0.83, 0.92]
        : [0.7, 0.92, 0.72, 0.95, 0.78, 0.97];
    const gr = bR && fo2 ? sm(0, 0.3, m) : 0,
      ow = bR ? mx(bR.width, Math.min(openHeight * 1.333, bR.width), gr) : 0,
      oh = bR ? mx(bR.height, openHeight, gr) : 0,
      ox = bR ? bR.left + bR.width / 2 - ow / 2 : 0,
      oy = bR ? bR.top + Math.max(0, sY - foldStart) + (bR.height - oh) / 2 : 0;
    /* Fase 2: telefono (derecha en escritorio, abajo en movil), en coordenadas de pantalla */
    const box = contactContainer.getBoundingClientRect(),
      gutter = parseFloat(getComputedStyle(contactContainer).paddingLeft),
      cW = box.width - 2 * gutter,
      cL = box.left + gutter - st.left,
      pw0 = stacked
        ? Math.min(unit(15.625), W * 0.62)
        : Math.min(unit(18.75), Math.max(unit(14.375), W * 0.24)),
      ph0 = Math.min(H * 0.8, unit(47.5)),
      flatWidth = pw0 + unit(1.375),
      pw = fo2
        ? ph0 * 0.7139
        : stacked
          ? Math.min(
              flatWidth,
              Math.max(unit(5), H - landing.height - unit(6)) * 0.7139,
            )
          : Math.min(flatWidth, H * 0.8 * 0.7139),
      ph = fo2 ? ph0 : pw / 0.7139,
      Rr = pw * 0.16,
      Rl = Math.max(unit(0.1875), pw * 0.012);
    const ex = stacked ? (W - pw) / 2 : cL + cW * 0.76 - pw / 2,
      ey = stacked ? H - ph - unit(2.5) : (H - ph) / 2,
      fx = st.left + ex,
      fy = top0 + ey;
    const gap = unit(2);
    const sceneCenter = stacked
      ? Math.max(
          top0 + unit(1.25) + landing.height / 2,
          fy - gap - landing.height / 2,
        )
      : top0 + H / 2;
    const landingCenter = landing.top - liftChange + landing.height / 2;
    /* Fase 1: origen = toda la rejilla del blog (si no existe, el panel grande de antes) */
    const o = bR
      ? [ox + ow * 0.5 * f, oy, ow * (1 - 0.5 * f), oh, unit(2.375)]
      : [
          st.left + W * 0.03,
          st.top + unit(0.375),
          W * 0.94,
          H * 0.94,
          unit(2.25),
        ];
    let X = mx(o[0], fx, g),
      Y = mx(o[1], fy, g),
      PW = mx(o[2], pw, g),
      PH = mx(o[3], ph, g);
    const RL = mx(o[4], Rl, Math.max(f, g)),
      RR = mx(o[4], Rr, g);
    const destination = (
      mob ? contactLayout : (directContact ?? contactLayout)
    )?.getBoundingClientRect();
    if (destination && settle > 0 && settle < 1) {
      const travel = sm(0, 0.87, settle);
      const targetHeight = Math.min(
        ph * 0.72,
        destination.height,
        destination.width / 0.7139,
      );
      const targetWidth = targetHeight * 0.7139;
      X = mx(
        X,
        destination.left + (destination.width - targetWidth) / 2,
        travel,
      );
      Y = mx(Y, destination.top, travel);
      PW = mx(PW, targetWidth, travel);
      PH = mx(PH, targetHeight, travel);
    }
    CUR.l = RL;
    CUR.r = RR;
    const fo = 1 - sm(0.5, 1, settle),
      dom1 = fo2 && m > 0 && m < 0.32;
    panel.style.opacity = (fo2 && !dom1 ? 0 : fo).toFixed(3);
    panel.style.visibility =
      (fo2 ? dom1 : !bR || m > 0) && fo > 0 ? "visible" : "hidden";
    if (bg) bg.style.visibility = m > 0 && bR && bR.bottom > 0 ? "hidden" : "";
    panel.style.left = (X - st.left).toFixed(1) + "px";
    panel.style.top = (Y - st.top).toFixed(1) + "px";
    panel.style.width = PW.toFixed(1) + "px";
    panel.style.height = PH.toFixed(1) + "px";
    panel.style.borderRadius = `${RL.toFixed(1)}px ${RR.toFixed(1)}px ${RR.toFixed(1)}px ${RL.toFixed(1)}px`;
    panel.style.setProperty("--rL", RL.toFixed(1) + "px");
    panel.style.setProperty("--rR", RR.toFixed(1) + "px");
    stage.style.perspectiveOrigin = `${(X - st.left + PW / 2).toFixed(1)}px ${(Y - st.top + PH / 2).toFixed(1)}px`;
    const ov = bR ? (fo2 ? sm(0.61, 0.65, m) : sm(c0 - 0.04, c0 + 0.03, m)) : 1;
    panel.style.background = `color-mix(in srgb,color-mix(in srgb,#020306 ${Math.round(ov * 100)}%,var(--card)) ${Math.round(100 * ov)}%,transparent)`;
    fitFold(
      lyBlog,
      bR ? ow : 1,
      bR ? oh : 1,
      PW,
      PH,
      bR ? (fo2 ? (1 - sm(0.255, 0.29, m)) * fo : (1 - sm(c0, c1, m)) * fo) : 0,
      f,
    );
    if (lyBlog) {
      lyBlog.s.style.setProperty(
        "--pi",
        (fo2
          ? Math.max(0, 0.0535 * oh - unit(0.9375)) * sm(0.04, 0.25, m)
          : 0
        ).toFixed(1) + "px",
      );
      lyBlog.s.style.setProperty(
        "--rb",
        (fo2
          ? mx(unit(2.375), 0.1157 * oh, sm(0.03, 0.25, m))
          : unit(2.375)
        ).toFixed(1) + "px",
      );
    }
    const t = sm(0.62, 1, m);
    panel.style.setProperty("--sh", ov.toFixed(2));
    panel.style.setProperty("--dk", sm(q[0], q[1], m).toFixed(2));
    panel.style.setProperty(
      "--lk",
      (fo2 ? 0 : ov * (1 - sm(q[2], q[3], m))).toFixed(3),
    );
    panel.style.setProperty("--rg", ov.toFixed(3));
    panel.style.setProperty(
      "--ms",
      ((PW - unit(1.375) * ov) / unit(30)).toFixed(4),
    );

    panel.style.setProperty(
      "--co",
      ((fo2 && end3d ? 0 : 1) * sm(q[4], q[5], m)).toFixed(2),
    );
    panel.style.setProperty(
      "--cs",
      (Math.min(pw - unit(1.375), ph - unit(1.375)) / unit(18.75)).toFixed(3),
    );
    panel.classList.toggle("fd", fo2 || m > c1);
    panel.style.setProperty("--gl", (26 * t).toFixed(1));
    panel.style.setProperty(
      "--fk",
      sm(fo2 ? 0.03 : 0.05, fo2 ? 0.22 : 0.35, m).toFixed(3),
    );
    panel.style.setProperty("--rr", RR.toFixed(1) + "px");
    const turn =
        sm(closeFrom + 0.03, closeFrom + 0.15, m) *
        (1 - sm(closeTo - 0.03, closeTo + 0.12, m)),
      yaw = (fo2 ? -21 : -12) * turn,
      pit = (fo2 ? -2.5 : 3) * turn;
    panel.style.transform = `rotateY(${yaw.toFixed(2)}deg) rotateX(${pit.toFixed(2)}deg)`;
    {
      const on3 = fo2 && m >= 0.25 && fo > 0,
        wa = on3 ? sm(0.255, 0.29, m) * fo : 0;
      cv3.style.opacity = wa.toFixed(3);
      cv3.style.visibility = wa > 0.002 ? "visible" : "hidden";
      if (on3 !== canvasOn) {
        canvasOn = on3;
        end3d?.vis(on3);
      }
      if (on3) {
        const ppu = innerHeight / 7.563,
          cx = settle > 0 ? X + PW / 2 : mx(ox + ow / 2, fx + pw / 2, g),
          cy = Y + PH / 2;
        const oo = 1 - f;
        P3.s = (PH / (5.53 * ppu)) * (1 - 0.022 * oo);
        P3.x = (cx - innerWidth / 2 + unit(0.5) * oo) / ppu;
        P3.y = -(cy - innerHeight / 2 - unit(0.4375) * oo) / ppu;
        P3.open = 1 - f;
        P3.ry = (yaw * Math.PI) / 180;
        P3.rx = (-pit * Math.PI) / 180;
      }
    }
    const gpuBlog = fo2 && m >= 0.268 && P3.open > 0.1 && settle === 0;
    const flatBlog =
      !!lyBlog && m > 0 && (fo2 ? m < 0.268 : m < c0) && settle === 0;
    if (lyBlog) {
      lyBlog.w.classList.toggle("cs-readable", flatBlog);
      lyBlog.w.setAttribute("aria-hidden", String(!flatBlog));
      lyBlog.w.inert = !flatBlog;
      lyBlog.r.inert = !flatBlog;
    }
    links.hidden = !gpuBlog;
    controls.blogActive = gpuBlog;
    const interactive =
      (fo2 ? m > 0.3 && P3.open < 0.5 : m >= q[5]) && fo > 0.75;
    const projectContact = fo2 && interactive;
    Object.assign(controls, {
      active: projectContact,
      width: PW,
      height: PH,
      left: st.left,
      top: st.top,
    });
    // The renderer enables projected controls once their cover faces the viewer.
    if (!projectContact || !panel.classList.contains("cs-hit-target")) {
      panel.inert = projectContact || !(interactive || flatBlog);
    }
    screen.inert = !interactive;
    panel.style.pointerEvents = interactive || flatBlog ? "auto" : "none";
    if (projectContact) {
      panel.style.visibility = "visible";
      panel.style.opacity = "1";
      panel.style.background = "transparent";
      panel.classList.add("cs-hit-target");
    } else panel.classList.remove("cs-hit-target");
    // Keep the contact preview at the section boundary while the blog is flat.
    const preview = blogEnd === undefined ? 0 : 1;
    const entrance = fo2 ? sm(0.38, 0.59, m) : sm(0.52, 0.88, m);
    const backdropStart = foldStart + foldDistance * (fo2 ? 0.38 : 0.52);
    const liftedBackdrop = Math.min(rc.top, backdropStart - sY - vh * 0.25);
    const backdropTop =
      blogEnd === undefined
        ? liftedBackdrop
        : mx(blogEnd, liftedBackdrop, entrance);
    backdrop.style.setProperty(
      "--contact-backdrop-top",
      backdropTop - backdrop.getBoundingClientRect().top + "px",
    );
    backdrop.style.setProperty(
      "--contact-backdrop-opacity",
      String(blogEnd === undefined ? entrance : 1),
    );
    backdrop.style.setProperty(
      "--contact-backdrop-feather",
      blogEnd === undefined ? "44svh" : entrance * 44 + "svh",
    );
    // The preview and the final heading share the same document position.
    const toSide = blogEnd === undefined ? 1 : sm(closeFrom, closeTo + 0.06, m);
    const align = mx(1 - sm(0, 0.72, toSide), 1, settle);
    // The rotating cover can extend past the flat layout near the hinge.
    const projectedLeft = fo2
      ? mx(ox + ow / 2, fx + pw / 2, g) -
        Math.max(ph * 0.39, (ow * (1 - f / 2)) / 2)
      : X;
    const room = Math.min(X, projectedLeft) - st.left - cL - gap;
    const copyWidth = stacked
      ? W - unit(2.5)
      : Math.min(cW * 0.46, Math.max(unit(11), room));
    const width = mx(copyWidth, landing.width, align);
    heading.style.width = width + "px";
    heading.style.left =
      mx(st.left + (stacked ? unit(1.25) : cL), landing.left, align) + "px";
    const copyCenter = mx(
      mx(
        landingCenter +
          contactLift +
          Math.max(0, sY - foldStart - (fo2 ? closeFrom * foldDistance : 0)),
        sceneCenter,
        toSide,
      ),
      landingCenter,
      settle,
    );
    heading.style.top = copyCenter + "px";
    heading.style.setProperty("--center", align * 50 + "%");
    heading.style.setProperty("--uncenter", -align * 50 + "%");
    heading.style.textAlign = align > 0.65 ? "center" : "left";
    const reveal = stacked
      ? sm(0.78, 0.97, m)
      : entrance * sm(unit(11), unit(17), room);
    heading.style.setProperty(
      "--ho",
      String(settle >= 1 ? 0 : Math.max(preview, reveal, settle)),
    );
    landingTitle.style.opacity = settle >= 1 ? "1" : "0";
    if (contactLayout) {
      contactLayout.style.opacity = String(sm(0.15, 1, settle));
      contactLayout.style.pointerEvents = settle >= 0.55 ? "" : "none";
    }
    if (!mob && directContact) {
      directContact.style.opacity = String(sm(0.55, 1, settle));
      directContact.style.pointerEvents = settle >= 0.78 ? "" : "none";
    } else {
      directContact?.style.removeProperty("opacity");
      directContact?.style.removeProperty("pointer-events");
    }
  }
  let frame = 0;
  function schedule() {
    if (!frame)
      frame = requestAnimationFrame((now) => {
        frame = 0;
        csUpdate(now);
      });
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  contactLayout?.addEventListener("focusin", schedule);
  contactLayout?.addEventListener("focusout", schedule);
  panel.addEventListener("focusout", schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(root);
  if (bg) resize.observe(bg);
  csUpdate();
  return () => {
    alive = false;
    cover?.removeEventListener("load", repaintCover);
    cancelAnimationFrame(frame);
    resize.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    contactLayout?.removeEventListener("focusin", schedule);
    contactLayout?.removeEventListener("focusout", schedule);
    panel.removeEventListener("focusout", schedule);
    end3d?.dispose();
    canvasOn = false;
    cv3.removeAttribute("style");
    panel.removeAttribute("style");
    panel.inert = false;
    heading.removeAttribute("style");
    heading.replaceChildren();
    contactContainer.style.removeProperty("top");
    contactContainer.style.removeProperty("margin-bottom");
    landingTitle.style.removeProperty("opacity");
    contactLayout?.style.removeProperty("opacity");
    contactLayout?.style.removeProperty("pointer-events");
    directContact?.style.removeProperty("opacity");
    directContact?.style.removeProperty("pointer-events");
    backdrop.style.removeProperty("--contact-backdrop-top");
    backdrop.style.removeProperty("--contact-backdrop-opacity");
    backdrop.style.removeProperty("--contact-backdrop-feather");
    links.hidden = true;
    leaves.forEach((leaf) => {
      leaf.replaceChildren();
      leaf.removeAttribute("style");
      leaf.hidden = false;
    });
    stage.removeAttribute("style");
    panel.classList.remove("fd", "cs-hit-target");
    panel
      .querySelectorAll(":scope > .cs-fold,.cs-lock > .cs-mini")
      .forEach((n) => n.remove());
    if (bg) bg.style.visibility = "";
  };
}

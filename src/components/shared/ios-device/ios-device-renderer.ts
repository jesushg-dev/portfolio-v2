export interface PhoneProfile {
  name: string;
  subtitle: string;
  photo: string;
  initials: string;
  locale: string;
  years?: number;
  services?: [string, string][];
  circuitTitle?: string;
  circuitSubtitle?: string;
  focusTitle?: string;
  focusSubtitle?: string;
  location?: string;
  locationSubtitle?: string;
  timezone?: string;
}
export interface PhoneRenderer {
  setScreenTexture(source: HTMLCanvasElement | null): boolean;
  set(progress: number): void;
  vis(visible: boolean): void;
  dispose(): void;
  retex(): void;
}

export interface DevicePalette {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  secondaryText: string;
  primary: string;
  onPrimary: string;
  accent: string;
  border: string;
}

export interface DeviceScreenTools {
  palette: DevicePalette;
  fillRound(
    this: void,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    color: string,
  ): void;
  roundRect(
    this: void,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
  ): void;
  portrait(
    this: void,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
  ): void;
  text(
    this: void,
    x: number,
    y: number,
    text: string,
    font: string,
    color?: string,
    align?: CanvasTextAlign,
  ): void;
  gradient(
    this: void,
    y1: number,
    y2: number,
    color1: string,
    color2: string,
  ): CanvasGradient;
}

export type DrawDeviceScreen = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  tools: DeviceScreenTools,
  mode: number,
  profile: PhoneProfile,
) => void;

export type DrawDeviceLayers = (
  palette: DevicePalette,
  profile?: PhoneProfile,
) => [HTMLCanvasElement, HTMLCanvasElement];

export interface DevicePose {
  s: number;
  x: number;
  y: number;
}
interface DeviceRenderControls {
  panel: HTMLElement;
  active: boolean;
  width: number;
  height: number;
  left: number;
  top: number;
  leaves: HTMLElement[];
  blogActive: boolean;
}
interface DeviceRenderOptions {
  canvas: HTMLCanvasElement;
  frame?: HTMLElement;
  mode?: (progress: number) => number;
  portraitImage?: HTMLImageElement | null;
  appSurface?: HTMLElement | null;
  appOpen?: () => boolean;
  inspectYaw?: () => number | null;
  screen?: DrawDeviceScreen;
  layers?: DrawDeviceLayers;
  refreshInterval?: number;
  duo?: boolean;
  fold?: () => number;
  pose?: () => DevicePose;
  start?: number;
  sw?: number;
  sh?: number;
  rot?: () => number[];
  controls?: DeviceRenderControls;
}
interface Plane {
  width: number;
  height: number;
  x: number;
  z: number;
}
interface Geometry {
  buffers: (WebGLBuffer | null)[];
  count: number;
}
interface Mesh {
  group: string;
  geo: Geometry;
  color: number[];
  metal: number;
  emit: number;
  tex: boolean | string;
  offset: number[];
}
// Geometry, shaders, screen artwork and poses from jesushg-engineer-iphone-3d.html.
// Read semantic tokens directly. A heading can be midway through a CSS color
// transition when the theme changes, which makes sampling its paint unreliable.
function readPhoneTheme(element: Element): DevicePalette {
  const styles = getComputedStyle(element);
  const token = (name: string) => styles.getPropertyValue("--" + name).trim();
  return {
    background: token("background"),
    foreground: token("foreground"),
    card: token("card"),
    muted: token("muted"),
    secondaryText: token("muted-foreground"),
    primary: token("primary"),
    onPrimary: token("primary-foreground"),
    accent: token("brand2"),
    border: token("border"),
  };
}

export function createDeviceChassis(
  canvas: HTMLCanvasElement,
  frame: HTMLElement,
): PhoneRenderer | null {
  return createPhone({ canvas, frame });
}

const foldLeafHalfDepth = 0.085;
const foldPivotDepth = foldLeafHalfDepth + 0.013;

export function createPhone(
  cfg: DeviceRenderOptions,
  profile?: PhoneProfile,
): PhoneRenderer | null {
  const canvas = cfg.canvas;
  const context = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: false,
  });
  if (!context || context.isContextLost()) return null;
  const gl = context;
  const motion = matchMedia("(prefers-reduced-motion:reduce)");
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  let target = cfg.start ?? 0,
    smooth = target,
    live = false,
    running = false,
    disposed = false,
    frame = 0;
  const vs = `attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;uniform mat4 uModel;uniform mat4 uVP;varying vec3 vN;varying vec3 vP;varying vec2 vUV;void main(){vec4 wp=uModel*vec4(aPos,1.);vP=wp.xyz;vN=mat3(uModel)*aNormal;vUV=aUV;gl_Position=uVP*wp;}`;
  const fs = `precision highp float;varying vec3 vN;varying vec3 vP;varying vec2 vUV;uniform vec4 uColor;uniform float uMetal;uniform float uEmit;uniform float uTex;uniform sampler2D uSampler;uniform vec3 uCamera;uniform vec3 uLight;void main(){vec3 N=normalize(vN);vec3 V=normalize(uCamera-vP);vec3 A=normalize(uLight);vec3 B=normalize(vec3(.8,-.2,-.8));float d=max(0.,dot(N,A))*.53+max(0.,dot(N,B))*.37;float spec=pow(max(0.,dot(reflect(-A,N),V)),uMetal>.5?54.:90.)*(.21+.62*uMetal);float rim=pow(1.-abs(dot(V,N)),2.5)*uMetal*.31;vec4 tex=texture2D(uSampler,vUV);vec4 base=mix(uColor,tex,uTex);float lit=uTex>.5?1.:(.43+d);vec3 finalCol=base.rgb*lit+vec3(.87,.94,1.)*(spec+rim)+base.rgb*uEmit;gl_FragColor=vec4(finalCol,base.a*uColor.a);}`;
  function compile(type: number, src: string) {
    const s = gl.createShader(type);
    if (!s) throw new Error("WebGL shader allocation failed");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(
        gl.getShaderInfoLog(s) ?? "WebGL shader compilation failed",
      );
    return s;
  }
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = compile(type, source);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(
      gl.getProgramInfoLog(program) ?? "WebGL program linking failed",
    );
  gl.useProgram(program);
  const locations = {
    pos: gl.getAttribLocation(program, "aPos"),
    normal: gl.getAttribLocation(program, "aNormal"),
    uv: gl.getAttribLocation(program, "aUV"),
    model: gl.getUniformLocation(program, "uModel"),
    vp: gl.getUniformLocation(program, "uVP"),
    color: gl.getUniformLocation(program, "uColor"),
    metal: gl.getUniformLocation(program, "uMetal"),
    emit: gl.getUniformLocation(program, "uEmit"),
    texture: gl.getUniformLocation(program, "uTex"),
    sampler: gl.getUniformLocation(program, "uSampler"),
    camera: gl.getUniformLocation(program, "uCamera"),
    light: gl.getUniformLocation(program, "uLight"),
  };
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  function mul(a: number[], b: number[]) {
    const o = new Array<number>(16).fill(0);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return o;
  }
  function trans(x: number, y: number, z: number) {
    const m = I();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  }
  function rx(a: number) {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return m;
  }
  function ry(a: number) {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return m;
  }
  function rz(a: number) {
    const m = I(),
      c = Math.cos(a),
      s = Math.sin(a);
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return m;
  }
  function scale(s: number, relativeWidth: number) {
    const m = I();
    m[0] = s * relativeWidth;
    m[5] = m[10] = s;
    return m;
  }
  function perspective(fov: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fov / 2),
      m = I();
    m[0] = f / aspect;
    m[5] = f;
    m[10] = (far + near) / (near - far);
    m[11] = -1;
    m[14] = (2 * far * near) / (near - far);
    m[15] = 0;
    return m;
  }
  function createGeo(P: number[], N: number[], U: number[]): Geometry {
    const buffers = [];
    for (const arr of [P, N, U]) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      buffers.push(b);
    }
    return { buffers, count: P.length / 3 };
  }
  function geoBuilder() {
    const P: number[] = [],
      N: number[] = [],
      U: number[] = [];
    function tri(
      a: number[],
      b: number[],
      c: number[],
      normal: number[],
      uvs?: number[][],
    ) {
      for (let j = 0; j < 3; j++) {
        const p = [a, b, c][j];
        P.push(...p);
        N.push(...normal);
        U.push(...(uvs ? uvs[j] : [0.5, 0.5]));
      }
    }
    return { P, N, U, tri, geo: () => createGeo(P, N, U) };
  }
  function perimeter(w: number, h: number, r: number, steps = 13) {
    const out = [];
    const corners = [
      [w / 2 - r, h / 2 - r, 0],
      [-w / 2 + r, h / 2 - r, 90],
      [-w / 2 + r, -h / 2 + r, 180],
      [w / 2 - r, -h / 2 + r, 270],
    ];
    for (const [cx, cy, st] of corners)
      for (let i = 0; i <= steps; i++) {
        const a = ((st + (i * 90) / steps) * Math.PI) / 180;
        out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    return out;
  }
  function face(w: number, h: number, r: number, z: number, dir = 1) {
    const pts = perimeter(w, h, r);
    const b = geoBuilder();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i],
        c = pts[(i + 1) % pts.length];
      if (dir === 1)
        b.tri(
          [0, 0, z],
          [a[0], a[1], z],
          [c[0], c[1], z],
          [0, 0, dir],
          [
            [0.5, 0.5],
            [a[0] / w + 0.5, a[1] / h + 0.5],
            [c[0] / w + 0.5, c[1] / h + 0.5],
          ],
        );
      else
        b.tri(
          [0, 0, z],
          [c[0], c[1], z],
          [a[0], a[1], z],
          [0, 0, dir],
          [
            [0.5, 0.5],
            [c[0] / w + 0.5, c[1] / h + 0.5],
            [a[0] / w + 0.5, a[1] / h + 0.5],
          ],
        );
    }
    return b.geo();
  }
  function band(layers: number[][]) {
    const b = geoBuilder();
    for (let l = 0; l < layers.length - 1; l++) {
      const p = perimeter(layers[l][0], layers[l][1], layers[l][2]),
        q = perimeter(layers[l + 1][0], layers[l + 1][1], layers[l + 1][2]);
      for (let i = 0; i < p.length; i++) {
        const j = (i + 1) % p.length,
          A = [p[i][0], p[i][1], layers[l][3]],
          B = [p[j][0], p[j][1], layers[l][3]],
          C = [q[j][0], q[j][1], layers[l + 1][3]],
          D = [q[i][0], q[i][1], layers[l + 1][3]],
          x = (A[0] + B[0]) / 2,
          y = (A[1] + B[1]) / 2;
        let n = [x / 2.5, y / 5.4, 0];
        const norm = Math.hypot(...n) || 1;
        n = n.map((v) => v / norm);
        b.tri(A, B, C, n);
        b.tri(A, C, D, n);
      }
    }
    return b.geo();
  }
  function circle(rad: number, z: number, dir = 1, sides = 40) {
    const b = geoBuilder();
    for (let i = 0; i < sides; i++) {
      const a = (i * 2 * Math.PI) / sides,
        c = ((i + 1) * 2 * Math.PI) / sides;
      b.tri(
        [0, 0, z],
        [rad * Math.cos(a), rad * Math.sin(a), z],
        [rad * Math.cos(c), rad * Math.sin(c), z],
        [0, 0, dir],
      );
    }
    return b.geo();
  }
  function box(w: number, h: number, d: number) {
    const x = w / 2,
      y = h / 2,
      z = d / 2,
      b = geoBuilder();
    function quad(
      a: number[],
      c: number[],
      e: number[],
      f: number[],
      n: number[],
    ) {
      b.tri(a, c, e, n);
      b.tri(a, e, f, n);
    }
    quad([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1]);
    quad([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], [0, 0, -1]);
    quad([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], [-1, 0, 0]);
    quad([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], [1, 0, 0]);
    quad([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], [0, 1, 0]);
    quad([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0]);
    return b.geo();
  }
  let LIGHT = [-0.4, 0.7, 1];
  const mesh: Mesh[] = [];
  let coverPlane: Plane | undefined,
    innerRight: Plane | undefined,
    innerLeft: Plane | undefined;
  const shellWidth = 2.74;
  const shellHeight = 5.53;
  const rootFont = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const sizingElement = cfg.frame ?? cfg.appSurface;
  const appStyle = sizingElement && getComputedStyle(sizingElement);
  const frameWidth =
    parseFloat(appStyle?.getPropertyValue("--ios-device-width") ?? "") *
    rootFont;
  const frameHeight =
    parseFloat(appStyle?.getPropertyValue("--ios-device-height") ?? "") *
    rootFont;
  const screenInset =
    parseFloat(appStyle?.getPropertyValue("--ios-device-screen-inset") ?? "") *
    rootFont;
  const frameRadius =
    parseFloat(appStyle?.getPropertyValue("--ios-device-frame-radius") ?? "") *
    rootFont;
  const screenRadius =
    parseFloat(appStyle?.getPropertyValue("--ios-device-screen-radius") ?? "") *
    rootFont;
  const matchesChassis =
    frameWidth > 0 &&
    frameHeight > 0 &&
    screenInset >= 0 &&
    frameRadius > 0 &&
    screenRadius > 0;
  const cornerScale = matchesChassis
    ? (shellHeight * frameRadius) / (frameHeight * 0.5)
    : 1;
  const relativeWidth = matchesChassis
    ? frameWidth / frameHeight / (shellWidth / shellHeight)
    : 1;
  const frontScreen = {
    width: matchesChassis
      ? shellWidth * (1 - (2 * screenInset) / frameWidth)
      : 2.48,
    height: matchesChassis
      ? shellHeight * (1 - (2 * screenInset) / frameHeight)
      : 5.27,
    radius: matchesChassis ? (shellHeight * screenRadius) / frameHeight : 0.38,
    x: 0,
    z: 0.194,
  };
  function add(
    group: string,
    geo: Geometry,
    color: number[],
    metal = 0,
    emit = 0,
    tex: boolean | string = false,
    offset = [0, 0, 0],
  ) {
    mesh.push({ group, geo, color, metal, emit, tex, offset });
  }
  // Outer titanium shell, dark brushed back, shiny stepped bezel and glass.
  if (!cfg.duo) {
    add(
      "back",
      band(
        [
          [2.55, 5.34, 0.42, -0.15],
          [2.66, 5.45, 0.47, -0.17],
          [2.72, 5.51, 0.49, -0.13],
          [shellWidth, shellHeight, 0.5, -0.075],
          [shellWidth, shellHeight, 0.5, 0.075],
          [2.72, 5.51, 0.49, 0.13],
          [2.66, 5.45, 0.47, 0.165],
        ].map(([w, h, radius, z]) => [w, h, radius * cornerScale, z]),
      ),
      [0.48, 0.55, 0.62, 1],
      1,
    );
    add(
      "back",
      face(2.6, 5.4, 0.45 * cornerScale, -0.178, -1),
      [0.17, 0.2, 0.24, 1],
      0.65,
    );
    add(
      "front",
      face(2.68, 5.49, 0.49 * cornerScale, 0.17),
      [0.18, 0.23, 0.29, 1],
      0.86,
    );
    add(
      "front",
      face(2.55, 5.35, 0.42 * cornerScale, 0.18),
      [0.015, 0.025, 0.04, 1],
      0.44,
    );
    add(
      "front",
      face(
        frontScreen.width,
        frontScreen.height,
        frontScreen.radius,
        frontScreen.z,
      ),
      cfg.frame ? [0.02, 0.025, 0.035, 1] : [1, 1, 1, 1],
      0,
      0,
      true,
    );
    // Camera plateau (latest iPhone Pro): full-width raised bar, lens triangle, flash and LiDAR.
    const camY = 1.84;
    add(
      "back",
      face(2.56, 1.62, 0.36, -0.19, -1),
      [0.2, 0.23, 0.29, 1],
      0.8,
      0,
      false,
      [0, camY, 0],
    );
    add(
      "back",
      band([
        [2.54, 1.6, 0.36, -0.19],
        [2.58, 1.64, 0.38, -0.215],
        [2.54, 1.6, 0.36, -0.245],
      ]),
      [0.4, 0.44, 0.5, 1],
      0.95,
      0,
      false,
      [0, camY, 0],
    );
    for (const [x, y] of [
      [-0.85, 2.1],
      [-0.3, 1.83],
      [-0.85, 1.56],
    ]) {
      add(
        "back",
        circle(0.255, -0.252, -1),
        [0.63, 0.69, 0.75, 1],
        0.98,
        0,
        false,
        [x, y, 0],
      );
      add(
        "back",
        circle(0.21, -0.259, -1),
        [0.028, 0.04, 0.065, 1],
        0.75,
        0,
        false,
        [x, y, 0],
      );
      add(
        "back",
        circle(0.158, -0.27, -1),
        [0.026, 0.05, 0.082, 1],
        0.55,
        0,
        false,
        [x, y, 0],
      );
      add(
        "back",
        circle(0.092, -0.278, -1),
        [0.022, 0.04, 0.069, 1],
        0.55,
        0,
        false,
        [x + 0.025, y + 0.013, 0],
      );
      add(
        "back",
        circle(0.036, -0.282, -1),
        [0.22, 0.38, 0.53, 1],
        0.1,
        0.06,
        false,
        [x - 0.038, y + 0.04, 0],
      );
    }
    add(
      "back",
      circle(0.11, -0.252, -1),
      [0.9, 0.92, 0.88, 1],
      0.4,
      0.2,
      false,
      [0.78, 2.12, 0],
    );
    add(
      "back",
      circle(0.1, -0.252, -1),
      [0.02, 0.03, 0.05, 1],
      0.4,
      0,
      false,
      [0.78, 1.55, 0],
    );
    add(
      "back",
      face(2.2, 3.25, 0.3, -0.184, -1),
      [0.15, 0.18, 0.23, 1],
      0.7,
      0,
      false,
      [0, -0.5, 0],
    );
    // Side hardware: independent meshes allow side silhouettes while turning.
    for (const [x, y, h] of [
      [-1.38, 1.2, 0.38],
      [-1.38, 0.37, 0.46],
      [-1.38, -0.22, 0.46],
      [1.38, 0.31, 0.65],
    ])
      add("back", box(0.075, h, 0.16), [0.64, 0.71, 0.79, 1], 0.93, 0, false, [
        x,
        y,
        0,
      ]);
    // Middle layer = API architecture, chassis inner plate = cloud & data (textures drawn below).
    add(
      "board",
      face(2.29, 4.92, 0.33, 0.013),
      [0.04, 0.07, 0.14, 1],
      0.2,
      0,
      "api",
    );
    add(
      "back",
      face(2.5, 5.2, 0.4, -0.13, 1),
      [0.04, 0.07, 0.14, 1],
      0.2,
      0,
      "infra",
    );
  } else {
    // === iPhone Duo cerrado (84.1 x 117.8 x 11.3 mm): bisagra cilindrica a la izquierda, esquinas izquierdas casi cuadradas, derechas muy redondeadas ===
    const W = 3.95,
      H = 5.53,
      hingeInset = 0.265,
      rl = 0.008,
      rr = 0.64,
      cxo = hingeInset / 2,
      Ws = W - hingeInset,
      R0 = [rr, rl, rl, rr],
      ins = (d: number) => R0.map((r) => Math.max(0.03, r - d));
    coverPlane = {
      width: Ws - 0.3,
      height: H - 0.3,
      x: cxo,
      z: foldLeafHalfDepth + 0.012,
    };
    innerRight = {
      width: Ws - 0.15,
      height: H - 0.3,
      x: cxo - 0.075,
      z: foldLeafHalfDepth + 0.012,
    };
    innerLeft = { ...innerRight, width: -innerRight.width, z: -innerRight.z };
    const perim2 = (w: number, h: number, R: number[], steps = 12) => {
      const out = [],
        st = [0, 90, 180, 270],
        c = [
          [w / 2 - R[0], h / 2 - R[0]],
          [-w / 2 + R[1], h / 2 - R[1]],
          [-w / 2 + R[2], -h / 2 + R[2]],
          [w / 2 - R[3], -h / 2 + R[3]],
        ];
      for (let k = 0; k < 4; k++)
        for (let i = 0; i <= steps; i++) {
          const a = ((st[k] + (i * 90) / steps) * Math.PI) / 180;
          out.push([
            c[k][0] + Math.cos(a) * R[k],
            c[k][1] + Math.sin(a) * R[k],
          ]);
        }
      return out;
    };
    const face2 = (w: number, h: number, R: number[], z: number, dir = 1) => {
      const pts = perim2(w, h, R),
        b = geoBuilder();
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i],
          c = pts[(i + 1) % pts.length],
          ua = [a[0] / w + 0.5, a[1] / h + 0.5],
          uc = [c[0] / w + 0.5, c[1] / h + 0.5];
        if (dir === 1)
          b.tri(
            [0, 0, z],
            [a[0], a[1], z],
            [c[0], c[1], z],
            [0, 0, 1],
            [[0.5, 0.5], ua, uc],
          );
        else
          b.tri(
            [0, 0, z],
            [c[0], c[1], z],
            [a[0], a[1], z],
            [0, 0, -1],
            [[0.5, 0.5], uc, ua],
          );
      }
      return b.geo();
    };
    const band2 = (L: [number, number, number[], number][]) => {
      const b = geoBuilder();
      for (let l = 0; l < L.length - 1; l++) {
        const p = perim2(L[l][0], L[l][1], L[l][2]),
          q = perim2(L[l + 1][0], L[l + 1][1], L[l + 1][2]);
        for (let i = 0; i < p.length; i++) {
          const j = (i + 1) % p.length,
            A = [p[i][0], p[i][1], L[l][3]],
            B = [p[j][0], p[j][1], L[l][3]],
            C = [q[j][0], q[j][1], L[l + 1][3]],
            E = [q[i][0], q[i][1], L[l + 1][3]],
            e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]],
            e2 = [E[0] - A[0], E[1] - A[1], E[2] - A[2]];
          let n = [
            e1[1] * e2[2] - e1[2] * e2[1],
            e1[2] * e2[0] - e1[0] * e2[2],
            e1[0] * e2[1] - e1[1] * e2[0],
          ];
          const nl = Math.hypot(...n) || 1;
          n = n.map((v) => v / nl);
          if (n[0] * (A[0] + B[0]) + n[1] * (A[1] + B[1]) < 0)
            n = n.map((v) => -v);
          b.tri(A, B, C, n);
          b.tri(A, C, E, n);
        }
      }
      return b.geo();
    };
    const hinge = (
      edgeRadius: number,
      depthRadius: number,
      length: number,
      sides = 30,
    ) => {
      const b = geoBuilder();
      for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides,
          c = ((i + 1) * 2 * Math.PI) / sides,
          m = (a + c) / 2,
          A = [
            edgeRadius * Math.cos(a),
            -length / 2,
            depthRadius * Math.sin(a),
          ],
          B = [
            edgeRadius * Math.cos(c),
            -length / 2,
            depthRadius * Math.sin(c),
          ],
          C = [B[0], length / 2, B[2]],
          E = [A[0], length / 2, A[2]],
          n = [Math.cos(m) / edgeRadius, 0, Math.sin(m) / depthRadius];
        b.tri(A, B, C, n);
        b.tri(A, C, E, n);
      }
      return b.geo();
    };
    // carcasa de titanio (mismos materiales que el primer telefono)
    add(
      "back",
      band2([
        [Ws - 0.12, H - 0.12, ins(0.06), -foldLeafHalfDepth],
        [Ws, H, R0, -foldLeafHalfDepth + 0.025],
        [Ws, H, R0, foldLeafHalfDepth - 0.025],
        [Ws - 0.12, H - 0.12, ins(0.06), foldLeafHalfDepth],
      ]),
      [0.48, 0.55, 0.62, 1],
      1,
      0,
      false,
      [cxo, 0, 0],
    );
    add(
      "back",
      face2(Ws - 0.1, H - 0.1, ins(0.05), -foldLeafHalfDepth - 0.004, -1),
      [0.17, 0.2, 0.24, 1],
      0.65,
      0,
      false,
      [cxo, 0, 0],
    );
    // cristal frontal: marco negro + pantalla exterior (textura)
    if (cfg.fold) {
      const fR = [ins(0.07)[0], 0.02, 0.02, ins(0.07)[3]],
        sR = [ins(0.15)[0], 0.02, 0.02, ins(0.15)[3]];
      add(
        "front",
        face2(Ws - 0.07, H - 0.14, fR, foldLeafHalfDepth + 0.004, 1),
        [0.02, 0.03, 0.05, 1],
        0.5,
        0,
        false,
        [cxo - 0.035, 0, 0],
      );
      add(
        "front",
        face2(Ws - 0.15, H - 0.3, sR, foldLeafHalfDepth + 0.012, 1),
        [1, 1, 1, 1],
        0,
        0,
        "innerR",
        [cxo - 0.075, 0, 0],
      );
    } else {
      add(
        "front",
        face2(Ws - 0.14, H - 0.14, ins(0.07), foldLeafHalfDepth + 0.004, 1),
        [0.02, 0.03, 0.05, 1],
        0.5,
        0,
        false,
        [cxo, 0, 0],
      );
      add(
        "front",
        face2(Ws - 0.3, H - 0.3, ins(0.15), foldLeafHalfDepth + 0.012, 1),
        [1, 1, 1, 1],
        0,
        0,
        true,
        [cxo, 0, 0],
      );
    }
    if (cfg.fold) {
      add(
        "cover",
        band2([
          [Ws - 0.12, H - 0.12, ins(0.06), -foldLeafHalfDepth],
          [Ws, H, R0, -foldLeafHalfDepth + 0.025],
          [Ws, H, R0, foldLeafHalfDepth - 0.025],
          [Ws - 0.12, H - 0.12, ins(0.06), foldLeafHalfDepth],
        ]),
        [0.48, 0.55, 0.62, 1],
        1,
        0,
        false,
        [cxo, 0, 0],
      );
      add(
        "cover",
        face2(Ws - 0.14, H - 0.14, ins(0.07), foldLeafHalfDepth + 0.004, 1),
        [0.02, 0.03, 0.05, 1],
        0.5,
        0,
        false,
        [cxo, 0, 0],
      );
      add(
        "cover",
        face2(Ws - 0.3, H - 0.3, ins(0.15), foldLeafHalfDepth + 0.012, 1),
        [1, 1, 1, 1],
        0,
        0,
        true,
        [cxo, 0, 0],
      );
      {
        const fR = [ins(0.07)[0], 0.02, 0.02, ins(0.07)[3]],
          sR = [ins(0.15)[0], 0.02, 0.02, ins(0.15)[3]];
        add(
          "cover",
          face2(Ws - 0.07, H - 0.14, fR, -foldLeafHalfDepth - 0.004, -1),
          [0.02, 0.03, 0.05, 1],
          0.5,
          0,
          false,
          [cxo - 0.035, 0, 0],
        );
        add(
          "cover",
          face2(Ws - 0.15, H - 0.3, sR, -foldLeafHalfDepth - 0.012, -1),
          [1, 1, 1, 1],
          0,
          0,
          "innerL",
          [cxo - 0.075, 0, 0],
        );
      }
    }
    // Perfil estrecho de frente con la profundidad de la unión entre las tapas.
    add(
      "back",
      hinge(0.075, foldLeafHalfDepth, H - 0.1),
      [0.4, 0.45, 0.52, 1],
      0.95,
      0,
      false,
      [-W / 2 + hingeInset, 0, 0],
    );
    // unico control: boton lateral derecho
    add("back", box(0.07, 0.62, 0.17), [0.64, 0.71, 0.79, 1], 0.93, 0, false, [
      W / 2 - 0.02,
      0.75,
      0,
    ]);
    // camaras traseras
    add(
      "back",
      face2(1.15, 0.98, [0.3, 0.3, 0.3, 0.3], -foldLeafHalfDepth - 0.02, -1),
      [0.2, 0.23, 0.29, 1],
      0.8,
      0,
      false,
      [cxo + 0.82, H / 2 - 0.9, 0],
    );
    for (const [x, y] of [
      [0.52, 0.0],
      [1.12, 0.0],
    ]) {
      add(
        "back",
        circle(0.27, -foldLeafHalfDepth - 0.05, -1),
        [0.63, 0.69, 0.75, 1],
        0.98,
        0,
        false,
        [cxo + x - 0.3, H / 2 - 0.9 + y, 0],
      );
      add(
        "back",
        circle(0.2, -foldLeafHalfDepth - 0.06, -1),
        [0.03, 0.04, 0.065, 1],
        0.75,
        0,
        false,
        [cxo + x - 0.3, H / 2 - 0.9 + y, 0],
      );
    }
  }
  const textures: Record<string, WebGLTexture> = {};
  let liveScreenTexture: WebGLTexture | null = null;
  function makeTexture(image: TexImageSource) {
    const t = gl.createTexture();
    if (!t) throw new Error("WebGL texture allocation failed");
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  let palette = readPhoneTheme(canvas);
  const screenCanvas = document.createElement("canvas");
  if (cfg.screen) {
    screenCanvas.width = cfg.sw ?? 900;
    screenCanvas.height = cfg.sh ?? 1912;
  }
  const context2D = screenCanvas.getContext("2d");
  if (!context2D) return null;
  const ctx = context2D;
  function rr(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function fillRound(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    color: string,
  ) {
    rr(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(
    x: number,
    y: number,
    s: string,
    font: string,
    color = palette.foreground,
    align: CanvasTextAlign = "left",
  ) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  }
  function gradient(y1: number, y2: number, c1: string, c2: string) {
    const g = ctx.createLinearGradient(0, y1, 0, y2);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }
  let photo: HTMLImageElement | null = null;
  const im = new Image();
  function portrait(x: number, y: number, w: number, h: number, r: number) {
    ctx.save();
    rr(x, y, w, h, r);
    ctx.clip();
    if (photo) {
      const k = Math.max(w / photo.width, h / photo.height),
        pw = photo.width * k,
        ph = photo.height * k;
      ctx.drawImage(photo, x + (w - pw) / 2, y + (h - ph) * 0.15, pw, ph);
    } else {
      ctx.fillStyle = gradient(y, y + h, palette.primary, palette.accent);
      ctx.fillRect(x, y, w, h);
      text(
        x + w / 2,
        y + h / 2 + Math.min(w, h) * 0.17,
        profile?.initials ?? "",
        "bold " + Math.round(Math.min(w, h) * 0.5) + "px system-ui",
        palette.onPrimary,
        "center",
      );
    }
    ctx.restore();
  }
  function screen(mode: number) {
    if (!cfg.screen || !profile) return;
    cfg.screen(
      ctx,
      screenCanvas.width,
      screenCanvas.height,
      {
        fillRound,
        text,
        portrait,
        gradient,
        roundRect: rr,
        palette,
      },
      mode,
      profile,
    );
  }
  if (cfg.screen) {
    screen(1);
    textures.screen = makeTexture(screenCanvas);
  }
  let loadedMode = 1;
  const layerKeys = cfg.duo ? ["innerL", "innerR"] : ["api", "infra"];
  cfg.layers?.(palette, profile).forEach((image, index) => {
    textures[layerKeys[index]] = makeTexture(image);
  });
  function upload() {
    gl.bindTexture(gl.TEXTURE_2D, textures.screen);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        screenCanvas,
      );
    } catch {
      photo = null;
      screen(loadedMode);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        screenCanvas,
      );
    }
  }
  function showScreen(mode: number) {
    if (loadedMode === mode) return;
    loadedMode = mode;
    screen(mode);
    upload();
  }
  function refresh() {
    screen(loadedMode);
    upload();
  }
  const clockTimer = cfg.refreshInterval
    ? setInterval(() => {
        if (live) refresh();
      }, cfg.refreshInterval)
    : null;
  const dummyTexture = makeTexture(document.createElement("canvas"));
  function geometryDraw(
    obj: Mesh,
    model: number[],
    vp: number[],
    camera: number[],
  ) {
    const g = obj.geo;
    gl.uniformMatrix4fv(
      locations.model,
      false,
      new Float32Array(
        mul(model, trans(obj.offset[0], obj.offset[1], obj.offset[2])),
      ),
    );
    gl.uniformMatrix4fv(locations.vp, false, new Float32Array(vp));
    gl.uniform4fv(locations.color, new Float32Array(obj.color));
    gl.uniform1f(locations.metal, obj.metal);
    gl.uniform1f(locations.emit, obj.emit);
    const texture =
      obj.tex === true
        ? (liveScreenTexture ?? textures.screen)
        : typeof obj.tex === "string"
          ? textures[obj.tex]
          : undefined;
    gl.uniform1f(locations.texture, texture ? 1 : 0);
    gl.uniform3fv(locations.camera, new Float32Array(camera));
    gl.uniform3fv(locations.light, new Float32Array(LIGHT));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture ?? dummyTexture);
    gl.uniform1i(locations.sampler, 0);
    for (let i = 0; i < 3; i++) {
      const loc = [locations.pos, locations.normal, locations.uv][i],
        size = [3, 3, 2][i];
      gl.bindBuffer(gl.ARRAY_BUFFER, g.buffers[i]);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, g.count);
  }
  function interpolate(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  function smoothstep(a: number, b: number, v: number) {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  }
  function mix3(a: number[], b: number[], t: number) {
    return a.map((v, i) => interpolate(v, b[i], t));
  }
  function modelTransform(translation: number[], rotation: number[], sc = 1) {
    return mul(
      mul(
        mul(
          mul(
            trans(translation[0], translation[1], translation[2]),
            rz(rotation[2]),
          ),
          ry(rotation[1]),
        ),
        rx(rotation[0]),
      ),
      scale(sc, relativeWidth),
    );
  }
  function projectSurface(
    element: HTMLElement,
    plane: Plane | undefined,
    model: number[],
    viewProj: number[],
    viewWidth: number,
    viewHeight: number,
    cssWidth: number,
    cssHeight: number,
    offsetX: number,
    offsetY: number,
  ) {
    if (!plane) return;
    const local = trans(plane.x - plane.width / 2, plane.height / 2, plane.z);
    local[0] = plane.width / cssWidth;
    local[5] = -plane.height / cssHeight;
    const screen = trans(viewWidth / 2 - offsetX, viewHeight / 2 - offsetY, 0);
    screen[0] = viewWidth / 2;
    screen[5] = -viewHeight / 2;
    screen[10] = 0;
    const m = mul(screen, mul(viewProj, mul(model, local)));
    // Signed screen-space area tells us when a folding page faces away.
    const dx = m[0] * m[15] - m[12] * m[3],
      dy = m[1] * m[15] - m[13] * m[3];
    const ex = m[4] * m[15] - m[12] * m[7],
      ey = m[5] * m[15] - m[13] * m[7];
    const backFacing = dx * ey - dy * ex <= 0;
    if (element.hasAttribute("data-leaf")) element.hidden = backFacing;
    else element.inert = backFacing;
    // Keep the unused depth axis invertible for native browser hit testing.
    m[8] = m[9] = m[11] = 0;
    m[10] = 1;
    element.style.setProperty("--projection", "matrix3d(" + m.join(",") + ")");
  }
  let currentInspectionYaw: number | null = null;
  let lastFrameTime: number | undefined;
  function render(time: number) {
    if (!live) {
      running = false;
      return;
    }
    running = true;
    const elapsed = Math.min(50, time - (lastFrameTime ?? time - 16));
    lastFrameTime = time;
    const width = canvas.clientWidth,
      height = canvas.clientHeight,
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const reduced = motion.matches;
    if (reduced) smooth = target;
    else smooth = interpolate(smooth, target, 0.095);
    LIGHT = [
      Math.sin(smooth * 7 + (reduced ? 0 : time * 0.0005)) * 0.95,
      0.55 + Math.cos(smooth * 5) * 0.25,
      1,
    ];
    // Scene boundaries: back → turn over → home → physical teardown → reassemble.
    const turn = smoothstep(0.13, 0.33, smooth);
    let tear =
      smoothstep(0.55, 0.68, smooth) * (1 - smoothstep(0.79, 0.91, smooth));
    let rotation = [
      interpolate(0.07, 0, turn),
      interpolate(Math.PI * 0.93, 0, turn),
      interpolate(-0.13, 0, turn),
    ];
    const newRot = [-0.54, -0.46, -0.38];
    rotation = mix3(rotation, newRot, smoothstep(0.57, 0.69, smooth));
    rotation = mix3(
      rotation,
      [0.02, -0.12, 0.04],
      smoothstep(0.82, 0.95, smooth),
    );
    if (cfg.rot) {
      rotation = cfg.rot();
      tear = 0;
    }
    const appOpen = !!cfg.frame || (cfg.appOpen?.() ?? false);
    const inspectYaw = cfg.inspectYaw?.();
    if (inspectYaw != null && !appOpen) {
      const initialYaw =
        rotation[1] +
        Math.round((inspectYaw - rotation[1]) / (2 * Math.PI)) * 2 * Math.PI;
      currentInspectionYaw = reduced
        ? inspectYaw
        : interpolate(
            currentInspectionYaw ?? initialYaw,
            inspectYaw,
            1 - Math.exp(-elapsed / 85),
          );
      rotation = [0, currentInspectionYaw, 0];
    } else {
      currentInspectionYaw = null;
    }
    if (appOpen) {
      rotation = [0, 0, 0];
      tear = 0;
    }
    const bob =
      reduced || appOpen || inspectYaw != null || cfg.fold
        ? 0
        : Math.sin(time * 0.00055) * 0.06;
    const isMobile = matchMedia("(width < 48rem)").matches;
    const cam = [0, 0, isMobile ? 10.7 : 9.85];
    const fov = (42 * Math.PI) / 180;
    const maxDeviceHeight =
      cfg.frame?.offsetHeight ??
      Math.min(
        frameHeight,
        height * (appOpen ? 0.84 : 0.75),
        ((innerWidth - rootFont * 2.5) * frameHeight) / frameWidth,
      );
    const fitScale = matchesChassis
      ? (maxDeviceHeight * cam[2]) /
        ((height * shellHeight) / (2 * Math.tan(fov / 2)) +
          maxDeviceHeight * frontScreen.z)
      : isMobile
        ? 0.8
        : 0.93;
    let s = fitScale * (1 - 0.3 * tear);
    let PX = 0,
      PY = 0;
    if (cfg.pose) {
      const P = cfg.pose();
      s = P.s;
      PX = P.x;
      PY = P.y;
    }
    let chassis = modelTransform(
      mix3([PX, bob + PY, 0], [-0.62, -0.78, -0.55], tear),
      rotation,
      s,
    );
    let board = modelTransform(
      mix3([PX, bob + PY, 0], [-0.08, -0.2, 0.22], tear),
      rotation,
      s,
    );
    let front = modelTransform(
      mix3([PX, bob + PY, 0], [0.46, 0.64, 0.72], tear),
      rotation,
      s,
    );
    let coverM = front;
    if (cfg.fold) {
      const op = cfg.fold(),
        sx = trans(1.71 * op, 0, 0);
      chassis = mul(chassis, sx);
      board = mul(board, sx);
      front = mul(front, sx);
      coverM = mul(
        chassis,
        mul(
          trans(-1.71, 0, foldPivotDepth),
          mul(ry(-Math.PI * op), trans(1.71, 0, foldPivotDepth)),
        ),
      );
    }
    // screen content changes only after the turn is complete.
    if (cfg.screen) showScreen(appOpen ? 2 : (cfg.mode?.(smooth) ?? 1));
    const vp = perspective(fov, width / height, 0.1, 100);
    const view = trans(0, 0, -cam[2]);
    const viewProj = mul(vp, view);
    if (cfg.appSurface) {
      cfg.appSurface.hidden = loadedMode !== 2 || tear > 0.05;
      if (!cfg.appSurface.hidden) {
        projectSurface(
          cfg.appSurface,
          frontScreen,
          front,
          viewProj,
          width,
          height,
          cfg.appSurface.offsetWidth,
          cfg.appSurface.offsetHeight,
          0,
          0,
        );
        cfg.appSurface.style.visibility = cfg.appSurface.inert
          ? "hidden"
          : "visible";
      }
    }
    // Each HTML surface shares its mesh's perspective, orientation and hinge.
    const controls = cfg.controls;
    if (controls?.active) {
      projectSurface(
        controls.panel,
        coverPlane,
        coverM,
        viewProj,
        width,
        height,
        controls.width,
        controls.height,
        controls.left,
        controls.top,
      );
    }
    if (controls?.blogActive) {
      const [left, right, lid] = controls.leaves;
      projectSurface(
        left,
        innerLeft,
        coverM,
        viewProj,
        width,
        height,
        width,
        height,
        0,
        0,
      );
      projectSurface(
        right,
        innerRight,
        front,
        viewProj,
        width,
        height,
        width,
        height,
        0,
        0,
      );
      projectSurface(
        lid,
        coverPlane,
        coverM,
        viewProj,
        width,
        height,
        width,
        height,
        0,
        0,
      );
    }
    // opaque geometry first; the shell houses the board whenever device is assembled.
    for (const obj of mesh) {
      if (cfg.frame && typeof obj.tex === "string") continue;
      const m =
        obj.group === "cover"
          ? coverM
          : obj.group === "back"
            ? chassis
            : obj.group === "board"
              ? board
              : front;
      geometryDraw(obj, m, viewProj, cam);
    }
    if (!reduced && !cfg.frame) frame = requestAnimationFrame(render);
    else running = false;
  }
  function start() {
    if (live && !running && !disposed) {
      running = true;
      frame = requestAnimationFrame(render);
    }
  }
  function repaintTextures() {
    if (disposed) return;
    if (!cfg.screen) {
      start();
      return;
    }
    palette = readPhoneTheme(canvas);
    refresh();
    cfg.layers?.(palette, profile).forEach((image, index) => {
      gl.bindTexture(gl.TEXTURE_2D, textures[layerKeys[index]]);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
    });
    start();
  }
  const themeObserver = new MutationObserver(repaintTextures);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme", "data-color-mode"],
  });
  if (profile?.photo) {
    im.crossOrigin = "anonymous";
    im.onload = () => {
      photo = im;
      refresh();
    };
    const source = cfg.portraitImage;
    if (source?.srcset) {
      im.sizes = source.sizes;
      im.srcset = source.srcset;
    }
    im.src = source?.src ?? profile.photo;
  }
  return {
    setScreenTexture(source) {
      if (disposed || gl.isContextLost()) return false;
      if (liveScreenTexture) {
        if (source) {
          gl.bindTexture(gl.TEXTURE_2D, liveScreenTexture);
          try {
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              source,
            );
          } catch {
            return false;
          }
        } else {
          gl.deleteTexture(liveScreenTexture);
          liveScreenTexture = null;
        }
      } else if (source) {
        try {
          liveScreenTexture = makeTexture(source);
        } catch {
          return false;
        }
      }
      start();
      return true;
    },
    set(value) {
      target = value;
      start();
    },
    vis(visible) {
      live = visible;
      if (visible) start();
      else {
        if (cfg.appSurface) cfg.appSurface.hidden = true;
        cancelAnimationFrame(frame);
        running = false;
      }
    },
    retex: repaintTextures,
    dispose() {
      if (cfg.appSurface) cfg.appSurface.hidden = true;
      themeObserver.disconnect();
      disposed = true;
      live = false;
      cancelAnimationFrame(frame);
      if (clockTimer !== null) clearInterval(clockTimer);
      im.onload = null;
      for (const { geo } of mesh)
        for (const buffer of geo.buffers) gl.deleteBuffer(buffer);
      for (const texture of Object.values(textures)) gl.deleteTexture(texture);
      if (liveScreenTexture) gl.deleteTexture(liveScreenTexture);
      gl.deleteTexture(dummyTexture);
      gl.deleteProgram(program);
    },
  };
}

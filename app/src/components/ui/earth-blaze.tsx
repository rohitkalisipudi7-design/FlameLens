"use client";

import * as React from "react";

/** NASA Planetary Equirectangular Textures (Mars 2K, Moon 2K, Earth Blue Marble) */
const MARS_TEXTURE = "./assets/mars-2k.jpg";
const MOON_TEXTURE = "./assets/moon-2k.jpg";
const EARTH_TEXTURE = "./assets/earth-blue-marble.jpg";
const CDN_EARTH_TEXTURE = "https://cdn.21st.dev/assets/mirror/97/9743175942473681d78838ca1042553dab4779cf957fb6d8f22a81fb796f7797.jpg";

export interface EarthBlazeProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** Deterministic star field. Clamped to 0–5400. */
  starCount?: number;
  /** Nebula exposure, 0–3. Default 1 preserves the original artwork. */
  galaxyBrightness?: number;
  /** Planetary exposure, 0–3. */
  surfaceBrightness?: number;
  /** Optional #RGB or #RRGGBB override. Omit to retain the original aurora palette. */
  auroraColor?: string;
  /** Optional #RGB or #RRGGBB override for the nebula. */
  backgroundColor?: string;
  /** Sun glow, atmospheric rim and planetary illumination, 0–3. Default 1. */
  illumination?: number;
  /** Keep auroral curtains visible while composing a scene. Default false. */
  auroraPreview?: boolean;
  auroraEnabled?: boolean;
  interactive?: boolean;
  /** Host the cloud-free equirectangular texture yourself, or use NASA's default. */
  textureUrl?: string;
  /** Omit to follow the operating system preference. */
  reducedMotion?: boolean;
  /** Target celestial body: "mars" (default) | "moon" | "earth" */
  body?: "mars" | "moon" | "earth";
}

type Options = Required<Pick<EarthBlazeProps, "starCount" | "galaxyBrightness" | "surfaceBrightness" | "illumination" | "auroraPreview" | "auroraEnabled" | "interactive" | "textureUrl">> & Pick<EarthBlazeProps, "reducedMotion"> & { auroraColor: Color; backgroundColor: Color; body: "mars" | "moon" | "earth" };
type Color = [number, number, number, number];
type Uniforms = Record<string, WebGLUniformLocation | null>;
type Geometry = { center: [number, number]; radius: number; low: number; high: number; rest: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const finite = (n: number, fallback: number, max: number) => clamp(Number.isFinite(n) ? n : fallback, 0, max);

function color(value?: string): Color {
  if (!value || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) return [0, 0, 0, 0];
  const hex = value.length === 4 ? value.slice(1).split("").map(c => c + c).join("") : value.slice(1);
  return [parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255, 1];
}

/** A celestial horizon (Mars, Moon, or Earth). Give the container a height, or use its 16:10 ratio. */
export function EarthBlaze({
  className, style, children, starCount = 1800, galaxyBrightness = 1,
  surfaceBrightness = 1, auroraColor, backgroundColor, illumination = 1, auroraPreview = false, auroraEnabled = true, interactive = true,
  textureUrl, reducedMotion, body = "mars",
}: EarthBlazeProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const fallback = React.useRef<HTMLDivElement>(null);
  const renderer = React.useRef<ReturnType<typeof createRenderer> | null>(null);
  const instructions = React.useId();
  const options = { starCount: Math.round(finite(starCount, 1800, 5400)),
    galaxyBrightness: finite(galaxyBrightness, 1, 3), surfaceBrightness: finite(surfaceBrightness, 1, 3),
    illumination: finite(illumination, 1, 3), auroraColor: color(auroraColor), backgroundColor: color(backgroundColor),
    auroraPreview, auroraEnabled, interactive, textureUrl, reducedMotion, body };
  const latest = React.useRef(options);
  latest.current = options;
  React.useEffect(() => {
    if (!canvas.current || !fallback.current) return;
    const instance = createRenderer(canvas.current, fallback.current, latest.current);
    renderer.current = instance;
    return () => { instance.dispose(); renderer.current = null; };
  }, []);
  React.useEffect(() => { renderer.current?.update(options); },
    [starCount, galaxyBrightness, surfaceBrightness, auroraColor, backgroundColor, illumination, auroraPreview, auroraEnabled, interactive, textureUrl, reducedMotion, body]);

  return (
    <div data-earth-blaze="" className={className} style={{ position: "relative", isolation: "isolate", overflow: "hidden", width: "100%", aspectRatio: "16 / 10", background: "#000", ...style }}>
      <style>{`[data-earth-blaze] > canvas:focus-visible { outline: 2px solid var(--color-ring, var(--ring, #a5c8ff)); outline-offset: -4px; }`}</style>
      <div ref={fallback} aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", background: "radial-gradient(ellipse at 32% 38%, #312034 0%, #101421 22%, #020308 52%, #000 78%)" }}>
        <div style={{ position: "absolute", width: "180%", height: "220%", left: "19%", top: "18%", borderRadius: "50%", background: "#000", boxShadow: "-2px -2px 3px #aa7c79, -8px -8px 38px #62406166", transform: "rotate(-28deg)" }} />
      </div>
      <canvas ref={canvas} tabIndex={interactive ? 0 : -1} role="img"
        aria-label="Earth Blaze: sunlight over Europe beneath a field of stars"
        aria-describedby={interactive ? instructions : undefined}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: interactive ? "pan-y" : "auto" }} />
      {interactive && <span id={instructions} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
        Move your pointer or drag horizontally to guide the light. Use arrow keys when focused. Hold Space to reveal Europe.
        {auroraEnabled && " Hold the pointer or Enter, then release for an aurora."} Press Escape or Home to reset. Reduced motion uses still illumination.
      </span>}
      {children && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>{children}</div>}
    </div>
  );
}

  const vertex = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }
  `;
  const fragment = `
    precision highp float;
    uniform vec2 resolution;
    uniform vec2 center;
    uniform float radius;
    uniform float angle;
    uniform float reveal;
    uniform float galaxyBrightness;
    uniform float surfaceBrightness;
    uniform vec4 auroraColor;
    uniform vec4 backgroundColor;
    uniform float illumination;
    uniform float auroraPreview;
    uniform float viewAngle;
    uniform float clock;
    uniform float charge;
    uniform float pulse;
    uniform float pulseAngle;
    uniform float still;
    uniform vec2 drift;
    uniform float bodyMode;
    uniform sampler2D earth;
    uniform sampler2D cosmos;
    const float PI = 3.141592653589793;

    float gauss(float x, float width) { return exp(-x * x / (width * width)); }
    float grain(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
    mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

    // Multi-octave procedural noise for planetary terrain & cratering
    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    float pNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    float pFbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * pNoise(p);
        p = p * 2.04 + vec2(13.1, 7.9);
        a *= 0.5;
      }
      return v;
    }

    vec3 orientGlobe(vec2 xy) {
      vec3 n = vec3(xy.x, -xy.y, sqrt(max(0., 1. - dot(xy, xy))));
      if (bodyMode < 0.5) {
        // Mars orientation: feature heavily cratered southern highlands & Valles Marineris in the sunlight
        n.xy = rotate(-2.15 - viewAngle) * n.xy;
        n.xz = rotate(1.10) * n.xz;
        n.yz = rotate(0.12) * n.yz;
      } else if (bodyMode < 1.5) {
        // Moon orientation: Mare Tranquillitatis & Oceanus Procellarum
        n.xy = rotate(-2.20 - viewAngle) * n.xy;
        n.xz = rotate(2.10) * n.xz;
      } else {
        // Earth orientation: Europe and Mediterranean
        n.xy = rotate(-2.30267 - viewAngle) * n.xy;
        n.xz = rotate(2.70) * n.xz;
        n.xy = rotate(-.08) * n.xy;
      }
      return n;
    }
    vec2 geography(vec3 n) {
      return vec2(atan(-n.z, n.x), asin(clamp(n.y, -1., 1.)));
    }
    vec3 recolor(vec3 source, vec4 tint) {
      return mix(source, tint.rgb * max(source.r, max(source.g, source.b)), tint.a);
    }

    // Mars Procedural Synthesis (Little detail: subtle dark basaltic maria, canyon rifts, soft craters, polar ice)
    vec3 getMars(vec2 uv, vec3 normal) {
      vec2 p = uv * vec2(7.0, 3.5);
      float continent = pFbm(p);
      float lowlands = smoothstep(0.40, 0.60, continent);
      
      // Subtle impact craters & ridges
      float craterField = pFbm(p * 3.8 + vec2(7.3, 11.4));
      float craterRims = smoothstep(0.66, 0.82, craterField) * 0.16;
      
      // Valles Marineris canyon rift system
      float eqDist = abs(normal.y + 0.04);
      float canyonNoise = pFbm(vec2(normal.x * 10.0, normal.y * 24.0));
      float canyon = smoothstep(0.045, 0.008, eqDist) * smoothstep(0.40, 0.85, canyonNoise) * smoothstep(-0.45, 0.35, normal.x) * 0.32;
      
      // Polar Ice Cap (Planum Boreum)
      float polarIce = smoothstep(0.72, 0.88, normal.y);
      
      vec3 darkBasalt = vec3(0.24, 0.14, 0.11);     // Syrtis Major volcanic dark plains
      vec3 redHighland = vec3(0.70, 0.35, 0.19);    // Iron oxide terracotta
      vec3 dustPlain = vec3(0.84, 0.47, 0.26);      // Chryse dust desert
      vec3 polarFrost = vec3(0.92, 0.90, 0.88);     // Water/CO2 frost
      
      vec3 col = mix(darkBasalt, redHighland, lowlands);
      col = mix(col, dustPlain, smoothstep(0.52, 0.72, craterField));
      col -= vec3(canyon * 0.55);
      col += vec3(craterRims * 0.35);
      col = mix(col, polarFrost, polarIce * 0.80);
      return col;
    }

    // Moon Procedural Synthesis (Little detail: dark lunar maria, highland regolith, crater rims, ejecta rays)
    vec3 getMoon(vec2 uv, vec3 normal) {
      vec2 p = uv * vec2(6.5, 3.25);
      float mariaNoise = pFbm(p);
      float maria = smoothstep(0.36, 0.56, mariaNoise);
      
      float craters = pFbm(p * 4.4 + vec2(15.1, 9.8));
      float craterRims = smoothstep(0.64, 0.80, craters) * 0.22;
      
      float rays = pNoise(vec2(atan(normal.y, normal.x) * 7.0, length(normal.xy) * 14.0));
      rays = smoothstep(0.58, 0.82, rays) * 0.12;
      
      vec3 darkMaria = vec3(0.22, 0.21, 0.21);        // Basaltic maria
      vec3 highlandRegolith = vec3(0.64, 0.63, 0.61); // Anorthosite crust
      vec3 brightEjecta = vec3(0.80, 0.79, 0.77);      // Crater ejecta
      
      vec3 col = mix(darkMaria, highlandRegolith, maria);
      col += vec3(craterRims * 0.38);
      col += vec3(rays * brightEjecta);
      return col;
    }
    void main() {
      vec2 p = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution.y;
      vec2 q = p - center;
      float distanceToCenter = length(q);
      float d = distanceToCenter - radius;
      float pixel = 1. / resolution.y;
      vec2 radial = vec2(cos(angle), sin(angle));
      vec2 tangent = vec2(-radial.y, radial.x);
      vec2 sun = center + radial * (radius - .007);
      vec2 delta = p - sun;
      float along = dot(delta, tangent);
      float across = dot(delta, radial);
      float angleDistance = acos(clamp(dot(q / max(distanceToCenter, .0001), radial), -1., 1.)) * radius;
      float space = smoothstep(-pixel, pixel, d);
      float inside = 1. - space;
      float verticalFade = smoothstep(.005, .13, p.y) * (1. - smoothstep(.86, 1.02, p.y));
      float rimLocal = gauss(angleDistance, .34);

      // Holding the light bends the distant nebula, while the planet stays still.
      float event = max(pulse, 0.);
      float bloom = smoothstep(0., .32, event) * (1. - smoothstep(1.4, 4.8, event)) * step(0., pulse);
      bloom = max(max(bloom, charge * still * .65), auroraPreview * .75);
      vec2 sky = p - drift * .007;
      vec2 lens = sky - sun;
      float bend = charge * exp(-dot(lens, lens) / .32) * (1. - still);
      sky = sun + rotate(-bend * .46) * lens / (1. - bend * .20);
      vec2 skyUV = vec2(sky.x / (resolution.x / resolution.y), 1. - sky.y);
      vec3 color = recolor(texture2D(cosmos, skyUV).rgb, backgroundColor) * galaxyBrightness * space * (1. + charge * .45 + bloom * .5);

      // Scattering stays on the sky side of the occluding planet.
      vec3 halo = vec3(.105, .026, .065) * gauss(along, .23) * gauss(across, .11);
      halo += vec3(.21, .066, .072) * gauss(along, .12) * gauss(across, .061);
      halo += vec3(.29, .16, .125) * gauss(along, .057) * gauss(across, .033);
      halo += vec3(.57, .48, .40) * gauss(along, .025) * gauss(across, .020);
      color += halo * illumination * space * (1. + charge * 1.4 + bloom * .65);

      // A thin cool atmosphere transitions to warm white beside the hidden sun.
      float line = gauss(d, max(.00042, pixel * .66));
      vec3 rim = mix(vec3(.105, .135, .18), vec3(.85, .64, .48), rimLocal);
      color += rim * illumination * line * verticalFade;
      color += vec3(.20, .078, .06) * illumination * gauss(d, .003) * rimLocal * verticalFade;
      color += vec3(.034, .057, .092) * illumination * exp(-max(d, 0.) / .007) * space * verticalFade * (.2 + .8 * rimLocal);

      // A released solar pulse travels along the limb and awakens auroral curtains.
      vec2 eventRadial = vec2(cos(pulseAngle), sin(pulseAngle));
      vec2 eventSun = center + eventRadial * (radius - .007);
      float eventDistance = acos(clamp(dot(q / max(distanceToCenter, .0001), eventRadial), -1., 1.)) * radius;
      float sweep = gauss(eventDistance - event * .31, .14);
      sweep = max(sweep, auroraPreview * .8);
      float curtainPhase = atan(q.y, q.x);
      float pleats = .5 + .5 * sin(curtainPhase * 185. + 3. * sin(curtainPhase * 37.) + clock * .23);
      float ceiling = .021 + .020 * sin(curtainPhase * 23. + clock * .11);
      float curtain = exp(-abs(d - ceiling) / .025) * (.25 + .75 * pleats);
      vec3 aurora = mix(vec3(.065, .54, .40), vec3(.36, .13, .59), .5 + .5 * sin(curtainPhase * 12.));
      color += recolor(aurora, auroraColor) * curtain * bloom * (.20 + sweep * .70) * verticalFade;
      color += recolor(vec3(.22, .55, .63), auroraColor) * gauss(d, .0025) * sweep * bloom * verticalFade;

      float waveRadius = .025 + event * .32;
      float wave = gauss(length(p - eventSun) - waveRadius, .010 + event * .004);
      color += recolor(mix(vec3(.20, .36, .57), vec3(.36, .16, .33), .5 + .5 * sin(atan(delta.y, delta.x) * 3.)), auroraColor) * wave * bloom * .25 * space * (1. - still);

      if (d < 0.) {
        vec3 normal = orientGlobe(q / radius);
        vec2 geo = geography(normal);
        vec2 uv = vec2(.5) + geo / vec2(2. * PI, PI);
        float depth = -d;

        vec3 rawTex = texture2D(earth, uv).rgb;
        bool hasTexture = max(rawTex.r, max(rawTex.g, rawTex.b)) > 0.04;

        vec3 surfaceTex;
        vec3 atmoHaze;
        if (bodyMode < 0.5) {
          // MARS: Rich, smooth cinematic NASA 2K mosaic with soft photographic crater relief
          vec3 marsProcedural = getMars(uv, normal);
          vec3 marsBase = hasTexture ? mix(rawTex, marsProcedural, 0.12) : marsProcedural;
          
          // Enhanced Mars color grading (warm burnt orange, rich sienna, golden dust)
          marsBase.r = clamp(pow(marsBase.r, 0.92) * 1.14, 0.0, 1.0);
          marsBase.g = clamp(pow(marsBase.g, 1.05) * 0.96, 0.0, 1.0);
          marsBase.b = clamp(pow(marsBase.b, 1.18) * 0.82, 0.0, 1.0);
          
          // Smooth central-difference crater relief (filters out JPEG high-frequency grain)
          vec2 eps = vec2(0.0035, 0.0035);
          float s0 = dot(texture2D(earth, uv - vec2(eps.x, 0.0)).rgb, vec3(0.3, 0.59, 0.11));
          float s1 = dot(texture2D(earth, uv + vec2(eps.x, 0.0)).rgb, vec3(0.3, 0.59, 0.11));
          float s2 = dot(texture2D(earth, uv - vec2(0.0, eps.y)).rgb, vec3(0.3, 0.59, 0.11));
          float s3 = dot(texture2D(earth, uv + vec2(0.0, eps.y)).rgb, vec3(0.3, 0.59, 0.11));
          vec2 slope = vec2(s1 - s0, s3 - s2) * 8.5;
          
          vec2 sunDir = normalize(sun - p);
          float craterRelief = clamp(dot(slope, sunDir), -0.25, 0.32);
          
          // Soft golden-ochre sunward crater rim highlight and natural interior shadow
          vec3 reliefShading = craterRelief > 0.0 
            ? vec3(0.38, 0.24, 0.14) * craterRelief * 1.8 
            : vec3(-0.18, -0.12, -0.09) * abs(craterRelief);
            
          surfaceTex = clamp(marsBase + reliefShading, 0.0, 1.0);
          
          // Ethereal peach-amber atmospheric limb haze hugging the horizon
          atmoHaze = mix(vec3(0.88, 0.52, 0.34), vec3(0.45, 0.48, 0.68), smoothstep(0.0, 0.05, depth)) 
                     * exp(-depth / 0.042) * illumination * 0.95;
          atmoHaze += vec3(0.25, 0.30, 0.50) * exp(-depth / 0.09) * illumination * 0.30;
        } else if (bodyMode < 1.5) {
          // MOON (2K NASA lunar mosaic with crater rays and maria)
          vec3 moonProcedural = getMoon(uv, normal);
          vec3 moonBase = hasTexture ? mix(rawTex, moonProcedural, 0.20) : moonProcedural;
          
          vec2 eps = vec2(0.0018, 0.0018);
          float lumC = dot(texture2D(earth, uv).rgb, vec3(0.33, 0.33, 0.33));
          float lumR = dot(texture2D(earth, uv + vec2(eps.x, 0.0)).rgb, vec3(0.33, 0.33, 0.33));
          float lumU = dot(texture2D(earth, uv + vec2(0.0, eps.y)).rgb, vec3(0.33, 0.33, 0.33));
          vec2 slope = vec2(lumR - lumC, lumU - lumC) * 30.0;
          vec2 sunDir = normalize(sun - p);
          float craterRelief = clamp(dot(slope, sunDir), -0.30, 0.45);
          vec3 reliefShading = craterRelief > 0.0 ? vec3(0.85) * craterRelief * 0.65 : vec3(-0.15) * abs(craterRelief);
          
          surfaceTex = clamp(moonBase + reliefShading, 0.0, 1.0);
          atmoHaze = vec3(0.0);
        } else {
          // EARTH
          surfaceTex = mix(rawTex, vec3(dot(rawTex, vec3(0.2126, 0.7152, 0.0722))), 0.20);
          atmoHaze = vec3(0.06, 0.14, 0.26) * exp(-depth / 0.08) * illumination;
        }

        // Lighting calculation
        float sunLit = max(gauss(angleDistance, 0.42), bloom * gauss(eventDistance, 0.60));
        float grazingRim = smoothstep(0.001, 0.045, depth) * exp(-depth / 0.25);
        float duskPool = sunLit * grazingRim;

        // Daylit crescent: warm sunlight grazing across craters and terrain ridges
        vec3 dayLit = surfaceTex * (0.85 + duskPool * 0.65);
        if (bodyMode < 0.5) {
          dayLit *= vec3(1.05, 0.96, 0.88);
        }

        // Night side ambient illumination:
        // CRITICAL FIX: NEVER PITCH BLACK! Visible starlight / space shine shows the spherical curvature and subtle terrain silhouettes
        vec3 nightAmbient;
        if (bodyMode < 0.5) {
          // Mars night side: soft dark rust-slate with visible terrain boundaries (~0.22 brightness)
          nightAmbient = surfaceTex * 0.24 + vec3(0.032, 0.018, 0.015);
        } else if (bodyMode < 1.5) {
          // Moon night side: soft earthshine (~0.22 brightness)
          nightAmbient = surfaceTex * 0.22 + vec3(0.024, 0.025, 0.028);
        } else {
          // Earth night side: quiet navy earthshine
          nightAmbient = surfaceTex * 0.18 + vec3(0.015, 0.020, 0.030);
        }

        // Blend smoothly across the terminator
        float litFactor = clamp(duskPool * 2.2 + reveal * 0.45 + bloom * 0.35, 0.0, 1.0);
        vec3 planetSphere = mix(nightAmbient, dayLit, litFactor);

        float baseExposure = (0.78 + reveal * 0.35 + charge * 0.10) * surfaceBrightness;
        color += (planetSphere * baseExposure + atmoHaze) * inside;
      }

      // One static sub-byte dither prevents bands without making black space noisy.
      float light = max(color.r, max(color.g, color.b));
      color += (grain(gl_FragCoord.xy) - .5) / 255. * smoothstep(.001, .015, light);
      gl_FragColor = vec4(clamp(color, 0., 1.), 1.);
    }
  `;

  // Bake intricate nebular dust once. The animation then samples one texture.
  const nebulaFragment = `
    precision highp float;
    uniform vec2 resolution;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float f = 0., a = .5;
      for (int i = 0; i < 6; i++) { f += a * noise(p); p = mat2(.8, -.6, .6, .8) * p * 2.07 + 17.3; a *= .5; }
      return f;
    }
    void main() {
      vec2 uv = vec2(gl_FragCoord.x / resolution.x, 1. - gl_FragCoord.y / resolution.y);
      vec2 p = uv * vec2(2.1, 1.);
      vec2 warp = vec2(fbm(p * 3.1), fbm(p * 3.1 + 9.7));
      float gas = fbm(p * 7. + warp * 4.);
      float lace = fbm(p * 23. + warp * 7.);
      float rift = abs(uv.y - (.58 - uv.x * .65 + .065 * sin(uv.x * 7.)) + (gas - .5) * .19);
      float band = exp(-pow(rift / .15, 2.));
      float dust = smoothstep(.28, .68, fbm(p * 11. + warp * 5. + 30.));
      float clouds = pow(gas, 2.3) * (.28 + lace * 1.1) * band;
      vec3 cold = mix(vec3(.018, .13, .26), vec3(.28, .045, .16), smoothstep(.14, .80, warp.x));
      cold = mix(cold, vec3(.022, .22, .18), smoothstep(.47, .66, warp.y) * .65);
      vec3 col = cold * clouds * (1. - dust * .82) * 2.4;
      col += vec3(.08, .10, .15) * pow(lace, 4.) * band * .50;
      col += vec3(.005, .007, .014) * pow(fbm(p * 4. + 80.), 2.);
      float speck = pow(hash(gl_FragCoord.xy), 34.) * band * .029;
      col += vec3(.7, .8, 1.) * speck;
      gl_FragColor = vec4(col, 1.);
    }
  `;

  const starVertex = `
    precision highp float;
    attribute vec4 star;
    attribute float tail;
    uniform vec2 resolution;
    uniform vec2 center;
    uniform vec2 drift;
    uniform float radius;
    uniform float angle;
    uniform float charge;
    uniform float clock;
    uniform float pulse;
    uniform float pulseAngle;
    uniform float still;
    varying vec3 tint;
    varying float alpha;
    varying float sharp;
    varying vec2 location;
    mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
    void main() {
      vec2 p = star.xy * vec2(resolution.x / resolution.y, 1.);
      p += drift * (.003 + star.w * .009) * (1. - still);
      vec2 sun = center + vec2(cos(angle), sin(angle)) * (radius - .007);
      vec2 delta = p - sun;
      float attraction = exp(-dot(delta, delta) / .40);
      float c = max(0., charge - tail * .026) * (1. - still);
      p = sun + rotate(c * .46 * attraction) * delta * (1. - c * .20 * attraction);
      float e = max(pulse, 0.);
      vec2 eventDelta = p - (center + vec2(cos(pulseAngle), sin(pulseAngle)) * (radius - .007));
      float impulse = exp(-pow((length(eventDelta) - e * .32) / .07, 2.)) * (1. - smoothstep(2., 4.8, e)) * step(0., pulse) * (1. - still);
      p += (eventDelta / max(length(eventDelta), .0001)) * impulse * .004;
      location = p;
      gl_Position = vec4(p.x / (resolution.x / resolution.y) * 2. - 1., 1. - p.y * 2., 0., 1.);
      sharp = step(.988, star.w);
      gl_PointSize = mix(star.z, 20. + star.w * 8., sharp) * max(1., resolution.y / 900.);
      float twinkle = .82 + .18 * sin(clock * (.45 + star.w) + star.w * 123.);
      alpha = (.24 + star.w * .58 + sharp * .55) * twinkle;
      alpha *= tail < .5 ? 1. : charge * (1. - tail / 7.) * .19 * (1. - still);
      alpha *= 1. + impulse * .8;
      tint = mix(vec3(.49, .70, 1.), vec3(1., .69, .49), smoothstep(.32, .90, fract(star.w * 13.7)));
      tint = mix(tint, vec3(.93, .77, 1.), step(.87, fract(star.w * 7.)));
    }
  `;
  const starFragment = `
    precision highp float;
    uniform vec2 center;
    uniform float radius;
    varying vec3 tint;
    varying float alpha;
    varying float sharp;
    varying vec2 location;
    void main() {
      float sky = smoothstep(.001, .004, length(location - center) - radius);
      vec2 p = gl_PointCoord - .5;
      float r = length(p);
      float ordinary = exp(-r * r * 23.);
      float core = exp(-r * r * 2100.);
      float rays = exp(-abs(p.x) * 260. - abs(p.y) * 13.) + exp(-abs(p.y) * 260. - abs(p.x) * 13.);
      float jewel = core * 2. + rays * .65 + exp(-r * r * 55.) * .035;
      gl_FragColor = vec4(tint * mix(ordinary, jewel, sharp), alpha * sky);
    }
  `;


function createRenderer(canvas: HTMLCanvasElement, fallback: HTMLDivElement, initial: Options) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!context) {
    canvas.hidden = true; canvas.style.visibility = "hidden";
    canvas.dataset.status = "fallback";
    return { update: (_: Options) => {}, dispose: () => {} };
  }
  const gl = context;
  let options = initial;
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => options.reducedMotion ?? media.matches;
  const resources: Array<() => void> = [];
  const subscriptions: Array<() => void> = [];
  let disposed = false, visible = true, image: HTMLImageElement | null = null;
  let geometry: Geometry | undefined;
  let program: WebGLProgram, stars: WebGLProgram, buffer: WebGLBuffer, starBuffer: WebGLBuffer;
  let texture: WebGLTexture, cosmos: WebGLTexture, uniforms: Uniforms, starUniforms: Uniforms;
  let position = 0, starPosition = 0, starTail = 0;
  const state = { angle: 0, target: 0, reveal: 0, targetReveal: 0, charge: 0, holding: false,
    pulse: -1, pulseAngle: 0, clock: 0, drift: [0, 0], targetDrift: [0, 0],
    ready: false, frame: 0, last: 0, lost: false };

  function listen(target: EventTarget, type: string, callback: (event: Event) => void) {
    target.addEventListener(type, callback);
    subscriptions.push(() => target.removeEventListener(type, callback));
  }
  function required<T>(resource: T | null): T {
    if (!resource) throw new Error("WebGL allocation failed");
    return resource;
  }
  function compile(type: number, source: string) {
    const shader = required(gl.createShader(type));
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader); throw new Error("Shader compilation failed");
    }
    return shader;
  }
  function link(v: string, f: string) {
    const shaders: WebGLShader[] = [];
    const result = required(gl.createProgram());
    resources.push(() => gl.deleteProgram(result));
    try {
      shaders.push(compile(gl.VERTEX_SHADER, v)); shaders.push(compile(gl.FRAGMENT_SHADER, f));
      for (const shader of shaders) gl.attachShader(result, shader);
      gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error("Shader linking failed");
      return result;
    } finally { shaders.forEach(shader => gl.deleteShader(shader)); }
  }
  function makeBuffer() { const b = required(gl.createBuffer()); resources.push(() => gl.deleteBuffer(b)); return b; }
  function makeTexture() { const t = required(gl.createTexture()); resources.push(() => gl.deleteTexture(t)); return t; }
  function locations(p: WebGLProgram, names: string[]): Uniforms {
    return Object.fromEntries(names.map(k => [k, gl.getUniformLocation(p, k)]));
  }
  function textureOptions() {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function quad(p: WebGLProgram, at: number) {
    gl.useProgram(p); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  }
  function clearResources() { while (resources.length) resources.pop()!(); }
  function resetTexture() {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([5, 9, 16]));
    textureOptions();
  }
  function setup() {
    clearResources(); state.ready = false;
    program = link(vertex, fragment);
    position = gl.getAttribLocation(program, "position");
    uniforms = locations(program, ["resolution", "center", "radius", "angle", "reveal", "viewAngle", "earth", "cosmos", "clock", "charge", "pulse", "pulseAngle", "still", "drift", "galaxyBrightness", "surfaceBrightness", "auroraColor", "backgroundColor", "illumination", "auroraPreview", "bodyMode"]);
    buffer = makeBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const nebula = link(vertex, nebulaFragment);
    cosmos = makeTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cosmos);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1536, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    textureOptions();
    const framebuffer = required(gl.createFramebuffer());
    try {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cosmos, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Incomplete framebuffer");
      quad(nebula, gl.getAttribLocation(nebula, "position"));
      gl.viewport(0, 0, 1536, 1024);
      gl.uniform2f(gl.getUniformLocation(nebula, "resolution"), 1536, 1024);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(framebuffer); }
    texture = makeTexture(); resetTexture();
    stars = link(starVertex, starFragment);
    starPosition = gl.getAttribLocation(stars, "star"); starTail = gl.getAttribLocation(stars, "tail");
    starUniforms = locations(stars, ["resolution", "center", "radius", "angle", "clock", "charge", "pulse", "pulseAngle", "still", "drift"]);
    starBuffer = makeBuffer(); updateStars(); state.ready = true;
    canvas.hidden = false; canvas.style.visibility = "visible";
    if (image?.complete && image.naturalWidth) uploadTexture(image);
  }
  function updateStars() {
    let seed = 428731;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const data = new Float32Array(options.starCount * 35);
    let at = 0;
    for (let i = 0; i < options.starCount; i++) {
      const x = random(), y = random(), size = 1 + Math.pow(random(), 2.4) * 2.6, identity = random();
      for (let tail = 0; tail < 7; tail++) { data.set([x, y, size, identity, tail], at); at += 5; }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }
  function uploadTexture(earthImage: HTMLImageElement) {
    try {
      let source: TexImageSource = earthImage;
      const limit = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096);
      if (Math.max(earthImage.width, earthImage.height) > limit) {
        const small = document.createElement("canvas");
        const ratio = limit / Math.max(earthImage.width, earthImage.height);
        small.width = Math.max(1, Math.round(earthImage.width * ratio)); small.height = Math.max(1, Math.round(earthImage.height * ratio));
        required(small.getContext("2d")).drawImage(earthImage, 0, 0, small.width, small.height); source = small;
      }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      canvas.dataset.texture = "ready";
    } catch { resetTexture(); canvas.dataset.texture = "unavailable"; }
    requestFrame();
  }
  function loadTexture() {
    if (image) { image.onload = null; image.onerror = null; }
    image = null;
    if (state.ready && !state.lost) resetTexture();
    canvas.dataset.texture = "loading";
    const pending = new Image(); image = pending;
    pending.crossOrigin = "anonymous";
    pending.onload = () => { if (!disposed && image === pending && state.ready && !state.lost) uploadTexture(pending); };
    pending.onerror = () => {
      if (pending.src !== CDN_EARTH_TEXTURE) {
        pending.src = CDN_EARTH_TEXTURE;
      } else if (!disposed && image === pending) {
        canvas.dataset.texture = "unavailable";
      }
    };
    const activeTexture =
      options.textureUrl && options.textureUrl !== EARTH_TEXTURE
        ? options.textureUrl
        : options.body === "mars"
        ? MARS_TEXTURE
        : options.body === "moon"
        ? MOON_TEXTURE
        : EARTH_TEXTURE;
    pending.src = activeTexture;
  }
  function resize() {
    if (state.lost || disposed) return;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) { stop(); return; }
    const aspect = box.width / box.height;
    const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3000000 / (box.width * box.height)), maxSize / box.width, maxSize / box.height);
    canvas.width = Math.max(1, Math.round(box.width * dpr)); canvas.height = Math.max(1, Math.round(box.height * dpr));
    const p = [.15 * aspect, .91], q = [.88 * aspect, .015];
    const vx = q[0] - p[0], vy = q[1] - p[1], length = Math.hypot(vx, vy);
    const radius = Math.max(1.4, aspect), offset = Math.sqrt(radius * radius - length * length / 4);
    const center: [number, number] = [(p[0] + q[0]) / 2 - vy / length * offset, (p[1] + q[1]) / 2 + vx / length * offset];
    const low = Math.atan2(p[1] - center[1], p[0] - center[0]) + .035;
    const high = Math.atan2(q[1] - center[1], q[0] - center[0]) - .035;
    const restingY = .4 - center[1];
    const rest = Math.atan2(restingY, -Math.sqrt(radius * radius - restingY * restingY));
    if (geometry) { state.angle += rest - geometry.rest; state.target += rest - geometry.rest; }
    else state.angle = state.target = rest;
    geometry = { center, radius, low, high, rest };
    state.angle = clamp(state.angle, low, high); state.target = clamp(state.target, low, high);
    requestFrame();
  }
  function stop() { cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0; }
  function requestFrame() {
    if (!state.frame && !disposed && visible && !document.hidden && !state.lost && state.ready && geometry) state.frame = requestAnimationFrame(draw);
  }
  function common(u: Uniforms) {
    const g = geometry!;
    gl.uniform2f(u.resolution, canvas.width, canvas.height); gl.uniform2f(u.center, ...g.center);
    gl.uniform1f(u.radius, g.radius); gl.uniform1f(u.angle, state.angle);
    gl.uniform1f(u.clock, still() ? 0 : state.clock); gl.uniform1f(u.charge, state.charge);
    gl.uniform1f(u.pulse, still() ? -1 : state.pulse); gl.uniform1f(u.still, still() ? 1 : 0);
    gl.uniform1f(u.pulseAngle, state.pulseAngle); gl.uniform2f(u.drift, still() ? 0 : state.drift[0], still() ? 0 : state.drift[1]);
  }
  function draw(now: number) {
    state.frame = 0;
    if (disposed || state.lost || !visible || document.hidden || !geometry) return;
    const moving = Math.abs(state.target - state.angle) > .0001 || Math.abs(state.targetReveal - state.reveal) > .001;
    if (!moving && !state.holding && state.charge < .001 && state.pulse < 0 && state.last && now - state.last < 32 && !still()) { requestFrame(); return; }
    const dt = Math.min((now - (state.last || now - 16)) / 1000, .05);
    state.last = now; state.clock += dt;
    const movement = still() ? 1 : 1 - Math.exp(-dt / .24);
    const exposure = still() ? 1 : 1 - Math.exp(-dt / (state.targetReveal > state.reveal ? .8 : .48));
    state.angle += (state.target - state.angle) * movement; state.reveal += (state.targetReveal - state.reveal) * exposure;
    state.charge += ((state.holding ? 1 : 0) - state.charge) * (still() ? 1 : 1 - Math.exp(-dt / (state.holding ? .68 : .5)));
    state.drift = state.drift.map((v, i) => v + (state.targetDrift[i] - v) * movement * .5);
    if (state.pulse >= 0) { state.pulse += dt; if (state.pulse > 5) state.pulse = -1; }
    gl.viewport(0, 0, canvas.width, canvas.height); gl.disable(gl.BLEND); gl.disableVertexAttribArray(starTail);
    quad(program, position); common(uniforms);
    gl.uniform1f(uniforms.reveal, state.reveal); gl.uniform1f(uniforms.viewAngle, geometry.rest);
    gl.uniform1f(uniforms.galaxyBrightness, options.galaxyBrightness); gl.uniform1f(uniforms.surfaceBrightness, options.surfaceBrightness);
    gl.uniform4f(uniforms.auroraColor, ...options.auroraColor); gl.uniform4f(uniforms.backgroundColor, ...options.backgroundColor);
    gl.uniform1f(uniforms.illumination, options.illumination);
    gl.uniform1f(uniforms.auroraPreview, options.auroraPreview && options.auroraEnabled ? 1 : 0);
    const bodyVal = options.body === "moon" ? 1.0 : options.body === "earth" ? 2.0 : 0.0;
    gl.uniform1f(uniforms.bodyMode, bodyVal);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(uniforms.earth, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cosmos); gl.uniform1i(uniforms.cosmos, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(stars); common(starUniforms); gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.enableVertexAttribArray(starPosition); gl.enableVertexAttribArray(starTail);
    gl.vertexAttribPointer(starPosition, 4, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(starTail, 1, gl.FLOAT, false, 20, 16);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, options.starCount * 7); gl.disable(gl.BLEND);
    canvas.dataset.status = "ready"; fallback.hidden = true;
    if (!still()) requestFrame();
  }
  function point(event: PointerEvent) {
    if (!geometry) return;
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.height - geometry.center[0];
    const y = (event.clientY - box.top) / box.height - geometry.center[1];
    let angle = Math.atan2(y, x); if (angle > 0) angle -= Math.PI * 2;
    state.target = clamp(angle, geometry.low, geometry.high);
    const distance = Math.hypot(x, y) - geometry.radius;
    state.targetReveal = Math.exp(-Math.pow((angle - geometry.rest) / .15, 2)) * Math.exp(-Math.pow((distance + .015) / .12, 2));
    state.targetDrift = [(event.clientX - box.left) / box.width - .5, (event.clientY - box.top) / box.height - .5]; requestFrame();
  }
  function release(celebrate = true) {
    if (state.holding && state.charge > .42 && celebrate && !still() && options.auroraEnabled) { state.pulse = 0; state.pulseAngle = state.angle; }
    state.holding = false; requestFrame();
  }
  function rest() {
    release(false); state.target = geometry?.rest ?? 0; state.targetReveal = 0; state.targetDrift = [0, 0]; requestFrame();
  }
  function pointer(type: string, fn: (event: PointerEvent) => void) {
    listen(canvas, type, event => { if (options.interactive && geometry) fn(event as PointerEvent); });
  }
  pointer("pointermove", e => { if (e.isPrimary) point(e); });
  pointer("pointerdown", e => {
    if (!e.isPrimary || e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true });
    state.holding = options.auroraEnabled; point(e); state.pulseAngle = state.target;
  });
  pointer("pointerup", e => {
    if (!e.isPrimary) return;
    release(); if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (e.pointerType !== "mouse") state.targetReveal = 0;
  });
  pointer("pointercancel", rest); pointer("lostpointercapture", () => release(false));
  pointer("pointerleave", e => { if (e.pointerType !== "touch" && !canvas.hasPointerCapture(e.pointerId)) rest(); });
  listen(canvas, "keydown", event => {
    const e = event as KeyboardEvent;
    if (!options.interactive || !geometry || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter", "Escape", "Home"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "ArrowRight" || e.key === "ArrowUp") state.target = clamp(state.target + .022, geometry.low, geometry.high);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") state.target = clamp(state.target - .022, geometry.low, geometry.high);
    if (e.key === " ") state.targetReveal = 1;
    if (e.key === "Enter" && options.auroraEnabled) { state.holding = true; state.pulseAngle = state.angle; }
    if (e.key === "Escape" || e.key === "Home") { state.pulse = -1; rest(); }
    requestFrame();
  });
  listen(canvas, "keyup", event => {
    const e = event as KeyboardEvent;
    if (e.key === "Enter") release();
    if (e.key === " ") { state.targetReveal = 0; requestFrame(); }
  });
  listen(canvas, "blur", rest); listen(window, "blur", rest);
  listen(media, "change", () => { state.pulse = -1; state.last = 0; requestFrame(); });
  listen(document, "visibilitychange", () => {
    if (document.hidden) { state.holding = false; stop(); }
    else requestFrame();
  });
  function fail() { state.ready = false; stop(); canvas.hidden = true; canvas.style.visibility = "hidden"; fallback.hidden = false; canvas.dataset.status = "fallback"; clearResources(); }
  listen(canvas, "webglcontextlost", event => {
    event.preventDefault(); state.lost = true; state.ready = false; state.holding = false; state.charge = 0; state.pulse = -1; stop();
    // Context loss has already released these GPU handles.
    resources.length = 0;
    canvas.hidden = true; canvas.style.visibility = "hidden"; fallback.hidden = false; canvas.dataset.status = "fallback";
  });
  listen(canvas, "webglcontextrestored", () => {
    state.lost = false;
    try { setup(); resize(); } catch { fail(); }
  });
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) { state.last = 0; requestFrame(); } else { state.holding = false; stop(); }
  });
  resizeObserver.observe(canvas); intersection.observe(canvas);
  listen(window, "resize", resize);
  try { setup(); resize(); loadTexture(); } catch { fail(); }
  return {
    update(next: Options) {
      const previous = options; options = next;
      if (!options.interactive || !options.auroraEnabled) { state.holding = false; state.charge = 0; state.pulse = -1; }
      if (!options.interactive) rest();
      if (previous.reducedMotion !== options.reducedMotion) state.pulse = -1;
      if (previous.starCount !== options.starCount && state.ready && !state.lost) updateStars();
      if (previous.textureUrl !== options.textureUrl || previous.body !== options.body) loadTexture();
      state.last = 0; requestFrame();
    },
    dispose() {
      disposed = true; stop(); resizeObserver.disconnect(); intersection.disconnect();
      subscriptions.forEach(unsubscribe => unsubscribe());
      if (image) { image.onload = null; image.onerror = null; image = null; }
      clearResources(); canvas.dataset.status = "disposed";
    },
  };
}

"use client";

import * as React from "react";
import { EarthBlaze } from "@/components/ui/earth-blaze";

// Literal defaults are also read by 21st Studio to generate live controls.
export const settings = {
  starCount: 1800,
  galaxyBrightness: 1,
  surfaceBrightness: 1,
  illumination: 1,
  auroraEnabled: true,
  auroraPreview: false,
  interactive: true,
  auroraTint: false,
  nebulaTint: false,
  auroraColor: "#118a66",
  backgroundColor: "#634369",
};

type DemoSettings = typeof settings;
const ranges = [
  { key: "illumination", label: "Illumination", max: 3, step: .05 },
  { key: "galaxyBrightness", label: "Nebula brightness", max: 3, step: .05 },
  { key: "surfaceBrightness", label: "Earth detail", max: 3, step: .05 },
  { key: "starCount", label: "Stars", max: 5400, step: 100 },
] as const;

export default function EarthBlazeDemo(props: Partial<DemoSettings> = {}) {
  const defaults = React.useMemo(() => ({ ...settings, ...props }), [
    props.starCount, props.galaxyBrightness, props.surfaceBrightness, props.illumination,
    props.auroraEnabled, props.auroraPreview, props.interactive, props.auroraTint,
    props.nebulaTint, props.auroraColor, props.backgroundColor,
  ]);
  const [values, setValues] = React.useState(defaults);
  const previous = React.useRef(defaults);
  React.useEffect(() => {
    const changed = Object.keys(defaults).filter(key => defaults[key as keyof DemoSettings] !== previous.current[key as keyof DemoSettings]);
    if (changed.length) setValues(current => {
      const next = { ...current };
      for (const key of changed) Object.assign(next, { [key]: defaults[key as keyof DemoSettings] });
      return next;
    });
    previous.current = defaults;
  }, [defaults]);
  const update = <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => setValues(current => ({ ...current, [key]: value }));

  return (
    <section data-earth-blaze-demo="" className="eb-demo">
      <style>{`
        [data-earth-blaze-demo] { --eb-bg:var(--color-background,var(--background,#fff)); --eb-fg:var(--color-foreground,var(--foreground,#18181b)); --eb-muted:var(--color-muted-foreground,var(--muted-foreground,#71717a)); --eb-border:var(--color-border,var(--border,#e4e4e7)); --eb-card:var(--color-popover,var(--popover,var(--eb-bg))); --eb-primary:var(--color-primary,var(--primary,#18181b)); --eb-on-primary:var(--color-primary-foreground,var(--primary-foreground,#fff)); --eb-ring:var(--color-ring,var(--ring,#71717a)); display:flex; flex-direction:column; width:100%; min-width:0; min-height:100dvh; background:var(--eb-bg); color:var(--eb-fg); font-family:ui-sans-serif,system-ui,sans-serif; font-size:13px; }
        [data-earth-blaze-demo] * { box-sizing:border-box; }
        [data-earth-blaze-demo] .eb-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:18px 28px; border-bottom:1px solid var(--eb-border); }
        [data-earth-blaze-demo] .eb-heading strong { font-size:14px; font-weight:600; letter-spacing:-.02em; }
        [data-earth-blaze-demo] .eb-meta { color:var(--eb-muted); font-size:12px; }
        [data-earth-blaze-demo] .eb-stage { position:relative; flex:1; min-height:440px; height:calc(100dvh - 180px); background:#000; }
        [data-earth-blaze-demo] .eb-overlay { padding:34px 28px; position:absolute; left:0; bottom:0; width:100%; color:#f4f4f5; display:flex; align-items:end; justify-content:space-between; gap:24px; }
        [data-earth-blaze-demo] .eb-overlay h1 { font-size:clamp(22px,3vw,34px); font-weight:500; letter-spacing:-.04em; margin:8px 0; }
        [data-earth-blaze-demo] .eb-overlay p { margin:0; color:#d4d4d8; font-size:12px; line-height:1.6; }
        [data-earth-blaze-demo] .eb-eyebrow { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#d4d4d8; }
        [data-earth-blaze-demo] .eb-source { pointer-events:auto; color:#f4f4f5; text-decoration:none; font-size:12px; padding:9px 0; border-bottom:1px solid #71717a; white-space:nowrap; }
        [data-earth-blaze-demo] .eb-panel { position:absolute; z-index:3; top:18px; right:20px; width:252px; max-width:calc(100% - 40px); border:1px solid var(--eb-border); border-radius:8px; background:var(--eb-card); color:var(--eb-fg); }
        [data-earth-blaze-demo] summary { padding:12px 14px; cursor:pointer; font-weight:500; }
        [data-earth-blaze-demo] summary::marker { color:var(--eb-muted); }
        [data-earth-blaze-demo] .eb-controls { display:grid; gap:16px; padding:6px 14px 16px; max-height:min(470px,calc(100dvh - 150px)); overflow-y:auto; }
        [data-earth-blaze-demo] label { display:grid; gap:8px; }
        [data-earth-blaze-demo] .eb-check { display:flex; align-items:center; gap:8px; }
        [data-earth-blaze-demo] .eb-color { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        [data-earth-blaze-demo] input { accent-color:var(--eb-primary); }
        [data-earth-blaze-demo] input[type=range] { width:100%; margin:0; }
        [data-earth-blaze-demo] input[type=color] { width:36px; height:30px; padding:2px; border:1px solid var(--eb-border); border-radius:4px; background:var(--eb-bg); cursor:pointer; }
        [data-earth-blaze-demo] output { float:right; color:var(--eb-muted); font-variant-numeric:tabular-nums; }
        [data-earth-blaze-demo] button { min-height:34px; padding:7px 12px; border:1px solid var(--eb-border); border-radius:5px; background:var(--eb-bg); color:var(--eb-fg); font:inherit; cursor:pointer; }
        [data-earth-blaze-demo] button[aria-pressed=true] { background:var(--eb-primary); color:var(--eb-on-primary); border-color:var(--eb-primary); }
        [data-earth-blaze-demo] :is(button,input,summary,a):focus-visible { outline:2px solid var(--eb-ring); outline-offset:4px; }
        [data-earth-blaze-demo] .eb-help { color:var(--eb-muted); font-size:11px; line-height:1.65; margin:0; }
        [data-earth-blaze-demo] .eb-example { display:flex; justify-content:space-between; align-items:start; gap:28px; padding:20px 28px; border-top:1px solid var(--eb-border); }
        [data-earth-blaze-demo] .eb-example p { margin:4px 0 0; color:var(--eb-muted); line-height:1.6; font-size:12px; }
        [data-earth-blaze-demo] .eb-example details { max-width:580px; }
        [data-earth-blaze-demo] .eb-example summary { padding:0; white-space:nowrap; }
        [data-earth-blaze-demo] pre { white-space:pre-wrap; overflow-wrap:anywhere; font-size:11px; line-height:1.7; margin:14px 0 0; }
        @media(max-width:600px) { [data-earth-blaze-demo] .eb-heading { padding:16px 18px; } [data-earth-blaze-demo] .eb-stage { min-height:440px; height:calc(100dvh - 215px); } [data-earth-blaze-demo] .eb-panel { right:12px; top:12px; } [data-earth-blaze-demo] .eb-overlay { padding:24px 18px; display:block; } [data-earth-blaze-demo] .eb-source { display:inline-block; margin-top:10px; } [data-earth-blaze-demo] .eb-example { padding:18px; flex-direction:column; gap:12px; } }
      `}</style>
      <header className="eb-heading"><strong>Earth Blaze</strong><span className="eb-meta">React · WebGL</span></header>
      <div className="eb-stage">
        <EarthBlaze
          starCount={values.starCount} galaxyBrightness={values.galaxyBrightness}
          surfaceBrightness={values.surfaceBrightness} illumination={values.illumination}
          auroraEnabled={values.auroraEnabled} auroraPreview={values.auroraPreview}
          interactive={values.interactive} auroraColor={values.auroraTint ? values.auroraColor : undefined}
          backgroundColor={values.nebulaTint ? values.backgroundColor : undefined}
          style={{ position:"absolute", inset:0, height:"100%", aspectRatio:"auto" }}
        >
          <div className="eb-overlay">
            <div><span className="eb-eyebrow">Earth observation / 01</span><h1>Europe at dusk</h1><p>Move the light along the horizon. Hold, then release.</p></div>
            <a className="eb-source" href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/" target="_blank" rel="noreferrer">View NASA imagery ↗</a>
          </div>
        </EarthBlaze>
        <details className="eb-panel">
          <summary>Scene controls</summary>
          <div className="eb-controls">
            {ranges.map(({ key, label, max, step }) => <label key={key}><span>{label}<output>{key === "starCount" ? values[key] : `${values[key].toFixed(2)}×`}</output></span><input type="range" aria-label={label} min={0} max={max} step={step} value={values[key]} onChange={event => update(key, Number(event.target.value))} /></label>)}
            <label className="eb-check"><input type="checkbox" checked={values.interactive} onChange={event => update("interactive",event.target.checked)} /> Pointer & keyboard interaction</label>
            <label className="eb-check"><input type="checkbox" checked={values.auroraEnabled} onChange={event => setValues(current => ({ ...current, auroraEnabled:event.target.checked, auroraPreview:false }))} /> Enable aurora</label>
            <button type="button" aria-pressed={values.auroraPreview} onClick={() => setValues(current => ({ ...current, auroraPreview:!current.auroraPreview, auroraEnabled:true }))}>Preview aurora</button>
            <label className="eb-color"><span>Aurora tint</span><input type="color" aria-label="Aurora tint" value={values.auroraColor} onChange={event => setValues(current => ({ ...current, auroraColor:event.target.value, auroraTint:true, auroraEnabled:true, auroraPreview:true }))} /></label>
            <label className="eb-check"><input type="checkbox" checked={values.auroraTint} onChange={event => update("auroraTint",event.target.checked)} /> Apply aurora tint</label>
            <label className="eb-color"><span>Nebula tint</span><input type="color" aria-label="Nebula tint" value={values.backgroundColor} onChange={event => setValues(current => ({ ...current, backgroundColor:event.target.value, nebulaTint:true }))} /></label>
            <label className="eb-check"><input type="checkbox" checked={values.nebulaTint} onChange={event => update("nebulaTint",event.target.checked)} /> Apply nebula tint</label>
            <p className="eb-help">Focus the scene: arrows move the light, Space reveals Earth, Enter holds the aurora. Escape resets. Motion follows your device preference.</p>
            <button type="button" onClick={() => setValues(defaults)}>Reset settings</button>
          </div>
        </details>
      </div>
      <footer className="eb-example">
        <div><strong>An observatory header</strong><p>Place text or links above the scene using children.</p></div>
        <details><summary>Usage example</summary><pre>{`<EarthBlaze style={{ height: 480, aspectRatio: "auto" }}>
  <div style={{ padding: 24 }}>
    <h1>Europe at dusk</h1>
    <a href="/observations" style={{ pointerEvents: "auto" }}>
      Browse observations
    </a>
  </div>
</EarthBlaze>`}</pre></details>
      </footer>
    </section>
  );
}

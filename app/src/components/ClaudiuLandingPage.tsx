"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Sliders,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Flame,
  Orbit,
  Layers,
  Search,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { EarthBlaze } from "./ui/earth-blaze";
import { createDualFlameHero } from "../render/dualFlameHero.js";

interface Mission {
  id: string;
  name: string;
  facility: string;
  finding: string;
  metricLabel: string;
  metricValue: string;
  citation: string;
  ntrsUrl: string;
}

const MISSIONS: Mission[] = [
  {
    id: "flex",
    name: "FLEX & FLEX-2",
    facility: "Combustion Integrated Rack (ISS)",
    finding:
      "Spherical droplet combustion and post-extinction cool-flame sustainment in isolated n-heptane and methanol drops.",
    metricLabel: "BURN RATE CONSTANT",
    metricValue: "K = 0.58 mm²/s",
    citation: "NASA/TM-2014-218388",
    ntrsUrl: "https://ntrs.nasa.gov/citations/20140011463",
  },
  {
    id: "saffire",
    name: "Saffire-I – VI",
    facility: "Cygnus Uncrewed Spacecraft",
    finding:
      "Full-scale solid-fuel flame spread across 0.4 × 1.0 m fabric samples under low-velocity cabin airflow.",
    metricLabel: "SPREAD VELOCITY",
    metricValue: "Vf = 0.44 cm/s",
    citation: "NASA/TM-2016-219154",
    ntrsUrl: "https://ntrs.nasa.gov/citations/20160007766",
  },
  {
    id: "bass",
    name: "BASS-II",
    facility: "Microgravity Science Glovebox (ISS)",
    finding:
      "Opposed- and concurrent-flow flame spread limits, mapping low-flow quenching thresholds for solid fuels.",
    metricLabel: "LIMITING OXYGEN INDEX",
    metricValue: "LOI = 16.5% O₂",
    citation: "NASA PSI-44 Report",
    ntrsUrl: "https://psi.nasa.gov/",
  },
  {
    id: "same",
    name: "SAME",
    facility: "Microgravity Aerosol Experiment (ISS)",
    finding:
      "Smoke particulate agglomeration in zero-buoyancy, showing 10× larger mean diameters that blind standard ionization alarms.",
    metricLabel: "PARTICLE AGGLOMERATION",
    metricValue: "0.85 µm mean",
    citation: "NASA/CR-2009-215802",
    ntrsUrl: "https://ntrs.nasa.gov/citations/20090014045",
  },
];

const CAPABILITIES = [
  {
    title: "Habitat Atmosphere Screening",
    description:
      "Maps material ignition limits across elevated-oxygen exploration atmospheres, including lunar habitats (56 kPa, 32% O₂) and transit cabins.",
  },
  {
    title: "Cool-Flame & Droplet Kinetics",
    description:
      "Derives burning rate constants (K) and low-temperature chemical sustain boundaries from ISS Combustion Integrated Rack n-heptane tests.",
  },
  {
    title: "Large-Scale Solid Spread",
    description:
      "Models upward and concurrent flame propagation across 0.4 × 1.0 m textiles using Saffire Cygnus re-entry burn telemetry.",
  },
  {
    title: "Fine-Mist Suppression",
    description:
      "Tests 15–30 µm water mist nozzles that quench flames via thermal extraction without poisoning closed-loop ECLSS scrubbers.",
  },
  {
    title: "Optical Smoke Discrimination",
    description:
      "Calibrates multi-angle optical detectors to catch 0.85 µm soot agglomerates up to 3.2 minutes prior to open flaming.",
  },
  {
    title: "Terrestrial Fire Gear Transfer",
    description:
      "Transfers composite pressure-vessel overwraps (35% lighter SCBA cylinders) and PBI thermal barriers to municipal fire services.",
  },
];

interface ClaudiuLandingPageProps {
  onEnterDashboard: () => void;
  onNavigatePage: (page: string) => void;
  data?: any;
}

export const ClaudiuLandingPage: React.FC<ClaudiuLandingPageProps> = ({
  onEnterDashboard,
  onNavigatePage,
  data,
}) => {
  // EarthBlaze scene options & Celestial Body
  const [celestialBody, setCelestialBody] = useState<"mars" | "moon" | "earth">("mars");
  const [starCount, setStarCount] = useState<number>(2400);
  const [galaxyBrightness, setGalaxyBrightness] = useState<number>(1.15);
  const [surfaceBrightness, setSurfaceBrightness] = useState<number>(1.25);
  const [illumination, setIllumination] = useState<number>(1.20);
  const [auroraEnabled, setAuroraEnabled] = useState<boolean>(true);
  const [auroraPreview, setAuroraPreview] = useState<boolean>(false);
  const [interactive, setInteractive] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Dual flame canvas refs
  const canvas1gRef = useRef<HTMLCanvasElement | null>(null);
  const canvas0gRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvas1gRef.current && canvas0gRef.current) {
      const cleanup = createDualFlameHero(canvas1gRef.current, canvas0gRef.current);
      return () => {
        if (typeof cleanup === "function") cleanup();
      };
    }
  }, []);

  const scrollToOverview = () => {
    const el = document.getElementById("landing-overview-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.theme) setTheme(e.detail.theme);
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("flamelens-theme", next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: next } }));
  };

  const totals = data?.totals || {
    experiments: 2009,
    papers: 277,
    tb: 13.5,
  };

  return (
    <div
      style={{
        background: "var(--claude-canvas, #faf9f5)",
        color: "var(--claude-ink, #141413)",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
        fontFamily: "var(--font-sans, Inter, sans-serif)",
      }}
    >
      {/* ── TOP NAV BAR (FLOATING EDITORIAL CHROME) ───────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          zIndex: 50,
          background: "rgba(24, 23, 21, 0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Brand */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="#cc785c"
            />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "21px",
              fontWeight: 500,
              letterSpacing: "-0.3px",
              color: "#faf9f5",
            }}
          >
            FlameLens
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(204, 120, 92, 0.2)",
              color: "#e8a55a",
              letterSpacing: "0.06em",
              border: "1px solid rgba(204, 120, 92, 0.3)",
            }}
          >
            NASA PSI
          </span>
        </div>

        {/* Quick Nav Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={scrollToOverview}
            style={{
              fontSize: "12px",
              background: "transparent",
              border: "none",
              color: "#a09d96",
              cursor: "pointer",
              padding: "6px 10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a09d96")}
          >
            Overview
          </button>

          <button
            onClick={() => onNavigatePage("lab3d")}
            style={{
              fontSize: "12px",
              background: "transparent",
              border: "none",
              color: "#a09d96",
              cursor: "pointer",
              padding: "6px 10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a09d96")}
          >
            3D Lab
          </button>

          <button
            onClick={() => onNavigatePage("data")}
            style={{
              fontSize: "12px",
              background: "transparent",
              border: "none",
              color: "#a09d96",
              cursor: "pointer",
              padding: "6px 10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a09d96")}
          >
            Evidence Explorer
          </button>

          <button
            onClick={() => onNavigatePage("optimizer")}
            style={{
              fontSize: "12px",
              background: "transparent",
              border: "none",
              color: "#a09d96",
              cursor: "pointer",
              padding: "6px 10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a09d96")}
          >
            Design Optimizer
          </button>

          <button
            onClick={() => onNavigatePage("comparison")}
            style={{
              fontSize: "12px",
              background: "transparent",
              border: "none",
              color: "#a09d96",
              cursor: "pointer",
              padding: "6px 10px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a09d96")}
          >
            Comparison Studio
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "11.5px",
              fontFamily: "var(--font-mono, monospace)",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#d4d0c8",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle dark/light mode"
          >
            {theme === "dark" ? (
              <>
                <Sun size={13} style={{ color: "#e8a55a" }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={13} style={{ color: "#cc785c" }} />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Scene Controls Toggle */}
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11.5px",
              fontFamily: "var(--font-mono, monospace)",
              padding: "6px 12px",
              borderRadius: "6px",
              background: showControls ? "rgba(204, 120, 92, 0.25)" : "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: showControls ? "#e8a55a" : "#d4d0c8",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Adjust planetary horizon lighting, stars, and terrain"
          >
            <Sliders size={13} />
            <span>Horizon Controls</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onEnterDashboard}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "8px",
              background: "var(--claude-primary, #cc785c)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(204, 120, 92, 0.35)",
              transition: "background 0.14s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#a9583e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#cc785c")}
          >
            <span>Launch Platform</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ── HERO STAGE: EARTH BLAZE WEBGL COMPONENT ──────────────────────── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          overflow: "hidden",
        }}
      >
        {/* Full-bleed EarthBlaze Canvas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        >
          <EarthBlaze
            body={celestialBody}
            starCount={starCount}
            galaxyBrightness={galaxyBrightness}
            surfaceBrightness={surfaceBrightness}
            illumination={illumination}
            auroraEnabled={auroraEnabled}
            auroraPreview={auroraPreview}
            interactive={interactive}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              aspectRatio: "auto",
            }}
          />
        </div>

        <style>{`
          @keyframes orbitalDrift {
            0% { transform: translateY(0px) rotate(-13deg); }
            50% { transform: translateY(-7px) rotate(-11.5deg); }
            100% { transform: translateY(0px) rotate(-13deg); }
          }
        `}</style>

        {/* Orbital Exploration Capsule (NASA Mars Exploration Reference) */}
        <div
          style={{
            position: "absolute",
            right: "38%",
            top: "24%",
            zIndex: 12,
            pointerEvents: "auto",
            cursor: "pointer",
            animation: "orbitalDrift 9s ease-in-out infinite",
            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.85))",
          }}
          title="NASA PSI Exploration Vehicle · Low Martian Orbit · Microgravity Freefall Flight"
        >
          <svg
            width="72"
            height="54"
            viewBox="0 0 100 75"
            fill="none"
          >
            <defs>
              <linearGradient id="capsuleHull" x1="0.85" y1="0.1" x2="0.15" y2="0.9">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#edebe6" />
                <stop offset="65%" stopColor="#8c8880" />
                <stop offset="100%" stopColor="#3d3a37" />
              </linearGradient>
              <linearGradient id="shieldGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#2c2826" />
                <stop offset="100%" stopColor="#141312" />
              </linearGradient>
              <radialGradient id="glintGrad" cx="68%" cy="28%" r="48%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="45%" stopColor="rgba(255,225,195,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Conical Capsule Body */}
            <path
              d="M34 20 L66 20 L82 54 C78 60 22 60 18 54 Z"
              fill="url(#capsuleHull)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.75"
            />

            {/* Base Heat Shield */}
            <ellipse cx="50" cy="54" rx="32" ry="6.5" fill="url(#shieldGrad)" />

            {/* Upper Docking Apex & Optical Sensor */}
            <ellipse cx="50" cy="20" rx="16" ry="3.8" fill="#353331" stroke="#5a5652" strokeWidth="0.6" />
            <ellipse cx="50" cy="18.5" rx="9" ry="2.2" fill="#1b1a19" />
            <circle cx="50" cy="17.8" r="1.4" fill="#5db8a6" opacity="0.85" />

            {/* Solar Grazing Highlight */}
            <ellipse cx="62" cy="28" rx="14" ry="9" fill="url(#glintGrad)" />

            {/* RCS Reaction Control Thruster Pods */}
            <circle cx="30" cy="44" r="2.0" fill="#151413" stroke="#555" strokeWidth="0.5" />
            <circle cx="36" cy="46" r="2.0" fill="#151413" stroke="#555" strokeWidth="0.5" />
            <circle cx="64" cy="46" r="2.0" fill="#151413" stroke="#555" strokeWidth="0.5" />
            <circle cx="70" cy="44" r="2.0" fill="#151413" stroke="#555" strokeWidth="0.5" />

            {/* Thermal Tile Grid Seams */}
            <line x1="50" y1="24" x2="50" y2="49" stroke="rgba(0,0,0,0.3)" strokeWidth="0.65" strokeDasharray="2.5 1.5" />
            <line x1="39" y1="22" x2="33" y2="50" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" strokeDasharray="2.5 1.5" />
            <line x1="61" y1="22" x2="67" y2="50" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" strokeDasharray="2.5 1.5" />
          </svg>
        </div>

        {/* Subtle bottom edge transition */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "80px",
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, transparent, rgba(13,15,20,0.4))",
          }}
        />

        {/* Floating Scene Controls Panel */}
        {showControls && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              right: "32px",
              zIndex: 30,
              width: "280px",
              background: "rgba(24, 23, 21, 0.94)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "10px",
              padding: "16px 18px",
              color: "#faf9f5",
              fontSize: "12px",
              boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                paddingBottom: "8px",
              }}
            >
              <strong style={{ fontSize: "12.5px", letterSpacing: "-0.01em" }}>
                Horizon & Planetary Lighting
              </strong>
              <button
                onClick={() => {
                  setCelestialBody("mars");
                  setIllumination(1.20);
                  setGalaxyBrightness(1.15);
                  setSurfaceBrightness(1.25);
                  setStarCount(2400);
                  setAuroraPreview(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a09d96",
                  fontSize: "10.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <label style={{ display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Sun & Atmospheric Glow</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#cc785c" }}>
                    {illumination.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={illumination}
                  onChange={(e) => setIllumination(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Nebula & Galaxy</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#cc785c" }}>
                    {galaxyBrightness.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={galaxyBrightness}
                  onChange={(e) => setGalaxyBrightness(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Star Density</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#cc785c" }}>
                    {starCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="4500"
                  step="100"
                  value={starCount}
                  onChange={(e) => setStarCount(Number(e.target.value))}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "6px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span>Solar Aurora</span>
                <button
                  type="button"
                  onClick={() => setAuroraPreview(!auroraPreview)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    background: auroraPreview ? "#cc785c" : "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {auroraPreview ? "Aurora Active" : "Trigger Aurora"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Editorial Overlay Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            pointerEvents: "none",
            padding: "120px 48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            minHeight: "100vh",
          }}
        >
          <div style={{ maxWidth: "840px" }}>
            {/* Serif Heading */}
            <h1
              style={{
                fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "clamp(3.4rem, 7.5vw, 6.4rem)",
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: "-1.5px",
                color: "#faf9f5",
                margin: "0 0 20px 0",
                textShadow: "0 2px 24px rgba(0,0,0,0.7)",
              }}
            >
              Understand combustion beyond Earth.
            </h1>

            {/* Subhead Lede */}
            <p
              style={{
                fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)",
                lineHeight: 1.6,
                color: "#d4d0c8",
                maxWidth: "660px",
                margin: "0 0 32px 0",
                textShadow: "0 2px 14px rgba(0,0,0,0.8)",
              }}
            >
              An evidence-grounded research platform synthesizing historical orbital freefall
              experiments from the NASA Physical Sciences Informatics (PSI) repository.
              Explore flammability thresholds, spherical cool-flame kinetics, and active
              learning optimization across exploration atmospheres.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                pointerEvents: "auto",
              }}
            >
              <button
                onClick={onEnterDashboard}
                style={{
                  padding: "14px 32px",
                  borderRadius: "8px",
                  background: "var(--claude-primary, #cc785c)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "9px",
                  boxShadow: "0 4px 20px rgba(204, 120, 92, 0.4)",
                  transition: "background 0.14s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#a9583e")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#cc785c")}
              >
                <span>Enter Research Dashboard</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => onNavigatePage("lab3d")}
                style={{
                  padding: "14px 26px",
                  borderRadius: "8px",
                  background: "rgba(24, 23, 21, 0.75)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#faf9f5",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.14s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cc785c";
                  e.currentTarget.style.color = "#cc785c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "#faf9f5";
                }}
              >
                <Flame size={15} />
                <span>3D Laboratory</span>
              </button>

              <button
                onClick={scrollToOverview}
                style={{
                  padding: "14px 24px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#a09d96",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.14s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#a09d96";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                }}
              >
                <span>Read Overview</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Interactive Hint */}
          <div
            style={{
              marginTop: "48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.5)",
              fontFamily: "var(--font-mono, monospace)",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "16px",
            }}
          >
            <span>
              💡 Interactive Horizon: Drag pointer to steer solar terminator · Valles Marineris & Syrtis Major terrain · Hold Enter for Aurora
            </span>
            <span style={{ color: "#cc785c" }}>
              NASA PSI Mars Exploration Framework
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: RESEARCH OVERVIEW & CORPUS METRICS (KEPT JUST BELOW HEROES) ───── */}
      <section
        id="landing-overview-section"
        style={{
          background: "var(--claude-canvas, #faf9f5)",
          padding: "72px 48px 60px",
          borderBottom: "1px solid var(--claude-hairline, #e6dfd8)",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          {/* Eyebrow & Title */}
          <div style={{ marginBottom: "36px" }}>
            <div
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11.5px",
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: "var(--claude-primary, #cc785c)",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              01 · COMPREHENSIVE RESEARCH OVERVIEW
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                fontWeight: 500,
                letterSpacing: "-0.5px",
                color: "var(--claude-ink, #141413)",
                margin: "0 0 14px 0",
              }}
            >
              The NASA Microgravity Combustion Corpus
            </h2>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--claude-body, #3d3d3a)",
                maxWidth: "760px",
                margin: 0,
              }}
            >
              Synthesizing 20+ years of microgravity combustion flight experiments conducted
              aboard the International Space Station and Cygnus spacecraft. Bridging raw
              PSI flight tables with Bayesian active learning and 3D kinetic simulations.
            </p>
          </div>

          {/* 5 Instrument-Grade Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
              marginBottom: "56px",
            }}
          >
            <div
              style={{
                background: "var(--claude-surface-card, #efe9de)",
                border: "1px solid var(--claude-hairline, #e6dfd8)",
                borderRadius: "8px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Flight Investigations
              </div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-ink, #141413)",
                  margin: "6px 0 2px 0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                24
              </div>
              <div style={{ fontSize: "12px", color: "var(--claude-muted, #6c6a64)" }}>
                FLEX, Saffire, BASS, ACME, SPICE
              </div>
            </div>

            <div
              style={{
                background: "var(--claude-surface-card, #efe9de)",
                border: "1px solid var(--claude-hairline, #e6dfd8)",
                borderRadius: "8px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Indexed Test Runs
              </div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-ink, #141413)",
                  margin: "6px 0 2px 0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                2,009
              </div>
              <div style={{ fontSize: "12px", color: "var(--claude-muted, #6c6a64)" }}>
                Tabular flight test records
              </div>
            </div>

            <div
              style={{
                background: "var(--claude-surface-card, #efe9de)",
                border: "1px solid var(--claude-hairline, #e6dfd8)",
                borderRadius: "8px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                NTRS Technical Reports
              </div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-ink, #141413)",
                  margin: "6px 0 2px 0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                277
              </div>
              <div style={{ fontSize: "12px", color: "var(--claude-muted, #6c6a64)" }}>
                Peer-reviewed research corpus
              </div>
            </div>

            <div
              style={{
                background: "var(--claude-surface-card, #efe9de)",
                border: "1px solid var(--claude-hairline, #e6dfd8)",
                borderRadius: "8px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Total Published Archive
              </div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-primary, #cc785c)",
                  margin: "6px 0 2px 0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                13.5 TB
              </div>
              <div style={{ fontSize: "12px", color: "var(--claude-muted, #6c6a64)" }}>
                High-speed imagery & telemetry
              </div>
            </div>

            <div
              style={{
                background: "var(--claude-surface-card, #efe9de)",
                border: "1px solid var(--claude-hairline, #e6dfd8)",
                borderRadius: "8px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Flight Gravity Level
              </div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-ink, #141413)",
                  margin: "6px 0 2px 0",
                }}
              >
                &lt; 10⁻⁴ g
              </div>
              <div style={{ fontSize: "12px", color: "var(--claude-muted, #6c6a64)" }}>
                Freefall (Grashof Gr ≈ 0)
              </div>
            </div>
          </div>

          {/* ── PHYSICAL PHENOMENON OVERVIEW: DUAL FLAME COMPARISON ──────── */}
          <div
            style={{
              background: "var(--claude-surface-card, #efe9de)",
              border: "1px solid var(--claude-hairline, #e6dfd8)",
              borderRadius: "10px",
              padding: "28px 32px",
              marginBottom: "56px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
                borderBottom: "1px solid var(--claude-hairline, #e6dfd8)",
                paddingBottom: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--claude-primary, #cc785c)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  PHYSICAL REGIME CONTRAST
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: "22px",
                    fontWeight: 500,
                    margin: "4px 0 0 0",
                    color: "var(--claude-ink, #141413)",
                  }}
                >
                  Earth Gravity (1g) vs Microgravity (0g) Combustion
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--claude-muted, #6c6a64)",
                }}
              >
                <span>1g Convection</span>
                <span style={{ color: "var(--claude-primary)" }}>⟷</span>
                <span>0g Diffusion</span>
              </div>
            </div>

            {/* Dual Flame Interactive Viewports */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "24px",
                alignItems: "center",
                background: "#0d0f14",
                borderRadius: "8px",
                padding: "20px",
                border: "1px solid #252830",
              }}
            >
              {/* 1g Earth Pane */}
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "190px", position: "relative" }}>
                  <canvas
                    ref={canvas1gRef}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#e8a55a",
                    }}
                  >
                    EARTH GRAVITY — 1g
                  </div>
                  <div style={{ fontSize: "12px", color: "#d4d0c8", marginTop: "2px" }}>
                    Buoyancy-Driven Upward Convection
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8e8b82",
                      fontFamily: "var(--font-mono)",
                      marginTop: "2px",
                    }}
                  >
                    Elongated thermal plume · Soot-forming yellow flame
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div style={{ width: "1px", height: "50px", background: "#2e323b" }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--claude-primary)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    background: "rgba(204,120,92,0.15)",
                  }}
                >
                  VS
                </span>
                <div style={{ width: "1px", height: "50px", background: "#2e323b" }} />
              </div>

              {/* 0g Microgravity Pane */}
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "190px", position: "relative" }}>
                  <canvas
                    ref={canvas0gRef}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#5db8a6",
                    }}
                  >
                    FREEFALL MICROGRAVITY — 0g
                  </div>
                  <div style={{ fontSize: "12px", color: "#d4d0c8", marginTop: "2px" }}>
                    Diffusion-Dominated Sphericity (Gr ≈ 0)
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8e8b82",
                      fontFamily: "var(--font-mono)",
                      marginTop: "2px",
                    }}
                  >
                    Spherical blue flame shell · Cool flame sustainment
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Disclosure Box (Warm Terracotta Tint & WCAG AAA Contrast) */}
            <div
              style={{
                marginTop: "18px",
                padding: "12px 16px",
                background: "rgba(204, 120, 92, 0.08)",
                border: "1px solid rgba(204, 120, 92, 0.25)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "var(--claude-ink, #141413)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--claude-primary, #cc785c)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: "2px" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div>
                <strong style={{ color: "var(--claude-primary, #cc785c)" }}>Conceptual Comparison ·</strong> Contrasts buoyancy-driven upward
                convection (1g) with spherical diffusion symmetry (0g). Qualitative visualization
                illustrates Grashof number collapse and absence of buoyant drafting in spacecraft
                interiors, not an uncalibrated CFD simulation output.
              </div>
            </div>
          </div>

          {/* ── CORE RESEARCH GAPS GRID (WHY MICROGRAVITY RESEARCH IS HARD) ── */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--claude-primary)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                02 · EMPIRICAL CHALLENGES
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "26px",
                  fontWeight: 500,
                  margin: "4px 0 0 0",
                }}
              >
                Four Fundamental Microgravity Research Gaps
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "var(--claude-surface-card, #efe9de)",
                  border: "1px solid var(--claude-hairline, #e6dfd8)",
                  borderRadius: "8px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--claude-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    <span>FRAGMENTED DATA</span>
                    <span style={{ color: "var(--claude-primary)" }}>GAP-01</span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
                    Inconsistent Formats & Dialects
                  </h4>
                  <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--claude-body)", margin: 0 }}>
                    Experimental tables across 24 investigations used incompatible column names,
                    mixed units (~21.5 vs 20 cm/s), and broken archive URLs that obscured direct comparisons.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--claude-hairline)",
                    fontSize: "12px",
                    color: "var(--claude-primary)",
                    fontWeight: 500,
                  }}
                >
                  ✓ FlameLens unifies full line-by-line provenance
                </div>
              </div>

              <div
                style={{
                  background: "var(--claude-surface-card, #efe9de)",
                  border: "1px solid var(--claude-hairline, #e6dfd8)",
                  borderRadius: "8px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--claude-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    <span>TRAPPED KNOWLEDGE</span>
                    <span style={{ color: "var(--claude-primary)" }}>GAP-02</span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
                    Locked in PDFs and Raw Video
                  </h4>
                  <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--claude-body)", margin: 0 }}>
                    Over 95% of published PSI archive bytes comprise raw camera arrays. Key quantitative conclusions
                    remained trapped in 277 unstructured NTRS reports.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--claude-hairline)",
                    fontSize: "12px",
                    color: "var(--claude-primary)",
                    fontWeight: 500,
                  }}
                >
                  ✓ Grounded vector embeddings + OLAP telemetry
                </div>
              </div>

              <div
                style={{
                  background: "var(--claude-surface-card, #efe9de)",
                  border: "1px solid var(--claude-hairline, #e6dfd8)",
                  borderRadius: "8px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--claude-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    <span>COVERAGE GAPS</span>
                    <span style={{ color: "var(--claude-primary)" }}>GAP-03</span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
                    Sparse Exploration Pressures
                  </h4>
                  <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--claude-body)", margin: 0 }}>
                    Exploration cabin standards propose 0.57 atm (56 kPa) with 34% O₂. In historical FLEX data,
                    fewer than 4 test runs ever measured below 0.65 atm.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--claude-hairline)",
                    fontSize: "12px",
                    color: "var(--claude-primary)",
                    fontWeight: 500,
                  }}
                >
                  ✓ GPR models provide explicit epistemic bounds (±2σ)
                </div>
              </div>

              <div
                style={{
                  background: "var(--claude-surface-card, #efe9de)",
                  border: "1px solid var(--claude-hairline, #e6dfd8)",
                  borderRadius: "8px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--claude-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    <span>TERRESTRIAL PARADOX</span>
                    <span style={{ color: "var(--claude-primary)" }}>GAP-04</span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
                    Certified in 1g, Flown in 0g
                  </h4>
                  <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--claude-body)", margin: 0 }}>
                    NASA-STD-6001 Test 1 screens materials upward on Earth. In orbit, silicone self-extinguished
                    where 1g tests burned completely, while fabrics spread 29 cm in space.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--claude-hairline)",
                    fontSize: "12px",
                    color: "var(--claude-primary)",
                    fontWeight: 500,
                  }}
                >
                  ✓ Direct 1g vs 0g matrix comparison studio
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: NTRS FLIGHT DATASETS LEDGER ─────────────────────── */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--claude-primary)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                03 · FLIGHT DATASETS
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "26px",
                  fontWeight: 500,
                  margin: "4px 0 0 0",
                }}
              >
                Microgravity Combustion Missions Ledger
              </h3>
            </div>

            {/* Desktop Ledger Table */}
            <div className="ntrs-section" style={{ padding: 0 }}>
              <div className="ntrs-ledger-header">
                <div>Mission & Facility</div>
                <div>Primary Finding</div>
                <div>Key Metric</div>
                <div style={{ textAlign: "right" }}>Report ID</div>
              </div>

              <div>
                {MISSIONS.map((mission) => (
                  <a
                    key={mission.id}
                    href={mission.ntrsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ntrs-ledger-row"
                  >
                    <div>
                      <div className="ntrs-mission-name">
                        <span>{mission.name}</span>
                        <ArrowUpRight size={14} className="ntrs-mission-arrow" />
                      </div>
                      <div className="ntrs-mission-facility">{mission.facility}</div>
                    </div>
                    <div className="ntrs-finding">{mission.finding}</div>
                    <div>
                      <div className="ntrs-metric-label">{mission.metricLabel}</div>
                      <div className="ntrs-metric-value">{mission.metricValue}</div>
                    </div>
                    <div>
                      <span className="ntrs-report-link">{mission.citation}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION 4: SPACECRAFT FIRE SAFETY CAPABILITIES ───────────── */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--claude-primary)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                04 · ENGINEERING CAPABILITIES
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "26px",
                  fontWeight: 500,
                  margin: "4px 0 0 0",
                }}
              >
                Spacecraft Fire Safety Applications
              </h3>
            </div>

            <div className="ntrs-capabilities-grid">
              {CAPABILITIES.map((cap, i) => (
                <div key={i} className="ntrs-capability-card">
                  <h4 className="ntrs-capability-title">{cap.title}</h4>
                  <p className="ntrs-capability-desc">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER: INSTRUMENT GRADE DISCLAIMER ───────────────────────────── */}
      <footer
        style={{
          background: "var(--claude-surface-soft, #f5f0e8)",
          borderTop: "1px solid var(--claude-hairline, #e6dfd8)",
          padding: "36px 48px",
          color: "var(--claude-muted, #6c6a64)",
          fontSize: "12px",
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <strong>FlameLens AI</strong> · NASA Space Apps Challenge 2026: Flame in Freefall
            <div style={{ marginTop: "4px" }}>
              Values appear only when printed in authoritative NASA source documents. Findings are reported
              under stated experimental conditions and do not constitute certified flight rules. No NASA endorsement implied.
            </div>
          </div>
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <a
              href="https://psi.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--claude-primary)", textDecoration: "none" }}
            >
              NASA PSI Portal ↗
            </a>
            <a
              href="https://ntrs.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--claude-primary)", textDecoration: "none" }}
            >
              NTRS Repository ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

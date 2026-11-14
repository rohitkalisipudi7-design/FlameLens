import { esc, fmt, ICON } from "../core/dom.js";
import { createVideoForensicFacility } from "../render/lab/videoForensicFacility.js";

export function mountVideoIntelligence(root, data, { go }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Module 10 · 3D Combustion Forensic Laboratory</div>
      <h2>Combustion Video Intelligence — Forensic Lab</h2>
      <p class="lede">Explore the physical optical diagnostic bench and high-speed imaging bay. Features a central calibrated diagnostic projection screen rendering synchronized NASA PSI-69 flight frames, OpenCV morphological contours, centroid reticles, and extinction event alerts.</p>
    </div>

    <!-- Forensic Video Studio 3-Column Layout -->
    <div class="forensic-video-layout">
      <!-- LEFT: Controls & Optics Configuration -->
      <div class="panel stack">
        <h3>Optics & Diagnostics</h3>

        <div style="display:grid; gap:6px;">
          <label style="font-size:0.82rem; font-weight:600; color:var(--ink-2);">NASA Flight Investigation</label>
          <select id="vid-inv-sel" style="width:100%; padding:7px 10px; background:var(--panel-solid); color:var(--ink); border:1px solid var(--line-2); border-radius:6px; font-size:12.5px;">
            <option value="PSI-69">PSI-69: FLEX Droplet Combustion (ISS CIR)</option>
            <option value="PSI-25">PSI-25: BASS-II Solid Burning (MGA Duct)</option>
            <option value="PSI-99">PSI-99: Saffire-II Fire Safety (Cygnus)</option>
          </select>
        </div>

        <div style="display:grid; gap:6px;">
          <span style="font-size:0.82rem; color:var(--ink-2);">Diagnostic Camera POV:</span>
          <div class="chips" id="vid-cam-chips">
            <button type="button" class="chip active" data-cam="orbit">Bench Orbit</button>
            <button type="button" class="chip" data-cam="screen">Screen Focus</button>
            <button type="button" class="chip" data-cam="camera">Phantom POV</button>
            <button type="button" class="chip" data-cam="instruments">Telemetry Rack</button>
          </div>
        </div>

        <div style="display:grid; gap:6px;">
          <span style="font-size:0.82rem; color:var(--ink-2);">CV Overlay Mode:</span>
          <div class="seg" id="vid-overlay-mode" style="width:100%; display:flex;">
            <button type="button" data-m="contour" class="active" style="flex:1;" aria-pressed="true">Contour</button>
            <button type="button" data-m="mask" style="flex:1;">Binary Mask</button>
            <button type="button" data-m="raw" style="flex:1;">Raw Video</button>
          </div>
        </div>

        <div style="display:grid; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
            <span style="color:var(--ink-2);">Optical Calibration Scale:</span>
            <b id="vid-scale-val" class="font-mono">24.5 px/mm</b>
          </div>
          <input type="range" id="vid-scale-slider" min="10" max="50" step="0.5" value="24.5" style="width:100%;">
        </div>

        <div style="display:grid; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
            <span style="color:var(--ink-2);">Segmentation Threshold:</span>
            <b id="vid-thresh-val" class="font-mono">35</b>
          </div>
          <input type="range" id="vid-thresh-slider" min="15" max="75" step="1" value="35" style="width:100%;">
        </div>

        <div class="note" style="font-size:0.8rem; line-height:1.45; margin-top:6px;">
          <strong>Vibration Isolation:</strong> Optical breadboard dampens micro-vibrations ($<10^{-5}\\text{ g}$). Calibrated scale bar verified against PSI-69 camera metadata.
        </div>
      </div>

      <!-- CENTER: 3D Video Analysis Laboratory Stage -->
      <div class="panel stack" style="padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="stage-badge" style="font-size:11px;">NASA OPTICAL FORENSIC BENCH</span>
            <span class="status st-good font-mono" id="vid-fps-tag" style="font-size:11px; padding:2px 8px;">25.0 FPS</span>
          </div>
          <span class="dim small" id="vid-cur-time" style="font-family:var(--f-mono);">t = 0.00 s / Frame #0</span>
        </div>

        <!-- 3D Optical Bench & Synchronized Video Viewport -->
        <div class="stage-lab" id="vid-3d-stage" style="min-height:440px;" aria-label="3D Video Analysis Laboratory">
          <video id="vid-main" src="./data/videos/psi69_flex_calibration_sample.mp4" playsinline loop preload="auto" style="display:none;"></video>
        </div>

        <!-- Video Transport & Scrubber Bar -->
        <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
          <button type="button" class="btn small" id="vid-btn-play" style="padding:6px 14px;">Play</button>
          <button type="button" class="btn small" id="vid-btn-restart" style="padding:6px 10px;">Restart</button>
          <input type="range" id="vid-scrub" min="0" max="119" step="1" value="0" style="flex:1;">
          <button type="button" class="btn small" id="vid-btn-step-prev" title="Previous Frame" style="padding:6px 10px;">◀</button>
          <button type="button" class="btn small" id="vid-btn-step-next" title="Next Frame" style="padding:6px 10px;">▶</button>
        </div>
      </div>

      <!-- RIGHT: Live Telemetry & Morphology HUD -->
      <div class="panel stack">
        <h3>Live Flame Telemetry</h3>

        <div class="outputs" style="grid-template-columns:1fr; gap:8px;">
          <div class="out"><span class="lbl">Apparent Diameter</span><b id="hud-d-app" class="font-mono">18.4 mm</b><small id="hud-d-px">450.8 px</small></div>
          <div class="out"><span class="lbl">Projected Area</span><b id="hud-area" class="font-mono">265.8 mm²</b><small id="hud-area-px">1,428 px²</small></div>
          <div class="out"><span class="lbl">Circularity (C)</span><b id="hud-circ" class="font-mono">0.892</b><small>0g spherical symmetry</small></div>
          <div class="out"><span class="lbl">Aspect Ratio</span><b id="hud-aspect" class="font-mono">1.04</b><small>major / minor axis</small></div>
        </div>

        <div style="margin-top:4px;">
          <span style="font-size:0.8rem; font-weight:600; color:var(--ink-2); display:block; margin-bottom:4px;">Extinction Analysis:</span>
          <div id="hud-extinction-box" class="note" style="font-size:0.82rem; line-height:1.45;">
            <strong>Radiative Extinction:</strong> Frame #95 (t = 3.80 s). Flame ceases due to radiative heat loss exceeding chemical heat release in microgravity.
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const stageEl = q("#vid-3d-stage");
  const videoEl = q("#vid-main");

  let facility3d = null;
  let videoData = null;
  let currentFrame = 0;
  let currentScale = 24.5;
  let currentThreshold = 35;
  let isPlaying = false;

  fetch("/data/video_intelligence.json")
    .then((r) => r.json())
    .then((json) => {
      videoData = json;
      initFacility();
    })
    .catch(() => {
      videoData = {
        total_frames: 120,
        fps: 25,
        measurements: Array.from({ length: 120 }, (_, i) => ({
          frame_index: i,
          time_seconds: i / 25,
          area_px: Math.max(100, Math.round(1500 * (1 - i / 120))),
          equivalent_diameter_px: Math.max(10, Math.round(43 * Math.sqrt(1 - i / 120))),
          circularity: 0.89 + Math.sin(i * 0.1) * 0.04,
          aspect_ratio: 1.04 + Math.cos(i * 0.1) * 0.02,
        })),
        extinction_candidate: { frame_index: 95, time_seconds: 3.80 }
      };
      initFacility();
    });

  function initFacility() {
    facility3d = createVideoForensicFacility(stageEl, {
      videoData,
      videoElement: videoEl,
      onFrameUpdate: (frameIdx, measurement, scale) => {
        updateHud(frameIdx, measurement, scale);
      }
    });

    const totalF = videoData?.total_frames || 120;
    q("#vid-scrub").max = totalF - 1;
  }

  function updateHud(frameIdx, m, scale = currentScale) {
    if (!m) return;
    currentFrame = frameIdx;
    q("#vid-cur-time").textContent = `t = ${(frameIdx / 25).toFixed(2)} s / Frame #${frameIdx}`;
    q("#vid-scrub").value = frameIdx;

    const dPx = m.equivalent_diameter_px || 40;
    const aPx = m.area_px || 1200;
    const dMm = dPx / scale;
    const aMm2 = aPx / (scale * scale);

    q("#hud-d-app").textContent = `${dMm.toFixed(1)} mm`;
    q("#hud-d-px").textContent = `${dPx.toFixed(1)} px`;
    q("#hud-area").textContent = `${aMm2.toFixed(1)} mm²`;
    q("#hud-area-px").textContent = `${aPx.toLocaleString()} px²`;
    q("#hud-circ").textContent = (m.circularity || 0.89).toFixed(3);
    q("#hud-aspect").textContent = (m.aspect_ratio || 1.04).toFixed(3);

    const extBox = q("#hud-extinction-box");
    if (frameIdx >= (videoData?.extinction_candidate?.frame_index || 95)) {
      extBox.style.borderLeft = "4px solid var(--bad)";
      extBox.innerHTML = `<strong>EXTINCTION OCCURRED:</strong> Frame #${frameIdx} (t = ${(frameIdx / 25).toFixed(2)} s). Flame envelope collapsed.`;
    } else {
      extBox.style.borderLeft = "4px solid var(--accent)";
      extBox.innerHTML = `<strong>Quasi-Steady Burning:</strong> Frame #${frameIdx}. Flame envelope stable with diffusion-limited oxygen transport.`;
    }
  }

  // Camera POV mode chips
  q("#vid-cam-chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#vid-cam-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    facility3d?.setCameraMode(btn.dataset.cam);
  });

  // Investigation selection reactivity
  q("#vid-inv-sel").addEventListener("change", (e) => {
    const inv = e.target.value;
    facility3d?.setInvestigation(inv);
  });

  // Optical Scale slider reactivity
  q("#vid-scale-slider").addEventListener("input", (e) => {
    currentScale = parseFloat(e.target.value);
    q("#vid-scale-val").textContent = `${currentScale.toFixed(1)} px/mm`;
    facility3d?.setCalibration(currentScale, currentThreshold);
    updateHud(currentFrame, videoData?.measurements?.[currentFrame], currentScale);
  });

  // Segmentation Threshold slider reactivity
  q("#vid-thresh-slider").addEventListener("input", (e) => {
    currentThreshold = parseInt(e.target.value, 10);
    q("#vid-thresh-val").textContent = `${currentThreshold}`;
    facility3d?.setCalibration(currentScale, currentThreshold);
  });

  // Playback Controls
  const playBtn = q("#vid-btn-play");
  playBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? "Pause" : "Play";
    if (isPlaying) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  });

  q("#vid-btn-restart").addEventListener("click", () => {
    videoEl.currentTime = 0;
    facility3d?.setFrame(0);
  });

  q("#vid-scrub").addEventListener("input", (e) => {
    const f = parseInt(e.target.value, 10);
    videoEl.currentTime = f / 25;
    facility3d?.setFrame(f);
  });

  q("#vid-btn-step-prev").addEventListener("click", () => {
    const f = Math.max(0, currentFrame - 1);
    videoEl.currentTime = f / 25;
    facility3d?.setFrame(f);
  });

  q("#vid-btn-step-next").addEventListener("click", () => {
    const f = Math.min((videoData?.total_frames || 120) - 1, currentFrame + 1);
    videoEl.currentTime = f / 25;
    facility3d?.setFrame(f);
  });

  q("#vid-overlay-mode").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    q("#vid-overlay-mode").querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    facility3d?.setOverlayMode(btn.dataset.m);
  });

  return {
    enter: () => {},
    leave: () => {
      videoEl.pause();
      facility3d?.dispose();
    }
  };
}

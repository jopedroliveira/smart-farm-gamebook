<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
</svelte:head>

<slot />

<style>

:global(:root) {

  /* Original light/outdoor palette */
  --grass:        #6fa84a;
  --grass-dark:   #4f7d31;
  --sky-1:        #a4d4ff;
  --sky-2:        #6ab7f5;
  --soil:         #5a3a1a;
  --bed-wood:     #8a5a2a;
  --bed-wood-dk:  #5a3a1a;
  --panel-cream:  #fff8dc;
  --ink:          #1d1d1d;
  --accent:       #c73030;
  --ink-soft:     #3a3a3a;

  /* Token aliases used by the newer components — mapped to the light look */
  --bg-0:         #1d1d1d;
  --bg-1:         #a4d4ff;
  --bg-2:         #fff8dc;
  --panel:        #fff;
  --panel-warm:   #fff8dc;
  --panel-cool:   #cfeeff;
  --border:       #1d1d1d;
  --border-soft:  rgba(0,0,0,0.12);
  --text:         #1d1d1d;
  --text-soft:    #5a5a5a;
  --text-dim:     #888;
  --accent-2:     #ffd35a;
  --accent-warm:  #c73030;
  --accent-cool:  #4fc3f7;
  --accent-purple:#c8a8ff;

}

:global(*) {
 box-sizing: border-box; 
}

:global(html), :global(body) {

  margin: 0;
  padding: 0;
  background:
    radial-gradient(ellipse at top, #cfeeff 0%, #a4d4ff 35%, #6ab7f5 100%);
  min-height: 100vh;
  font-family: 'VT323', monospace;
  color: var(--ink);
  image-rendering: pixelated;
  overflow-x: auto;

}

:global(body::before) {

  /* tiled grass at bottom */
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(180deg, transparent 0%, transparent 55%, var(--grass) 55%, var(--grass) 100%);
  z-index: 0;
  pointer-events: none;

}

:global(body::after) {

  /* clouds */
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; height: 55%;
  background-image:
    radial-gradient(ellipse 90px 28px at 8% 18%, #fff 0 70%, transparent 71%),
    radial-gradient(ellipse 120px 36px at 75% 12%, #fff 0 70%, transparent 71%),
    radial-gradient(ellipse 70px 22px at 45% 28%, #fff 0 70%, transparent 71%);
  opacity: 0.85;
  z-index: 0;
  pointer-events: none;

}

:global(#app) {

  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 22px 28px 60px;

}

:global(.farm-root) {

  display: flex;
  flex-direction: column;
  gap: 18px;

}

/* ============ TOP BAR ============ */

:global(.topbar) {

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;

}

:global(.topbar-left) {

  display: flex;
  align-items: center;
  gap: 14px;

}

:global(.logo-mark) {

  width: 56px; height: 56px;
  background: #fff8dc;
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--ink), inset 0 0 0 3px rgba(255,255,255,0.5), 0 5px 0 var(--ink);
  display: flex; align-items: center; justify-content: center;
  position: relative;

}
:global(.logo-leaf) {

  width: 30px; height: 30px;
  background:
    radial-gradient(circle at 30% 30%, #7ec850 0 8px, transparent 9px),
    linear-gradient(135deg, #4f7d31, #7ec850);
  border-radius: 0 60% 0 60%;
  transform: rotate(-15deg);
  box-shadow: inset 0 0 0 2px #2d5018;

}

:global(.logo-title) {

  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  color: var(--ink);
  letter-spacing: 1.5px;
  text-shadow: 2px 2px 0 #fff;

}
:global(.logo-sub) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--accent);
  margin-top: 5px;
  letter-spacing: 1px;

}

:global(.topbar-center) {
 display: flex; justify-content: center; 
}

:global(.topbar-right) {

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

}

/* ============ GRID ============ */

:global(.farm-grid) {

  display: grid;
  grid-template-columns: 320px minmax(0,1fr);
  gap: 18px;
  align-items: start;

}

:global(.farm-col-left), :global(.farm-col-center), :global(.farm-col-right) {

  display: flex;
  flex-direction: column;
  gap: 14px;

}

/* ============ MAP ============ */

:global(.playfield) {

  position: relative;
  background: #6fa84a;
  background-image:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 12px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 12px);
  box-shadow: inset 0 0 0 4px #1f3a1a, inset 0 0 0 7px #4f7d31;

}

:global(.playfield-grass) {

  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 8% 14%,  #5a8d3a 0 4px, transparent 5px),
    radial-gradient(circle at 32% 8%,  #88c068 0 3px, transparent 4px),
    radial-gradient(circle at 60% 20%, #5a8d3a 0 4px, transparent 5px),
    radial-gradient(circle at 88% 14%, #88c068 0 3px, transparent 4px),
    radial-gradient(circle at 12% 80%, #5a8d3a 0 4px, transparent 5px),
    radial-gradient(circle at 78% 92%, #88c068 0 3px, transparent 4px),
    radial-gradient(circle at 50% 88%, #5a8d3a 0 4px, transparent 5px);
  opacity: 0.85;

}

/* Crushed-gravel path between raised beds */
:global(.corridor-strip) {

  position: absolute;
  background-color: #e0d9c8;
  background-image:
    /* small pebbles — lighter mix */
    radial-gradient(circle at 12% 18%, #8a8278 0 1.4px, transparent 1.7px),
    radial-gradient(circle at 30% 70%, #ffffff 0 2.2px, transparent 2.5px),
    radial-gradient(circle at 47% 30%, #b3a895 0 1.8px, transparent 2.1px),
    radial-gradient(circle at 62% 80%, #9c9286 0 1.5px, transparent 1.8px),
    radial-gradient(circle at 80% 22%, #f0e8d4 0 2px,   transparent 2.3px),
    radial-gradient(circle at 92% 60%, #c1b6a2 0 1.6px, transparent 1.9px),
    radial-gradient(circle at 18% 52%, #a89e8c 0 1.7px, transparent 2px),
    radial-gradient(circle at 38% 92%, #f6efdc 0 1.5px, transparent 1.8px),
    radial-gradient(circle at 70% 8%,  #7d7568 0 1.3px, transparent 1.6px),
    /* base mottling so it doesn't look flat */
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35) 0 6px, transparent 7px),
    radial-gradient(circle at 75% 75%, rgba(0,0,0,0.07) 0 7px, transparent 8px),
    linear-gradient(180deg, #ebe3d0 0%, #d4cbb6 100%);
  background-size:
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    24px 24px,
    36px 36px,
    36px 36px,
    100% 100%;
  box-shadow:
    inset 0 0 0 2px rgba(120, 105, 80, 0.4),
    inset 0 -3px 0 rgba(0,0,0,0.08);
  z-index: 1;

}
:global(.corridor-strip.vert) {

  /* same texture works in both orientations */
  background-image:
    radial-gradient(circle at 12% 18%, #8a8278 0 1.4px, transparent 1.7px),
    radial-gradient(circle at 30% 70%, #ffffff 0 2.2px, transparent 2.5px),
    radial-gradient(circle at 47% 30%, #b3a895 0 1.8px, transparent 2.1px),
    radial-gradient(circle at 62% 80%, #9c9286 0 1.5px, transparent 1.8px),
    radial-gradient(circle at 80% 22%, #f0e8d4 0 2px,   transparent 2.3px),
    radial-gradient(circle at 92% 60%, #c1b6a2 0 1.6px, transparent 1.9px),
    radial-gradient(circle at 18% 52%, #a89e8c 0 1.7px, transparent 2px),
    radial-gradient(circle at 38% 92%, #f6efdc 0 1.5px, transparent 1.8px),
    radial-gradient(circle at 70% 8%,  #7d7568 0 1.3px, transparent 1.6px),
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35) 0 6px, transparent 7px),
    radial-gradient(circle at 75% 75%, rgba(0,0,0,0.07) 0 7px, transparent 8px),
    linear-gradient(90deg, #ebe3d0 0%, #d4cbb6 100%);

}

/* Wooden fence */
:global(.fence) {

  z-index: 4;
  pointer-events: none;
  background: #5a3a1a;
  box-shadow:
    inset 0 0 0 1px #3a2410,
    0 0 0 1px rgba(0,0,0,0.2);
  border-radius: 1px;

}
:global(.fence-h) {

  background-image: repeating-linear-gradient(90deg, #6a4a2a 0 8px, #4a2a14 8px 10px);

}
:global(.fence-v) {

  background-image: repeating-linear-gradient(0deg, #6a4a2a 0 8px, #4a2a14 8px 10px);

}

/* Weed garden (large walkable region east of cluster) */
:global(.weed-garden) {

  background:
    repeating-linear-gradient(45deg, #6fa84a 0 14px, #5a8d3a 14px 28px);
  box-shadow: inset 0 0 0 3px #4f7d31;
  cursor: pointer;
  border-radius: 0 6px 6px 0;
  transition: filter 120ms;

}
:global(.weed-garden:hover) {
 filter: brightness(1.05); 
}
:global(.weed-garden-selected) {

  box-shadow: inset 0 0 0 3px var(--accent), 0 0 0 3px #ffe16a;

}
:global(.weed-garden-highlighted) {

  animation: bedHighlight 0.8s steps(2) infinite;

}
:global(.weed-garden-label) {

  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  background: #fff;
  color: var(--ink);
  padding: 6px 10px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  z-index: 5;
  letter-spacing: 1px;
  white-space: nowrap;
  pointer-events: none;

}

/* Horizontal dirt corridor (legacy, kept for compatibility) */
:global(.corridor) {

  position: absolute;
  left: 0; right: 0;
  display: flex;
  gap: 0;
  pointer-events: none;
  z-index: 1;

}
:global(.corridor-tile) {

  flex: 1;
  height: 100%;
  background: #b9b3a4;
  background-image:
    radial-gradient(circle at 30% 30%, #6e6a60 0 1.6px, transparent 2px),
    radial-gradient(circle at 70% 70%, #d6cfba 0 1.6px, transparent 2px),
    radial-gradient(circle at 50% 50%, #8b8174 0 1.4px, transparent 1.8px);
  background-size: 16px 16px, 16px 16px, 14px 14px;
  box-shadow: inset 0 0 0 1px rgba(80, 70, 55, 0.35), inset 0 -3px 0 rgba(0,0,0,0.12);

}
:global(.corridor-tile:nth-child(odd)) {
 background-color: #a89f8e; 
}

/* Vertical connector — same gravel look */
:global(.vert-path) {

  position: absolute;
  width: 32px;
  background-color: #b9b3a4;
  background-image:
    radial-gradient(circle at 30% 30%, #6e6a60 0 1.6px, transparent 2px),
    radial-gradient(circle at 70% 70%, #d6cfba 0 1.6px, transparent 2px),
    radial-gradient(circle at 50% 50%, #8b8174 0 1.4px, transparent 1.8px);
  background-size: 16px 16px, 16px 16px, 14px 14px;
  box-shadow: inset 0 0 0 1px rgba(80, 70, 55, 0.4), inset -3px 0 0 rgba(0,0,0,0.12);
  z-index: 1;

}

/* Pre-area cells (absolute positioned) */
:global(.prearea-cell) {

  border-radius: 6px;
  padding: 8px;
  box-shadow: inset 0 0 0 3px #1f3a1a, inset 0 -4px 0 rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 2;
  overflow: hidden;
  transition: transform 100ms;

}
:global(.prearea-cell:hover) {
 transform: translateY(-2px); 
}
:global(.prearea-tiles) {

  display: flex;
  flex-wrap: wrap;
  gap: 4px;

}
:global(.prearea-selected) {

  box-shadow: inset 0 0 0 3px var(--accent), inset 0 -4px 0 rgba(0,0,0,0.15), 0 0 0 3px #ffe16a;

}
:global(.prearea-highlighted) {

  animation: bedHighlight 0.8s steps(2) infinite;

}
:global(.prearea-label) {

  position: absolute;
  bottom: 6px; left: 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  background: #fff;
  padding: 4px 6px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink);
  z-index: 3;

}

:global(.map-hint) {

  margin-top: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #1f3a1a;
  text-align: center;
  letter-spacing: 0.5px;

}

/* ============ PLAYER ============ */

:global(.player) {

  will-change: transform;

}
:global(.player-shadow) {

  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  width: 26px;
  height: 6px;
  background: rgba(0,0,0,0.35);
  border-radius: 50%;
  filter: blur(1px);
  z-index: -1;

}

/* ============ ACTION EFFECTS ============ */

:global(.action-effect) {

  position: absolute;
  z-index: 30;
  pointer-events: none;

}
:global(.action-popup) {

  position: absolute;
  left: 0; top: -10px;
  transform: translate(-50%, -100%);
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  background: #fff;
  padding: 6px 10px;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  white-space: nowrap;
  animation: popupFloat 0.9s ease-out forwards;
  letter-spacing: 0.5px;

}
@keyframes -global-popupFloat {

  0%   { transform: translate(-50%, -80%); opacity: 0; }
  20%  { transform: translate(-50%, -100%); opacity: 1; }
  80%  { transform: translate(-50%, -120%); opacity: 1; }
  100% { transform: translate(-50%, -160%); opacity: 0; }

}
:global(.action-particle) {

  position: absolute;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  transform: translate(-50%, -50%);
  animation: particleFly 0.8s ease-out forwards;

}
@keyframes -global-particleFly {

  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.6); opacity: 0; }

}

:global(.bed) {

  cursor: pointer;
  transition: transform 120ms ease;
  z-index: 5;

}
:global(.bed:hover) {
 transform: translateY(-2px); 
}
:global(.bed-selected) {

  outline: 4px solid #ffe16a;
  outline-offset: 4px;
  box-shadow: 0 0 0 4px var(--accent);

}

:global(.bed-frame) {

  position: absolute; inset: 0;
  background: linear-gradient(180deg, var(--bed-wood) 0%, var(--bed-wood-dk) 100%);
  box-shadow:
    inset 0 0 0 3px #3a2410,
    inset 0 -6px 0 rgba(0,0,0,0.25),
    0 5px 0 #3a2410;
  border-radius: 4px;
  z-index: 0;

}
:global(.bed-soil) {

  position: absolute;
  inset: 8px 8px 12px 8px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 2px #3a2410, inset 0 4px 0 rgba(0,0,0,0.2);
  z-index: 1;
  overflow: hidden;

}
:global(.bed-tiles) {

  display: grid;
  grid-template-rows: 1fr 1fr;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-items: center;
  padding: 4px 6px;

}
:global(.bed-tile) {

  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

}
:global(.weeds-overlay) {

  position: absolute;
  inset: 0;
  pointer-events: none;

}

:global(.bed-status) {

  position: absolute;
  top: -12px;
  left: 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 5px 6px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
  z-index: 6;
  letter-spacing: 0.3px;
  white-space: nowrap;
  max-width: calc(100% - 12px);
  overflow: hidden;

}
:global(.bed-microbar) {

  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 6px;
  background: #1d1d1d;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px #000;
  overflow: hidden;
  z-index: 3;

}
:global(.bed-microbar-fill) {

  height: 100%;
  transition: width 250ms steps(8);

}
:global(.bed-dims) {

  position: absolute;
  bottom: 10px;
  right: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #fff;
  background: rgba(0,0,0,0.6);
  padding: 3px 4px;
  border-radius: 2px;
  z-index: 6;
  white-space: nowrap;

}

:global(.bed-ready) {

  animation: bedReady 1.2s steps(2) infinite;

}
@keyframes -global-bedReady {

  0%, 50% { filter: brightness(1); }
  50.01%, 100% { filter: brightness(1.15); }

}

:global(.bed-ready-sparkle) {

  position: absolute;
  top: -22px;
  right: -10px;
  width: 28px; height: 28px;
  background: #ffe16a;
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--ink), 0 4px 0 var(--ink);
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  z-index: 4;
  animation: sparkle 0.8s steps(2) infinite;
  cursor: pointer;
  transition: transform 0.1s;

}
:global(.bed-ready-sparkle:hover) {
 transform: scale(1.15); 
}
:global(.bed-ready-sparkle:active) {
 transform: scale(0.95); 
}

/* ============ HARVEST READY MODAL ============ */

:global(.harvest-modal) {
 width: min(560px, 100%); 
}
:global(.harvest-intro) {

  font-family: 'VT323', monospace;
  font-size: 18px;
  line-height: 1.35;
  background: #fff8dc;
  padding: 10px 12px;
  border-radius: 4px;
  margin-bottom: 14px;
  color: var(--ink);
  box-shadow: 0 0 0 2px var(--ink);

}
:global(.harvest-list) {

  display: flex;
  flex-direction: column;
  gap: 10px;

}
:global(.harvest-row) {

  background: #fff;
  padding: 8px 10px;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);

}
:global(.harvest-row-head) {

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

}
:global(.harvest-row-name) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);

}
:global(.harvest-emoji) {
 font-size: 16px; 
}
:global(.harvest-row-count) {

  background: var(--ink);
  color: #fff;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 9px;
  margin-left: 4px;

}
:global(.harvest-row-stage) {

  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  padding: 4px 7px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink);
  color: var(--ink);
  letter-spacing: 0.5px;
  white-space: nowrap;

}
:global(.harvest-row-bar) {

  height: 8px;
  background: #2e2e2e;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--ink);
  overflow: hidden;
  margin-bottom: 4px;

}
:global(.harvest-row-bar-fill) {

  height: 100%;
  transition: width 0.2s;

}
:global(.harvest-row-meta) {

  font-family: 'VT323', monospace;
  font-size: 14px;
  color: var(--text-soft);

}
:global(.harvest-actions) {

  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: center;

}
:global(.harvest-go-btn), :global(.harvest-cancel-btn) {

  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  padding: 10px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.5px;

}
:global(.harvest-go-btn) {

  background: #ffe16a;
  color: var(--ink);
  box-shadow: 0 0 0 3px var(--ink), 0 4px 0 var(--ink);

}
:global(.harvest-go-btn:hover) {
 transform: translateY(-1px); 
}
:global(.harvest-go-btn:active) {
 transform: translateY(2px); box-shadow: 0 0 0 3px var(--ink); 
}
:global(.harvest-cancel-btn) {

  background: #fff;
  color: var(--ink);
  box-shadow: 0 0 0 3px var(--ink), 0 4px 0 var(--ink);

}
:global(.harvest-cancel-btn:hover) {
 transform: translateY(-1px); 
}
:global(.harvest-cancel-btn:active) {
 transform: translateY(2px); box-shadow: 0 0 0 3px var(--ink); 
}
@keyframes -global-sparkle {

  0%, 50% { transform: scale(1); }
  50.01%, 100% { transform: scale(1.15); }

}

:global(.flash-popup) {

  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  padding: 14px 22px;
  border-radius: 6px;
  border: 4px solid;
  box-shadow: 0 6px 0 var(--ink);
  z-index: 40;
  animation: flashIn 1.3s steps(4);
  pointer-events: none;
  letter-spacing: 1px;

}
@keyframes -global-flashIn {

  0%   { transform: translate(-50%, -30%); opacity: 0; }
  20%  { transform: translate(-50%, -50%); opacity: 1; }
  80%  { transform: translate(-50%, -50%); opacity: 1; }
  100% { transform: translate(-50%, -70%); opacity: 0; }

}

/* ============ HOTBAR ============ */

:global(.hotbar) {

  display: grid;
  grid-template-columns: auto 1px 1fr;
  gap: 14px;
  align-items: center;

}
:global(.hotbar-tools) {

  display: flex;
  gap: 10px;

}
:global(.hotbar-slot) {

  width: 78px;
  height: 90px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 4px 0 var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 120ms;

}
:global(.hotbar-slot:hover) {
 transform: translateY(-2px); 
}
:global(.hotbar-slot-active) {

  background: #ffe16a;
  box-shadow: 0 0 0 3px var(--accent), inset 0 0 0 2px rgba(255,255,255,0.6), 0 4px 0 var(--accent);

}
:global(.hotbar-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  letter-spacing: 0.5px;

}
:global(.hotbar-divider) {

  width: 3px;
  height: 70px;
  background: var(--ink);

}
:global(.hotbar-seeds) {

  display: flex;
  flex-direction: column;
  gap: 6px;

}
:global(.hotbar-seedlabel) {

  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: var(--ink);

}
:global(.hotbar-seedslist) {

  display: flex;
  flex-wrap: wrap;
  gap: 8px;

}
:global(.seed-chip) {

  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  cursor: pointer;

}
:global(.seed-chip-active) {

  background: #ffe16a;
  box-shadow: 0 0 0 2px var(--accent), 0 3px 0 var(--accent);

}
:global(.seed-chip-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;

}
:global(.seed-chip-count) {

  font-family: 'VT323', monospace;
  font-size: 20px;
  color: #3a3a3a;
  font-weight: bold;

}

/* ============ BED DETAILS ============ */

:global(.bed-detail-portrait) {

  display: flex;
  gap: 12px;
  margin: 14px 0;
  align-items: center;

}
:global(.portrait-frame) {

  width: 110px;
  height: 110px;
  background: #cfeeff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 6px #fff, 0 0 0 1px var(--ink);
  background-image:
    linear-gradient(180deg, #cfeeff 0%, #cfeeff 60%, #86c46b 60%, #86c46b 100%);

}
:global(.portrait-meta) {

  flex: 1;

}
:global(.portrait-name) {

  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  margin-bottom: 10px;

}
:global(.portrait-stage) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--text-soft);
  margin-bottom: 10px;

}
:global(.portrait-status) {

  display: inline-block;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  padding: 5px 8px;
  background: #fff;
  box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
  border-radius: 2px;
  letter-spacing: 0.5px;

}
:global(.status-ready) {
 background: #ffe16a; color: var(--accent); 
}
:global(.status-thirsty) {
 background: var(--accent-cool); color: var(--bg-0); 
}
:global(.status-weedy) {
 background: #a4d96b; color: var(--bg-0); 
}
:global(.status-pests) {
 background: var(--accent-warm); color: var(--ink); 
}
:global(.status-thriving) {
 background: #5cd96b; color: var(--bg-0); 
}
:global(.status-growing) {
 background: #fff; color: var(--text-soft); 
}

:global(.bed-detail-bars) {

  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;

}
:global(.bed-detail-actions) {

  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  flex-wrap: wrap;

}
:global(.bed-detail-body) {

  margin-top: 10px;

}

/* ============ QUESTS / LOG ============ */

:global(.quests-list) {

  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;

}
:global(.quest) {

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);

}
:global(.quest-done) {

  opacity: 0.55;

}
:global(.quest-check) {

  width: 18px; height: 18px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: var(--ink);

}
:global(.quest-text) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  letter-spacing: 0.3px;
  margin-bottom: 5px;
  line-height: 1.4;
  color: var(--ink);

}
:global(.quest-meta) {

  font-family: 'VT323', monospace;
  font-size: 18px;
  color: #3a3a3a;

}

:global(.logbody) {

  max-height: 200px;
  overflow-y: auto;
  font-family: 'VT323', monospace;
  font-size: 18px;
  line-height: 1.35;
  word-break: break-word;

}
:global(.logbody::-webkit-scrollbar) {
 width: 8px; 
}
:global(.logbody::-webkit-scrollbar-thumb) {
 background: #a4f96b; border-radius: 0; 
}

:global(.log-entry) {

  color: #c4ff8b;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(196, 255, 139, 0.2);
  display: block;
  line-height: 1.3;
  overflow-wrap: anywhere;

}
:global(.log-entry:last-child) {
 border-bottom: none; 
}
:global(.log-time) {

  color: #8acaff;

}

/* ============ BED DETAILS — permaculture log ============ */

:global(.bed-section-title) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin: 12px 0 6px;
  border-bottom: 2px dashed var(--ink);
  padding-bottom: 4px;

}

:global(.bed-dates) {

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 10px 0 6px;

}
:global(.bed-date-chip) {

  background: #fff8dc;
  border-radius: 3px;
  padding: 6px 7px;
  box-shadow: 0 0 0 2px var(--ink);
  text-align: center;

}
:global(.bed-date-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin-bottom: 3px;

}
:global(.bed-date-val) {

  font-family: 'VT323', monospace;
  font-size: 16px;
  color: var(--ink);
  font-weight: bold;
  line-height: 1.1;

}
:global(.bed-date-sub) {

  font-family: 'VT323', monospace;
  font-size: 14px;
  color: var(--text-soft);
  margin-top: 2px;
  line-height: 1.1;

}

:global(.cultures-list) {

  display: flex;
  flex-direction: column;
  gap: 4px;

}
:global(.culture-row) {

  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  background: #fff8dc;
  padding: 6px 8px;
  border-radius: 0 3px 3px 0;
  align-items: start;

}
:global(.culture-sprite) {

  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;

}
:global(.culture-name) {

  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: var(--ink);
  letter-spacing: 0.2px;
  margin-bottom: 2px;

}
:global(.culture-count) {

  background: var(--ink);
  color: #fff;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 8px;

}
:global(.culture-family) {

  font-family: 'VT323', monospace;
  font-size: 14px;
  color: var(--text-soft);
  font-style: italic;
  line-height: 1.2;

}
:global(.culture-fn) {

  font-family: 'VT323', monospace;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.25;
  margin-top: 1px;

}

:global(.bed-note-text) {

  font-family: 'VT323', monospace;
  font-size: 17px;
  line-height: 1.3;
  color: var(--ink);
  background: #fff8dc;
  padding: 8px 10px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.15);

}
:global(.bed-note-warn) {

  background: #3a2218;
  box-shadow: 0 0 0 2px #c73030;

}
:global(.bed-note-next) {

  background: #1a3a1a;
  box-shadow: 0 0 0 2px #4f7d31;

}

:global(.bed-history) {

  display: flex;
  flex-direction: column;
  gap: 4px;

}
:global(.history-row) {

  background: #fff8dc;
  padding: 6px 8px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.15);

}
:global(.history-season) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: var(--accent);
  margin-bottom: 3px;

}
:global(.history-plants) {

  font-family: 'VT323', monospace;
  font-size: 16px;
  color: var(--ink);
  line-height: 1.2;

}
:global(.history-notes) {

  font-family: 'VT323', monospace;
  font-size: 14px;
  color: var(--text-soft);
  font-style: italic;
  margin-top: 2px;
  line-height: 1.2;

}

/* Status pill localized labels */
:global(.status-colheita) {
 background: #ffe16a; color: var(--accent); 
}
:global(.status-sede) {
 background: var(--accent-cool); color: var(--bg-0); 
}
:global(.status-ervas) {
 background: #a4d96b; color: var(--bg-0); 
}
:global(.status-pragas) {
 background: var(--accent-warm); color: var(--ink); 
}
:global(.status-prspera) {
 background: #5cd96b; color: var(--bg-0); 
}
:global(.status-crescer) {
 background: #fff;     color: var(--text-soft); 
}
/* Notion estados */
:global(.status-plantado) {
 background: #5cd96b; color: var(--bg-0); 
}
:global(.status-acolher) {
 background: #ffe16a; color: var(--accent); 
}
:global(.status-terminado) {
 background: #4a3a3a; color: var(--text-soft); 
}
:global(.status-emrepouso) {
 background: #d4d4d4; color: var(--text-soft); 
}
:global(.status-planeado) {
 background: var(--accent-purple); color: var(--bg-0); 
}

/* ============ HORTIDEX BADGE (knowledge base trigger) ============ */

:global(.hortidex-badge) {

  position: relative;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
  padding: 4px 12px 4px 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--ink);
  transition: transform 100ms;

}
:global(.hortidex-badge:hover) {
 transform: translateY(-1px); 
}
:global(.hortidex-badge:active) {
 transform: translateY(1px); box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6); 
}

:global(.hortidex-badge-icon) {

  width: 36px;
  height: 36px;
  background: linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

}
/* Pixel book sprite */
:global(.hortidex-book) {

  width: 20px;
  height: 22px;
  background:
    /* spine + cover */
    linear-gradient(90deg, #5a3a1a 0 3px, #8a5a2a 3px 20px);
  box-shadow:
    inset 0 0 0 2px var(--ink),
    /* pages */
    0 0 0 0 transparent;
  position: relative;

}
:global(.hortidex-book::before) {

  /* leaf bookmark */
  content: '';
  position: absolute;
  top: -2px;
  right: 4px;
  width: 6px;
  height: 12px;
  background: var(--grass-dark, #4f7d31);
  box-shadow: inset 0 0 0 1px #2d5018;
  border-radius: 0 0 50% 50%;

}
:global(.hortidex-book::after) {

  /* small "page lines" on the cover */
  content: '';
  position: absolute;
  left: 6px;
  top: 8px;
  width: 10px;
  height: 8px;
  background:
    linear-gradient(180deg, rgba(255,225,106,0.85) 0 2px, transparent 2px 4px,
                            rgba(255,225,106,0.85) 4px 6px, transparent 6px 8px);

}
:global(.hortidex-badge-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--ink);
  letter-spacing: 1px;

}

@media (max-width: 900px) {

  :global(.hortidex-badge-label) {
 display: none; 
}
  :global(.hortidex-badge) {
 padding: 4px; 
}

}

/* ============ SAGE BADGE (top bar trigger) ============ */

:global(.sage-badge) {

  position: relative;
  background: #fff;
  border: none;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--ink);
  transition: transform 100ms;

}
:global(.sage-badge:hover) {
 transform: translateY(-1px); 
}
:global(.sage-badge:active) {
 transform: translateY(1px); box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6); 
}
:global(.sage-badge-portrait) {

  width: 36px;
  height: 36px;
  background: linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px var(--ink);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  padding-bottom: 1px;

}
:global(.sage-badge-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--ink);
  letter-spacing: 1px;

}

/* sage modal — make body padding scrollable nicely */
:global(.sage-modal) {
 width: min(640px, 100%); 
}
:global(.sage-modal .info-modal-body) {
 padding: 18px; 
}
/* hide PixelPanel chrome around the inner SageAssistant inside the modal */
:global(.sage-modal .info-modal-body > div) {

  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;

}

/* ============ INTERACTION MENU (Pokémon-style) ============ */

:global(.interaction-menu-wrap) {

  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
  align-items: stretch;
  pointer-events: none;
  animation: menuPop 180ms steps(3) both;

}
@keyframes -global-menuPop {

  0%   { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0);    opacity: 1; }

}

:global(.interaction-target), :global(.interaction-menu) {

  pointer-events: auto;
  background: #fdfdfd;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow:
    0 0 0 4px var(--ink),
    inset 0 0 0 2px rgba(255,255,255,0.6),
    0 5px 0 var(--ink);
  font-family: 'Press Start 2P', monospace;

}

:global(.interaction-target) {

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;

}
:global(.interaction-target-label) {

  font-size: 13px;
  color: var(--accent);
  letter-spacing: 1px;

}
:global(.interaction-target-sub) {

  font-family: 'VT323', monospace;
  font-size: 22px;
  color: var(--ink);
  line-height: 1.1;

}

:global(.interaction-menu) {

  display: flex;
  flex-direction: column;
  gap: 8px;

}
:global(.interaction-menu-grid) {

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 28px;

}
:global(.interaction-menu-list) {

  /* single column when listing cultures to harvest */
  grid-template-columns: 1fr;
  gap: 3px 0;
  max-height: 200px;
  overflow-y: auto;

}
:global(.interaction-count) {

  background: var(--ink);
  color: #fff;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 9px;
  margin-left: 6px;

}
:global(.interaction-family) {

  font-family: 'VT323', monospace;
  font-size: 15px;
  color: var(--text-soft);
  font-style: italic;
  margin-left: 6px;

}
:global(.interaction-item) {

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: var(--ink);
  letter-spacing: 0.5px;
  border-radius: 2px;
  white-space: nowrap;

}
:global(.interaction-item-active) {

  background: #ffe16a;
  box-shadow: inset 0 0 0 2px var(--accent);

}
:global(.interaction-item-disabled) {

  opacity: 0.35;
  cursor: not-allowed;

}
:global(.interaction-cursor) {

  width: 14px;
  display: inline-block;
  text-align: center;
  color: var(--accent);
  font-size: 12px;

}
:global(.interaction-label) {
 flex: 0 0 auto; 
}
:global(.interaction-hint) {

  font-family: 'VT323', monospace;
  font-size: 14px;
  color: var(--text-soft);
  margin-left: 4px;

}
:global(.interaction-hint-bar) {

  font-family: 'VT323', monospace;
  font-size: 15px;
  color: var(--text-soft);
  text-align: center;
  padding-top: 4px;
  border-top: 2px dashed rgba(0,0,0,0.18);

}

/* ============ BED INFO MODAL ============ */

:global(.info-modal-backdrop) {

  position: fixed;
  inset: 0;
  background: rgba(10, 18, 28, 0.72);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

}
:global(.info-modal) {

  width: min(720px, 100%);
  max-height: 90vh;
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 0 0 5px var(--ink),
    inset 0 0 0 2px rgba(255,255,255,0.6),
    0 10px 0 var(--ink);
  display: flex;
  flex-direction: column;
  overflow: hidden;

}
:global(.info-modal-bar) {

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #cfeeff;
  border-bottom: 3px solid var(--ink);
  font-family: 'Press Start 2P', monospace;

}
:global(.info-modal-title) {

  font-size: 13px;
  color: var(--ink);
  letter-spacing: 1px;

}
:global(.info-modal-close) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  background: #ffe16a;
  color: var(--ink);
  border: none;
  padding: 7px 10px;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  letter-spacing: 0.5px;

}
:global(.info-modal-close:hover) {
 transform: translateY(-1px); 
}
:global(.info-modal-close:active) {
 transform: translateY(1px); box-shadow: 0 0 0 2px var(--ink); 
}
:global(.info-modal-body) {

  overflow-y: auto;
  padding: 16px;

}
:global(.info-modal-body > div) {
 /* PixelPanel inside */
  box-shadow: none;

}

/* ============ MODE TOGGLE (plantas / sensores) ============ */

:global(.mode-toggle) {

  display: inline-flex;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--ink);
  cursor: pointer;
  overflow: hidden;

}
:global(.mode-tab) {

  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: var(--ink);
  letter-spacing: 0.5px;
  transition: background 0.1s;

}
:global(.mode-tab + .mode-tab) {
 border-left: 2px solid var(--ink); 
}
:global(.mode-tab span) {
 font-size: 14px; 
}
:global(.mode-tab-on) {

  background: #ffe16a;
  color: var(--ink);

}

/* ============ BED MONITOR (sensores) ============ */

:global(.bed-monitor) {

  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  height: 100%;
  width: 100%;
  padding: 3px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-family: 'Press Start 2P', monospace;

}
:global(.bed-monitor-cell) {

  background: rgba(0,0,0,0.35);
  border-radius: 2px;
  padding: 3px 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
  min-width: 0;
  overflow: hidden;

}
:global(.bed-monitor-label) {

  font-size: 7px;
  color: #c4ff8b;
  letter-spacing: 0.3px;
  margin-bottom: 1px;
  white-space: nowrap;

}
:global(.bed-monitor-val) {

  font-family: 'VT323', monospace;
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: baseline;
  gap: 2px;

}
:global(.bed-monitor-pct) {

  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-left: 1px;

}
:global(.bed-monitor-sub) {

  font-family: 'VT323', monospace;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-left: 4px;

}

/* ============ RESPONSIVE ============ */

/* Tablet: stack the side column under the map */
@media (max-width: 1199px) {

  :global(#app) {
 padding: 14px 16px 60px; 
}
  :global(.farm-grid) {

    grid-template-columns: 1fr;
    gap: 14px;
  
}
  :global(.farm-col-left) {

    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  
}
  :global(.farm-col-left > *) {

    flex: 1 1 calc(50% - 6px);
    min-width: 280px;
  
}
  :global(.topbar) {

    grid-template-columns: 1fr 1fr;
    gap: 10px;
  
}
  :global(.topbar-center) {

    grid-column: 1 / -1;
    order: 3;
    justify-content: flex-start;
  
}
  :global(.topbar-center > div) {
 width: 100%; 
}

}

/* Mobile landscape: scale the fixed-px playfield down */
@media (max-width: 900px) {

  :global(.playfield) {
 zoom: 0.85; 
}
  :global(.topbar-right) {
 gap: 6px; 
}
  :global(.sage-badge-label) {
 display: none; 
}
  :global(.sage-badge) {
 padding: 4px; 
}

}

@media (max-width: 720px) {

  :global(.playfield) {
 zoom: 0.7; 
}
  :global(.farm-col-left > *) {

    flex: 1 1 100%;
  
}
  :global(.mode-tab) {
 padding: 6px 8px; font-size: 8px; 
}
  :global(.topbar) {
 grid-template-columns: 1fr; 
}

}

@media (max-width: 560px) {

  :global(.playfield) {
 zoom: 0.55; 
}

}

/* ============ WEATHER TOPBAR + MODAL ============ */

:global(.wx-topbar) {

  display: flex;
  align-items: center;
  gap: 18px;
  background: #cfeeff;
  padding: 8px 14px;
  border-radius: 6px;
  box-shadow:
    0 0 0 4px #1d3a52,
    inset 0 0 0 2px rgba(255,255,255,0.6),
    0 6px 0 0 #1d3a52;
  cursor: pointer;
  transition: transform 100ms;
  position: relative;

}
:global(.wx-topbar:hover) {
 transform: translateY(-1px); 
}
:global(.wx-topbar:active) {
 transform: translateY(2px); box-shadow: 0 0 0 4px #1d3a52, inset 0 0 0 2px rgba(255,255,255,0.6); 
}

:global(.wx-topbar-date) {

  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: #1d3a52;
  letter-spacing: 0.5px;

}
:global(.wx-topbar-time) {

  font-family: 'VT323', monospace;
  font-size: 28px;
  color: #1d3a52;
  font-weight: bold;
  line-height: 1;

}
:global(.wx-topbar-now) {

  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 14px;
  border-left: 2px dashed rgba(29,58,82,0.4);

}
:global(.wx-topbar-now-text) {

  display: flex;
  flex-direction: column;
  gap: 2px;

}
:global(.wx-topbar-temp) {

  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: #1d3a52;
  letter-spacing: 1px;

}
:global(.wx-topbar-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: var(--accent);
  letter-spacing: 0.5px;

}
:global(.wx-topbar-season) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 1px;
  padding-left: 14px;
  border-left: 2px dashed rgba(29,58,82,0.4);

}
:global(.wx-topbar-chev) {

  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #1d3a52;
  margin-left: 2px;
  opacity: 0.5;

}

@media (max-width: 1100px) {

  :global(.wx-topbar-season) {
 display: none; 
}

}
@media (max-width: 900px) {

  :global(.wx-topbar) {
 gap: 12px; padding: 6px 10px; 
}
  :global(.wx-topbar-time) {
 font-size: 22px; 
}
  :global(.wx-topbar-label) {
 display: none; 
}

}

/* ---- Modal ---- */
:global(.wx-modal) {
 width: min(720px, 100%); 
}

:global(.wx-now) {

  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 14px;
  background: linear-gradient(180deg, #cfeeff 0%, #e8f6ff 100%);
  border-radius: 6px;
  box-shadow: inset 0 0 0 3px #1d3a52;
  margin-bottom: 16px;

}
:global(.wx-now-icon) {

  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #1d3a52, 0 3px 0 #1d3a52;

}
:global(.wx-now-body) {

  display: flex;
  flex-direction: column;
  gap: 4px;

}
:global(.wx-now-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: var(--accent);
  letter-spacing: 1px;

}
:global(.wx-now-temp) {

  font-family: 'Press Start 2P', monospace;
  font-size: 36px;
  color: #1d3a52;
  letter-spacing: 1px;
  line-height: 1;

}
:global(.wx-now-temp .wx-deg) {

  font-size: 22px;
  color: var(--accent);
  margin-left: 4px;

}
:global(.wx-now-sub) {

  font-family: 'VT323', monospace;
  font-size: 17px;
  color: var(--text-soft);
  line-height: 1.3;

}
:global(.wx-now-side) {

  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  padding: 8px 10px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px #1d3a52;
  min-width: 200px;

}
:global(.wx-side-row) {

  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 6px;
  align-items: center;
  font-family: 'VT323', monospace;
  font-size: 16px;

}
:global(.wx-side-icon) {
 font-size: 14px; 
}
:global(.wx-side-lbl) {

  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: var(--text-soft);
  letter-spacing: 0.3px;

}
:global(.wx-side-val) {

  font-family: 'VT323', monospace;
  font-size: 16px;
  color: #1d3a52;
  font-weight: bold;

}

:global(.wx-section-title) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 0.5px;
  margin: 14px 0 8px;
  border-bottom: 2px dashed var(--ink);
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;

}
:global(.wx-section-title::before) {

  content: '▶';
  color: var(--ink);

}

:global(.wx-days) {

  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;

}
:global(.wx-day) {

  background: #fff8dc;
  padding: 8px 4px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;

}
:global(.wx-day-today) {

  background: #ffe16a;
  box-shadow: 0 0 0 3px var(--accent), 0 4px 0 var(--accent);

}
:global(.wx-day-label) {

  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: var(--ink);
  letter-spacing: 0.3px;
  white-space: nowrap;

}
:global(.wx-day-icon) {

  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: #cfeeff;
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px var(--ink);
  padding: 2px;

}
:global(.wx-day-temps) {

  display: flex;
  gap: 6px;
  font-family: 'VT323', monospace;
  font-size: 17px;
  line-height: 1;

}
:global(.wx-temp-hi) {
 color: var(--accent); font-weight: bold; 
}
:global(.wx-temp-lo) {
 color: var(--text-soft); 
}
:global(.wx-day-precip) {

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;

}
:global(.wx-precip-bar) {

  width: 90%;
  height: 4px;
  background: #2e2e2e;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--ink);
  overflow: hidden;

}
:global(.wx-precip-fill) {

  height: 100%;
  background: #4fc3f7;

}
:global(.wx-precip-val) {

  font-family: 'VT323', monospace;
  font-size: 12px;
  color: var(--text-soft);

}

:global(.wx-empty) {

  grid-column: 1 / -1;
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 18px;
  color: var(--text-soft);
  padding: 30px;

}

:global(.wx-advice) {

  display: flex;
  flex-direction: column;
  gap: 6px;

}
:global(.wx-advice-row) {

  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  background: #fff;
  padding: 8px 10px;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--ink);
  font-family: 'VT323', monospace;
  font-size: 17px;
  line-height: 1.3;
  color: var(--ink);

}
:global(.wx-advice-icon) {

  font-size: 18px;
  text-align: center;

}
:global(.wx-advice-ok) {
 background: #e8ffe8; box-shadow: 0 0 0 2px var(--grass-dark); 
}
:global(.wx-advice-warn) {
 background: #ffe2e2; box-shadow: 0 0 0 2px var(--accent); 
}
:global(.wx-advice-info) {
 background: #e8f6ff; box-shadow: 0 0 0 2px #4fc3f7; 
}

@media (max-width: 720px) {

  :global(.wx-now) {
 grid-template-columns: 1fr; text-align: center; 
}
  :global(.wx-now-side) {
 min-width: 0; 
}
  :global(.wx-days) {
 grid-template-columns: repeat(4, 1fr); 
}

}
@media (max-width: 480px) {

  :global(.wx-days) {
 grid-template-columns: repeat(3, 1fr); 
}

}

/* ============ Tweaks Panel CSS ============ */
:global(.tweaks-panel *) {
 box-sizing: border-box; 
}

/* ============ SAGE ASSISTANT ============ */

:global(.sage-row) {

  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: stretch;

}

:global(.sage-portrait-wrap) {

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

}

:global(.sage-portrait-bg) {

  width: 96px;
  height: 96px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 6px 0 4px;
  background:
    linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
  border-radius: 4px;
  box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 5px #fff;
  position: relative;
  overflow: hidden;

}
:global(.sage-portrait-bg::before) {

  /* sun rays */
  content: '';
  position: absolute;
  top: 6px; right: 8px;
  width: 18px; height: 18px;
  background: #ffe16a;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--ink);

}

:global(.sage-bob) {

  animation: sageBob 1.6s steps(2) infinite;

}
@keyframes -global-sageBob {

  0%, 50%   { transform: translateY(0); }
  50.01%, 100% { transform: translateY(-2px); }

}

:global(.sage-name-tag) {

  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  background: #ffe16a;
  padding: 4px 8px;
  border-radius: 2px;
  box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
  color: var(--ink);
  letter-spacing: 1px;

}

:global(.sage-dialog) {

  background: #f7f4e8;
  border-radius: 4px;
  box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 5px #fff;
  padding: 10px 12px;
  min-height: 110px;
  position: relative;

}
:global(.sage-dialog::before) {

  /* speech bubble tail */
  content: '';
  position: absolute;
  left: -8px; top: 30px;
  width: 0; height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 10px solid var(--ink);

}

:global(.sage-thread) {

  font-family: 'VT323', monospace;
  font-size: 22px;
  line-height: 1.45;
  max-height: 220px;
  overflow-y: auto;
  color: var(--ink);

}

:global(.sage-msg) {

  margin-bottom: 8px;
  display: block;

}
:global(.sage-msg-user) {
 color: #2a5d8c; 
}
:global(.sage-msg-sage) {
 color: #1d1d1d; 
}

:global(.sage-msg-prefix) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: var(--accent);
  margin-right: 6px;
  letter-spacing: 0.5px;
  vertical-align: 2px;

}
:global(.sage-msg-user .sage-msg-prefix) {
 color: #2a5d8c; 
}

:global(.sage-cursor) {

  display: inline-block;
  color: var(--accent);
  margin-left: 4px;

}
:global(.sage-cursor-blink) {

  animation: sageBlink 0.7s steps(2) infinite;

}
@keyframes -global-sageBlink {

  0%, 50%   { opacity: 1; }
  50.01%, 100% { opacity: 0; }

}

:global(.sage-thinking .dot1) {
 animation: sageThink 1.2s steps(2) infinite; 
}
:global(.sage-thinking .dot2) {
 animation: sageThink 1.2s steps(2) infinite 0.2s; 
}
:global(.sage-thinking .dot3) {
 animation: sageThink 1.2s steps(2) infinite 0.4s; 
}
@keyframes -global-sageThink {

  0%, 50%   { opacity: 0.2; }
  50.01%, 100% { opacity: 1; }

}

:global(.sage-actions) {

  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;

}
:global(.sage-chip) {

  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  background: #fff;
  color: var(--ink);
  border: none;
  padding: 8px 10px;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: transform 100ms;

}
:global(.sage-chip:hover) {
 transform: translateY(-1px); 
}
:global(.sage-chip:active) {
 transform: translateY(1px); box-shadow: 0 0 0 2px var(--ink); 
}
:global(.sage-chip:disabled) {
 opacity: 0.4; cursor: not-allowed; 
}
:global(.sage-chip-active) {

  background: #ffe16a;
  box-shadow: 0 0 0 2px var(--accent), 0 3px 0 var(--accent);

}

:global(.sage-input-row) {

  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;

}
:global(.sage-input) {

  flex: 1;
  font-family: 'VT323', monospace;
  font-size: 20px;
  padding: 8px 10px;
  background: #fff;
  border: none;
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px var(--ink), inset 0 2px 0 rgba(0,0,0,0.1);
  color: var(--ink);
  outline: none;

}
:global(.sage-input:focus) {

  box-shadow: inset 0 0 0 2px var(--accent), inset 0 2px 0 rgba(0,0,0,0.1);

}

/* ============ HIGHLIGHTED BED (sage callout) ============ */

:global(.bed-highlighted) {

  animation: bedHighlight 0.8s steps(2) infinite;

}
@keyframes -global-bedHighlight {

  0%, 50%   { outline: 5px solid #ffe16a; outline-offset: 4px; }
  50.01%, 100% { outline: 5px solid #c73030; outline-offset: 6px; }

}


  </style>

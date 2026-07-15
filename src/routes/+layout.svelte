<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
</svelte:head>

<slot />

<style>
  :global(:root) {
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

  :global(*) { box-sizing: border-box; }

  :global(html, body) {
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
    content: '';
    position: fixed;
    inset: 0;
    background:
      linear-gradient(180deg, transparent 0%, transparent 55%, var(--grass) 55%, var(--grass) 100%);
    z-index: 0;
    pointer-events: none;
  }

  :global(body::after) {
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

  :global(.farm-root) {
    position: relative;
    z-index: 1;
    max-width: 1440px;
    margin: 0 auto;
    padding: 22px 28px 60px;
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
  :global(.topbar-left) { display: flex; align-items: center; gap: 14px; }
  :global(.topbar-center) { display: flex; justify-content: center; }
  :global(.topbar-right) { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }

  /* ============ GRID ============ */
  :global(.farm-grid) {
    display: grid;
    grid-template-columns: 320px minmax(0,1fr);
    gap: 18px;
    align-items: stretch;
  }
  :global(.farm-col-left) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  :global(.farm-col-center) {
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
    overflow: hidden;
    border-radius: 6px;
  }
  :global(.playfield-grass) {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      radial-gradient(circle at 8% 14%, #5a8d3a 0 4px, transparent 5px),
      radial-gradient(circle at 32% 8%, #88c068 0 3px, transparent 4px),
      radial-gradient(circle at 60% 20%, #5a8d3a 0 4px, transparent 5px),
      radial-gradient(circle at 88% 14%, #88c068 0 3px, transparent 4px),
      radial-gradient(circle at 12% 80%, #5a8d3a 0 4px, transparent 5px),
      radial-gradient(circle at 78% 92%, #88c068 0 3px, transparent 4px),
      radial-gradient(circle at 50% 88%, #5a8d3a 0 4px, transparent 5px);
    opacity: 0.85;
  }

  /* Corridors */
  :global(.corridor-strip) {
    position: absolute;
    background-color: #e0d9c8;
    background-image:
      radial-gradient(circle at 12% 18%, #8a8278 0 1.4px, transparent 1.7px),
      radial-gradient(circle at 30% 70%, #ffffff 0 2.2px, transparent 2.5px),
      radial-gradient(circle at 47% 30%, #b3a895 0 1.8px, transparent 2.1px),
      radial-gradient(circle at 62% 80%, #9c9286 0 1.5px, transparent 1.8px),
      radial-gradient(circle at 80% 22%, #f0e8d4 0 2px, transparent 2.3px),
      radial-gradient(circle at 92% 60%, #c1b6a2 0 1.6px, transparent 1.9px),
      radial-gradient(circle at 18% 52%, #a89e8c 0 1.7px, transparent 2px),
      radial-gradient(circle at 38% 92%, #f6efdc 0 1.5px, transparent 1.8px),
      radial-gradient(circle at 70% 8%, #7d7568 0 1.3px, transparent 1.6px),
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35) 0 6px, transparent 7px),
      radial-gradient(circle at 75% 75%, rgba(0,0,0,0.07) 0 7px, transparent 8px),
      linear-gradient(180deg, #ebe3d0 0%, #d4cbb6 100%);
    box-shadow: inset 0 0 0 2px rgba(120,105,80,0.4), inset 0 -3px 0 rgba(0,0,0,0.08);
    z-index: 1;
  }

  /* Fences */
  :global(.fence) { z-index: 4; pointer-events: none; background: #5a3a1a; box-shadow: inset 0 0 0 1px #3a2410, 0 0 0 1px rgba(0,0,0,0.2); border-radius: 1px; }
  :global(.fence-h) { background-image: repeating-linear-gradient(90deg, #6a4a2a 0 8px, #4a2a14 8px 10px); }
  :global(.fence-v) { background-image: repeating-linear-gradient(0deg, #6a4a2a 0 8px, #4a2a14 8px 10px); }

  /* Weed garden */
  :global(.weed-garden) {
    position: absolute;
    background: repeating-linear-gradient(45deg, #6fa84a 0 14px, #5a8d3a 14px 28px);
    box-shadow: inset 0 0 0 3px #4f7d31;
    cursor: pointer;
    border-radius: 0 6px 6px 0;
    transition: filter 120ms;
    z-index: 2;
  }
  :global(.weed-garden:hover) { filter: brightness(1.05); }
  :global(.weed-garden-selected) { box-shadow: inset 0 0 0 3px var(--accent), 0 0 0 3px #ffe16a; }
  :global(.weed-garden-label) {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-family: 'Press Start 2P', monospace; font-size: 12px;
    background: #fff; color: var(--ink); padding: 6px 10px; border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    z-index: 5; letter-spacing: 1px; white-space: nowrap; pointer-events: none;
  }

  /* Pre-area cells */
  :global(.prearea-cell) {
    position: absolute; border-radius: 6px; padding: 8px;
    box-shadow: inset 0 0 0 3px #1f3a1a, inset 0 -4px 0 rgba(0,0,0,0.15);
    cursor: pointer; z-index: 2; overflow: hidden; transition: transform 100ms;
  }
  :global(.prearea-cell:hover) { transform: translateY(-2px); }
  :global(.prearea-tiles) { display: flex; flex-wrap: wrap; gap: 4px; }
  :global(.prearea-selected) { box-shadow: inset 0 0 0 3px var(--accent), inset 0 -4px 0 rgba(0,0,0,0.15), 0 0 0 3px #ffe16a; }
  :global(.prearea-label) {
    position: absolute; bottom: 6px; left: 8px;
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: #fff; padding: 4px 6px; border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink); z-index: 3;
  }

  :global(.map-hint) {
    margin-top: 10px; font-family: 'Press Start 2P', monospace; font-size: 10px;
    color: #1f3a1a; text-align: center; letter-spacing: 0.5px;
  }

  /* ============ PLAYER ============ */
  :global(.player) { position: absolute; left: 0; top: 0; z-index: 20; pointer-events: none; will-change: transform; }
  :global(.player-shadow) {
    position: absolute; left: 50%; bottom: -4px; transform: translateX(-50%);
    width: 26px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1px); z-index: -1;
  }

  /* ============ BED ============ */
  :global(.bed) { position: absolute; cursor: pointer; transition: transform 120ms ease; z-index: 5; }
  :global(.bed:hover) { transform: translateY(-2px); }
  :global(.bed-selected) { outline: 4px solid #ffe16a; outline-offset: 4px; box-shadow: 0 0 0 4px var(--accent); }
  :global(.bed-frame) {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, var(--bed-wood) 0%, var(--bed-wood-dk) 100%);
    box-shadow: inset 0 0 0 3px #3a2410, inset 0 -6px 0 rgba(0,0,0,0.25), 0 5px 0 #3a2410;
    border-radius: 4px; z-index: 0;
  }
  :global(.bed-soil) {
    position: absolute; inset: 8px 8px 12px 8px; border-radius: 2px;
    box-shadow: inset 0 0 0 2px #3a2410, inset 0 4px 0 rgba(0,0,0,0.2);
    z-index: 1; overflow: hidden;
  }
  :global(.bed-tiles) {
    display: grid; grid-template-rows: 1fr 1fr; height: 100%; width: 100%;
    align-items: center; justify-items: center; padding: 4px 6px;
  }
  :global(.bed-tile) { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  :global(.weeds-overlay) { position: absolute; inset: 0; pointer-events: none; }
  :global(.bed-status) {
    position: absolute; top: -12px; left: 6px;
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    padding: 5px 6px; border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
    z-index: 6; letter-spacing: 0.3px; white-space: nowrap;
  }
  :global(.bed-microbar) {
    position: absolute; bottom: 2px; left: 14px; right: 14px; height: 6px;
    background: #1d1d1d; border-radius: 2px; box-shadow: inset 0 0 0 1px #000;
    overflow: hidden; z-index: 3;
  }
  :global(.bed-microbar-fill) { height: 100%; transition: width 250ms steps(8); }
  :global(.bed-dims) {
    position: absolute; bottom: 10px; right: 10px;
    font-family: 'Press Start 2P', monospace; font-size: 8px;
    color: #fff; background: rgba(0,0,0,0.6); padding: 3px 4px;
    border-radius: 2px; z-index: 6; white-space: nowrap;
  }
  :global(.bed-ready) { animation: bedReady 1.2s steps(2) infinite; }
  @keyframes -global-bedReady {
    0%, 50% { filter: brightness(1); }
    50.01%, 100% { filter: brightness(1.15); }
  }
  :global(.bed-ready-sparkle) {
    position: absolute; top: -22px; right: -10px;
    width: 28px; height: 28px; background: #ffe16a; border-radius: 50%;
    box-shadow: 0 0 0 3px var(--ink), 0 4px 0 var(--ink);
    font-family: 'Press Start 2P', monospace; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    color: var(--accent); z-index: 4;
    animation: sparkle 0.8s steps(2) infinite;
    cursor: pointer; transition: transform 0.1s;
  }
  :global(.bed-ready-sparkle:hover) { transform: scale(1.15); }
  @keyframes -global-sparkle {
    0%, 50% { transform: scale(1); }
    50.01%, 100% { transform: scale(1.15); }
  }
  :global(.bed-highlighted) { animation: bedHighlight 0.8s steps(2) infinite; }
  @keyframes -global-bedHighlight {
    0%, 50% { outline: 5px solid #ffe16a; outline-offset: 4px; }
    50.01%, 100% { outline: 5px solid #c73030; outline-offset: 6px; }
  }

  /* ============ BED MONITOR ============ */
  :global(.bed-monitor) {
    display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
    gap: 2px; height: 100%; width: 100%; padding: 3px;
    background: rgba(0,0,0,0.6); color: #fff; font-family: 'Press Start 2P', monospace;
  }
  :global(.bed-monitor-cell) {
    background: rgba(0,0,0,0.35); border-radius: 2px; padding: 3px 5px;
    display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
  }
  :global(.bed-monitor-label) { font-size: 7px; color: #c4ff8b; letter-spacing: 0.3px; margin-bottom: 1px; white-space: nowrap; }
  :global(.bed-monitor-val) { font-family: 'VT323', monospace; font-size: 20px; font-weight: bold; line-height: 1; display: flex; align-items: baseline; gap: 2px; }
  :global(.bed-monitor-pct) { font-size: 11px; color: rgba(255,255,255,0.6); margin-left: 1px; }

  /* ============ FLASH ============ */
  :global(.flash-popup) {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #fff; font-family: 'Press Start 2P', monospace; font-size: 18px;
    padding: 14px 22px; border-radius: 6px; border: 4px solid;
    box-shadow: 0 6px 0 var(--ink); z-index: 40;
    animation: flashIn 1.3s steps(4); pointer-events: none; letter-spacing: 1px;
  }
  @keyframes -global-flashIn {
    0% { transform: translate(-50%, -30%); opacity: 0; }
    20% { transform: translate(-50%, -50%); opacity: 1; }
    80% { transform: translate(-50%, -50%); opacity: 1; }
    100% { transform: translate(-50%, -70%); opacity: 0; }
  }

  /* ============ MODE TOGGLE ============ */
  :global(.mode-toggle) {
    display: inline-flex; background: #fff; border-radius: 4px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--ink);
    cursor: pointer; overflow: hidden;
  }
  :global(.mode-tab) {
    display: flex; align-items: center; gap: 6px; padding: 8px 12px;
    font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--ink);
    letter-spacing: 0.5px; transition: background 0.1s;
  }
  :global(.mode-tab + .mode-tab) { border-left: 2px solid var(--ink); }
  :global(.mode-tab span) { font-size: 14px; }
  :global(.mode-tab-on) { background: #ffe16a; color: var(--ink); }

  /* ============ WEATHER TOPBAR ============ */
  :global(.wx-topbar) {
    display: flex; align-items: center; gap: 18px;
    background: #cfeeff; padding: 8px 14px; border-radius: 6px;
    box-shadow: 0 0 0 4px #1d3a52, inset 0 0 0 2px rgba(255,255,255,0.6), 0 6px 0 0 #1d3a52;
    cursor: pointer; transition: transform 100ms; position: relative;
  }
  :global(.wx-topbar:hover) { transform: translateY(-1px); }
  :global(.wx-topbar-date) { font-family: 'Press Start 2P', monospace; font-size: 11px; color: #1d3a52; letter-spacing: 0.5px; }
  :global(.wx-topbar-time) { font-family: 'VT323', monospace; font-size: 28px; color: #1d3a52; font-weight: bold; line-height: 1; }
  :global(.wx-topbar-now) { display: flex; align-items: center; gap: 10px; padding-left: 14px; border-left: 2px dashed rgba(29,58,82,0.4); }
  :global(.wx-topbar-now-text) { display: flex; flex-direction: column; gap: 2px; }
  :global(.wx-topbar-temp) { font-family: 'Press Start 2P', monospace; font-size: 16px; color: #1d3a52; letter-spacing: 1px; }
  :global(.wx-topbar-label) { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--accent); letter-spacing: 0.5px; }
  :global(.wx-topbar-season) { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent); letter-spacing: 1px; padding-left: 14px; border-left: 2px dashed rgba(29,58,82,0.4); }
  :global(.wx-topbar-chev) { font-family: 'Press Start 2P', monospace; font-size: 14px; color: #1d3a52; margin-left: 2px; opacity: 0.5; }

  /* ============ HORTIDEX BADGE ============ */
  :global(.hortidex-badge) {
    position: relative; background: #fff; cursor: pointer; text-decoration: none;
    padding: 4px 12px 4px 4px; display: inline-flex; align-items: center; gap: 8px;
    border-radius: 4px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--ink);
    transition: transform 100ms;
  }
  :global(.hortidex-badge:hover) { transform: translateY(-1px); }
  :global(.hortidex-badge-icon) {
    width: 36px; height: 36px;
    background: linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
    border-radius: 3px; box-shadow: inset 0 0 0 2px var(--ink);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  :global(.hortidex-book) {
    width: 20px; height: 22px;
    background: linear-gradient(90deg, #5a3a1a 0 3px, #8a5a2a 3px 20px);
    box-shadow: inset 0 0 0 2px var(--ink); position: relative;
  }
  :global(.hortidex-book::before) {
    content: ''; position: absolute; top: -2px; right: 4px;
    width: 6px; height: 12px; background: var(--grass-dark, #4f7d31);
    box-shadow: inset 0 0 0 1px #2d5018; border-radius: 0 0 50% 50%;
  }
  :global(.hortidex-book::after) {
    content: ''; position: absolute; left: 6px; top: 8px;
    width: 10px; height: 8px;
    background: linear-gradient(180deg, rgba(255,225,106,0.85) 0 2px, transparent 2px 4px, rgba(255,225,106,0.85) 4px 6px, transparent 6px 8px);
  }
  :global(.hortidex-badge-label) { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); letter-spacing: 1px; }

  /* ============ INTERACTION MENU ============ */
  :global(.interaction-menu-wrap) {
    position: absolute; left: 12px; right: 12px; bottom: 12px;
    z-index: 50; display: grid; grid-template-columns: 1fr 1.5fr;
    gap: 10px; align-items: stretch; pointer-events: none;
    animation: menuPop 180ms steps(3) both;
  }
  @keyframes -global-menuPop {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  :global(.interaction-target), :global(.interaction-menu) {
    pointer-events: auto; background: #fdfdfd; border-radius: 6px;
    padding: 10px 14px;
    box-shadow: 0 0 0 4px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 5px 0 var(--ink);
    font-family: 'Press Start 2P', monospace;
  }
  :global(.interaction-target) { display: flex; flex-direction: column; justify-content: center; gap: 6px; }
  :global(.interaction-target-label) { font-size: 13px; color: var(--accent); letter-spacing: 1px; }
  :global(.interaction-target-sub) { font-family: 'VT323', monospace; font-size: 22px; color: var(--ink); line-height: 1.1; }
  :global(.interaction-menu) { display: flex; flex-direction: column; gap: 8px; }
  :global(.interaction-menu-grid) { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 28px; }
  :global(.interaction-menu-list) { grid-template-columns: 1fr; gap: 3px 0; max-height: 200px; overflow-y: auto; }
  :global(.interaction-count) { background: var(--ink); color: #fff; padding: 2px 5px; border-radius: 2px; font-size: 9px; margin-left: 6px; }
  :global(.interaction-family) { font-family: 'VT323', monospace; font-size: 15px; color: var(--text-soft); font-style: italic; margin-left: 6px; }
  :global(.interaction-item) {
    display: flex; align-items: center; gap: 8px; padding: 5px 4px;
    cursor: pointer; font-family: 'Press Start 2P', monospace; font-size: 11px;
    color: var(--ink); letter-spacing: 0.5px; border-radius: 2px; white-space: nowrap;
  }
  :global(.interaction-item-active) { background: #ffe16a; box-shadow: inset 0 0 0 2px var(--accent); }
  :global(.interaction-cursor) { width: 14px; display: inline-block; text-align: center; color: var(--accent); font-size: 12px; }
  :global(.interaction-item-disabled) { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
  :global(.interaction-hint-bar) { font-family: 'VT323', monospace; font-size: 15px; color: var(--text-soft); text-align: center; padding-top: 4px; border-top: 2px dashed rgba(0,0,0,0.18); }

  /* ============ MODALS ============ */
  :global(.info-modal-backdrop) {
    position: fixed; inset: 0; background: rgba(10,18,28,0.72);
    z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  :global(.info-modal) {
    width: min(720px, 100%); max-height: 90vh; background: #fff; border-radius: 8px;
    box-shadow: 0 0 0 5px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 10px 0 var(--ink);
    display: flex; flex-direction: column; overflow: hidden;
  }
  :global(.info-modal-bar) {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: #cfeeff; border-bottom: 3px solid var(--ink);
    font-family: 'Press Start 2P', monospace;
  }
  :global(.info-modal-title) { font-size: 13px; color: var(--ink); letter-spacing: 1px; }
  :global(.info-modal-close) {
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: #ffe16a; color: var(--ink); border: none;
    padding: 7px 10px; border-radius: 3px; cursor: pointer;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    letter-spacing: 0.5px;
  }
  :global(.info-modal-close:hover) { transform: translateY(-1px); }
  :global(.info-modal-body) { overflow-y: auto; padding: 16px; }

  /* ============ HARVEST MODAL ============ */
  :global(.harvest-intro) { font-family: 'VT323', monospace; font-size: 18px; line-height: 1.4; margin-bottom: 14px; color: var(--ink); }
  :global(.harvest-list) { display: flex; flex-direction: column; gap: 10px; }
  :global(.harvest-row) { background: #fff8dc; padding: 10px; border-radius: 4px; box-shadow: 0 0 0 2px var(--ink); }
  :global(.harvest-row-head) { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  :global(.harvest-row-name) { font-family: 'Press Start 2P', monospace; font-size: 11px; display: flex; gap: 8px; align-items: center; }
  :global(.harvest-row-count) { background: var(--ink); color: #fff; padding: 2px 5px; border-radius: 2px; font-size: 9px; }
  :global(.harvest-row-stage) { font-family: 'Press Start 2P', monospace; font-size: 9px; padding: 4px 6px; border-radius: 2px; box-shadow: 0 0 0 2px var(--ink); }
  :global(.harvest-row-bar) { height: 8px; background: #1d1d1d; border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
  :global(.harvest-row-bar-fill) { height: 100%; transition: width 250ms steps(8); }
  :global(.harvest-row-meta) { font-family: 'VT323', monospace; font-size: 15px; color: var(--text-soft); }
  :global(.harvest-actions) { display: flex; gap: 10px; margin-top: 14px; }
  :global(.harvest-go-btn), :global(.harvest-cancel-btn) {
    font-family: 'Press Start 2P', monospace; font-size: 11px;
    padding: 10px 14px; border: none; border-radius: 3px; cursor: pointer;
    letter-spacing: 0.5px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
  }
  :global(.harvest-go-btn) { background: #ffe16a; color: var(--ink); }
  :global(.harvest-cancel-btn) { background: #fff; color: var(--ink); }
  :global(.harvest-go-btn:hover), :global(.harvest-cancel-btn:hover) { transform: translateY(-1px); }

  /* ============ BED DETAILS ============ */
  :global(.bed-detail-portrait) { display: flex; gap: 12px; margin: 14px 0; align-items: center; }
  :global(.portrait-frame) {
    width: 110px; height: 110px; background: #cfeeff;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 6px #fff, 0 0 0 1px var(--ink);
    background-image: linear-gradient(180deg, #cfeeff 0%, #cfeeff 60%, #86c46b 60%, #86c46b 100%);
  }
  :global(.portrait-meta) { flex: 1; }
  :global(.portrait-name) { font-family: 'Press Start 2P', monospace; font-size: 16px; margin-bottom: 10px; }
  :global(.portrait-stage) { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--text-soft); margin-bottom: 10px; }
  :global(.portrait-status) {
    display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 10px;
    padding: 5px 8px; background: #fff;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink); border-radius: 2px; letter-spacing: 0.5px;
  }
  :global(.status-colheita) { background: #ffe16a; color: var(--accent); }
  :global(.status-plantado) { background: #5cd96b; color: var(--bg-0); }
  :global(.status-acolher) { background: #ffe16a; color: var(--accent); }
  :global(.bed-dates) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 10px 0 6px; }
  :global(.bed-date-chip) { background: #fff8dc; border-radius: 3px; padding: 6px 7px; box-shadow: 0 0 0 2px var(--ink); text-align: center; }
  :global(.bed-date-label) { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--accent); letter-spacing: 0.5px; margin-bottom: 3px; }
  :global(.bed-date-val) { font-family: 'VT323', monospace; font-size: 16px; color: var(--ink); font-weight: bold; line-height: 1.1; }
  :global(.bed-date-sub) { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); margin-top: 2px; line-height: 1.1; }
  :global(.bed-section-title) {
    font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent);
    letter-spacing: 0.5px; margin: 12px 0 6px; border-bottom: 2px dashed var(--ink); padding-bottom: 4px;
  }
  :global(.cultures-list) { display: flex; flex-direction: column; gap: 4px; }
  :global(.culture-row) {
    display: grid; grid-template-columns: auto 1fr; gap: 8px;
    background: #fff8dc; padding: 6px 8px; border-radius: 0 3px 3px 0; align-items: start;
  }
  :global(.culture-sprite) { width: 24px; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
  :global(.culture-name) {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--ink); letter-spacing: 0.2px; margin-bottom: 2px;
  }
  :global(.culture-count) { background: var(--ink); color: #fff; padding: 2px 4px; border-radius: 2px; font-size: 8px; }
  :global(.culture-family) { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); font-style: italic; line-height: 1.2; }
  :global(.culture-fn) { font-family: 'VT323', monospace; font-size: 15px; color: var(--ink); line-height: 1.25; margin-top: 1px; }
  :global(.bed-note-text) {
    font-family: 'VT323', monospace; font-size: 17px; line-height: 1.3; color: var(--ink);
    background: #fff8dc; padding: 8px 10px; border-radius: 3px; box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
  }
  :global(.bed-note-warn) { background: #ffe2e2; box-shadow: 0 0 0 2px #c73030; }
  :global(.bed-note-next) { background: #e8ffe8; box-shadow: 0 0 0 2px #4f7d31; }
  :global(.bed-detail-bars) { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; }
  :global(.bed-history) { display: flex; flex-direction: column; gap: 4px; }
  :global(.history-row) { background: #fff8dc; padding: 6px 8px; border-radius: 3px; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
  :global(.history-season) { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--accent); margin-bottom: 3px; }
  :global(.history-plants) { font-family: 'VT323', monospace; font-size: 16px; color: var(--ink); line-height: 1.2; }
  :global(.history-notes) { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); font-style: italic; margin-top: 2px; line-height: 1.2; }

  /* ============ WEATHER MODAL ============ */
  :global(.wx-modal) { width: min(720px, 100%); }
  :global(.wx-now) {
    display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center;
    padding: 14px; background: linear-gradient(180deg, #cfeeff 0%, #e8f6ff 100%);
    border-radius: 6px; box-shadow: inset 0 0 0 3px #1d3a52; margin-bottom: 16px;
  }
  :global(.wx-now-icon) { display: flex; align-items: center; justify-content: center; background: #fff; padding: 8px; border-radius: 4px; box-shadow: 0 0 0 2px #1d3a52, 0 3px 0 #1d3a52; }
  :global(.wx-now-body) { display: flex; flex-direction: column; gap: 4px; }
  :global(.wx-now-label) { font-family: 'Press Start 2P', monospace; font-size: 12px; color: var(--accent); letter-spacing: 1px; }
  :global(.wx-now-temp) { font-family: 'Press Start 2P', monospace; font-size: 36px; color: #1d3a52; letter-spacing: 1px; line-height: 1; }
  :global(.wx-deg) { font-size: 22px; color: var(--accent); margin-left: 4px; }
  :global(.wx-now-sub) { font-family: 'VT323', monospace; font-size: 17px; color: var(--text-soft); line-height: 1.3; }
  :global(.wx-now-side) { display: flex; flex-direction: column; gap: 6px; background: #fff; padding: 8px 10px; border-radius: 4px; box-shadow: 0 0 0 2px #1d3a52; min-width: 200px; }
  :global(.wx-side-row) { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; align-items: center; font-family: 'VT323', monospace; font-size: 16px; }
  :global(.wx-side-icon) { font-size: 14px; }
  :global(.wx-side-lbl) { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--text-soft); letter-spacing: 0.3px; }
  :global(.wx-side-val) { font-family: 'VT323', monospace; font-size: 16px; color: #1d3a52; font-weight: bold; }
  :global(.wx-section-title) {
    font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent);
    letter-spacing: 0.5px; margin: 14px 0 8px; border-bottom: 2px dashed var(--ink); padding-bottom: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  :global(.wx-section-title::before) { content: '▶'; color: var(--ink); }
  :global(.wx-days) { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  :global(.wx-day) {
    background: #fff8dc; padding: 8px 4px; border-radius: 4px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;
  }
  :global(.wx-day-today) { background: #ffe16a; box-shadow: 0 0 0 3px var(--accent), 0 4px 0 var(--accent); }
  :global(.wx-day-label) { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--ink); letter-spacing: 0.3px; white-space: nowrap; }
  :global(.wx-day-icon) {
    display: flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; background: #cfeeff; border-radius: 3px;
    box-shadow: inset 0 0 0 2px var(--ink); padding: 2px;
  }
  :global(.wx-day-temps) { display: flex; gap: 6px; font-family: 'VT323', monospace; font-size: 17px; line-height: 1; }
  :global(.wx-temp-hi) { color: var(--accent); font-weight: bold; }
  :global(.wx-temp-lo) { color: var(--text-soft); }
  :global(.wx-day-precip) { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; }
  :global(.wx-precip-bar) { width: 90%; height: 4px; background: #2e2e2e; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--ink); overflow: hidden; }
  :global(.wx-precip-fill) { height: 100%; background: #4fc3f7; }
  :global(.wx-precip-val) { font-family: 'VT323', monospace; font-size: 12px; color: var(--text-soft); }
  :global(.wx-empty) { grid-column: 1 / -1; text-align: center; font-family: 'VT323', monospace; font-size: 18px; color: var(--text-soft); padding: 30px; }
  :global(.wx-advice) { display: flex; flex-direction: column; gap: 6px; }
  :global(.wx-advice-row) {
    display: grid; grid-template-columns: 28px 1fr; gap: 8px; align-items: center;
    background: #fff; padding: 8px 10px; border-radius: 3px; box-shadow: 0 0 0 2px var(--ink);
    font-family: 'VT323', monospace; font-size: 17px; line-height: 1.3; color: var(--ink);
  }
  :global(.wx-advice-icon) { font-size: 18px; text-align: center; }
  :global(.wx-advice-ok) { background: #e8ffe8; box-shadow: 0 0 0 2px var(--grass-dark); }
  :global(.wx-advice-warn) { background: #ffe2e2; box-shadow: 0 0 0 2px var(--accent); }
  :global(.wx-advice-info) { background: #e8f6ff; box-shadow: 0 0 0 2px #4fc3f7; }

  /* ============ SAGE DECK ============ */
  :global(.sage-deck) {
    display: grid;
    grid-template-columns: 120px 1fr 340px;
    gap: 14px;
    padding: 14px;
    background: linear-gradient(180deg, #4a2f16, #3a2410);
    border-radius: 8px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 3px rgba(255,225,106,0.15), 0 5px 0 var(--ink);
    min-height: 252px;
  }

  :global(.sd-portrait) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-top: 6px;
  }

  :global(.sage-portrait-bg) {
    width: 96px; height: 96px; display: flex; align-items: flex-end; justify-content: center;
    padding: 6px 0 4px;
    background: linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
    border-radius: 4px; box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 5px #fff;
    position: relative; overflow: hidden;
  }
  :global(.sage-portrait-bg::before) {
    content: ''; position: absolute; top: 6px; right: 8px;
    width: 18px; height: 18px; background: #ffe16a; border-radius: 50%;
    box-shadow: 0 0 0 2px var(--ink);
  }
  :global(.sage-name-tag) {
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: #ffe16a; padding: 4px 8px; border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
    color: var(--ink); letter-spacing: 1px;
  }

  :global(.sd-chat) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  :global(.sd-thread) {
    background: #f7f4e8;
    border-radius: 4px;
    box-shadow: inset 0 0 0 2px rgba(0,0,0,0.15);
    padding: 10px 12px;
    flex: 1;
    min-height: 120px;
    max-height: 180px;
    overflow-y: auto;
    font-family: 'VT323', monospace;
    font-size: 20px;
    line-height: 1.4;
    color: var(--ink);
  }
  :global(.sd-thread::-webkit-scrollbar) { width: 6px; }
  :global(.sd-thread::-webkit-scrollbar-thumb) { background: #c4b898; border-radius: 3px; }

  :global(.sage-msg) { margin-bottom: 6px; display: block; }
  :global(.sage-msg-user) { color: #2a5d8c; }
  :global(.sage-msg-sage) { color: #1d1d1d; }
  :global(.sage-msg-system) { font-size: 0.8em; opacity: 0.7; font-style: italic; padding: 2px 0; }
  :global(.sage-msg-prefix) {
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    color: var(--accent); margin-right: 6px; letter-spacing: 0.5px; vertical-align: 2px;
  }
  :global(.sage-msg-user .sage-msg-prefix) { color: #2a5d8c; }
  :global(.sage-cursor) { display: inline-block; color: var(--accent); margin-left: 4px; animation: sageBlink 0.7s steps(2) infinite; }
  @keyframes -global-sageBlink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
  :global(.sage-thinking) {
    display: inline-flex; gap: 2px;
    font-family: 'Press Start 2P', monospace; font-size: 12px; color: #e8d8a0;
  }
  :global(.sage-thinking .dot) { animation: sage-bounce 1.2s infinite; }
  :global(.sage-thinking .dot:nth-child(2)) { animation-delay: 0.2s; }
  :global(.sage-thinking .dot:nth-child(3)) { animation-delay: 0.4s; }
  @keyframes -global-sage-bounce {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-3px); }
  }

  :global(.sd-chips) {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  :global(.sage-chip) {
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    background: #fff; color: var(--ink); border: none;
    padding: 8px 10px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    cursor: pointer; letter-spacing: 0.5px; transition: transform 100ms;
  }
  :global(.sage-chip:hover) { transform: translateY(-1px); }
  :global(.sage-chip:active) { transform: translateY(1px); box-shadow: 0 0 0 2px var(--ink); }
  :global(.sage-chip:disabled) { opacity: 0.4; cursor: not-allowed; }

  :global(.sd-input-row) {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  :global(.sage-input) {
    flex: 1; font-family: 'VT323', monospace; font-size: 20px;
    padding: 8px 10px; background: #fff; border: none; border-radius: 3px;
    box-shadow: inset 0 0 0 2px var(--ink), inset 0 2px 0 rgba(0,0,0,0.1);
    color: var(--ink); outline: none;
  }
  :global(.sage-input:focus) { box-shadow: inset 0 0 0 2px var(--accent), inset 0 2px 0 rgba(0,0,0,0.1); }

  :global(.sd-send-btn) {
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    background: #ffe16a; color: var(--ink); border: none;
    padding: 10px 14px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    cursor: pointer; letter-spacing: 0.5px; white-space: nowrap;
  }
  :global(.sd-send-btn:hover) { transform: translateY(-1px); }
  :global(.sd-send-btn:disabled) { opacity: 0.4; cursor: not-allowed; }

  :global(.sd-sidebar) {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  :global(.sd-sidebar-block) {
    background: #f7f4e8;
    border-radius: 4px;
    box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);
    padding: 10px;
  }

  :global(.sd-sidebar-title) {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--accent);
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  :global(.sd-tools) {
    display: flex;
    gap: 8px;
  }

  :global(.sd-tool-slot) {
    width: 60px; height: 66px;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  :global(.sd-tool-label) {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    letter-spacing: 0.3px;
  }

  :global(.sd-tool-hint) {
    font-family: 'VT323', monospace;
    font-size: 14px;
    color: var(--text-dim);
    margin-top: 6px;
    text-align: center;
  }

  :global(.sd-harvested) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  :global(.sd-harvest-empty) {
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: var(--text-soft);
  }

  :global(.seed-chip) {
    display: flex; align-items: center; gap: 6px;
    background: #fff; padding: 4px 8px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
  }
  :global(.seed-chip-label) { font-family: 'Press Start 2P', monospace; font-size: 8px; }
  :global(.seed-chip-count) { font-family: 'VT323', monospace; font-size: 18px; color: #3a3a3a; font-weight: bold; }

  /* ============ TASKS PANEL ============ */
  :global(.tasks-header) {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  :global(.tasks-title) {
    font-family: 'Press Start 2P', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    color: var(--ink);
  }

  :global(.tasks-count) {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    background: #ffe16a;
    color: var(--ink);
    padding: 3px 7px;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink);
  }

  :global(.tsec) {
    margin-bottom: 10px;
  }

  :global(.tsec-title) {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--accent);
    letter-spacing: 0.5px;
    border-bottom: 2px dashed var(--accent);
    padding-bottom: 4px;
    margin-bottom: 8px;
  }

  :global(.task) {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
    margin-bottom: 6px;
  }

  :global(.task-done) {
    opacity: 0.5;
  }
  :global(.task-done .task-text) {
    text-decoration: line-through;
  }

  :global(.task-check) {
    width: 18px;
    height: 18px;
    min-width: 18px;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    color: var(--ink);
    cursor: pointer;
    margin-top: 2px;
  }

  :global(.task-check-auto) {
    cursor: default;
    background: #e8e4d4;
  }

  :global(.task-check-done) {
    background: #5cd96b;
    color: #fff;
  }

  :global(.task-body) {
    flex: 1;
    min-width: 0;
  }

  :global(.task-text) {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    letter-spacing: 0.3px;
    line-height: 1.5;
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  :global(.task-meta) {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  :global(.chip-bed) {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    background: #cfeeff;
    padding: 3px 6px;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink);
    cursor: pointer;
    letter-spacing: 0.3px;
  }
  :global(.chip-bed:hover) { background: #a4d4ff; }

  :global(.chip-src) {
    font-family: 'Press Start 2P', monospace;
    font-size: 6px;
    padding: 2px 5px;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--ink);
    letter-spacing: 0.3px;
  }
  :global(.chip-src-auto) { background: #e8e4d4; }
  :global(.chip-src-sage) { background: #ffe16a; }
  :global(.chip-src-manual) { background: #fff; }

  :global(.task-reason) {
    font-family: 'VT323', monospace;
    font-size: 14px;
    color: var(--text-dim);
  }

  :global(.task-new-btn) {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--text-soft);
    text-align: center;
    padding: 8px;
    cursor: pointer;
    border: 2px dashed rgba(0,0,0,0.2);
    border-radius: 3px;
    margin-top: 6px;
    letter-spacing: 0.5px;
  }
  :global(.task-new-btn:hover) {
    border-color: var(--ink);
    color: var(--ink);
  }

  :global(.task-add-row) {
    margin-bottom: 6px;
  }

  :global(.task-add-input) {
    width: 100%;
    font-family: 'VT323', monospace;
    font-size: 18px;
    padding: 6px 8px;
    border: none;
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px var(--ink);
    outline: none;
    background: #fff;
  }
  :global(.task-add-input:focus) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  /* ============ MOBILE TABS ============ */
  :global(.mobile-only) { display: none; }
  :global(.desktop-only) { display: block; }
  :global(.farm-grid.desktop-only) { display: grid; }

  :global(.m-tabs) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: #3a2410;
    box-shadow: 0 -3px 0 var(--ink);
    z-index: 90;
  }

  :global(.m-tab) {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 10px 0;
    min-height: 56px;
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    color: rgba(255,225,106,0.5);
  }

  :global(.m-tab-active) {
    color: #ffe16a;
    box-shadow: inset 0 3px 0 #ffe16a;
  }

  :global(.m-tab-icon) {
    font-size: 20px;
  }

  :global(.m-tab-label) {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    letter-spacing: 0.5px;
  }

  :global(.m-tab-badge) {
    position: absolute;
    top: 4px;
    right: calc(50% - 22px);
    background: var(--accent);
    color: #fff;
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    padding: 2px 4px;
    border-radius: 4px;
    min-width: 16px;
    text-align: center;
  }

  :global(.sage-strip) {
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(180deg, #4a2f16, #3a2410);
    padding: 8px 12px;
    border-radius: 6px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    cursor: pointer;
    margin-top: 10px;
  }

  :global(.sage-strip-portrait) {
    width: 32px;
    height: 32px;
    background: linear-gradient(180deg, #cfeeff 0%, #cfeeff 55%, #86c46b 55%, #6fa84a 100%);
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px var(--ink);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    padding-bottom: 1px;
    flex-shrink: 0;
  }

  :global(.sage-strip-text) {
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: rgba(255,225,106,0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1199px) {
    :global(.farm-root) { padding: 14px 16px 60px; }
    :global(.farm-grid) { grid-template-columns: 1fr; gap: 14px; }
    :global(.farm-col-left) { max-height: 300px; }
    :global(.sage-deck) { grid-template-columns: 100px 1fr 280px; }
    :global(.topbar) { grid-template-columns: 1fr 1fr; gap: 10px; }
    :global(.topbar-center) { grid-column: 1 / -1; order: 3; justify-content: flex-start; }
  }

  @media (max-width: 900px) {
    :global(.desktop-only) { display: none !important; }
    :global(.mobile-only) { display: block; }
    :global(.farm-root) { padding: 14px 12px 80px; }
    :global(.playfield) { zoom: 0.85; }
    :global(.topbar-right) { gap: 6px; }
    :global(.hortidex-badge-label) { display: none; }
    :global(.hortidex-badge) { padding: 4px; }
    :global(.sage-deck) {
      grid-template-columns: 1fr;
      min-height: auto;
    }
    :global(.sd-portrait) { display: none; }
    :global(.sd-sidebar) { display: none; }
    :global(.sd-chips) {
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
    }
    :global(.sage-chip) { white-space: nowrap; flex-shrink: 0; }
  }

  @media (max-width: 720px) {
    :global(.playfield) { zoom: 0.7; }
    :global(.mode-tab) { padding: 6px 8px; font-size: 8px; }
    :global(.topbar) { grid-template-columns: 1fr; gap: 8px; }
    :global(.topbar-left) { justify-content: center; }
    :global(.topbar-right) { justify-content: center; flex-wrap: wrap; }
    :global(.wx-now) { grid-template-columns: 1fr; text-align: center; }
    :global(.wx-now-side) { min-width: 0; }
    :global(.wx-days) { grid-template-columns: repeat(4, 1fr); }
    :global(.map-hint) { font-size: 8px; }
  }

  @media (max-width: 560px) {
    :global(.playfield) { zoom: 0.5; }
    :global(.farm-root) { padding: 12px 10px 80px; }
    :global(.wx-topbar) { gap: 8px; padding: 6px 8px; }
    :global(.wx-topbar-date) { font-size: 9px; }
    :global(.wx-topbar-time) { font-size: 20px; }
    :global(.wx-topbar-season) { display: none; }
    :global(.wx-topbar-temp) { font-size: 12px; }
  }

  @media (max-width: 400px) {
    :global(.playfield) { zoom: 0.42; }
  }
</style>

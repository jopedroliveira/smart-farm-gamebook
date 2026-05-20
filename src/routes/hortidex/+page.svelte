<!--
  Hortidex — Pokédex-style encyclopedia with a wooden device frame,
  diorama screen, d-pad controls, and a field-journal right page.
-->
<script>
  import { PLANT_SPECIES, FAMILY_COLORS } from '$lib/data/plant-species.js';
  import { NOTION_BEDS, daysSince, daysUntil, bedPhase, bedCycleProgress, bedAvgCycle } from '$lib/data/beds.js';
  import { PLANT_LORE, bedsForSpecies, fmtDate } from '$lib/data/plant-lore.js';
  import PlantSprite from '$lib/components/PlantSprite.svelte';
  import StatBar from '$lib/components/StatBar.svelte';

  let mode = 'beds';
  let selectedBedId = 'A1';
  let selectedSpecies = null;
  let tab = 'geral';
  let search = '';

  $: bedEntries = Object.entries(NOTION_BEDS);
  $: speciesEntries = Object.entries(PLANT_SPECIES);
  $: bed = NOTION_BEDS[selectedBedId];
  $: species = selectedSpecies ? PLANT_SPECIES[selectedSpecies] : null;
  $: lore = selectedSpecies ? PLANT_LORE[selectedSpecies] : null;
  $: bedFamilies = bed?.plantings
    ? [...new Set(bed.plantings.map(p => PLANT_SPECIES[p.species]?.family).filter(Boolean))]
    : [];

  // Filtered index list
  $: filteredBeds = bedEntries.filter(([id, b]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.notionCode.toLowerCase().includes(q) || id.toLowerCase().includes(q) ||
      b.plantings.some(p => PLANT_SPECIES[p.species]?.name.toLowerCase().includes(q));
  });
  $: filteredSpecies = speciesEntries.filter(([id, sp]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return sp.name.toLowerCase().includes(q) || sp.family.toLowerCase().includes(q) || id.includes(q);
  });

  $: counter = mode === 'beds'
    ? `${String(bedEntries.findIndex(([id]) => id === selectedBedId) + 1).padStart(3, '0')} / ${String(bedEntries.length).padStart(3, '0')}`
    : selectedSpecies
      ? `${String(speciesEntries.findIndex(([id]) => id === selectedSpecies) + 1).padStart(3, '0')} / ${String(speciesEntries.length).padStart(3, '0')}`
      : `--- / ${String(speciesEntries.length).padStart(3, '0')}`;

  function selectSpecies(id) {
    selectedSpecies = id;
    mode = 'species';
    tab = 'geral';
  }

  function statusKey(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('plantado')) return 'plantado';
    if (e.includes('colher')) return 'acolher';
    if (e.includes('termin')) return 'terminado';
    if (e.includes('repouso')) return 'emrepouso';
    if (e.includes('planea')) return 'planeado';
    return 'default';
  }
</script>

<svelte:head>
  <title>Hortidex — SmartFarm</title>
</svelte:head>

<div class="dex-page">
  <!-- Top bar -->
  <div class="topbar">
    <div class="topbar-left">
      <div class="dex-logo"><span class="dex-logo-leaf"></span></div>
      <div class="logo-titles">
        <div class="logo-title">HORTIDEX</div>
        <div class="logo-sub">CADERNO DE CAMPO · SMARTFARM</div>
      </div>
    </div>
    <div class="topbar-right">
      <div class="mode-tabs">
        <button class="mode-tab" class:mode-tab-on={mode === 'beds'}
          on:click={() => { mode = 'beds'; }}>
          <span class="mode-tab-icon">🌱</span> CANTEIROS
        </button>
        <button class="mode-tab" class:mode-tab-on={mode === 'species'}
          on:click={() => { mode = 'species'; }}>
          <span class="mode-tab-icon">🌿</span> PLANTAS
        </button>
      </div>
      <a class="back-btn" href="/">◀ QUINTA</a>
    </div>
  </div>

  <!-- Device frame -->
  <div class="dex-device">
    <div class="dex-device-header">
      <div class="dex-lens"></div>
      <div class="dex-leds-wrap">
        <div class="dex-led dex-led-r"></div>
        <div class="dex-led dex-led-y"></div>
        <div class="dex-led dex-led-g"></div>
      </div>
      <div class="dex-strap"><span></span></div>
      <div class="dex-counter">{counter}</div>
    </div>

    <div class="dex-body">
      <!-- LEFT PAGE -->
      <div class="dex-leftpage">
        <!-- Screen -->
        <div class="dex-screen">
          <div class="dex-screen-cloud"></div>
          <div class="dex-screen-cloud-2"></div>

          {#if mode === 'beds' && bed}
            <div class="dex-screen-id">N.º {bed.notionCode}</div>
            <div class="dex-screen-tag">{bed.widthM}×{bed.heightM} m</div>
            <div class="dex-bed-diorama">
              <div class="diorama-bed" class:diorama-narrow={bed.widthM <= 1.7}>
                <div class="diorama-soil" style:grid-template-columns={bed.widthM <= 1.7 ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)'}>
                  {#each (bed.plantings || []).slice(0, bed.widthM <= 1.7 ? 8 : 12) as p}
                    {#if PLANT_SPECIES[p.species]}
                      <div class="diorama-cell">
                        <PlantSprite kind={PLANT_SPECIES[p.species].sprite} stage={3} scale={2} />
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
          {:else if mode === 'species' && species}
            <div class="dex-screen-id">{species.emoji} {species.name}</div>
            <div class="dex-sprite-stage">
              <div class="dex-sprite-shadow"></div>
              <div class="dex-sprite-bob">
                <PlantSprite kind={species.sprite} stage={3} scale={8} />
              </div>
            </div>
          {:else}
            <div class="dex-sprite-stage">
              <div style="font-family: 'Press Start 2P', monospace; font-size: 12px; color: #888; text-align: center;">
                Selecciona um item
              </div>
            </div>
          {/if}
        </div>

        <!-- Spec readout -->
        <div class="dex-spec-pad">
          {#if mode === 'beds' && bed}
            <div class="row"><span class="lbl">ID</span> <span class="val">{selectedBedId} · {bed.notionCode}</span></div>
            <div class="row"><span class="lbl">DIMENSÕES</span> <span class="val">{bed.widthM}×{bed.heightM} m · {(bed.widthM*bed.heightM).toFixed(2)} m²</span></div>
            <div class="row"><span class="lbl">CULTURAS</span> <span class="val">{bed.plantings?.length || 0}</span></div>
            <div class="row"><span class="lbl">FAMÍLIAS</span> <span class="val">{bedFamilies.length}</span></div>
            <div class="row"><span class="lbl">ROTAÇÃO</span> <span class="val warn">{bed.rotation}</span></div>
          {:else if mode === 'species' && species}
            <div class="row"><span class="lbl">NOME</span> <span class="val">{species.name}</span></div>
            <div class="row"><span class="lbl">FAMÍLIA</span> <span class="val">{species.family}</span></div>
            <div class="row"><span class="lbl">CICLO</span> <span class="val">{species.growthDays} dias</span></div>
            <div class="row"><span class="lbl">SPRITE</span> <span class="val">{species.sprite}</span></div>
          {/if}
        </div>

        <!-- Controls -->
        <div class="dex-controls">
          <div class="dpad">
            <div class="dpad-cross"></div>
            <div class="dpad-hub"></div>
          </div>
          <div class="dex-action-btns">
            <div class="act-btn act-btn-b"></div>
            <div class="act-btn act-btn-a"></div>
          </div>
        </div>
      </div>

      <!-- RIGHT PAGE -->
      <div class="dex-rightpage">
        {#if mode === 'beds' && bed}
          <div class="dex-namebar">
            <div>
              <div class="dex-name">CANTEIRO {bed.notionCode}</div>
              <div class="dex-name-sub">{bed.season} · {bed.rotation}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <div class="dex-id-tag">{selectedBedId}</div>
              <span class="status-pill status-{statusKey(bed.estado)}">{bed.estado}</span>
            </div>
          </div>

          <div class="dex-rtabs">
            {#each ['geral', 'cultivos', 'rotação', 'histórico'] as t}
              <button class="dex-rtab" class:dex-rtab-on={tab === t} on:click={() => { tab = t; }}>
                {t.toUpperCase()}
              </button>
            {/each}
          </div>

          <div class="dex-paper">
            {#if tab === 'geral'}
              <div class="dex-desc">{bed.notes}</div>
              <div class="dex-section-title">SENSORES</div>
              <div class="dex-stats">
                <StatBar label="HUMIDADE" value={0.6} color="#4fc3f7" height={14} />
                <StatBar label="SOLO" value={0.8} color="#5cd96b" height={14} />
                <StatBar label="ERVAS" value={0.2} color="#a4d96b" height={14} />
                <StatBar label="PRAGAS" value={0.1} color="#c73030" height={14} />
              </div>
              <div class="dex-section-title">DATAS</div>
              <div class="dex-dates">
                <div class="row"><span class="lbl">PLANTADO</span> {fmtDate(bed.plantedDate)} <span class="dim">({daysSince(bed.plantedDate)}d)</span></div>
                <div class="row"><span class="lbl">COLHEITA</span> {fmtDate(bed.harvestStart)}{bed.harvestEnd ? ' — ' + fmtDate(bed.harvestEnd) : ''}</div>
                <div class="row"><span class="lbl">FASE</span> <span class="phase">{bedPhase(bed)}</span></div>
              </div>
              {#if bed.pestNotes}
                <div class="dex-note" class:dex-note-warn={bed.pestNotes.includes('⚠')}>{bed.pestNotes}</div>
              {/if}
            {:else if tab === 'cultivos'}
              <div class="dex-section-title">{bed.plantings?.length || 0} CULTURAS · {bedFamilies.length} FAMÍLIAS</div>
              <div class="dex-plantings">
                {#each bed.plantings || [] as p}
                  {#if PLANT_SPECIES[p.species]}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="dex-planting" on:click={() => selectSpecies(p.species)}>
                      <div class="dex-planting-sprite">
                        <PlantSprite kind={PLANT_SPECIES[p.species].sprite} stage={3} scale={3} />
                      </div>
                      <div>
                        <div class="dex-planting-name">{PLANT_SPECIES[p.species].name}</div>
                        <div class="dex-planting-fam">{PLANT_SPECIES[p.species].family} · {p.fn}</div>
                      </div>
                      <div class="dex-planting-count">×{p.count}</div>
                    </div>
                  {/if}
                {/each}
              </div>
            {:else if tab === 'rotação'}
              <div class="dex-section-title">CICLO ATUAL</div>
              <div class="dex-stats">
                <StatBar label="PROGRESSO" value={bedCycleProgress(bed)} color="#5cd96b" height={14} />
              </div>
              <div class="dex-dates">
                <div class="row"><span class="lbl">CICLO MÉDIO</span> {bedAvgCycle(bed)} dias</div>
                <div class="row"><span class="lbl">RESTANTES</span> {Math.max(0, bedAvgCycle(bed) - (daysSince(bed.plantedDate) || 0))} dias</div>
              </div>
              {#if bed.nextRotation}
                <div class="dex-note dex-note-next">{bed.nextRotation}</div>
              {/if}
            {:else if tab === 'histórico'}
              {#if bed.history?.length}
                {#each bed.history as h}
                  <div class="dex-history-row">
                    <div class="dex-history-season">{h.season}</div>
                    <div class="dex-history-plants">{(h.plants || []).join(' · ')}</div>
                    {#if h.notes}<div class="dex-history-notes">{h.notes}</div>{/if}
                  </div>
                {/each}
              {:else}
                <div class="dex-desc" style="color: var(--text-soft); font-style: italic;">Sem histórico.</div>
              {/if}
            {/if}
          </div>

        {:else if mode === 'species' && species && lore}
          <div class="dex-namebar">
            <div>
              <div class="dex-name">{species.emoji} {species.name}</div>
              <div class="dex-name-sub">{species.family} · {species.growthDays} dias</div>
            </div>
          </div>

          <div class="dex-rtabs">
            {#each ['geral', 'cultivo', 'consociação'] as t}
              <button class="dex-rtab" class:dex-rtab-on={tab === t} on:click={() => { tab = t; }}>{t.toUpperCase()}</button>
            {/each}
          </div>

          <div class="dex-paper">
            {#if tab === 'geral'}
              <div class="dex-desc">{lore.desc}</div>
              <div class="dex-section-title">FASES DE CRESCIMENTO</div>
              <div class="dex-stages">
                {#each [0,1,2,3] as stage}
                  <div class="dex-stage">
                    <div class="dex-stage-art">
                      <PlantSprite kind={species.sprite} {stage} scale={4} />
                    </div>
                    <div class="dex-stage-lbl">{['SEMENTE','JOVEM','MADURA','PRONTA'][stage]}</div>
                  </div>
                {/each}
              </div>
              {#if lore.notes}
                <div class="dex-note">{lore.notes}</div>
              {/if}
            {:else if tab === 'cultivo'}
              <div class="dex-section-title">CONDIÇÕES</div>
              <div class="dex-info-grid">
                <div>{lore.sun}</div>
                <div>💧 {lore.water}</div>
                <div>📏 {lore.spacing}</div>
                <div>🌱 Germinação: {lore.germDays}d</div>
                <div>📅 Semear: {lore.sowFrom}–{lore.sowTo}</div>
                <div>🌿 Plantar: {lore.plantFrom}–{lore.plantTo}</div>
              </div>
              {@const inBeds = bedsForSpecies(selectedSpecies)}
              {#if inBeds.length}
                <div class="dex-section-title">PRESENTE EM</div>
                <div class="dex-beds-grid">
                  {#each inBeds as b}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="dex-bed-pill" on:click={() => { selectedBedId = b.bedId; mode = 'beds'; tab = 'cultivos'; }}>
                      <div class="dex-bed-pill-code">{b.code}</div>
                      <div class="dex-bed-pill-meta">×{b.count} · {b.fn}</div>
                    </div>
                  {/each}
                </div>
              {/if}
            {:else if tab === 'consociação'}
              <div class="dex-pair-grid">
                <div>
                  <div class="dex-pair-col-title dex-pair-good">✓ COMPANHEIROS</div>
                  <div class="dex-pair-list">
                    {#each lore.companions || [] as c}
                      {#if PLANT_SPECIES[c]}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span class="dex-pair-chip" on:click={() => selectSpecies(c)}>
                          <PlantSprite kind={PLANT_SPECIES[c].sprite} stage={3} scale={1.5} />
                          {PLANT_SPECIES[c].name}
                        </span>
                      {/if}
                    {/each}
                    {#if !lore.companions?.length}
                      <span class="dex-pair-empty">—</span>
                    {/if}
                  </div>
                </div>
                <div>
                  <div class="dex-pair-col-title dex-pair-bad">✗ EVITAR</div>
                  <div class="dex-pair-list">
                    {#each lore.avoid || [] as a}
                      {#if PLANT_SPECIES[a]}
                        <span class="dex-pair-chip">
                          <PlantSprite kind={PLANT_SPECIES[a].sprite} stage={3} scale={1.5} />
                          {PLANT_SPECIES[a].name}
                        </span>
                      {:else}
                        <span class="dex-pair-chip">{a}</span>
                      {/if}
                    {/each}
                    {#if !lore.avoid?.length}
                      <span class="dex-pair-empty">—</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="dex-namebar">
            <div class="dex-name">Selecciona um item</div>
          </div>
          <div class="dex-paper">
            <div class="dex-desc" style="text-align: center; padding: 60px 0; color: var(--text-soft);">
              ← Clica num item da lista abaixo.
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Index strip -->
  <div class="dex-index">
    <div class="dex-index-head">
      <div class="dex-index-title">{mode === 'beds' ? '🌱 CANTEIROS' : '🌿 PLANTAS'}</div>
      <input class="dex-search" placeholder="Pesquisar..." bind:value={search} />
    </div>
    <div class="dex-index-list">
      {#if mode === 'beds'}
        {#each filteredBeds as [id, b]}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="dex-entry" class:dex-entry-on={selectedBedId === id}
            on:click={() => { selectedBedId = id; tab = 'geral'; }}>
            <div class="dex-entry-sprite">
              {#if b.plantings?.[0] && PLANT_SPECIES[b.plantings[0].species]}
                <PlantSprite kind={PLANT_SPECIES[b.plantings[0].species].sprite} stage={3} scale={2} />
              {/if}
            </div>
            <div class="dex-entry-body">
              <div class="dex-entry-id">{b.notionCode}</div>
              <div class="dex-entry-name">{id} · {b.plantings?.length || 0} culturas</div>
              <div class="dex-entry-tag">{b.widthM}×{b.heightM}m · {b.estado}</div>
            </div>
          </div>
        {/each}
      {:else}
        {#each filteredSpecies as [id, sp]}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="dex-entry" class:dex-entry-on={selectedSpecies === id}
            on:click={() => selectSpecies(id)}>
            <div class="dex-entry-sprite">
              <PlantSprite kind={sp.sprite} stage={3} scale={2} />
            </div>
            <div class="dex-entry-body">
              <div class="dex-entry-id">{sp.family}</div>
              <div class="dex-entry-name">{sp.name}</div>
              <div class="dex-entry-tag">{sp.growthDays}d · {sp.emoji}</div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .dex-page { position: relative; z-index: 1; max-width: 1380px; margin: 0 auto; padding: 24px 28px 60px; }

  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .dex-logo {
    width: 64px; height: 64px; background: #fff8dc; border-radius: 50%;
    box-shadow: 0 0 0 4px var(--ink), inset 0 0 0 3px rgba(255,255,255,0.5), 0 5px 0 var(--ink);
    display: flex; align-items: center; justify-content: center;
  }
  .dex-logo-leaf {
    display: block; width: 34px; height: 34px;
    background: radial-gradient(circle at 30% 30%, #7ec850 0 9px, transparent 10px), linear-gradient(135deg, #4f7d31, #7ec850);
    border-radius: 0 60% 0 60%; transform: rotate(-15deg); box-shadow: inset 0 0 0 2px #2d5018;
  }
  .logo-titles { display: flex; flex-direction: column; }
  .logo-title { font-family: 'Press Start 2P', monospace; font-size: 22px; color: var(--ink); letter-spacing: 2px; text-shadow: 2px 2px 0 #fff; }
  .logo-sub { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent); margin-top: 6px; letter-spacing: 1px; }
  .mode-tabs {
    display: inline-flex; background: #fff8dc; border-radius: 6px; padding: 4px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 4px 0 var(--ink);
  }
  .mode-tab {
    font-family: 'Press Start 2P', monospace; font-size: 11px; background: transparent; color: var(--text-soft);
    border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; letter-spacing: 1px;
    display: flex; align-items: center; gap: 8px;
  }
  .mode-tab-on { background: #ffe16a; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
  .mode-tab-icon { font-size: 14px; }
  .back-btn {
    font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); background: #ffe16a;
    text-decoration: none; padding: 10px 14px; border-radius: 4px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 4px 0 var(--ink);
    letter-spacing: 1px; transition: transform 100ms;
  }
  .back-btn:hover { transform: translateY(-1px); }

  /* Device frame */
  .dex-device {
    background:
      repeating-linear-gradient(90deg, var(--bed-wood) 0 38px, var(--bed-wood-dk, #5a3a1a) 38px 42px, #b07a3a 42px 80px, var(--bed-wood-dk, #5a3a1a) 80px 84px),
      linear-gradient(180deg, #b07a3a 0%, var(--bed-wood) 30%, var(--bed-wood-dk, #5a3a1a) 100%);
    background-blend-mode: multiply;
    border-radius: 10px; padding: 18px;
    box-shadow: 0 0 0 4px var(--ink), inset 0 0 0 3px rgba(0,0,0,0.35), inset 0 -8px 0 rgba(0,0,0,0.25), 0 10px 0 #3a2410, 0 14px 30px rgba(0,0,0,0.4);
  }
  .dex-device-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .dex-lens {
    width: 52px; height: 52px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff 0 4px, transparent 5px), radial-gradient(circle at center, #fff8dc 0 40%, #ffe16a 42% 70%, #b9802a 72% 100%);
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(0,0,0,0.35);
  }
  .dex-leds-wrap { display: flex; gap: 8px; margin-left: 4px; background: rgba(0,0,0,0.25); padding: 4px 6px; border-radius: 12px; }
  .dex-led {
    width: 14px; height: 14px; border-radius: 50%;
    box-shadow: 0 0 0 2px var(--ink), inset 0 0 0 1px rgba(255,255,255,0.4);
  }
  .dex-led-r { background: var(--accent); animation: ledBlink 1.4s steps(2) infinite; }
  .dex-led-y { background: #ffe16a; animation: ledBlink 1.4s steps(2) infinite 0.4s; }
  .dex-led-g { background: var(--grass); animation: ledBlink 1.4s steps(2) infinite 0.8s; }
  @keyframes ledBlink { 0%, 50% { filter: brightness(0.6); } 50.01%, 100% { filter: brightness(1.2); } }
  .dex-strap {
    flex: 1; height: 18px; background: var(--bed-wood-dk, #5a3a1a);
    background-image: repeating-linear-gradient(90deg, transparent 0 10px, rgba(0,0,0,0.25) 10px 12px);
    border-radius: 3px; box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 3px rgba(255,255,255,0.15);
    position: relative;
  }
  .dex-strap::after {
    content: ''; position: absolute; left: 6px; right: 6px; top: 50%; transform: translateY(-50%);
    height: 0; border-top: 1.5px dashed #fff8dc; opacity: 0.6;
  }
  .dex-counter {
    background: var(--ink); color: #ffe16a; font-family: 'VT323', monospace; font-size: 22px;
    padding: 6px 10px; border-radius: 3px;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.15), 0 2px 0 rgba(0,0,0,0.4);
    letter-spacing: 1px; white-space: nowrap;
  }

  .dex-body { display: grid; grid-template-columns: 480px 1fr; gap: 18px; align-items: stretch; }
  .dex-leftpage { display: flex; flex-direction: column; gap: 14px; }

  /* Screen */
  .dex-screen {
    position: relative;
    background: linear-gradient(180deg, #cfeeff 0%, #a4d4ff 60%, var(--grass) 60%, #4f7d31 100%);
    border-radius: 6px; padding: 14px; min-height: 260px; overflow: hidden;
    box-shadow: inset 0 0 0 4px var(--ink), inset 0 0 0 8px #cfd6d8, inset 0 0 0 10px var(--ink), 0 4px 0 var(--ink);
  }
  .dex-screen::before {
    content: ''; position: absolute; inset: 10px;
    background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px);
    pointer-events: none; z-index: 5;
  }
  .dex-screen-cloud {
    position: absolute; top: 18px; left: 24px; width: 60px; height: 14px;
    background: radial-gradient(ellipse 30px 8px at 30% 50%, #fff 0 70%, transparent 71%), radial-gradient(ellipse 22px 6px at 70% 60%, #fff 0 70%, transparent 71%);
    opacity: 0.85; pointer-events: none; z-index: 1;
  }
  .dex-screen-cloud-2 {
    position: absolute; top: 36px; right: 30px; width: 80px; height: 16px;
    background: radial-gradient(ellipse 40px 9px at 40% 50%, #fff 0 70%, transparent 71%);
    opacity: 0.7; pointer-events: none; z-index: 1;
  }
  .dex-screen-id {
    position: absolute; top: 12px; right: 14px; z-index: 7;
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: var(--ink); color: #ffe16a; padding: 5px 8px; border-radius: 3px;
    letter-spacing: 1px; box-shadow: 0 2px 0 rgba(0,0,0,0.4);
  }
  .dex-screen-tag {
    position: absolute; bottom: 12px; left: 14px; z-index: 7;
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    background: rgba(0,0,0,0.7); color: #fff8dc; padding: 4px 7px; border-radius: 2px;
  }
  .dex-sprite-stage {
    position: relative; z-index: 3; display: flex; align-items: flex-end; justify-content: center;
    height: 210px; padding-bottom: 30px;
  }
  .dex-sprite-bob { animation: spriteBob 1.4s steps(2) infinite; }
  @keyframes spriteBob { 0%, 50% { transform: translateY(0); } 50.01%, 100% { transform: translateY(-3px); } }
  .dex-sprite-shadow {
    position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
    width: 80px; height: 8px; background: rgba(0,0,0,0.45); border-radius: 50%; filter: blur(2px); z-index: 2;
  }
  .dex-bed-diorama {
    position: relative; z-index: 3; display: flex; align-items: flex-end; justify-content: center;
    height: 210px; padding-bottom: 10px;
  }
  .diorama-bed {
    position: relative; width: 320px; height: 130px;
    background: linear-gradient(180deg, var(--bed-wood) 0%, var(--bed-wood-dk, #5a3a1a) 100%);
    border-radius: 6px;
    box-shadow: inset 0 0 0 3px #3a2410, inset 0 -6px 0 rgba(0,0,0,0.25), 0 5px 0 #3a2410;
    padding: 10px;
  }
  .diorama-narrow { width: 200px; }
  .diorama-soil {
    position: absolute; inset: 10px 10px 14px 10px;
    background: linear-gradient(180deg, #6a4a2a 0%, #4a3018 100%);
    border-radius: 3px; box-shadow: inset 0 0 0 2px #3a2410, inset 0 4px 0 rgba(0,0,0,0.2);
    overflow: hidden; display: grid; grid-template-rows: repeat(2, 1fr);
    padding: 6px; gap: 4px; align-items: center; justify-items: center;
  }
  .diorama-cell { display: flex; align-items: center; justify-content: center; }

  /* Spec readout */
  .dex-spec-pad {
    background: var(--ink); border-radius: 4px; padding: 10px 14px;
    box-shadow: inset 0 0 0 3px #2e2e2e, 0 3px 0 #050505;
    color: #5cd96b; font-family: 'VT323', monospace; font-size: 18px; line-height: 1.4;
  }
  .dex-spec-pad .row { display: flex; justify-content: space-between; gap: 12px; }
  .dex-spec-pad .lbl { color: #8acaff; }
  .dex-spec-pad .val { color: #5cd96b; }
  .dex-spec-pad .warn { color: #ffe16a; }

  /* Controls */
  .dex-controls { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px 0; }
  .dpad { width: 56px; height: 56px; position: relative; }
  .dpad-cross {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 33%, var(--ink) 33% 67%, transparent 67%), linear-gradient(0deg, transparent 33%, var(--ink) 33% 67%, transparent 67%);
  }
  .dpad-hub { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #2a2a2a; border-radius: 2px; }
  .dex-action-btns { display: flex; gap: 8px; }
  .act-btn {
    width: 24px; height: 24px; border-radius: 50%;
    box-shadow: 0 0 0 2px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.3), 0 3px 0 var(--ink);
  }
  .act-btn-a { background: #ffe16a; }
  .act-btn-b { background: #4fc3f7; }

  /* Right page */
  .dex-rightpage {
    background: radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.4), transparent 50%), linear-gradient(180deg, #fff8dc 0%, #f7f0c8 100%);
    border-radius: 8px; padding: 14px;
    box-shadow: inset 0 0 0 3px var(--ink), inset 0 0 0 5px rgba(255,255,255,0.6), 0 4px 0 #3a2410;
    display: flex; flex-direction: column; gap: 12px;
  }
  .dex-namebar {
    background: #4f7d31; padding: 12px 14px; border-radius: 4px;
    box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 4px rgba(255,255,255,0.18);
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .dex-name { font-family: 'Press Start 2P', monospace; font-size: 16px; color: #fff8dc; letter-spacing: 1px; line-height: 1.2; text-shadow: 1px 1px 0 rgba(0,0,0,0.3); }
  .dex-name-sub { font-family: 'VT323', monospace; font-size: 16px; color: #ffe16a; font-style: italic; margin-top: 4px; }
  .dex-id-tag { font-family: 'Press Start 2P', monospace; font-size: 12px; color: #ffe16a; letter-spacing: 1px; text-shadow: 1px 1px 0 rgba(0,0,0,0.3); }
  .dex-rtabs { display: flex; gap: 4px; }
  .dex-rtab {
    font-family: 'Press Start 2P', monospace; font-size: 9px; padding: 8px 10px;
    background: var(--bed-wood-dk, #5a3a1a); color: #fff8dc; border: none; cursor: pointer;
    border-radius: 4px 4px 0 0; letter-spacing: 0.5px; box-shadow: inset 0 -3px 0 rgba(0,0,0,0.3);
  }
  .dex-rtab-on { background: #fff; color: var(--ink); box-shadow: inset 0 -3px 0 #ffe16a, inset 0 0 0 2px var(--ink); }

  .dex-paper {
    background: #fff; border-radius: 0 4px 4px 4px; padding: 14px;
    box-shadow: inset 0 0 0 2px var(--ink); min-height: 320px; flex: 1;
    display: flex; flex-direction: column; gap: 12px;
    background-image: linear-gradient(90deg, rgba(199,48,48,0.18) 0 2px, transparent 2px 18px), repeating-linear-gradient(0deg, transparent 0 22px, rgba(0,0,0,0.04) 22px 23px);
    background-position: 24px 0, 0 0;
  }
  .dex-desc { font-family: 'VT323', monospace; font-size: 19px; line-height: 1.35; color: var(--ink); background: #fff; padding: 10px 12px; border-radius: 3px; box-shadow: 0 0 0 2px var(--ink); }
  .dex-section-title {
    font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent); letter-spacing: 0.5px;
    margin: 2px 0 4px; border-bottom: 2px dashed var(--ink); padding-bottom: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  .dex-section-title::before { content: '▶'; color: var(--ink); }
  .dex-stats { display: flex; flex-direction: column; gap: 6px; }
  .dex-dates { display: flex; flex-direction: column; gap: 4px; }
  .dex-dates .row { font-family: 'VT323', monospace; font-size: 17px; display: flex; gap: 8px; }
  .dex-dates .lbl { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--text-soft); min-width: 90px; }
  .dex-dates .dim { color: var(--text-soft); }
  .dex-dates .phase { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent); }

  .dex-plantings { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .dex-planting {
    background: #fff; padding: 6px 8px; border-radius: 2px; box-shadow: 0 0 0 2px var(--ink);
    display: grid; grid-template-columns: 28px 1fr auto; gap: 6px; align-items: center; cursor: pointer;
    transition: background 80ms;
  }
  .dex-planting:hover { background: #ffe16a; }
  .dex-planting-sprite { display: flex; justify-content: center; }
  .dex-planting-name { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--ink); letter-spacing: 0.2px; line-height: 1.1; }
  .dex-planting-fam { font-family: 'VT323', monospace; font-size: 13px; color: var(--text-soft); font-style: italic; margin-top: 2px; }
  .dex-planting-count { background: var(--ink); color: #fff; padding: 2px 5px; border-radius: 2px; font-family: 'Press Start 2P', monospace; font-size: 8px; }

  .dex-stages { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .dex-stage { background: #fff; padding: 8px 6px 6px; border-radius: 2px; box-shadow: 0 0 0 2px var(--ink); text-align: center; }
  .dex-stage-art {
    height: 64px; display: flex; align-items: flex-end; justify-content: center;
    background: linear-gradient(180deg, #cfeeff 0% 70%, #86c46b 70% 100%);
    border-radius: 2px; margin-bottom: 4px; box-shadow: inset 0 0 0 1px var(--ink);
  }
  .dex-stage-lbl { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--ink); letter-spacing: 0.3px; }
  .dex-note { font-family: 'VT323', monospace; font-size: 16px; line-height: 1.3; padding: 8px 10px; border-radius: 2px; background: #fff; box-shadow: 0 0 0 2px var(--ink); }
  .dex-note-warn { background: #ffe2e2; box-shadow: 0 0 0 2px var(--accent); }
  .dex-note-next { background: #e2ffe2; box-shadow: 0 0 0 2px #4f7d31; }
  .dex-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-family: 'VT323', monospace; font-size: 18px; }
  .dex-pair-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .dex-pair-col-title { font-family: 'Press Start 2P', monospace; font-size: 8px; letter-spacing: 0.3px; margin-bottom: 4px; }
  .dex-pair-good { color: #4f7d31; }
  .dex-pair-bad { color: var(--accent); }
  .dex-pair-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .dex-pair-chip {
    background: #fff; padding: 4px 6px; font-family: 'VT323', monospace; font-size: 14px;
    color: var(--ink); border-radius: 2px; box-shadow: 0 0 0 1.5px var(--ink);
    display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  }
  .dex-pair-empty { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-dim); font-style: italic; }
  .dex-beds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .dex-bed-pill {
    background: #fff; padding: 6px 8px; border-radius: 2px;
    box-shadow: 0 0 0 1.5px var(--ink); cursor: pointer; transition: transform 100ms;
  }
  .dex-bed-pill:hover { transform: translateY(-1px); }
  .dex-bed-pill-code { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--accent); }
  .dex-bed-pill-meta { font-family: 'VT323', monospace; font-size: 13px; color: var(--text-soft); }
  .dex-history-row { background: #fff; padding: 6px 8px; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); margin-bottom: 4px; }
  .dex-history-season { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--accent); margin-bottom: 3px; }
  .dex-history-plants { font-family: 'VT323', monospace; font-size: 15px; color: var(--ink); }
  .dex-history-notes { font-family: 'VT323', monospace; font-size: 13px; color: var(--text-soft); font-style: italic; margin-top: 2px; }
  .status-pill {
    display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 8px;
    padding: 4px 6px; border-radius: 2px; box-shadow: 0 0 0 2px var(--ink); letter-spacing: 0.3px;
  }
  .status-plantado { background: #5cd96b; color: var(--bg-0); }
  .status-acolher { background: #ffe16a; color: var(--accent); }

  /* Index strip */
  .dex-index {
    margin-top: 18px;
    background: repeating-linear-gradient(90deg, #b07a3a 0 38px, var(--bed-wood-dk, #5a3a1a) 38px 42px, var(--bed-wood) 42px 80px, var(--bed-wood-dk, #5a3a1a) 80px 84px);
    border-radius: 8px; padding: 14px 16px 16px;
    box-shadow: 0 0 0 4px var(--ink), inset 0 0 0 3px rgba(0,0,0,0.35), 0 6px 0 #3a2410;
  }
  .dex-index-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 12px; }
  .dex-index-title {
    font-family: 'Press Start 2P', monospace; font-size: 12px; color: #fff8dc; letter-spacing: 1px;
    text-shadow: 2px 2px 0 var(--ink); background: #4f7d31; padding: 6px 10px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 2px 0 var(--ink);
  }
  .dex-search {
    flex: 1; max-width: 320px; font-family: 'VT323', monospace; font-size: 18px;
    background: #fff; color: var(--ink); padding: 8px 12px; border-radius: 4px;
    box-shadow: inset 0 0 0 2px var(--ink), 0 3px 0 var(--ink); border: none; outline: none;
  }
  .dex-search::placeholder { color: rgba(0,0,0,0.35); }
  .dex-index-list {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px; max-height: 340px; overflow-y: auto; padding: 6px 8px 6px 2px;
  }
  .dex-index-list::-webkit-scrollbar { width: 10px; }
  .dex-index-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.25); border-radius: 4px; }
  .dex-index-list::-webkit-scrollbar-thumb { background: #ffe16a; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--ink); }
  .dex-entry {
    background: #fff8dc; padding: 8px 10px; border-radius: 4px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink); cursor: pointer;
    display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center;
    transition: transform 80ms; min-height: 60px;
  }
  .dex-entry:hover { transform: translateY(-2px); }
  .dex-entry-on {
    background: #ffe16a;
    box-shadow: 0 0 0 3px var(--accent), 0 0 0 5px #fff8dc, 0 5px 0 var(--accent);
    transform: translateY(-1px);
  }
  .dex-entry-sprite {
    background: #cfeeff; border-radius: 2px; box-shadow: inset 0 0 0 1.5px var(--ink);
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .dex-entry-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .dex-entry-id { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--accent); letter-spacing: 0.5px; }
  .dex-entry-name { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--ink); letter-spacing: 0.2px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dex-entry-tag { font-family: 'VT323', monospace; font-size: 12px; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  @media (max-width: 1199px) { .dex-body { grid-template-columns: 1fr; } }
  @media (max-width: 720px) {
    .dex-page { padding: 14px 14px 60px; }
    .topbar { flex-direction: column; align-items: flex-start; }
    .dex-plantings { grid-template-columns: 1fr; }
    .dex-stages { grid-template-columns: 1fr 1fr; }
  }
</style>

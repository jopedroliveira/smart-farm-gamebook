<!--
  Hortidex — Pokédex-style plant and bed encyclopedia.
  Simplified initial version with the species browser and bed viewer.
-->
<script>
  import { PLANT_SPECIES, FAMILY_COLORS } from '$lib/data/plant-species.js';
  import { NOTION_BEDS, daysSince, bedPhase, bedCycleProgress, bedAvgCycle } from '$lib/data/beds.js';
  import { PLANT_LORE, bedsForSpecies, fmtDate } from '$lib/data/plant-lore.js';
  import PlantSprite from '$lib/components/PlantSprite.svelte';
  import PixelPanel from '$lib/components/PixelPanel.svelte';
  import StatBar from '$lib/components/StatBar.svelte';

  let mode = 'beds'; // 'beds' | 'species'
  let selectedBedId = 'C2';
  let selectedSpecies = null;
  let tab = 'geral';

  $: bedEntries = Object.entries(NOTION_BEDS);
  $: speciesEntries = Object.entries(PLANT_SPECIES);
  $: bed = NOTION_BEDS[selectedBedId];
  $: species = selectedSpecies ? PLANT_SPECIES[selectedSpecies] : null;
  $: lore = selectedSpecies ? PLANT_LORE[selectedSpecies] : null;
  $: bedFamilies = bed?.plantings
    ? [...new Set(bed.plantings.map(p => PLANT_SPECIES[p.species]?.family).filter(Boolean))]
    : [];

  function selectSpecies(id) {
    selectedSpecies = id;
    mode = 'species';
    tab = 'geral';
  }
</script>

<svelte:head>
  <title>Hortidex — SmartFarm</title>
</svelte:head>

<div class="dex-root">
  <!-- Top navigation -->
  <div class="dex-topnav">
    <a href="/" class="dex-back">◀ HORTA</a>
    <div class="dex-title-row">
      <div class="dex-book-icon"></div>
      <h1 class="dex-title">HORTIDEX</h1>
    </div>
    <div class="dex-mode-toggle">
      <button class="dex-mode-btn" class:active={mode === 'beds'} on:click={() => { mode = 'beds'; }}>
        🌱 CANTEIROS
      </button>
      <button class="dex-mode-btn" class:active={mode === 'species'} on:click={() => { mode = 'species'; }}>
        📖 ESPÉCIES
      </button>
    </div>
  </div>

  <div class="dex-layout">
    <!-- Left: list -->
    <div class="dex-list-panel">
      <PixelPanel color="#fff" accent="#1d1d1d" padding={0}>
        {#if mode === 'beds'}
          {#each bedEntries as [id, b]}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="dex-list-item"
              class:active={selectedBedId === id}
              on:click={() => { selectedBedId = id; tab = 'geral'; }}
            >
              <div class="dex-list-sprite">
                {#if b.plantings?.[0] && PLANT_SPECIES[b.plantings[0].species]}
                  <PlantSprite kind={PLANT_SPECIES[b.plantings[0].species].sprite} stage={3} scale={2} />
                {/if}
              </div>
              <div class="dex-list-info">
                <div class="dex-list-name">{b.notionCode}</div>
                <div class="dex-list-sub">{b.plantings?.length || 0} culturas · {b.widthM}×{b.heightM}m</div>
              </div>
              <div class="dex-list-badge" class:harvest={b.estado === 'A colher'}>
                {b.estado}
              </div>
            </div>
          {/each}
        {:else}
          {#each speciesEntries as [id, sp]}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="dex-list-item"
              class:active={selectedSpecies === id}
              on:click={() => selectSpecies(id)}
            >
              <div class="dex-list-sprite">
                <PlantSprite kind={sp.sprite} stage={3} scale={2} />
              </div>
              <div class="dex-list-info">
                <div class="dex-list-name">{sp.name}</div>
                <div class="dex-list-sub">
                  <span class="fam-chip" style:background={FAMILY_COLORS[sp.family] || '#5a5a5a'}>{sp.family}</span>
                </div>
              </div>
              <div class="dex-list-emoji">{sp.emoji}</div>
            </div>
          {/each}
        {/if}
      </PixelPanel>
    </div>

    <!-- Right: detail -->
    <div class="dex-detail-panel">
      {#if mode === 'beds' && bed}
        <PixelPanel color="#fff" accent="#1d1d1d" padding={16}>
          <!-- Bed header -->
          <div class="dex-header">
            <div>
              <div class="dex-name">CANTEIRO {bed.notionCode}</div>
              <div class="dex-name-sub">{bed.season} · {bed.rotation}</div>
            </div>
            <div class="dex-id-badge">{selectedBedId}</div>
          </div>

          <!-- Diorama -->
          <div class="dex-diorama">
            {#each bed.plantings?.slice(0, 12) || [] as p}
              {@const sp = PLANT_SPECIES[p.species]}
              {#if sp}
                <div class="diorama-cell">
                  <PlantSprite kind={sp.sprite} stage={3} scale={3} />
                </div>
              {/if}
            {/each}
          </div>

          <!-- Tabs -->
          <div class="dex-tabs">
            {#each ['geral', 'cultivos', 'rotação', 'histórico'] as t}
              <button class="dex-tab" class:active={tab === t} on:click={() => { tab = t; }}>
                {t.toUpperCase()}
              </button>
            {/each}
          </div>

          <div class="dex-content">
            {#if tab === 'geral'}
              <div class="dex-desc">{bed.notes}</div>
              <div class="dex-section-title">SENSORES</div>
              <div class="dex-bars">
                <StatBar label="ÁGUA" value={0.6} color="#4fc3f7" />
                <StatBar label="SOLO" value={0.8} color="#5cd96b" />
              </div>
              <div class="dex-section-title">DATAS</div>
              <div class="dex-dates">
                <div><span class="lbl">PLANTADO</span> {fmtDate(bed.plantedDate)} ({daysSince(bed.plantedDate)}d)</div>
                <div><span class="lbl">COLHEITA</span> {fmtDate(bed.harvestStart)}{bed.harvestEnd ? ' — ' + fmtDate(bed.harvestEnd) : ''}</div>
                <div><span class="lbl">FASE</span> <span class="phase">{bedPhase(bed)}</span></div>
              </div>
              {#if bed.pestNotes}
                <div class="dex-warn">{bed.pestNotes}</div>
              {/if}
            {:else if tab === 'cultivos'}
              <div class="dex-section-title">{bed.plantings?.length || 0} CULTURAS · {bedFamilies.length} FAMÍLIAS</div>
              <div class="dex-plantings">
                {#each bed.plantings || [] as p}
                  {@const sp = PLANT_SPECIES[p.species]}
                  {#if sp}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="dex-planting" on:click={() => selectSpecies(p.species)}>
                      <div class="dex-planting-sprite">
                        <PlantSprite kind={sp.sprite} stage={3} scale={3} />
                      </div>
                      <div>
                        <div class="dex-planting-name">{sp.name}</div>
                        <div class="dex-planting-fam">{sp.family} · {p.fn}</div>
                      </div>
                      <div class="dex-planting-count">×{p.count}</div>
                    </div>
                  {/if}
                {/each}
              </div>
            {:else if tab === 'rotação'}
              <div class="dex-section-title">CICLO ATUAL</div>
              <div class="dex-bars">
                <StatBar label="PROGRESSO" value={bedCycleProgress(bed)} color="#5cd96b" />
              </div>
              <div class="dex-dates">
                <div><span class="lbl">CICLO MÉDIO</span> {bedAvgCycle(bed)} dias</div>
                <div><span class="lbl">RESTANTES</span> {Math.max(0, bedAvgCycle(bed) - (daysSince(bed.plantedDate) || 0))} dias</div>
              </div>
              {#if bed.nextRotation}
                <div class="dex-next">{bed.nextRotation}</div>
              {/if}
            {:else if tab === 'histórico'}
              {#if bed.history?.length}
                {#each bed.history as h}
                  <div class="dex-history-row">
                    <div class="dex-history-season">{h.season}</div>
                    <div class="dex-history-plants">{(h.plants || []).join(' · ')}</div>
                    {#if h.notes}
                      <div class="dex-history-notes">{h.notes}</div>
                    {/if}
                  </div>
                {/each}
              {:else}
                <div class="dex-desc" style="color: var(--text-soft); font-style: italic;">
                  Sem histórico anterior registado.
                </div>
              {/if}
            {/if}
          </div>
        </PixelPanel>

      {:else if mode === 'species' && species && lore}
        <PixelPanel color="#fff" accent="#1d1d1d" padding={16}>
          <div class="dex-header">
            <div>
              <div class="dex-name">{species.emoji} {species.name}</div>
              <div class="dex-name-sub">
                <span class="fam-chip" style:background={FAMILY_COLORS[species.family] || '#5a5a5a'}>{species.family}</span>
              </div>
            </div>
          </div>

          <!-- Growth stages -->
          <div class="dex-stages">
            {#each [0, 1, 2, 3] as stage}
              <div class="dex-stage">
                <PlantSprite kind={species.sprite} {stage} scale={5} />
                <div class="dex-stage-label">
                  {['SEMENTE', 'JOVEM', 'MADURA', 'PRONTA'][stage]}
                </div>
              </div>
            {/each}
          </div>

          <div class="dex-desc">{lore.desc}</div>

          <div class="dex-section-title">CULTIVO</div>
          <div class="dex-info-grid">
            <div class="dex-info-item"><span class="lbl">{lore.sun}</span></div>
            <div class="dex-info-item"><span class="lbl">💧 {lore.water}</span></div>
            <div class="dex-info-item"><span class="lbl">📏 {lore.spacing}</span></div>
            <div class="dex-info-item"><span class="lbl">🌱 Germinação: {lore.germDays}d</span></div>
            <div class="dex-info-item"><span class="lbl">📅 Semear: {lore.sowFrom}–{lore.sowTo}</span></div>
            <div class="dex-info-item"><span class="lbl">🌿 Plantar: {lore.plantFrom}–{lore.plantTo}</span></div>
          </div>

          {#if lore.companions?.length}
            <div class="dex-section-title">COMPANHEIROS</div>
            <div class="dex-companion-list">
              {#each lore.companions as comp}
                {@const compSp = PLANT_SPECIES[comp]}
                {#if compSp}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="dex-companion" on:click={() => selectSpecies(comp)}>
                    <PlantSprite kind={compSp.sprite} stage={3} scale={2} />
                    <span>{compSp.name}</span>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}

          {#if lore.avoid?.length}
            <div class="dex-section-title">EVITAR</div>
            <div class="dex-companion-list avoid">
              {#each lore.avoid as av}
                {@const avSp = PLANT_SPECIES[av]}
                {#if avSp}
                  <div class="dex-companion avoid">
                    <PlantSprite kind={avSp.sprite} stage={3} scale={2} />
                    <span>{avSp.name}</span>
                  </div>
                {:else}
                  <div class="dex-companion avoid"><span>{av}</span></div>
                {/if}
              {/each}
            </div>
          {/if}

          {@const inBeds = bedsForSpecies(selectedSpecies)}
          {#if inBeds.length}
            <div class="dex-section-title">CANTEIROS</div>
            <div class="dex-beds-list">
              {#each inBeds as b}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="dex-bed-chip" on:click={() => { selectedBedId = b.bedId; mode = 'beds'; tab = 'cultivos'; }}>
                  {b.code} · ×{b.count}
                </div>
              {/each}
            </div>
          {/if}

          {#if lore.notes}
            <div class="dex-section-title">NOTAS</div>
            <div class="dex-desc">{lore.notes}</div>
          {/if}
        </PixelPanel>
      {:else}
        <PixelPanel color="#fff" accent="#1d1d1d" padding={16}>
          <div class="dex-desc" style="text-align: center; padding: 40px 0;">
            ← Selecciona um item da lista.
          </div>
        </PixelPanel>
      {/if}
    </div>
  </div>
</div>

<style>
  .dex-root {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 22px 28px 60px;
  }

  .dex-topnav {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
  }
  .dex-back {
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    color: #fff;
    text-decoration: none;
    background: var(--accent);
    padding: 8px 14px;
    border-radius: 4px;
    box-shadow: 0 0 0 3px var(--ink), 0 3px 0 var(--ink);
    transition: transform 100ms;
  }
  .dex-back:hover { transform: translateY(-1px); }
  .dex-title-row { display: flex; align-items: center; gap: 10px; flex: 1; }
  .dex-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: #fff;
    text-shadow: 2px 2px 0 var(--ink);
    letter-spacing: 2px;
    margin: 0;
  }
  .dex-mode-toggle { display: flex; gap: 0; }
  .dex-mode-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    padding: 8px 14px;
    border: none;
    cursor: pointer;
    background: #fff;
    color: var(--ink);
    box-shadow: 0 0 0 2px var(--ink);
    transition: background 100ms;
  }
  .dex-mode-btn:first-child { border-radius: 4px 0 0 4px; }
  .dex-mode-btn:last-child { border-radius: 0 4px 4px 0; }
  .dex-mode-btn.active { background: #ffe16a; }

  .dex-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 18px;
    align-items: start;
  }

  .dex-list-panel { max-height: 80vh; overflow-y: auto; }
  .dex-list-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    transition: background 100ms;
  }
  .dex-list-item:hover { background: #fff8dc; }
  .dex-list-item.active { background: #ffe16a; }
  .dex-list-sprite { width: 28px; display: flex; justify-content: center; }
  .dex-list-info { flex: 1; }
  .dex-list-name { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--ink); letter-spacing: 0.3px; }
  .dex-list-sub { font-family: 'VT323', monospace; font-size: 16px; color: var(--text-soft); margin-top: 2px; }
  .dex-list-badge {
    font-family: 'Press Start 2P', monospace; font-size: 7px;
    padding: 4px 6px; border-radius: 2px;
    background: #e8ffe8; color: var(--ink); box-shadow: 0 0 0 1px var(--ink);
    white-space: nowrap;
  }
  .dex-list-badge.harvest { background: #ffe16a; color: var(--accent); }
  .dex-list-emoji { font-size: 20px; }

  .fam-chip {
    display: inline-block;
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #fff;
    padding: 3px 6px;
    border-radius: 2px;
    letter-spacing: 0.3px;
  }

  .dex-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .dex-name { font-family: 'Press Start 2P', monospace; font-size: 14px; color: var(--ink); letter-spacing: 1px; }
  .dex-name-sub { font-family: 'VT323', monospace; font-size: 18px; color: var(--text-soft); margin-top: 4px; }
  .dex-id-badge {
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: var(--accent); color: #fff; padding: 4px 8px; border-radius: 3px;
  }

  .dex-diorama {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    background: linear-gradient(180deg, #cfeeff 0% 55%, #86c46b 55% 100%);
    padding: 10px;
    border-radius: 6px;
    box-shadow: inset 0 0 0 3px var(--ink);
    margin-bottom: 14px;
    justify-content: center;
  }
  .diorama-cell { display: flex; align-items: flex-end; justify-content: center; }

  .dex-tabs { display: flex; gap: 0; margin-bottom: 14px; }
  .dex-tab {
    font-family: 'Press Start 2P', monospace; font-size: 8px;
    padding: 8px 12px; border: none; cursor: pointer;
    background: #fff; color: var(--ink);
    box-shadow: 0 0 0 2px var(--ink);
    transition: background 100ms;
  }
  .dex-tab:first-child { border-radius: 4px 0 0 4px; }
  .dex-tab:last-child { border-radius: 0 4px 4px 0; }
  .dex-tab.active { background: #ffe16a; }

  .dex-content { min-height: 200px; }
  .dex-desc { font-family: 'VT323', monospace; font-size: 20px; line-height: 1.4; color: var(--ink); margin-bottom: 14px; }
  .dex-section-title {
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    color: var(--accent); letter-spacing: 0.5px;
    margin: 14px 0 8px; border-bottom: 2px dashed var(--ink); padding-bottom: 4px;
  }
  .dex-bars { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
  .dex-dates { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
  .dex-dates div { font-family: 'VT323', monospace; font-size: 18px; }
  .dex-dates .lbl { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--text-soft); margin-right: 8px; }
  .dex-dates .phase { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--accent); }
  .dex-warn {
    font-family: 'VT323', monospace; font-size: 18px; line-height: 1.3;
    background: #ffe2e2; padding: 8px 10px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--accent); margin-top: 10px;
  }
  .dex-next {
    font-family: 'VT323', monospace; font-size: 18px; line-height: 1.3;
    background: #e8ffe8; padding: 8px 10px; border-radius: 3px;
    box-shadow: 0 0 0 2px #4f7d31; margin-top: 10px;
  }
  .dex-plantings { display: flex; flex-direction: column; gap: 6px; }
  .dex-planting {
    display: grid; grid-template-columns: auto 1fr auto; gap: 10px;
    align-items: center; padding: 8px; background: #fff8dc; border-radius: 3px;
    cursor: pointer; transition: background 100ms;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
  }
  .dex-planting:hover { background: #ffe16a; }
  .dex-planting-name { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--ink); }
  .dex-planting-fam { font-family: 'VT323', monospace; font-size: 15px; color: var(--text-soft); font-style: italic; }
  .dex-planting-count { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); }

  .dex-stages {
    display: flex; justify-content: space-around; padding: 14px;
    background: linear-gradient(180deg, #cfeeff 0% 55%, #86c46b 55% 100%);
    border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink);
    margin-bottom: 14px;
  }
  .dex-stage { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .dex-stage-label { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--ink); }

  .dex-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
  .dex-info-item { font-family: 'VT323', monospace; font-size: 18px; color: var(--ink); }
  .dex-info-item .lbl { display: block; }

  .dex-companion-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .dex-companion {
    display: flex; align-items: center; gap: 6px;
    background: #e8ffe8; padding: 4px 8px; border-radius: 3px;
    box-shadow: 0 0 0 1px #4f7d31; cursor: pointer;
    font-family: 'VT323', monospace; font-size: 16px;
  }
  .dex-companion:hover { background: #d4ffd4; }
  .dex-companion.avoid { background: #ffe2e2; box-shadow: 0 0 0 1px var(--accent); }
  .dex-companion.avoid:hover { background: #ffd0d0; }

  .dex-beds-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .dex-bed-chip {
    font-family: 'Press Start 2P', monospace; font-size: 8px;
    background: #cfeeff; padding: 6px 10px; border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink); cursor: pointer;
  }
  .dex-bed-chip:hover { background: #ffe16a; }

  .dex-history-row { background: #fff8dc; padding: 8px; border-radius: 3px; margin-bottom: 6px; box-shadow: 0 0 0 1px rgba(0,0,0,0.1); }
  .dex-history-season { font-family: 'Press Start 2P', monospace; font-size: 9px; color: var(--accent); margin-bottom: 3px; }
  .dex-history-plants { font-family: 'VT323', monospace; font-size: 16px; color: var(--ink); }
  .dex-history-notes { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); font-style: italic; margin-top: 2px; }

  @media (max-width: 768px) {
    .dex-layout { grid-template-columns: 1fr; }
    .dex-list-panel { max-height: 40vh; }
  }
</style>

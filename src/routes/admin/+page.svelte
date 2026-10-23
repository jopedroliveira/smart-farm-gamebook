<script>
  export let data;

  let activeTab = 'beds';
  let editingCell = null;
  let editValue = '';

  const tabs = [
    { id: 'beds', label: 'CANTEIROS' },
    { id: 'cycles', label: 'CICLOS' },
    { id: 'crops', label: 'CULTURAS' },
    { id: 'actions', label: 'DIARIO' },
    { id: 'species', label: 'ESPECIES' },
  ];
  const ROLES = ['principal', 'companheira', 'cobertura', 'atrativa', 'outra'];
  const METHODS = ['semeado', 'plantado'];
  const OUTCOMES = ['', 'colhida', 'falhada', 'retirada'];
  let error = '';

  function startEdit(table, id, field, current) {
    editingCell = `${table}:${id}:${field}`;
    editValue = current || '';
  }

  async function saveEdit(table, id, field) {
    if (editingCell === null) return;
    editingCell = null;
    const res = await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, field, value: editValue }),
    });
    if (!res.ok) { error = (await res.json()).error || 'Erro'; return; }
    error = '';
    const list = { beds: data.beds, cycles: data.cycles, crops: data.crops, species: data.species }[table];
    const row = list?.find(r => r.id === id);
    if (row) {
      row[field] = editValue === '' ? null : editValue;
      if (table === 'crops' && field === 'speciesId') row.speciesName = speciesName(editValue);
    }
    data = data;
  }

  async function deleteRow(table, id) {
    await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });

    if (table === 'actions') {
      data.actions = data.actions.filter(a => a.id !== id);
    } else if (table === 'crops') {
      data.crops = data.crops.filter(c => c.id !== id);
    } else if (table === 'cycles') {
      data.cycles = data.cycles.filter(c => c.id !== id);
      data.crops = data.crops.filter(c => c.cycleId !== id);
    }
    data = data;
  }

  function cancelEdit() {
    editingCell = null;
  }

  function handleEditKey(e, table, id, field) {
    if (e.key === 'Enter') saveEdit(table, id, field);
    if (e.key === 'Escape') cancelEdit();
  }

  function speciesName(id) {
    const sp = data.species.find(s => s.id === id);
    return sp ? sp.name : id;
  }

  function cropsFor(cycleId) {
    return data.crops
      .filter(c => c.cycleId === cycleId && !c.outOn)
      .map(c => `${c.speciesName} x${c.count}`)
      .join(', ');
  }
</script>

<div class="admin-root">
  <div class="admin-header">
    <a href="/" class="admin-back">&#9664; HORTA</a>
    <h1 class="admin-title">GESTAO</h1>
  </div>

  <div class="admin-tabs">
    {#each tabs as tab}
      <button
        class="admin-tab"
        class:admin-tab-active={activeTab === tab.id}
        on:click={() => { activeTab = tab.id; }}
      >{tab.label}</button>
    {/each}
  </div>

  <div class="admin-content">
    {#if activeTab === 'beds'}
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Area</th>
            <th>Notas</th>
            <th>Proxima Rotacao</th>
          </tr>
        </thead>
        <tbody>
          {#each data.beds as bed}
            <tr>
              <td class="td-id">{bed.notionCode}</td>
              <td>{(bed.widthM * bed.heightM).toFixed(1)}m2</td>
              <td class="td-editable" on:dblclick={() => startEdit('beds', bed.id, 'notes', bed.notes)}>
                {#if editingCell === `beds:${bed.id}:notes`}
                  <input
                    class="edit-input"
                    bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'beds', bed.id, 'notes')}
                    on:blur={() => saveEdit('beds', bed.id, 'notes')}
                  />
                {:else}
                  {bed.notes || '—'}
                {/if}
              </td>
              <td class="td-editable" on:dblclick={() => startEdit('beds', bed.id, 'nextRotation', bed.nextRotation)}>
                {#if editingCell === `beds:${bed.id}:nextRotation`}
                  <input
                    class="edit-input"
                    bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'beds', bed.id, 'nextRotation')}
                    on:blur={() => saveEdit('beds', bed.id, 'nextRotation')}
                  />
                {:else}
                  {bed.nextRotation || '—'}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

    {:else if activeTab === 'cycles'}
      <table class="admin-table">
        <thead>
          <tr>
            <th>Canteiro</th>
            <th>Titulo</th>
            <th>Esquema</th>
            <th>Inicio</th>
            <th>Fecho</th>
            <th>Na terra</th>
            <th>Notas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.cycles as c}
            <tr class:row-done={!!c.closedOn}>
              <td class="td-id">{c.bedId} <span class="td-small">#{c.id}</span></td>
              {#each ['title', 'scheme', 'startedOn', 'closedOn'] as f}
                <td class="td-editable" on:dblclick={() => startEdit('cycles', c.id, f, c[f])}>
                  {#if editingCell === `cycles:${c.id}:${f}`}
                    <input class="edit-input" bind:value={editValue}
                      placeholder={f.endsWith('On') ? 'YYYY-MM-DD' : ''}
                      on:keydown={(e) => handleEditKey(e, 'cycles', c.id, f)}
                      on:blur={() => saveEdit('cycles', c.id, f)} />
                  {:else}
                    {c[f] || '—'}
                  {/if}
                </td>
              {/each}
              <td class="td-small">{cropsFor(c.id) || '—'}</td>
              <td class="td-editable" on:dblclick={() => startEdit('cycles', c.id, 'notes', c.notes)}>
                {#if editingCell === `cycles:${c.id}:notes`}
                  <input class="edit-input" bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'cycles', c.id, 'notes')}
                    on:blur={() => saveEdit('cycles', c.id, 'notes')} />
                {:else}
                  {c.notes || '—'}
                {/if}
              </td>
              <td>
                <button class="btn-delete" on:click={() => deleteRow('cycles', c.id)}>&#10005;</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

    {:else if activeTab === 'crops'}
      <table class="admin-table">
        <thead>
          <tr>
            <th>Canteiro</th>
            <th>Ciclo</th>
            <th>Especie</th>
            <th>Qtd</th>
            <th>Papel</th>
            <th>Metodo</th>
            <th>Entrada</th>
            <th>Saida</th>
            <th>Desfecho</th>
            <th>Nota</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.crops as c}
            <tr class:row-done={!!c.outOn}>
              <td class="td-id">{c.bedId}</td>
              <td class="td-small">#{c.cycleId}</td>
              <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, 'speciesId', c.speciesId)}>
                {#if editingCell === `crops:${c.id}:speciesId`}
                  <select class="edit-select" bind:value={editValue}
                    on:change={() => saveEdit('crops', c.id, 'speciesId')}
                    on:blur={() => saveEdit('crops', c.id, 'speciesId')}>
                    {#each data.species as sp}
                      <option value={sp.id}>{sp.name}</option>
                    {/each}
                  </select>
                {:else}
                  {c.speciesName}
                {/if}
              </td>
              <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, 'count', c.count)}>
                {#if editingCell === `crops:${c.id}:count`}
                  <input class="edit-input" bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'crops', c.id, 'count')}
                    on:blur={() => saveEdit('crops', c.id, 'count')} />
                {:else}
                  {c.count}
                {/if}
              </td>
              {#each [['role', ROLES], ['method', METHODS]] as [f, opts]}
                <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, f, c[f])}>
                  {#if editingCell === `crops:${c.id}:${f}`}
                    <select class="edit-select" bind:value={editValue}
                      on:change={() => saveEdit('crops', c.id, f)}
                      on:blur={() => saveEdit('crops', c.id, f)}>
                      {#each opts as opt}
                        <option value={opt}>{opt}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="estado-badge estado-{f === 'role' ? c.role : 'plantado'}">{c[f]}</span>
                  {/if}
                </td>
              {/each}
              {#each ['inOn', 'outOn'] as f}
                <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, f, c[f])}>
                  {#if editingCell === `crops:${c.id}:${f}`}
                    <input class="edit-input" bind:value={editValue} placeholder="YYYY-MM-DD"
                      on:keydown={(e) => handleEditKey(e, 'crops', c.id, f)}
                      on:blur={() => saveEdit('crops', c.id, f)} />
                  {:else}
                    {c[f] || '—'}
                  {/if}
                </td>
              {/each}
              <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, 'outcome', c.outcome)}>
                {#if editingCell === `crops:${c.id}:outcome`}
                  <select class="edit-select" bind:value={editValue}
                    on:change={() => saveEdit('crops', c.id, 'outcome')}
                    on:blur={() => saveEdit('crops', c.id, 'outcome')}>
                    {#each OUTCOMES as opt}
                      <option value={opt}>{opt || '—'}</option>
                    {/each}
                  </select>
                {:else}
                  {c.outcome || '—'}
                {/if}
              </td>
              <td class="td-editable" on:dblclick={() => startEdit('crops', c.id, 'outcomeNote', c.outcomeNote)}>
                {#if editingCell === `crops:${c.id}:outcomeNote`}
                  <input class="edit-input" bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'crops', c.id, 'outcomeNote')}
                    on:blur={() => saveEdit('crops', c.id, 'outcomeNote')} />
                {:else}
                  {c.outcomeNote || '—'}
                {/if}
              </td>
              <td>
                <button class="btn-delete" on:click={() => deleteRow('crops', c.id)}>&#10005;</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

    {:else if activeTab === 'actions'}
      {#if data.actions.length === 0}
        <p class="empty-msg">Sem acoes registadas. Fala com o Sage para registar atividades.</p>
      {:else}
        <table class="admin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Canteiro</th>
              <th>Acao</th>
              <th>Nota</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.actions as action}
              <tr>
                <td class="td-small">{action.createdAt}</td>
                <td class="td-id">{action.bedId || '—'}</td>
                <td><span class="action-badge">{action.action}</span></td>
                <td>{action.details || '—'}</td>
                <td>
                  <button class="btn-delete" on:click={() => deleteRow('actions', action.id)}>&#10005;</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

    {:else if activeTab === 'species'}
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Especie</th>
            <th>Familia</th>
            <th>Ciclo</th>
            <th>Sementeira</th>
            <th>Colheita</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {#each data.species as sp}
            <tr>
              <td>{sp.name}</td>
              <td class="td-small">{sp.speciesName || '—'}</td>
              <td class="td-editable td-small" on:dblclick={() => startEdit('species', sp.id, 'family', sp.family)}>
                {#if editingCell === `species:${sp.id}:family`}
                  <input class="edit-input" bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'species', sp.id, 'family')}
                    on:blur={() => saveEdit('species', sp.id, 'family')} />
                {:else}
                  {sp.family || '—'}
                {/if}
              </td>
              <td class="td-editable" on:dblclick={() => startEdit('species', sp.id, 'growthDays', sp.growthDays)}>
                {#if editingCell === `species:${sp.id}:growthDays`}
                  <input class="edit-input" bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'species', sp.id, 'growthDays')}
                    on:blur={() => saveEdit('species', sp.id, 'growthDays')} />
                {:else}
                  {sp.growthDays ? sp.growthDays + 'd' : '—'}
                {/if}
              </td>
              <td class="td-small">{sp.sowingWindow || '—'}</td>
              <td class="td-small">{sp.harvestWindow || '—'}</td>
              <td class="td-editable" on:dblclick={() => startEdit('species', sp.id, 'notes', sp.notes)}>
                {#if editingCell === `species:${sp.id}:notes`}
                  <input
                    class="edit-input"
                    bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'species', sp.id, 'notes')}
                    on:blur={() => saveEdit('species', sp.id, 'notes')}
                  />
                {:else}
                  {sp.notes || '—'}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  {#if error}
    <p class="admin-error">{error}</p>
  {/if}
  <p class="admin-hint">Duplo-clique para editar uma celula. Enter para guardar, Esc para cancelar.</p>
</div>

<style>
  .admin-root {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 22px 28px 60px;
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
  }

  .admin-back {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    background: #fff;
    color: var(--ink);
    padding: 8px 12px;
    border-radius: 3px;
    box-shadow: 0 0 0 2px var(--ink), 0 3px 0 var(--ink);
    text-decoration: none;
    cursor: pointer;
    letter-spacing: 0.5px;
  }

  .admin-back:hover { transform: translateY(-1px); }

  .admin-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: var(--ink);
    letter-spacing: 2px;
    margin: 0;
  }

  .admin-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 14px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 0 0 3px var(--ink), 0 4px 0 var(--ink);
    overflow: hidden;
  }

  .admin-tab {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    padding: 10px 16px;
    background: #fff;
    color: var(--ink);
    border: none;
    cursor: pointer;
    letter-spacing: 0.5px;
    border-right: 2px solid var(--ink);
  }

  .admin-tab:last-child { border-right: none; }
  .admin-tab-active { background: #ffe16a; }
  .admin-tab:hover:not(.admin-tab-active) { background: #f0f0f0; }

  .admin-content {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,0.6), 0 5px 0 var(--ink);
    padding: 16px;
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'VT323', monospace;
    font-size: 18px;
  }

  .admin-table th {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--accent);
    text-align: left;
    padding: 8px 10px;
    border-bottom: 3px solid var(--ink);
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .admin-table td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    vertical-align: top;
  }

  .admin-table tr:hover td { background: #fff8dc; }

  .td-id {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--ink);
    white-space: nowrap;
  }

  .td-small { font-size: 16px; color: var(--text-soft); }

  .td-editable { cursor: text; }
  .td-editable:hover { background: #f0f0e0; }

  .edit-input {
    font-family: 'VT323', monospace;
    font-size: 18px;
    width: 100%;
    padding: 4px 6px;
    border: none;
    border-radius: 2px;
    box-shadow: inset 0 0 0 2px var(--accent);
    outline: none;
    background: #fff;
  }

  .edit-select {
    font-family: 'VT323', monospace;
    font-size: 18px;
    padding: 4px;
    border: 2px solid var(--accent);
    border-radius: 2px;
    background: #fff;
  }

  .estado-badge {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    padding: 3px 6px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .estado-plantado { background: #d4f5d4; color: #2d5018; }
  .estado-principal { background: #fff3c4; color: #8a5a2a; }
  .estado-companheira { background: #d4e8ff; color: #1d3a52; }
  .estado-cobertura, .estado-atrativa, .estado-outra { background: #e0e0e0; color: #666; }

  .admin-error {
    font-family: 'VT323', monospace;
    font-size: 18px;
    color: #c73030;
    text-align: center;
    margin-top: 12px;
  }

  .action-badge {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    background: #cfeeff;
    color: #1d3a52;
    padding: 3px 6px;
    border-radius: 2px;
  }

  .row-done td { opacity: 0.5; }

  .btn-delete {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 2px;
  }

  .btn-delete:hover { background: #ffe2e2; }

  .empty-msg {
    font-family: 'VT323', monospace;
    font-size: 20px;
    color: var(--text-soft);
    text-align: center;
    padding: 40px;
  }

  .admin-hint {
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: var(--text-soft);
    text-align: center;
    margin-top: 12px;
  }
</style>

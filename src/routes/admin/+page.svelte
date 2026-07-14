<script>
  export let data;

  let activeTab = 'beds';
  let editingCell = null;
  let editValue = '';

  const tabs = [
    { id: 'beds', label: 'CANTEIROS' },
    { id: 'rotations', label: 'ROTACOES' },
    { id: 'actions', label: 'DIARIO' },
    { id: 'species', label: 'ESPECIES' },
  ];

  function startEdit(table, id, field, current) {
    editingCell = `${table}:${id}:${field}`;
    editValue = current || '';
  }

  async function saveEdit(table, id, field) {
    await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, field, value: editValue }),
    });
    editingCell = null;

    if (table === 'beds') {
      const bed = data.beds.find(b => b.id === id);
      if (bed) bed[field] = editValue;
    } else if (table === 'rotations') {
      const rot = data.rotations.find(r => r.id === id);
      if (rot) rot[field] = editValue;
    } else if (table === 'species') {
      const sp = data.species.find(s => s.id === id);
      if (sp) sp[field] = editValue;
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
    } else if (table === 'rotations') {
      data.rotations = data.rotations.filter(r => r.id !== id);
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

  function plantingsFor(rotId) {
    return data.plantings
      .filter(p => p.rotationId === rotId)
      .map(p => speciesName(p.speciesId))
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

    {:else if activeTab === 'rotations'}
      <table class="admin-table">
        <thead>
          <tr>
            <th>Canteiro</th>
            <th>Titulo</th>
            <th>Estado</th>
            <th>Culturas</th>
            <th>Notas Pragas</th>
            <th>Notas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.rotations as rot}
            <tr class:row-done={rot.estado === 'Terminado' || rot.estado === 'Em repouso'}>
              <td class="td-id">{rot.bedId}</td>
              <td>{rot.title || '—'}</td>
              <td class="td-editable" on:dblclick={() => startEdit('rotations', rot.id, 'estado', rot.estado)}>
                {#if editingCell === `rotations:${rot.id}:estado`}
                  <select
                    class="edit-select"
                    bind:value={editValue}
                    on:change={() => saveEdit('rotations', rot.id, 'estado')}
                    on:blur={() => saveEdit('rotations', rot.id, 'estado')}
                  >
                    {#each ['Planeado', 'Plantado', 'A colher', 'Terminado', 'Em repouso'] as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else}
                  <span class="estado-badge estado-{rot.estado?.toLowerCase().replace(/ /g, '-')}">{rot.estado || '—'}</span>
                {/if}
              </td>
              <td class="td-small">{plantingsFor(rot.id) || '—'}</td>
              <td class="td-editable" on:dblclick={() => startEdit('rotations', rot.id, 'pestNotes', rot.pestNotes)}>
                {#if editingCell === `rotations:${rot.id}:pestNotes`}
                  <input
                    class="edit-input"
                    bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'rotations', rot.id, 'pestNotes')}
                    on:blur={() => saveEdit('rotations', rot.id, 'pestNotes')}
                  />
                {:else}
                  {rot.pestNotes || '—'}
                {/if}
              </td>
              <td class="td-editable" on:dblclick={() => startEdit('rotations', rot.id, 'notes', rot.notes)}>
                {#if editingCell === `rotations:${rot.id}:notes`}
                  <input
                    class="edit-input"
                    bind:value={editValue}
                    on:keydown={(e) => handleEditKey(e, 'rotations', rot.id, 'notes')}
                    on:blur={() => saveEdit('rotations', rot.id, 'notes')}
                  />
                {:else}
                  {rot.notes || '—'}
                {/if}
              </td>
              <td>
                <button class="btn-delete" on:click={() => deleteRow('rotations', rot.id)}>&#10005;</button>
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
              <th>Nota</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.actions as action}
              <tr>
                <td class="td-small">{action.createdAt}</td>
                <td class="td-id">{action.bedId || '—'}</td>
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
              <td class="td-small">{sp.family || '—'}</td>
              <td>{sp.cycleDays ? sp.cycleDays + 'd' : '—'}</td>
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
  .estado-a-colher { background: #fff3c4; color: #8a5a2a; }
  .estado-terminado { background: #e0e0e0; color: #666; }
  .estado-em-repouso { background: #e0e0e0; color: #666; }
  .estado-planeado { background: #d4e8ff; color: #1d3a52; }

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

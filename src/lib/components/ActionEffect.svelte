<!--
  Floating text + particle burst when a tool action is performed.
-->
<script>
  import { onMount } from 'svelte';

  export let kind = 'water';
  export let x = 0;
  export let y = 0;

  const config = {
    water:   { icon: '💧', count: 5, color: '#4fc3f7' },
    shovel:  { icon: '✦',  count: 4, color: '#a4d96b' },
    harvest: { icon: '★',  count: 6, color: '#ffe16a' },
    seed:    { icon: '·',  count: 3, color: '#86c46b' },
    compost: { icon: '💧', count: 4, color: '#b58a5a' },
    gather:  { icon: '✦',  count: 4, color: '#a4d96b' },
  };

  $: cfg = config[kind] || config.water;

  $: particles = Array.from({ length: cfg.count }, (_, i) => {
    const angle = (i / cfg.count) * Math.PI * 2;
    const dist = 30 + i * 4;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 20,
      delay: i * 30,
    };
  });

  onMount(() => {
    const id = setTimeout(() => {
      // dispatch done event by removing self
    }, 900);
    return () => clearTimeout(id);
  });
</script>

<div class="action-effect" style:left="{x}px" style:top="{y}px">
  <div class="action-popup" style:color={cfg.color}>
    {kind.toUpperCase()}!
  </div>
  {#each particles as p, i}
    <div
      class="action-particle"
      style:color={cfg.color}
      style:animation-delay="{p.delay}ms"
      style:--dx="{p.dx}px"
      style:--dy="{p.dy}px"
    >
      {cfg.icon}
    </div>
  {/each}
</div>

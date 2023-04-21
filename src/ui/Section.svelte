<script>
  import { Chart } from "@onsvisual/svelte-charts";
  
  export let section;
  export let plaintext = false;
  export let single = false;
</script>

<section style:border-top={single ? "none" : null}>
  {#if section.type && !plaintext}<span class="class-label">{section.type}</span>{/if}
  {#if section.id && !plaintext}<span class="id-label">id: {section.id}</span>{/if}
  {#if section.type === "Chart" && section.chartType && !plaintext}
    <Chart section={section}/>
  {:else}
    {#if !plaintext}
    {#each Object.keys(section).filter(key => !["content", "id", "type", "sections"].includes(key)) as key}
    <prop class="{key}">{key}: {@html key === "data" ? JSON.stringify(section[key]) : section[key]}</prop>
    {/each}
    {/if}
    {@html section.content ? section.content : ""}
    {#if section.sections}
      {#each section.sections as subsec}    
      <svelte:self section={subsec} {plaintext}/>
      {/each}
    {/if}
  {/if}
</section>
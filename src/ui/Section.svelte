<script>
  import Chart from "./Chart.svelte";
  
  export let section;
</script>

<section>
  {#if section.type}<span class="class-label">{section.type}</span>{/if}
  {#if section.id}<span class="id-label">id: {section.id}</span>{/if}
  {#if section.type === "Chart" && section.chartType}
    <Chart section={section}/>
  {:else}
    {#each Object.keys(section).filter(key => !["content", "id", "type", "sections"].includes(key)) as key}
    <prop class="{key}">{key}: {@html key === "data" ? JSON.stringify(section[key]) : section[key]}</prop>
    {/each}
    {@html section.content ? section.content : ""}
    {#if section.sections}
      {#each section.sections as subsec}    
      <svelte:self section={subsec}/>
      {/each}
    {/if}
  {/if}
</section>
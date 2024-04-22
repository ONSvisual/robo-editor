<script>
  import Section from "./Section.svelte";

  export let output;
  export let plaintext = false;
</script>

{#if output}
  {#each output.sections as section, i}
    <Section {section} {plaintext} single={i === 0}/>
  {/each}
{/if}
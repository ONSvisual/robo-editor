<script>
	import { onMount } from "svelte";
  import { MagicArray, autoType, renderJSON } from "@onsvisual/robo-utils";
	import { csvParse } from "d3-dsv";
	import { format } from "d3-format";
	import parseColor from "parse-color";
  import debounce from "debounce";
	import { download, sleep } from "./utils";
	import template_default from "./template";
  import { HSplitPane } from "svelte-split-pane";
	import Editor from "./ui/Editor.svelte";
	import Icon from "./ui/Icon.svelte";
  import Section from "./ui/Section.svelte";
	
	// DOM BINDINGS ETC
	let rosae, editor, pug_upload, csv_upload;
	
	// DATA/STATE
	let template = template_default;
  let output;
	let places = null;
	let lookup = null;
	let place = null;
	let plaintext = false;
	let progress = 0;
  let w;

  const render = debounce(() => output = renderJSON(template, place, places, lookup, rosae), 500);
  $: if (rosae && template) render(template, place, places, lookup);
  $: console.log(output);

	function clickPUG() {
		pug_upload.click();
	}
	function loadPUG() {
		let file = pug_upload.files[0] ? pug_upload.files[0] : null;
		
		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				editor.setContent(e.target.result);
			};
			reader.readAsText(file);
		}
	}

	async function validatePUG() {
		progress = 0;
		let invalid = [];

		let plcs = places ? [null, ...places] : [null];

		for (let i = 0; i < plcs.length; i ++) {
			progress = i == plcs.length - 1 ? 0 : (i + 1) / plcs.length;
			await sleep(0);
			let output = render(template, plcs[i], plaintext);
			if (output == "") invalid.push(plcs[i] ? plcs[i].areanm : "No area selected");
		}

		if (invalid[0]) {
			alert(`Validation failed for ${invalid.join(', ')}`);
		} else {
			alert("Validation passed for all areas.");
		}
	}

	function makeData(str) {
		let newplaces = new MagicArray(...csvParse(str, autoType));
		let newlookup = {};
		newplaces.forEach(d => newlookup[d.areacd] = d);

		places = newplaces.filter(d => ["E06","E07","E08","E09","W06"].includes(d.areacd.slice(0,3)))
			.sort((a, b) => a.areanm.localeCompare(b.areanm));
		place = places[0];
		lookup = newlookup;
	}
	function clickCSV() {
		csv_upload.click();
	}
	function loadCSV() {
		let file = csv_upload.files[0] ? csv_upload.files[0] : null;
		
		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				makeData(e.target.result);
			};
			reader.readAsText(file);
		}
	}

	function savePUG() {
		let blob = new Blob([template], { type: "text/pug;charset=utf-8" });
		download(blob, "template.pug");
	}

	async function ddjDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/template.pug");
	}

	async function nlgDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/nlgtemplate.pug");
	}

	async function getCSV(url) {
		console.log("loading csv");
		let csv_res = await fetch(url);
		let csv_str = await csv_res.text();
		makeData(csv_str);
	}

	async function getPUG(url) {
		console.log("loading pug");
		let pug_res = await fetch(url);
		let pug = await pug_res.text();
		await sleep(50);
		editor.setContent(pug);
	}

	onMount(() => {
		window.ddjDemo = ddjDemo;
		window.nlgDemo = nlgDemo;
		let params = (new URL(document.location)).searchParams;
		for (const [key, url] of params) {
			console.log(key, url);
			if (key == "csv") {
				getCSV(url);
			} else if (key == "pug") {
				getPUG(url);
			}
		}
	});
</script>

<svelte:head>
	<script src="https://unpkg.com/rosaenlg@3.2.4/dist/rollup/rosaenlg_tiny_en_US_3.2.4_comp.js" on:load={() => rosae = window.rosaenlg_en_US}></script>
	{#if plaintext}
	<style>
		mark {
			background-color: rgba(255,255,255,0);
		}
		section > section {
			margin-left: none;
		}
	</style>
	{:else}
	<style>
		mark {
			font-weight: bold;
			padding: 0 4px;
			background-color: lightgrey;
		}
		prop {
			background-color: lightgrey;
      margin-right: 4px;
		}
		section {
			border-top: 1px solid black;
		}
		section > section {
			margin-left: 20px;
		}
	</style>
	{/if}
</svelte:head>

<main>
	<nav>
		<div>
			<button on:click={clickPUG}><Icon type="load" margin/> Load PUG file</button>
			<button on:click={validatePUG}>{#if progress}{(progress * 100).toFixed(0)}%{:else}<Icon type="validate" margin/>{/if} Validate PUG</button>
			<button on:click={savePUG}><Icon type="save" margin/> Save PUG file</button>
			<input type="file" accept=".pug" style="display:none" bind:this={pug_upload} on:change={loadPUG}>
			<input type="file" accept=".csv" style="display:none" bind:this={csv_upload} on:change={loadCSV}>
		</div>
		<div>
			<button on:click={clickCSV}><Icon type="load" margin/> Load CSV file</button>
			<select bind:value={place} disabled={!places}>
				{#if places}
				<option value={null}>No area selected</option>
				{#each places as option}
				<option value={option}>{option.areanm}</option>
				{/each}
				{:else}
				<option value={null}>Load a CSV data file</option>
				{/if}
			</select>
			<label>
				<input type="checkbox" bind:checked={plaintext}/>
				Plain text
			</label>
		</div>
	</nav>
  <div class="content">
    <HSplitPane>
      <left slot="left">
        <div bind:clientWidth={w}/>
        <Editor bind:content={template} bind:this={editor} width={w}/>
      </left>
      <right slot="right">
        <div class="preview">
          {#if output}
          {#each output.sections as section}
          <Section {section}/>
          {/each}
          {/if}
        </div>
      </right>
    </HSplitPane>
  </div>
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		padding: 0;
		margin: 0;
	}
	:global(.class-label) {
		background-color: lightgreen;
	}
	:global(.id-label) {
		background-color: yellow;
	}
	:global(prop.highlighted) {
		display: inline-block;
    	vertical-align: top;
		white-space: nowrap;
  		max-width: 300px;
  		overflow: hidden;
  		text-overflow: ellipsis;
	}
	:global(prop.highlighted:hover) {
  		overflow: visible;
	}
	:global(.text-big) {
		font-size: 1.3em;
	}
	:global(h1) {
		font-size: 2em;
	}
	:global(h1, h2, p) {
		margin: 0 0 10px 0;
	}
	:global(section) {
		margin-top: 20px;
	}
	:global(.visually-hidden) {
		color: grey;
		font-style: italic;
	}
	:global(.btn-inline) {
		margin: 0 4px;
		padding: 0 4px;
	}
	main {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
	}
	nav {
		display: flex;
		flex-direction: row;
		flex-grow: 0;
		background-color: #bbb;
		padding: 8px;
	}
	nav > div {
		display: flex;
		flex-direction: row;
		align-items: center;
  	flex: 1;
	}
	button {
		display: inline-flex;
		flex-direction: row;
		margin: 0 8px 0 0;
		cursor: pointer;
	}
	select {
		margin: 0;
	}
  .content {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    overflow: hidden;
  }
  left, right {
    position: relative;
  }
  left > div {
    position: absolute;
    width: 100%;
  }
	.preview {
		padding: 10px;
    overflow-y: auto;
		height: 100%;
	}
	nav label {
		margin-left: 12px;
	}
	nav input[type=checkbox] {
		transform: scale(1.5);
		filter: saturate(0) contrast(2.5);
		margin-right: 2.5px;
	}
</style>
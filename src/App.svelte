<script>
	import { onMount } from "svelte";
	import { csvParse, autoType } from "d3-dsv";
	import { format } from "d3-format";
	import parseColor from 'parse-color';
	import { download, MagicArray } from "./utils";
	import template_default from "./template";
	import Editor from "./ui/Editor.svelte";
	import Icon from "./ui/Icon.svelte";
	
	// DOM BINDINGS ETC
	let rosae, editor, pug_upload, csv_upload;
	
	// DATA/STATE
	let template = template_default;
	let places = null;
	let lookup = null;
	let place = null;
	
	function render(template, place) {
		try {
			let str = rosae.render(template, {place, places, lookup, format, language: 'en_US'});
			// Fix to remove spaces added between numbers and prefix/suffix symbols by rosae
			str = str.replace(/(?<=\d)\s+((?=%)|(?=p{2}))/g, "");
			str = str.replace(/(?<=[£€\$])\s+(?=\d)/g, "");
			// Fix to add spaces after closing </mark> </em> or <strong> tags unless followed by one of . , <
			str = str.replace(/((?<=<\/mark>)|(?<=<\/strong>)|(?<=<\/em>)|(?<=<\/[abi]>))(?![\.,<:;])/g, " ");
			// Hack in ID labels
			let sections = str.match(/<section([^<]*?)>/g);
			sections = Array.isArray(sections) ? sections.filter((d,i,arr) => arr.indexOf(d) == i) : [];
			let ids = sections ? sections.map(s => s.match(/id="([^<]*?)"/)) : [];
			let classes = sections ? sections.map(s => s.match(/class="([^<]*?)"/)) : [];
			sections.forEach((s, i) => {
				str = str.replaceAll(s, `${s}${classes[i] ? `<span class="class-label">${classes[i][1]}</span>` : ''}${ids[i] ? `<span class="id-label">id: ${ids[i][1]}</span>` : ''}`);
			});
			// Write in keys for custom props
			let props = str.match(/<prop([^<]*?)>/g);
			props = Array.isArray(props) ? props.filter((d,i,arr) => arr.indexOf(d) == i) : [];
			let prop_classes = props ? props.map(s => s.match(/class="([^<]*?)"/)) : [];
			props.forEach((p, i) => {
				str = str.replaceAll(p, `${p}${prop_classes[i][1]}: `);
			});
			// Contrasting text colours for highlighted <mark> texts
			let marks = str.match(/<mark([^<]*?)>/g);
			if (Array.isArray(marks)) {
				marks = marks.filter((d,i,arr) => arr.indexOf(d) == i && d.includes("background-color"));
				let colors = marks.map(d => d.match(/(?<=background-color:\s).+(?=[";])/)[0]);
				colors.forEach(color => {
					let rgb = parseColor(color).rgb;
					let text_color = (((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000) > 125 ? "black" : "white";
					str = str.replaceAll(`background-color: ${color}`, `background-color: ${color}; color: ${text_color};`);
				});
			}
			return str;
		} catch {
			return "";
		}
	}

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

	function makeData(str) {
		let newplaces = csvParse(str, autoType);
		let newlookup = {};
		newplaces.forEach(d => newlookup[d.areacd] = d);

		newplaces = newplaces.filter(d => ["E06","E07","E08","E09","W06"].includes(d.areacd.slice(0,3)))
			.sort((a, b) => a.areanm.localeCompare(b.areanm));
		places = new MagicArray(...newplaces);
		place = places[0];
		lookup = newlookup;
		console.log(places.sortBy)
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
		console.log("loading");
		let csv_res = await fetch("./data/data.csv");
		let csv_str = await csv_res.text();
		makeData(csv_str);

		let pug_res = await fetch("./data/template.txt");
		let pug = await pug_res.text();
		editor.setContent(pug);
	}

	async function nlgDemo() {
		console.log("loading");
		let csv_res = await fetch("./data/data.csv");
		let csv_str = await csv_res.text();
		makeData(csv_str);

		let pug_res = await fetch("./data/nlgtemplate.txt");
		let pug = await pug_res.text();
		editor.setContent(pug);
	}

	onMount(() => {
		window.ddjDemo = ddjDemo;
		window.nlgDemo = nlgDemo;
	});
</script>

<svelte:head>
	<script src="https://unpkg.com/rosaenlg@3.2.4/dist/rollup/rosaenlg_tiny_en_US_3.2.4_comp.js" on:load={() => rosae = window.rosaenlg_en_US}></script>
</svelte:head>

<main>
	<nav>
		<div>
			<button on:click={clickPUG}><Icon type="load" margin/> Load PUG file</button>
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
		</div>
	</nav>
	<div class="content">
		<div>
			<Editor bind:content={template} bind:this={editor}/>
		</div>
		<div class="preview">
			{#if rosae && template}
			{@html render(template, place)}
			{/if}
		</div>
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
		margin-right: 4px;
	}
	:global(.id-label) {
		background-color: yellow;
		margin-right: 4px;
	}
	:global(prop) {
		background-color: lightgrey !important;
		margin-right: 4px;
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
		border-top: 1px solid black;
	}
	:global(section > section) {
		margin-left: 20px;
	}
	:global(mark) {
		background-color: lightgrey;
		font-weight: bold;
		padding: 0 4px;
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
		background-color: grey;
		padding: 8px;
	}
	nav > div {
		display: flex;
		flex-direction: row;
  		flex: 1;
	}
	button {
		display: inline-flex;
		flex-direction: row;
		margin: 0 8px 0 0;
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
	.content > div {
  		flex: 1;
		overflow-y: auto;
		height: 100%;
	}
	.preview {
		padding: 10px;
	}
</style>
<script>
	import { onMount } from "svelte";
	import { csvParse, autoType } from "d3-dsv";
	import { format } from "d3-format";
	import parseColor from "parse-color";
	import { MagicArray, sleep } from "./utils";
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
	let plaintext = false;
	let progress = 0;

	function render(template, place, plaintext = false) {
		try {
			let str = rosae.render(template, {
				place,
				places,
				lookup,
				format,
				language: "en_US",
			});
			// Fix to remove spaces added between numbers and prefix/suffix symbols by rosae
			str = str.replace(/(?<=\d)\s+((?=%)|(?=p{2}))/g, "");
			str = str.replace(/(?<=[£€\$])\s+(?=\d)/g, "");
			// Fix to add spaces after closing </mark> </em> or <strong> tags unless followed by one of . , <
			str = str.replace(
				/((?<=<\/mark>)|(?<=<\/strong>)|(?<=<\/em>)|(?<=<\/[abi]>))(?![\.,<:;])/g,
				" "
			);

			if (!plaintext) {
				// Hack in ID labels
				let sections = str.match(/<section([^<]*?)>/g);
				sections = Array.isArray(sections)
					? sections.filter((d, i, arr) => arr.indexOf(d) == i)
					: [];
				let ids = sections
					? sections.map((s) => s.match(/id="([^<]*?)"/))
					: [];
				let classes = sections
					? sections.map((s) => s.match(/class="([^<]*?)"/))
					: [];
				sections.forEach((s, i) => {
					str = str.replaceAll(
						s,
						`${s}${
							classes[i]
								? `<span class="class-label">${classes[i][1]}</span>`
								: ""
						}${
							ids[i]
								? `<span class="id-label">id: ${ids[i][1]}</span>`
								: ""
						}`
					);
				});
				// Write in keys for custom props
				let props = str.match(/<prop([^<]*?)>/g);
				props = Array.isArray(props)
					? props.filter((d, i, arr) => arr.indexOf(d) == i)
					: [];
				let prop_classes = props
					? props.map((s) => s.match(/class="([^<]*?)"/))
					: [];
				props.forEach((p, i) => {
					str = str.replaceAll(p, `${p}${prop_classes[i][1]}: `);
				});
			}
			// Contrasting text colours for highlighted <mark> texts
			let marks = str.match(/<mark([^<]*?)>/g);
			if (Array.isArray(marks)) {
				marks = marks.filter(
					(d, i, arr) =>
						arr.indexOf(d) == i && d.includes("background-color")
				);
				let colors = marks.map(
					(d) => d.match(/(?<=background-color:\s).+(?=[";])/)[0]
				);
				colors.forEach((color) => {
					let rgb = parseColor(color).rgb;
					let text_color =
						(rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 >
						125
							? "black"
							: "white";
					str = str.replaceAll(
						`background-color: ${color}`,
						plaintext
							? ""
							: `background-color: ${color}; color: ${text_color};`
					);
				});
			}
			return str;
		} catch {
			return "";
		}
	}

	let fileHandle;
	let currentPugName;
	let currentCsvName;
	let lastModifiedPug;
	let lastModifiedCsv;

	async function openPUG() {
		const options = {
			types: [
				{
					description: "PUG file",
					accept: {
						"text/plain": [".pug"],
					},
				},
			],
		};
		//	alert('clicked')
		[fileHandle] = await window.showOpenFilePicker(options);
		const file = await fileHandle.getFile();
		const content = await file.text();

		currentPugName = fileHandle.name;
		lastModifiedPug = file.lastModifiedDate.toGMTString();
		console.log(lastModifiedPug);
		editor.setContent(content);
	}

	async function openCSV() {
		const options = {
			types: [
				{
					description: "CSV file",
					accept: {
						"text/plain": [".csv"],
					},
				},
			],
		};

		[fileHandle] = await window.showOpenFilePicker(options);
		const file = await fileHandle.getFile();
		currentCsvName = fileHandle.name;
		lastModifiedCsv = file.lastModifiedDate.toGMTString();
		const content = await file.text();
		makeData(content);
	}

	async function writeNewPUG() {
		const options = {
			types: [
				{
					description: "PUG file",
					accept: {
						"text/plain": [".pug"],
					},
				},
			],
		};

		const handle = await window.showSaveFilePicker(options);
		const writable = await handle.createWritable();
		await writable.write(template);
		await writable.close();
		return handle;
	}

	async function ddjDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/template.txt");
	}

	async function nlgDemo() {
		getCSV("./data/data.csv");
		getPUG("./data/nlgtemplate.txt");
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

	async function validatePUG() {
		progress = 0;
		let invalid = [];

		let plcs = places ? [null, ...places] : [null];

		for (let i = 0; i < plcs.length; i++) {
			progress = i == plcs.length - 1 ? 0 : (i + 1) / plcs.length;
			await sleep(0);
			let output = render(template, plcs[i], plaintext);
			if (output == "")
				invalid.push(plcs[i] ? plcs[i].areanm : "No area selected");
		}

		if (invalid[0]) {
			alert(`Validation failed for ${invalid.join(", ")}`);
		} else {
			alert("Validation passed for all areas.");
		}
	}

	function makeData(str) {
		let newplaces = csvParse(str, autoType);
		let newlookup = {};
		newplaces.forEach((d) => (newlookup[d.areacd] = d));
		newplaces = newplaces
			.filter((d) =>
				["E06", "E07", "E08", "E09", "W06"].includes(
					d.areacd.slice(0, 3)
				)
			)
			.sort((a, b) => a.areanm.localeCompare(b.areanm));
		places = new MagicArray(...newplaces);
		place = places[0];
		lookup = newlookup;
	}

	async function getCSV(url) {
		let csv_res = await fetch(url);
		let csv_str = await csv_res.text();
		makeData(csv_str);
	}

	async function getPUG(url) {
		let pug_res = await fetch(url);
		let pug = await pug_res.text();
		await sleep(50);
		editor.setContent(pug);
	}

</script>

<svelte:head>
	<script
		src="https://unpkg.com/rosaenlg@3.2.4/dist/rollup/rosaenlg_tiny_en_US_3.2.4_comp.js"
		on:load={() => (rosae = window.rosaenlg_en_US)}/>
	{#if plaintext}
		<style>
			mark {
				background-color: rgba(255, 255, 255, 0);
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
			<button on:click={openPUG}
				><Icon type="load" margin /> Load PUG file</button
			>
			<button on:click={validatePUG}
				>{#if progress}{(progress * 100).toFixed(0)}%{:else}<Icon
						type="validate"
						margin
					/>{/if} Validate PUG</button
			>
			<button on:click={writeNewPUG}
				><Icon type="save" margin /> Save PUG file</button
			>
		</div>
		<div>
			<button on:click={openCSV}
				><Icon type="load" margin /> Load CSV file</button
			>
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
				<input type="checkbox" bind:checked={plaintext} />
				Plain text
			</label>
		</div>
	</nav>
	<div class="content">
		<div>
			<Editor bind:content={template} bind:this={editor} />
		</div>

		<div class="preview">
			<p class="fixed">
				{#if rosae && template}
					{#if currentPugName && !plaintext}
						<span
							>You are editing <b>{currentPugName}</b><i>
								last modified on {lastModifiedPug}</i
							></span
						>
					{/if}
					{#if currentCsvName && !plaintext}
						<span>
							with data from <b>{currentCsvName}</b><i>
								last modified on {lastModifiedCsv}</i
							></span
						>
					{/if}
					{@html render(template, place, plaintext)}
				{/if}
			</p>
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
	.content > div {
		flex: 1;
		overflow-y: auto;
		height: 100%;
	}
	.preview {
		padding: 10px;
	}
	nav label {
		margin-left: 12px;
	}
	nav input[type="checkbox"] {
		transform: scale(1.5);
		filter: saturate(0) contrast(2.5);
		margin-right: 2.5px;
	}
</style>

<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	
	export let editor = null;
	export let content = "";
	export let theme = "monokai";
	export let mode = "jade";
	export function setContent(content) {
		editor ? editor.session.setValue(content, -1) : null
	}
	
	function initEditor() {
		ace.config.set("basePath", "https://cdnjs.cloudflare.com/ajax/libs/ace/1.7.1/");
		editor = ace.edit("editor");
		editor.setTheme(`ace/theme/${theme}`);
		editor.setShowPrintMargin(false);
		editor.getSession().setUseWrapMode(true);
		editor.session.setOptions({
			mode: `ace/mode/${mode}`,
			tabSize: 4,
			useSoftTabs: true
		});
		
		setContent(content);
		
		editor.session.on('change', function(delta) {
			content = editor.getValue();
			dispatch('change', {
				content
			});
		});
	}
</script>

<svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.7.1/ace.min.js" on:load={initEditor}></script>
</svelte:head>

<pre id="editor"/>

<style>
	#editor {
		padding: 0;
		margin: 0;
		width: 100%;
		height: 100%;
	}
</style>
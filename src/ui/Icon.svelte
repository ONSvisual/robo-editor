<script>
    export let type = "save";
    export let rotation = 0;
    export let position = "inline";
    export let clickable = false;
    export let margin = false;
  
    const paths = {
        save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
        load: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
        data: "M21 8H3V4h18v4zm0 2H3v4h18v-4zm0 6H3v4h18v-4z"
      }
  
    let style = `transform: translate(0, 15%) scale(1.5) rotate(${-rotation}deg);`;
    if (["left", "right"].includes(position)) style += ` position: absolute; ${position}: 10px;`
  </script>
  
  <svg
    class="ico"
    viewBox="0 0 24 24"
    fill-rule="evenodd"
    clip-rule="evenodd"
    aria-hidden="true"
    focusable="false"
    {style}
    class:margin
    class:noclick={!clickable}>
    <path d={paths[type]}></path>
  </svg>
  
  <style>
    .ico {
      position: inherit;
      width: 1em;
      height: 1em;
      fill: currentColor;
      overflow: visible;
      transition: all 0.3s ease-out;
    }
    .noclick {
      pointer-events: none;
    }
    .margin {
      margin: 0 6px 0 1px;
    }
  </style>
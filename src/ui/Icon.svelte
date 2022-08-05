<script>
    export let type = "save";
    export let rotation = 0;
    export let position = "inline";
    export let clickable = false;
    export let margin = false;
  
    const paths = {
        save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
        load: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
        data: "M21 8H3V4h18v4zm0 2H3v4h18v-4zm0 6H3v4h18v-4z",
        validate: "M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM10 17H5v-2h5v2zm0-4H5v-2h5v2zm0-4H5V7h5v2zm4.82 6L12 12.16l1.41-1.41 1.41 1.42L17.99 9l1.42 1.42L14.82 15z",
        wait: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5-4-4V4h8v3.5l-4 4z"
      }
  </script>
  
  <svg
    class="ico"
    viewBox="0 0 24 24"
    fill-rule="evenodd"
    clip-rule="evenodd"
    aria-hidden="true"
    focusable="false"
    style:transform="translate(0, 15%) scale(1.5) rotate({-rotation}deg)"
    class:left={position == "left"}
    class:right={position == "right"}
    class:margin
    class:noclick={!clickable}
    class:absolute={["left", "right"].includes(position)}>
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
    .absolute {
      position: absolute !important;
    }
    .left {
      left: 0;
    }
    .right {
      right: 0;
    }
  </style>
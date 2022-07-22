export function download(blob, filename) {
	let url = window.URL || window.webkitURL || window;
	let link = url.createObjectURL(blob);

	let a = document.createElement("a");
	a.download = filename;
	a.href = link;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export class MagicArray extends Array {
	sortBy(key) {
		return this[0][key] && typeof this[0][key] === "number" ?
			new MagicArray(...this).sort((a, b) => b[key] - a[key]) :
			this[0][key] && typeof this[0][key] === "string" ? 
			new MagicArray(...this).sort((a, b) => a[key].localeCompare(b[key])) :
			this;
	}
	filterBy(key, val) {
		return !this[0][key] ? this :
			this.filter(d => d[key] === val);
	}
	trim(int) {
		return typeof int !== "number" ? this :
			int >= 0 ? this.slice(0, Math.floor(int)) :
			this.slice(Math.floor(int));
	}
	flip() {
		return new MagicArray(...this).reverse();
	}
}
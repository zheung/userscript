export function saveFile(url, name) {
	const a = document.createElement('a');

	a.download = name;
	a.href = url;
	a.click();
}

export function saveFile(url, name) {
	const a = document.createElement('a');

	a.download = name;
	a.href = url;
	a.click();
}


/**
 * @param {string} selector
 * @param {Document|Element} [element=document] `default: document`
 * @returns {Element[]}
 */
export function querySelector(selector, element = document) {
	return element.querySelector(selector);
}

/**
 * @param {string} selector
 * @param {Document|Element} [element=document] `default: document`
 * @returns {Element[]}
 */
export function querySelectorAll(selector, element = document) {
	return [...element.querySelectorAll(selector)];
}

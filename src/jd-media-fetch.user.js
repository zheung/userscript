// ==UserScript==
// @name        jd-media-fetch
// @description 2025.08.21 22
// @namespace   https://danor.app
// @version     0.0.1
// @author      DanoR
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @match       *://item.jd.com/*.html
// @noframes
// ==/UserScript==

import FetchManager from './lib/fetch-manager.js';
import { G } from './lib/logger.js';

import { faDownload } from '@fortawesome/free-solid-svg-icons';




/* 网页信息处理 */
const product = unsafeWindow.pageConfig?.product;

/** @type {Object[]} */
const optionsMedia = (product?.imageList ?? []).map((path, index) => {
	path = path.replace('.avif', '');

	return {
		index: index + 1,
		type: 'image',
		textType: '图片',
		name: path.split('/').pop(),
		url: 'https://img12.360buyimg.com//n0/' + path,
	};
});


const namePrefix = `jd@${product.skuid}`;



/* 脚本功能 */
const createSaveLink = (innerHTML, download, href, title) => {
	const a = document.createElement('a');

	a.setAttribute('saver', '');

	a.innerHTML = innerHTML;

	if(download) { a.download = download; }
	if(href) { a.href = href; }
	if(title) { a.title = title; }

	return a;
};


/**
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @param {Function} handle
 */
const readReader = async (reader, handle) => {
	let sizeRead = 0;
	let isWhile = true;

	while(isWhile) {
		const { done, value } = await reader.read();

		if(!done || sizeRead == 0) {
			await handle(value, sizeRead += value.length, sizeRead - value.length);
		}
		else {
			isWhile = false;
		}
	}
};

const fetchMediaSize = async url => {
	const controller = new AbortController();

	const responseSize = await fetch(new Request(url, { method: 'GET', signal: controller.signal }));

	const size = +responseSize.headers.get('Content-Length');

	controller.abort();

	return size;
};

const fetchMediaData = async (info, { saveImmediately = false } = {}) => {
	// const [proger, infoer] = box;

	try {
		const responseGet = await fetch(info.url);

		const reader = responseGet.body.getReader();

		const datasMedia = new Uint8Array(info.size);

		await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
			datasMedia.set(data, sizeRead);

			// updateProg(sizeReadAfter, II.size, box);
		});


		const linkMedia = createSaveLink(`[下载${info.nameLog}]`, info.nameSave, URL.createObjectURL(new Blob([datasMedia])));
		// infoer.parentNode.removeChild(infoer.nextElementSibling);
		// infoer.parentNode.insertBefore(linkMedia, infoer.nextElementSibling);
		if(saveImmediately) { linkMedia.click(); }


		G.info('download-media', '✔', info.nameLog);


		return datasMedia;
	}
	catch(error) {
		// proger.hidden = true;

		// infoer.innerHTML = `
		// 	<div messager title="${error.message ?? error}">${info.nameLog} error, ${error.message ?? error}</div>
		// `.replace(/\t|\n/g, '');
		globalThis.console.log(1);

		throw error;
	}
};



/* 应用 */
const FM = new FetchManager('#FF475E');

FM.$willStorageValue = true;
FM.$widthPanel = 'calc(var(--spc) * 80)';

FM.$panels = [{
	id: 'media',
	type: 'select-grid',
	title: '选择商品媒体',
	keyValue: 'indexOptionSelected',
	heads: [
		{ key: 'index', text: '顺序' },
		{ key: 'textType', text: '类型' },
		{ key: 'name', text: '文件名' },
	],
	options: optionsMedia,
	handle: { getOptionKey: option => option.index }
}, {
	id: 'functions',
	title: '功能',
	type: 'functions',
	functions: [{
		id: 'fetch-all-media',
		text: '下载全部媒体',
		icon: faDownload,
		async handle(states) {
			for (const option of optionsMedia) {
				await fetchMediaData({
					url: option.url,
					nameLog: '图片',
					nameSave: `${namePrefix}@image#${option.index}@${option.name}`.replace(/[~/]/g, '_'),
					size: await fetchMediaSize(option.url),
				}, { saveImmediately: true });
			}
		}
	}, {
		id: 'fetch-detect-media',
		text: '下载指定媒体',
		icon: faDownload,
		async handle(states) {
			const indexOptionSelected = states.$values.value.indexOptionSelected;

			const option = optionsMedia.find(option => option.index == indexOptionSelected);
			if(!option) { return; }

			fetchMediaData({
				url: option.url,
				nameLog: '图片',
				nameSave: `${namePrefix}@image#${option.index}@${option.name}`.replace(/[~/]/g, '_'),
				size: await fetchMediaSize(option.url),
			}, { saveImmediately: true });
		}
	}]
}];

FM.$values = {
	indexOptionSelected: null,
};

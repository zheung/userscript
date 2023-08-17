// ==UserScript==
// @name        bilibili-dynamic-media-download
// @description as the title
// @namespace   https://danor.app/
// @version     1.1.1-2023.03.24.02
// @author      Nuogz
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource    notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @match       *://t.bilibili.com/*
// @match       *://www.bilibili.com/opus/*
// @match       *://space.bilibili.com/*/dynamic/*
// ==/UserScript==

/* global Notyf */



const namePackage = GM_info.script.name;


const G = {
	log(...params) { console.log(`${namePackage}: `, ...params); },
	error(...params) { console.error(`${namePackage}: `, ...params); },
};



GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.${namePackage} {
		padding: 0px;
		background: #1da1f2;
		box-shadow: rgb(136 153 166 / 20%) 0px 0px 15px, rgb(136 153 166 / 15%) 0px 0px 3px 1px;
		border-radius: 3px;
		max-width: unset;
	}

	.${namePackage}>.notyf__wrapper {
		padding: 10px;
	}


	.${namePackage} .inline {
		display: inline-block;
		vertical-align: top;
	}


	.${namePackage} [main-box] {
		display: grid;
		grid-template-columns: repeat(5, auto);

		align-items: center;

		grid-gap: 4px 12px;
	}

	.${namePackage} [main-box]>* {
		height: 20px;

		color: white;
		font-size: 14px;
		line-height: 20px;
		text-align: right;
		font-family: consolas;

		text-decoration: none;
	}



	.${namePackage} [download-progress] {
		width: 100px;
		border: none;
		height: 14px
	}
	.${namePackage} [download-progress]::-webkit-progress-bar {
		background-color: #ffffff;
		border-radius: 3px;
	}
	.${namePackage} [download-progress]::-webkit-progress-value {
		background: #17bf63;
		border-radius: 2px;
	}


	.${namePackage} [save-button][href]:hover {
		color: lightgreen;
	}


	.${namePackage} [download-message] {
		grid-column-start: 1;
		grid-column-end: 6;

		max-width: 400px;

		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`);


const notyf = new Notyf({
	duration: 0,
	position: { x: 'right', y: 'top' },
	types: [
		{
			type: namePackage,
			icon: false,
			className: namePackage,
		}
	]
});


/**
 * Download Info Box
 * @typedef {Object} DownloadInfoBox
 * @property {HTMLProgressElement} progress
 * @property {HTMLDivElement} titler
 * @property {HTMLDivElement} percenter
 * @property {HTMLDivElement} sizer
 * @property {HTMLAnchorElement} saver
 */

const innerHTMLFile = `
	<div download-title></div>
	<progress download-progress value="0" max="100"></progress>
	<div class="inline" download-percent>0%</div>
	<div class="inline" download-size>未知大小</div>
	<a class="inline" save-button>下载中...</a>
`;

/**
 * 初始化下载浮窗
 * @param {string} titleMain
 * @returns
 */
const openNoty = titleMain => {
	const idNoty = (Math.random() * 10000).toFixed(0);

	const noty = notyf.open({
		type: namePackage,
		message: `
			<div id="${namePackage}-${idNoty}">
				<div main-title>${titleMain}</div>
				<div perpare-title>准备中...</div>
				<div main-box></div>
			</div>
		`
	});


	const elBoxNoty = document.querySelector(`#${namePackage}-${idNoty}`);

	const elTitleMain = elBoxNoty.querySelector('div[main-title]');
	const elBoxMain = elBoxNoty.querySelector('div[main-box]');


	elTitleMain.addEventListener('click', () => notyf.dismiss(noty));

	/**
	 * @param {number} count
	 * @param {string} title
	 * @returns {DownloadInfoBox}
	 */
	const initer = (count, title = '') => {
		elBoxNoty.title = title;

		elBoxNoty.querySelector('[perpare-title]')?.remove();

		elBoxMain.innerHTML = innerHTMLFile.repeat(count);


		const titles = [...elBoxNoty.querySelectorAll('[download-title]')];
		const progresses = [...elBoxNoty.querySelectorAll('[download-progress]')];
		const percents = [...elBoxNoty.querySelectorAll('[download-percent]')];
		const sizers = [...elBoxNoty.querySelectorAll('[download-size]')];
		const savers = [...elBoxNoty.querySelectorAll('[save-button]')];

		return progresses.map((progress, index) => ({
			progress,
			titler: titles[index],
			percenter: percents[index],
			sizer: sizers[index],
			saver: savers[index],
		}));
	};


	return { initer, noty, elTitleMain, elBoxMain };
};



/**
 * 渲染文件大小
 * @param {number} value
 * @returns {string}
 */
const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2).padStart(6, '0')}${['By', 'KB', 'MB', 'GB'][index]}`;
};


/**
 * 下载数据
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

/**
 * 初始化下载链接
 * @param {HTMLAnchorElement} [a]
 * @param {string} innerHTML
 * @param {string} [download]
 * @param {string} [href]
 * @param {string} [title]
 * @returns {HTMLAnchorElement}
 */
const initSaver = (a = document.createElement('a'), innerHTML, download, href, title) => {
	a.innerHTML = innerHTML;

	if(download) { a.download = download; }
	if(href) { a.href = href; }
	if(title) { a.title = title; }

	return a;
};


/**
 * 获取文件大小
 * @param {string} url
 * @returns {number}
 */
const fetchMediaSize = async url => {
	const responseSize = await fetch(new Request(url, { method: 'HEAD', }));

	const size = +responseSize.headers.get('Content-Length');

	return size;
};


/**
 * 更新下载进度
 * @param {number} now
 * @param {number} max
 * @param {HTMLProgressElement} progress
 * @param {HTMLDivElement} percenter
 */
const updateProgress = (now, max, progress, percenter) => {
	progress.value = now;
	progress.max = max;

	percenter.innerHTML = `${(now * 100 / max).toFixed(0).padStart(3, '0')}%`;
};


/**
 * 下载信息
 * @typedef {Object} DownloadInfo
 * @property {string} url
 * @property {string} nameLog
 * @property {string} nameSave
 * @property {number} size
 */

/**
 * 下载文件数据
 * @param {DownloadInfo} info
 * @param {DownloadInfoBox} box
 * @param {boolean} isSaveImmediate
 * @returns {Uint8Array}
 */
const downloadData = async (info, box, isSaveImmediate = false) => {
	const { progress, titler, percenter, sizer, saver } = box;

	titler.innerHTML = info.nameLog;

	try {
		const responseGet = await fetch(info.url);

		const reader = responseGet.body.getReader();

		sizer.innerHTML = renderSize(info.size);
		const datasMedia = new Uint8Array(info.size);


		await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
			datasMedia.set(data, sizeRead);

			updateProgress(sizeReadAfter, info.size, progress, percenter);
		});


		initSaver(saver, '保存', info.nameSave, URL.createObjectURL(new Blob([datasMedia])));

		if(isSaveImmediate) { saver.click(); }


		G.log('download-media', '✔', info.nameLog);


		return datasMedia;
	}
	catch(error) {
		progress.hidden = true;
		percenter.hidden = true;
		sizer.hidden = true;
		saver.hidden = true;

		percenter.innerHTML = `
			<div download-message class="inline" style="width: 350px" title="${error.message ?? error}">${info.nameLog} error, ${error.message ?? error}</div>
		`.replace(/\t|\n/g, '');

		throw error;
	}
};


/**
 * 下载媒体
 * @param {number} idDynamic
 */
const download = async idDynamic => {
	G.log('download-start', '...');

	const dynamic = await (await fetch(`https://api.bilibili.com/x/polymer/web-dynamic/v1/detail?id=${idDynamic}`, { credentials: 'include' })).json();

	const urls = dynamic?.data?.item?.modules?.module_dynamic?.major?.draw?.items.map(item => item.src);
	const author = dynamic?.data?.item?.modules?.module_author;

	const boxes = openNoty(`下载 ${author.name}@${idDynamic}`).initer(urls.length);

	urls.map(async (url, index) => {
		const II = {
			url: url,
			nameLog: `第${index + 1}张`,
			nameSave: `bilibili@${author.mid}@${idDynamic}@${index + 1}@${new URL(url).pathname.split('/').pop()}`,
			size: await fetchMediaSize(url),
		};

		downloadData(II, boxes[index], true);
	});
};



GM_addStyle(`
	[${namePackage}]>[download-button] {
		cursor: pointer !important;
	}
	[${namePackage}]>[download-button]:hover {
		color: #72d5fb;
	}
`);

/**
 * 初始化保存按钮
 * @param {Element} elTime
 */
const initDownloadButton = elTime => {
	elTime.setAttribute(namePackage, '');

	if(!document.querySelector('.bili-album')) { return; }

	let idDynamic = location.pathname.split('/').pop();


	if(!~~idDynamic) {
		const elMain = elTime.parentElement.parentElement.parentElement;

		const elAlbum = elMain.querySelector('.bili-album');
		idDynamic = elAlbum?.attributes['dyn-id']?.value;

		if(!~~idDynamic) { return; }
	}


	elTime.innerHTML = `<span>${elTime.innerHTML}</span>` + `<span download-button> 保存 </span>`;

	elTime.querySelector('[download-button]').addEventListener('click', event => {
		download(idDynamic);

		event.preventDefault();
		event.stopPropagation();
	});
};



// 监视dom变化
const observer = new MutationObserver(() => {
	try {
		document.querySelectorAll(`.bili-dyn-time, .opus-module-author__pub__text`)
			.forEach(elTime => {
				if(namePackage in elTime.attributes) { return; }

				initDownloadButton(elTime);
			});
	}
	catch(error) { G.error('init-download-button', '✖', error.message, error.stack); }
});

observer.observe(document.body, { childList: true, subtree: true });

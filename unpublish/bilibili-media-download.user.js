// ==UserScript==
// @name        bilibili-media-download
// @description as the title
// @namespace   https://danor.app/
// @version     1.1.0-2022.10.25.01
// @author      Nuogz
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require     https://cdn.jsdelivr.net/npm/gbk.js@0.3.0/dist/gbk2.min.js
// @require     https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js
// @resource    notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @match       *://*.bilibili.com/bangumi/play/*
// @match       *://*.bilibili.com/video/*
// ==/UserScript==

/* global Notyf, FFmpeg, GBK */
/* global __INITIAL_STATE__ */



const namePackage = GM_info.script.name;


const G = {
	log(...params) { console.log(`${namePackage}: `, ...params); },
	error(...params) { console.error(`${namePackage}: `, ...params); },
};


let ffmpegLoad;
try {
	ffmpegLoad = FFmpeg.createFFmpeg({ log: false });
}
catch(error) { G.error(error.message ?? error); }

const ffmpeg = ffmpegLoad;


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


	.${namePackage} [title-name] {
		margin-bottom: 5px;
	}

	.${namePackage} [proger] {
		width: 100px;
		border: none;
	}

	.${namePackage} [proger]::-webkit-progress-bar {
		background-color: #ffffff;
		border-radius: 3px;
	}
	.${namePackage} [proger]::-webkit-progress-value {
		background: #17bf63;
		border-radius: 3px;
	}

	.${namePackage} [infoer] {
		text-align: right;
	}

	.${namePackage} .save {
		color: white;
		text-decoration: none;
		margin-left: 5px;
	}

	.${namePackage} [text-liner] {
		text-align: right;
		overflow: hidden;
		white-space: nowrap;
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


const domTextDBox = `
<progress proger value="0" max="100"></progress>
<div class="inline" infoer>准备中...</div><br>
`;
const openNoty = title => {
	const idNoty = (Math.random() * 10000).toFixed(0);
	const noty = notyf.open({
		type: namePackage,
		message: `<div id="${namePackage}-${idNoty}"><div title-name>${title} 准备中...</div><div main></div></div>`
	});

	const boxNoty = document.querySelector(`#${namePackage}-${idNoty}`);
	const boxTitle = boxNoty.querySelector('div[title-name]');
	const boxMain = boxNoty.querySelector('div[main]');

	boxTitle.addEventListener('click', () => notyf.dismiss(noty));

	const initer = (count, title = '') => {
		boxNoty.title = title;

		boxTitle.innerHTML = boxTitle.innerHTML.replace(' 准备中...', '');
		boxMain.innerHTML = domTextDBox.repeat(count);

		const progers = [...boxNoty.querySelectorAll('progress')];
		const infoers = [...boxNoty.querySelectorAll('div[infoer]')];

		return progers.map((proger, index) => [proger, infoers[index]]);
	};

	return { noty, initer, boxTitle, boxMain };
};


// 最大文件 2046MB
const sizeArrayBufferMax = Math.pow(2, 31) - Math.pow(2, 21);
const sizeAudioMax = Math.pow(2, 27);
const sizeVideoMax = sizeArrayBufferMax - sizeAudioMax;


const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2).padStart(6, '0')} ${['By', 'KB', 'MB', 'GB'][index]}`;
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


const makeRangesBySize = (size, max) => {
	const result = [];

	let sizeNow = 0;

	while(sizeNow <= size - max) {
		result.push([`${sizeNow}-${sizeNow + max - 1}`, sizeNow + max - sizeNow]);


		sizeNow += max;
	}

	if(sizeNow != size) {
		result.push([`${sizeNow}-${size - 1}`, size - sizeNow]);
	}

	return result;
};


const createSaveLink = (innerHTML, download, href, title) => {
	const a = document.createElement('a');

	a.classList.add('inline', 'save');

	a.innerHTML = innerHTML;

	if(a.download) { a.download = download; }
	if(a.href) { a.href = href; }
	if(a.title) { a.title = title; }

	return a;
};


const fetchMediaSize = async url => {
	const responseSize = await fetch(new Request(url, { method: 'HEAD', }));

	const size = +responseSize.headers.get('Content-Length');

	return size;
};

const updateProg = (now, max, box) => {
	const [proger, infoer] = box;

	infoer.innerHTML = `${renderSize(max)} ${(now * 100 / max).toFixed(2).padStart(5, '0')}%`;

	proger.value = now;
	proger.max = max;
};


const downloadMediaData = async (II, box) => {
	const [proger, infoer] = box;

	try {
		const responseGet = await fetch(II.url);

		const reader = responseGet.body.getReader();

		const datasMedia = new Uint8Array(II.size);

		await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
			datasMedia.set(data, sizeRead);

			updateProg(sizeReadAfter, II.size, box);
		});


		const linkMedia = createSaveLink(`[下载${II.nameLog}]`, II.nameSave, URL.createObjectURL(new Blob([datasMedia])));
		infoer.parentNode.insertBefore(linkMedia, infoer.nextElementSibling);

		G.log('download-media', '✔', II.nameLog);


		return datasMedia;
	}
	catch(error) {
		proger.hidden = true;

		infoer.innerHTML = `
			<div text-liner class="inline" style="width: 350px" title="${error.message ?? error}">${II.nameLog} error, ${error.message ?? error}</div>
		`.replace(/\t|\n/g, '');

		throw error;
	}
};

const mixinMediaData = async (datasVideo, datasAudio, nameFile, isCloseAfterDownload) => {
	ffmpeg.FS('writeFile', 'video.m4s', datasVideo);
	ffmpeg.FS('writeFile', 'audio.m4s', datasAudio);

	await ffmpeg.run('-y', '-v', 'quiet', '-i', 'video.m4s', '-i', 'audio.m4s', '-vcodec', 'copy', '-acodec', 'copy', 'output.mp4');

	const datasMixin = ffmpeg.FS('readFile', 'output.mp4');

	const a = document.createElement('a');
	a.download = nameFile;
	a.href = URL.createObjectURL(new Blob([datasMixin]));
	a.click();

	G.log('save-mixin-media', '✔', a.download);

	if(isCloseAfterDownload) { setTimeout(() => window.close(), 1000 * 5); }
};




const initSaver = (url, nameSave, box, what, sizeRange, range) => {
	const [, infoer] = box;

	const a = createSaveLink(`[下载${what}]`, nameSave, '', (range ? `${range}, ` : '') + `${renderSize(sizeRange)}`);
	infoer.parentNode.insertBefore(a, infoer.nextElementSibling);


	a.addEventListener('click', async () => {
		/** @type {FileSystemFileHandle} */
		const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameSave });

		if(!file) { throw `没有选择文件，无法保存${nameSave}`; }


		const headerGet = new Headers();
		headerGet.append('Range', `bytes=${range}`);
		const requestGet = new Request(url, { headers: headerGet });
		const responseGet = await fetch(requestGet);

		const reader = responseGet.body.getReader();

		const writable = await file.createWritable();

		await readReader(reader, async (data, sizeReadAfter) => {
			await writable.write(data);

			updateProg(sizeReadAfter, sizeRange, box);
		});

		await writable.close();

		G.log('save-media', '✔', nameSave);
	});
};

const makeDownloadButton = (I, initer, boxMain) => {
	const ranges = makeRangesBySize(I.video.size, sizeArrayBufferMax);

	const boxes = initer(ranges.length + 1);

	ranges.forEach(([range, sizeRange], index) => {
		const nameVideoPartSave = I.video.nameSave + `.part${index + 1}`;


		initSaver(I.video.url, nameVideoPartSave, boxes[index], `${I.video.nameLog}${String(index + 1).padStart(2, '0')}`, sizeRange, range);
	});


	initSaver(I.audio.url, I.audio.nameSave, boxes[boxes.length - 1], I.audio.nameLog, I.audio.size);




	const dataMixin = new Uint8Array(GBK.encode(`
		@echo off

		echo 合并[视频文件]
		copy /B ".\\${I.audio.nameSave}.part*" ".\\${I.audio.nameSave}"
		echo 合并[视频文件] ✔

		echo 混流[音视频文件]
		ffmpeg -y -v quiet -i ".\\${I.audio.nameSave}" -i ".\\${I.audio.nameSave}" -vcodec copy -acodec copy ".\\${I.nameMixin}"
		echo 混流[音视频文件] ✔

		echo 移除[音视频文件]
		del ".\\${I.audio.nameSave}.part*"
		del ".\\${I.audio.nameSave}"
		del ".\\${I.audio.nameSave}"
		echo 移除[音视频文件] ✔

		echo 删除脚本自身
		del %0
		echo 删除脚本自身 ✔
	`.replace(/\|/g, '_').replace(/\t/g, '').replace(/\n/g, '\r\n')
	));

	const nameMinxinSave = `bilibili@${I.uid}@${I.slot}.mixin.bat`;

	const a = createSaveLink('[下载合并脚本]');
	boxMain.appendChild(a);

	a.addEventListener('click', async () => {
		const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameMinxinSave });

		if(!file) { throw `没有选择文件，无法保存${nameMinxinSave}`; }

		const writable = await file.createWritable();

		await writable.write({ type: 'write', data: dataMixin });

		await writable.close();
	});
};


const download = async (p_, isCloseAfterDownload) => {
	G.log('download-start', '...');


	const I = {};


	const source = unsafeWindow.__playinfo__.data.dash;
	const video = source.video.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];
	const audio = source.audio.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];

	const state = __INITIAL_STATE__;

	I.slot = state.bvid ||
		location.pathname.replace(/\/$/, '')
			.replace('/bangumi/play/', '')
			.replace('/video/', '');

	I.title = state.h1Title ?? state?.videoData?.title ?? '未知标题';
	I.uid = state?.upData?.mid ?? '0';

	I.p = p_ ?? state?.p;
	const pages = state?.videoData?.pages;
	I.part = pages?.find(page => page.page == I.p)?.part;


	const namePrefix = `bilibili@${I.uid}@${I.slot}@${I.title}` + (pages?.length > 1 ? `@p${I.p}@${I.part}` : '');

	I.nameMixin = `${namePrefix}@${video.height}p@${video.bandwidth}.mp4`.replace(/[~/]/g, '_');

	I.video = {};
	I.video.url = video.baseUrl;
	I.video.nameLog = '视频';
	I.video.nameSave = `${namePrefix}@video@${video.height}p.m4s`.replace(/[~/]/g, '_');
	I.video.size = await fetchMediaSize(I.video.url);

	I.audio = {};
	I.audio.url = audio.baseUrl;
	I.audio.nameLog = '音频';
	I.audio.nameSave = `${namePrefix}@audio.m4s`.replace(/[~/]/g, '_');
	I.audio.size = await fetchMediaSize(I.audio.url);


	const { initer, boxMain } = openNoty(`● ${I.title}`);

	const modeSave = I.video.size > sizeVideoMax || localStorage.getItem(`${namePackage}/save-mode`) == 'direct' ? 'direct' : 'mixin';
	if('mixin' == modeSave) {
		const boxes = initer(2);

		const datasVideo = await downloadMediaData(I.video, boxes[0]);
		const datasAudio = await downloadMediaData(I.audio, boxes[1]);

		if(ffmpeg.isLoaded()) { mixinMediaData(datasVideo, datasAudio, I.nameMixin, isCloseAfterDownload); }
	}
	else if('direct' == modeSave) {
		makeDownloadButton(I, initer, boxMain);
	}
};


const initDownloadButton = () => {
	const buttonSetting = document.querySelector('.bpx-player-dm-setting');

	if(buttonSetting) {
		const buttonDown = buttonSetting.cloneNode(true);
		buttonSetting.parentNode.insertBefore(buttonDown, buttonSetting.nextElementSibling);


		const svg = buttonDown.querySelector('svg');
		svg.setAttribute('viewBox', '0 -5 26 36');
		svg.innerHTML = '<polygon points="12.732,26 25.464,13.27 18.026,13.27 18.026,0 7.438,0 7.438,13.27 0,13.27" />';

		buttonDown.classList.add(`${namePackage}-download-button`);
		buttonDown.title = '下载';

		return buttonDown;
	}
};


(async () => {
	try {
		await ffmpeg.load();

		G.log('init-ffmpeg', '✔');
	}
	catch(error) { G.error('init-ffmpeg', '✖', error.message, error.stack); }


	const observer = new MutationObserver(() => {
		try {
			if(!document.querySelector(`.${namePackage}-download-button`)) {
				const buttonDownload = initDownloadButton();

				if(buttonDownload) {
					buttonDownload.addEventListener('click', event => (
						event.stopPropagation(),
						download()
					));

					G.log('init-download-button', '✔');


					const pAutoDownload = new URLSearchParams(location.search).get(`${namePackage}-auto-download`);
					if(pAutoDownload) { download(~~pAutoDownload, true); }

					observer.disconnect();
				}
			}
		}
		catch(error) { G.error('init-download-button', '✖', error.message, error.stack); }
	});
	observer.observe(document.body, { childList: true, subtree: true });
})();

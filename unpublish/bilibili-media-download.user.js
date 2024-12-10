// ==UserScript==
// @name        bilibili-media-download
// @description 2024.05.17 01
// @namespace   https://danor.app/
// @version     1.3.4
// @author      DanoR
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require     https://www.unpkg.com/notyf@3/notyf.min.js
// @require     https://www.unpkg.com/gbk.js@0.3.0/dist/gbk2.min.js
// @require     https://www.unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js
// @resource    notyf_css https://www.unpkg.com/notyf@3/notyf.min.css
// @match       *://*.bilibili.com/bangumi/play/*
// @match       *://*.bilibili.com/video/*
// @noframes
// ==/UserScript==

/* global Notyf, FFmpeg, GBK */
/* global __INITIAL_STATE__ */



const namePackage = GM_info.script.name;


const G = {
	log(...params) { globalThis.console.log(`${namePackage}: `, ...params); },
	error(...params) { globalThis.console.error(`${namePackage}: `, ...params); },
};


let ffmpegLoad;
try {
	ffmpegLoad = FFmpeg.createFFmpeg({
		corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
		mainName: 'main',
		log: false
	});
}
catch(error) { G.error(error.message ?? error); }

const ffmpeg = ffmpegLoad;


GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.${namePackage} {
		top: 64px;
		padding: 0px;
		background: var(--bg1);
		box-shadow: rgb(136 153 166 / 40%) 0px 0px 15px, rgb(136 153 166 / 40%) 0px 0px 3px 1px;
		border-radius: 6px;
		max-width: unset;
		color: var(--text1);
		overflow: hidden;
	}

	.${namePackage}>.notyf__wrapper {
		padding: 10px;
	}


	.${namePackage} [main] {
		display: grid;
		justify-items: end;
	}


	.${namePackage} [title-name] {
		width: 100%;
		margin-bottom: 5px;
	}

	.${namePackage} [list] {
		display: grid;
		grid-template-columns: auto auto auto;
		grid-gap: 6px 20px;
		align-items: center;
	}
	.${namePackage} [list]>* {
		text-align: right;
	}

	.${namePackage} [proger] {
		width: 100px;
		border: none;
	}

	.${namePackage} [proger]::-webkit-progress-bar {
		border: 1px solid var(--brand_pink);
		background-color: var(--bg1);
		border-radius: 6px;
	}
	.${namePackage} [proger]::-webkit-progress-value {
		background: var(--brand_pink);
		border-radius: 6px;
	}

	.${namePackage} [saver] {
		color: var(--text1);
		text-decoration: none;
	}
	.${namePackage} [saver][_solo] {
		grid-column: 1/4;
	}

	.${namePackage} [messager] {
		grid-column: 1/3;
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
	<div infoer>准备中...</div>
	<div linker></div>
`;
const openNoty = title => {
	const idNoty = (Math.random() * 10000).toFixed(0);
	const noty = notyf.open({
		type: namePackage,
		message: `<div id="${namePackage}-${idNoty}" main><div title-name>${title} 准备中...</div><div list></div></div>`
	});

	const boxNoty = document.querySelector(`#${namePackage}-${idNoty}`);
	const boxTitle = boxNoty.querySelector('div[title-name]');
	const boxMain = boxNoty.querySelector('div[list]');

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

	a.setAttribute('saver', '');

	a.innerHTML = innerHTML;

	if(download) { a.download = download; }
	if(href) { a.href = href; }
	if(title) { a.title = title; }

	return a;
};


const fetchMediaSize = async url => {
	const controller = new AbortController();

	const responseSize = await fetch(new Request(url, { method: 'GET', signal: controller.signal }));

	const size = +responseSize.headers.get('Content-Length');

	controller.abort();

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
		infoer.parentNode.removeChild(infoer.nextElementSibling);
		infoer.parentNode.insertBefore(linkMedia, infoer.nextElementSibling);


		G.log('download-media', '✔', II.nameLog);


		return datasMedia;
	}
	catch(error) {
		proger.hidden = true;

		infoer.innerHTML = `
			<div messager title="${error.message ?? error}">${II.nameLog} error, ${error.message ?? error}</div>
		`.replace(/\t|\n/g, '');

		throw error;
	}
};

const mixinMediaData = async (datasVideo, datasAudio, nameFile, isCloseAfterDownload) => {
	ffmpeg.FS('writeFile', 'video.m4s', datasVideo);
	if(datasAudio) {
		ffmpeg.FS('writeFile', 'audio.m4s', datasAudio);
	}

	await ffmpeg.run('-y', '-v', 'quiet',
		'-i', 'video.m4s',
		...(datasAudio ? ['-i', 'audio.m4s'] : []),
		'-vcodec', 'copy', '-acodec', 'copy', 'output.mp4');

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
	infoer.parentNode.removeChild(infoer.nextElementSibling);
	infoer.parentNode.insertBefore(a, infoer.nextElementSibling);


	a.addEventListener('click', async () => {
		/** @type {FileSystemFileHandle} */
		const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameSave });

		if(!file) { throw `没有选择文件，无法保存${nameSave}`; }


		const headerGet = new Headers();
		if(range) { headerGet.append('Range', `bytes=${range}`); }

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

	if(I.audio) {
		initSaver(I.audio.url, I.audio.nameSave, boxes[boxes.length - 1], I.audio.nameLog, I.audio.size);
	}




	const dataMixin = new Uint8Array(GBK.encode(`
		@echo off

		echo 合并[视频文件]
		copy /B ".\\${I.video.nameSave}.part*" ".\\${I.video.nameSave}"
		echo 合并[视频文件] ok

		echo 混流[音视频文件]
		ffmpeg -y -v quiet -i ".\\${I.video.nameSave}" ${I.audio ? `-i ".\\${I.audio.nameSave}" ` : ''}-vcodec copy -acodec copy ".\\${I.nameMixin}"
		echo 混流[音视频文件] ok

		@REM echo 移除[音视频文件]
		@REM del ".\\${I.video.nameSave}.part*"
		@REM del ".\\${I.video.nameSave}"
		${I.audio ? `@REM del ".\\${I.audio.nameSave}"` : ''}
		@REM echo 移除[音视频文件] ok

		@REM echo 删除脚本自身
		@REM del %0
		@REM echo 删除脚本自身 ok
	`.replace(/\|/g, '_').replace(/\t/g, '').replace(/\n/g, '\r\n')));

	const nameMinxinSave = `bilibili@${I.uid}@${I.slot}.mixin.bat`;

	const a = createSaveLink('[下载混流脚本]');
	a.setAttribute('_solo', '');
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
	const videos = source.video.slice().sort((a, b) =>
		b.id - a.id ||
		b.height - a.height ||
		b.bandwidth - a.bandwidth
	);
	const videoAVC = videos.filter(v => ~v.codecs.indexOf('avc'))[0];
	const videoAV1 = videos.filter(v => ~v.codecs.indexOf('av01'))[0];
	const videoHEV = videos.filter(v => ~v.codecs.indexOf('hev1') || ~v.codecs.indexOf('hvc1'))[0];
	const videosBest = [videoAVC, videoAV1, videoHEV].sort((a, b) => b.id - a.id || b.height - a.height || b.bandwidth - a.bandwidth);
	const video = videosBest[0];

	const audio = source.audio ? source.audio.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0] : null;
	G.log('picked video', video);
	G.log('picked audio', audio);


	const state = __INITIAL_STATE__;

	I.slot = state.bvid ||
		location.pathname.replace(/\/$/, '')
			.replace('/bangumi/play/', '')
			.replace('/video/', '');

	I.title = state.h1Title ?? state?.videoData?.title ?? '(未知标题)';
	I.uid = state?.upData?.mid ?? '0';
	I.uname = state?.upData?.name ?? '(未知用户)';

	I.p = p_ ?? state?.p;
	const pages = state?.videoData?.pages;
	I.part = pages?.find(page => page.page == I.p)?.part;


	const namePrefix = `bilibili@${I.uid}#${I.uname}@${I.slot}#${I.title}` + (pages?.length > 1 ? `@p${I.p}#${I.part}` : '');

	I.nameMixin = `${namePrefix}@${Math.min(video.width, video.height)}p#${video.bandwidth}.mp4`.replace(/[~/]/g, '_');

	I.video = {};
	I.video.url = video.backupUrl[0];
	I.video.url = video.baseUrl;
	I.video.nameLog = '视频';
	I.video.nameSave = `${namePrefix}@video@${Math.min(video.width, video.height)}p.m4s`.replace(/[~/]/g, '_');
	I.video.size = await fetchMediaSize(I.video.url);

	if(audio) {
		I.audio = {};
		I.audio.url = audio.backupUrl[0];
		I.audio.url = audio.baseUrl;
		I.audio.nameLog = '音频';
		I.audio.nameSave = `${namePrefix}@audio.m4s`.replace(/[~/]/g, '_');
		I.audio.size = await fetchMediaSize(I.audio.url);
	}


	const { initer, boxMain } = openNoty(`● ${I.title}`);

	const modeSave = I.video.size > sizeVideoMax || localStorage.getItem(`${namePackage}/save-mode`) == 'direct' ? 'direct' : 'mixin';
	if('mixin' == modeSave) {
		const boxes = initer(2);

		const datasVideo = await downloadMediaData(I.video, boxes[0]);
		const datasAudio = audio ? await downloadMediaData(I.audio, boxes[1]) : null;

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
		buttonDown.classList.remove('disabled');
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

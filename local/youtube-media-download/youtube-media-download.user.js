// ==UserScript==
// @name        youtube-media-download
// @description 2023.01.17.01
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/npm/gbk.js@0.3.0/dist/gbk2.min.js
// @match       *://www.youtube.com/watch*
// @resource    html ./youtube-media-download.user.html
// @resource    css ./youtube-media-download.user.css
// ==/UserScript==

// eslint-disable-next-line no-unused-vars
/* global GBK */


/**
 * @typedef {Object} YoutubeFormat

 * @property {number} itag 22
 * @property {string} type 'fixed-video'
 * @property {string} mime 'video'
 * @property {string} ext 'mp4'
 * @property {string} codecs 'avc1.1'
 * @property {number} width 1920
 * @property {number} height 1080
 * @property {number} size 123456
 * @property {number} bitrate 123456
 * @property {string} qualityLabel 1080p60
 * @property {string} url
 */



const namePackage = GM_info.script.name;



const htmlScript = GM_getResourceText('html');
const cssScript = GM_getResourceText('css').replace(new RegExp('namePackage', 'g'), namePackage);

GM_addStyle(cssScript);



const G = {
	log(...params) { console.log(`${namePackage}:`, ...params); },
	error(...params) { console.error(`${namePackage}:`, ...params); },
};



// 2046MB
const sizeArrayBufferMax = Math.pow(2, 31) - Math.pow(2, 21);
const sizeAudioMax = Math.pow(2, 27);
const sizeVideoMax = 5 * 1024 * 1024;
// const sizeVideoMax = sizeArrayBufferMax - sizeAudioMax;



/**
 * @param {number} value
 * @returns {string}
 */
const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2)}${[' B', 'KB', 'MB', 'GB'][index]}`.padStart(9, ' ');
};

/**
 * @param {number} value
 * @returns {string}
 */
const renderBitrate = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1000));

	return `${(value / Math.pow(1000, index)).toFixed(2)}${[' bps', 'kbps', 'mbps', 'gbps'][index]}`.padStart(10, ' ');
};

const toHTMLString = string => String(string).replace(/ /g, '&nbsp;');



/**
 * @param {string} url
 * @returns {Promise<number>}
 */
const fetchMediaSize = async url => {
	const responseSize = await fetch(new Request(url, { method: 'HEAD', cache: 'reload' }));

	return +responseSize.headers.get('Content-Length');
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



const parseFormat = async (formatRaw, prefix) => {
	const [typeMime = '', codecs = ''] = formatRaw.mimeType.split(';');
	const [mime, ext] = typeMime.trim().split('/');

	if(!Number(formatRaw.contentLength)) { formatRaw.contentLength = await fetchMediaSize(formatRaw.url); }

	return {
		itag: formatRaw.itag,
		type: `${prefix}-${mime}`,
		mime,
		ext,
		codecs: codecs.match(/codecs="(.*?)"/)?.[1] ?? 'unknown',
		width: formatRaw.width,
		height: formatRaw.height,
		size: Number(formatRaw.contentLength),
		bitrate: formatRaw.bitrate,
		qualityLabel: formatRaw.qualityLabel,
		url: formatRaw.url,
	};
};
const parseFormats = async dataStreaming => {
	const { formats, adaptiveFormats } = dataStreaming;


	const result = {
		all: [],
		videosFixed: [],
		videosAdaptive: [],
		audiosAdaptive: [],
	};


	for(const formatRaw of formats) {
		const format = await parseFormat(formatRaw, 'fixed');

		result.all.push(format);
		result.videosFixed.push(format);
	}

	for(const formatRaw of adaptiveFormats) {
		const format = await parseFormat(formatRaw, 'adaptive');

		result.all.push(format);
		if(format.type == 'adaptive-video') { result.videosAdaptive.push(format); }
		if(format.type == 'adaptive-audio') { result.audiosAdaptive.push(format); }
	}


	result.all.sort((a, b) => b.bitrate - a.bitrate);
	result.videosFixed.sort((a, b) => b.bitrate - a.bitrate);
	result.videosAdaptive.sort((a, b) => b.bitrate - a.bitrate);
	result.audiosAdaptive.sort((a, b) => b.bitrate - a.bitrate);


	return result;
};


const IR = unsafeWindow.ytInitialPlayerResponse;
const detailsVideo = IR.videoDetails;

const formats = await parseFormats(IR.streamingData);


const nameSavePrefix = `youtube@${detailsVideo.channelId}@${detailsVideo.author}@${detailsVideo.videoId}@${detailsVideo.title}`;



const modesDownload$itag = {};
/**
 * @param {YoutubeFormat} format
 */
const detectDownloadMode = async format => modesDownload$itag[format.itag] ?? (
	modesDownload$itag[format.itag] = !format.size || format.size > sizeVideoMax || 1 == 1
		? 'disk-direct'
		: 'memory-cache');


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


const tasksDownload = [];


/**
 * @param {YoutubeFormat} format
 * @param {*} task
 * @param {*} mode
 * @returns
 */
const downloadMedia = async (format, task, mode, nameSave, range) => {
	const sizeMedia = range?.[1] || format.size;
	task.eleProgress.setAttribute('max', String(sizeMedia));


	if(mode == 'disk-direct') {
		task.eleSave.addEventListener('click', async () => {
			/** @type {FileSystemFileHandle} */
			const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameSave });

			if(!file) { throw `没有选择文件，无法保存${nameSave}`; }


			G.log('download-task', `○ download start, itag: ${format.itag}, mode: direct`);


			const headerGet = new Headers();
			if(range) { headerGet.append('Range', `bytes=${range[0]}`); }


			const requestGet = new Request(format.url, { headers: headerGet });
			const responseGet = await fetch(requestGet);

			const reader = responseGet.body.getReader();

			const writable = await file.createWritable();

			try {
				await readReader(reader, async (data, sizeReadAfter) => {
					await writable.write(data);

					task.updateProgress(sizeReadAfter, sizeMedia);
				});

				await writable.close();
			}
			catch(error) { G.error('✖', error, error.stack); throw error; }


			G.log('download-task', '✔ download finish', nameSave);
		});


		task.eleSave.removeAttribute('disable');


		return nameSave;
	}
	else if(mode == 'memory-cache') {
		const responseGet = await fetch(format.url);

		const reader = responseGet.body.getReader();


		const datasMedia = new Uint8Array(sizeMedia);


		G.log('download-task', `○ download start, itag: ${format.itag}, mode: memory`);


		await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
			datasMedia.set(data, sizeRead);

			task.updateProgress(sizeReadAfter, sizeMedia);
		});


		G.log('download-task', '✔ download finish', nameSave);


		task.eleSave.download = task.eleSave.title = nameSave;
		task.eleSave.href = URL.createObjectURL(new Blob([datasMedia]));
		task.eleSave.removeAttribute('disable');


		return datasMedia;
	}
};

/**
 * @param {YoutubeFormat} format
 * @param {HTMLDivElement} eleTasks
 */
const createDownloadTask = async (format, eleTasks, mode, nameSave, range, indexRange) => {
	const eleTask = document.createElement('task');
	eleTasks.appendChild(eleTask);


	const eleTitle = document.createElement('div');
	eleTitle.setAttribute('task-title', '');
	eleTitle.innerText = `${format.mime} ${format.qualityLabel || renderBitrate(format.bitrate).trim()}${indexRange ? ` part${indexRange}` : ''}`;
	eleTask.appendChild(eleTitle);

	const eleProgress = document.createElement('progress');
	eleProgress.setAttribute('task-progress', '');
	eleProgress.setAttribute('min', '0');
	eleProgress.value = 0;
	eleTask.appendChild(eleProgress);

	const elePercent = document.createElement('div');
	elePercent.setAttribute('task-percent', '');
	elePercent.innerHTML = '&nbsp;&nbsp;00.00% &nbsp;&nbsp;&nbsp;0.00MB';
	eleTask.appendChild(elePercent);

	const eleSave = document.createElement('a');
	eleSave.setAttribute('task-save', '');
	eleSave.setAttribute('disable', '');
	eleSave.innerText = 'SAVE';
	eleTask.appendChild(eleSave);


	const task = {
		format,

		eleTitle,
		eleProgress,
		elePercent,
		eleSave,

		updateProgress(now, max) {
			task.eleProgress.value = now;

			task.elePercent.innerHTML = ` ${toHTMLString((now * 100 / max).toFixed(2).padStart(7, ' '))}% ${toHTMLString(renderSize(max))}`;
		}
	};


	tasksDownload.push(task);


	return downloadMedia(format, task, mode, nameSave, range);
};

const createMixinBatch = (eleTasks, nameVideo, nameAudio, nameMixed) => {
	const dataMixin = new Uint8Array(GBK.encode(`
		@REM @echo off

		echo 合并[视频文件]
		copy /B ".\\${nameVideo}.part*" ".\\${nameVideo}"
		echo 合并[视频文件] ok

		echo 混流[音视频文件]
		ffmpeg -y -v quiet -i ".\\${nameVideo}" ${nameAudio ? `-i ".\\${nameAudio}" ` : ''}-vcodec copy -acodec copy ".\\${nameMixed}"
		echo 混流[音视频文件] ok

		@REM echo 移除[音视频文件]
		@REM del ".\\${nameVideo}.part*"
		@REM del ".\\${nameVideo}"
		${nameAudio ? `@REM del ".\\${nameAudio}"` : ''}
		@REM echo 移除[音视频文件] ok

		@REM echo 删除脚本自身
		@REM del %0
		@REM echo 删除脚本自身 ok

		pause
	`.replace(/\|/g, '_').replace(/\t/g, '').replace(/\n/g, '\r\n')));

	const nameBatch = `${nameMixed}.mixin.bat`;


	const eleTask = document.createElement('task');
	eleTasks.appendChild(eleTask);


	const eleTitle = document.createElement('div');
	eleTitle.setAttribute('task-title', '');
	eleTitle.innerText = `Mixin Script`;
	eleTask.appendChild(eleTitle);


	const eleSave = document.createElement('a');
	eleSave.setAttribute('task-save', '');
	eleSave.innerText = 'SAVE';
	eleTask.appendChild(eleSave);


	eleSave.addEventListener('click', async () => {
		const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameBatch });

		if(!file) { throw `没有选择文件，无法保存${nameBatch}`; }

		const writable = await file.createWritable();

		await writable.write({ type: 'write', data: dataMixin });

		await writable.close();
	});
};

const mixinMedia = (datasVideo, datasAudio) => {

};


const initPanel = () => {
	const eleMain = document.createElement(namePackage);
	document.body.appendChild(eleMain);


	eleMain.innerHTML = htmlScript;

	const eleTasks = eleMain.querySelector('[tasks]');


	/** @type {HTMLDivElement} */
	const eleButtonShow = eleMain.querySelector('[show-button]');
	/** @type {HTMLDialogElement} */
	const eleDialog = eleMain.querySelector('dialog');
	/** @type {HTMLSelectElement} */
	const selectVideosFixed = eleMain.querySelector('[fixed-videos]');
	/** @type {HTMLSelectElement} */
	const selectVideosAdaptive = eleMain.querySelector('[adaptive-videos]');
	/** @type {HTMLSelectElement} */
	const selectAudiosAdaptive = eleMain.querySelector('[adaptive-audios]');



	formats.videosFixed.forEach(format => {
		const eleOpiton = document.createElement('option');
		eleOpiton.setAttribute('value', format.itag);
		selectVideosFixed.appendChild(eleOpiton);

		eleOpiton.innerHTML = `${toHTMLString(renderBitrate(format.bitrate))} &nbsp;${toHTMLString(format.qualityLabel.padStart(7, ' '))} ${toHTMLString(renderSize(format.size))} ${format.codecs.split(',').map(code => code.trim().split('.')[0]).join(', ')}`;
		eleOpiton.title = `${format.width}x${format.height}`;


		const eleOpitonSub = document.createElement('option');
		eleOpitonSub.setAttribute('disabled', '');
		selectVideosFixed.appendChild(eleOpitonSub);

		eleOpitonSub.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;(${format.itag}) ${format.codecs} | ${format.width}x${format.height}`;
	});

	formats.videosAdaptive.forEach(format => {
		const eleOpiton = document.createElement('option');
		eleOpiton.setAttribute('value', format.itag);
		selectVideosAdaptive.appendChild(eleOpiton);

		eleOpiton.innerHTML = `${toHTMLString(renderBitrate(format.bitrate))} &nbsp;${toHTMLString(format.qualityLabel.padStart(7, ' '))} ${toHTMLString(renderSize(format.size))} ${format.codecs.split(',').map(code => code.trim().split('.')[0]).join(', ')}`;
		eleOpiton.title = `${format.width}x${format.height}`;


		const eleOpitonSub = document.createElement('option');
		eleOpitonSub.setAttribute('disabled', '');
		selectVideosAdaptive.appendChild(eleOpitonSub);

		eleOpitonSub.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;(${format.itag}) ${format.codecs} | ${format.width}x${format.height}`;
	});

	formats.audiosAdaptive.forEach(format => {
		const eleOption = document.createElement('option');
		eleOption.setAttribute('audio', '');
		eleOption.setAttribute('value', format.itag);
		selectAudiosAdaptive.appendChild(eleOption);

		eleOption.innerHTML = `${toHTMLString(renderBitrate(format.bitrate))} &nbsp;${toHTMLString(' none')} ${toHTMLString(renderSize(format.size))} ${format.codecs}`;


		const eleOpitonSub = document.createElement('option');
		eleOpitonSub.setAttribute('disabled', '');
		selectAudiosAdaptive.appendChild(eleOpitonSub);

		eleOpitonSub.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;(${format.itag}) ${format.codecs}`;
	});


	eleButtonShow.addEventListener('click', () => eleDialog.showModal());
	eleDialog.showModal();



	eleMain.querySelector('download-button[fixed-video]').addEventListener('click', async () => {
		try {
			const formatVideo = formats.all.find(format => format.itag == selectVideosAdaptive.value);
			const nameSaveVideo = `${nameSavePrefix}@${formatVideo.qualityLabel}(${formatVideo.itag}).${formatVideo.ext}`;

			await createDownloadTask(selectVideosFixed.value, eleTasks);
		}
		catch(error) { G.error('✖', error, error.stack); throw error; }
	});
	eleMain.querySelector('download-button[adaptive-video]').addEventListener('click', async () => {
		try {
			const formatVideo = formats.all.find(format => format.itag == selectVideosAdaptive.value);
			const modeDownloadVideo = await detectDownloadMode(formatVideo);
			const nameSaveVideo = `${nameSavePrefix}@${formatVideo.qualityLabel}(${formatVideo.itag}).${formatVideo.ext}`;


			makeRangesBySize(formatVideo.size, sizeVideoMax).forEach((range, index) =>
				createDownloadTask(formatVideo, eleTasks, 'disk-direct', nameSaveVideo + `.part${index + 1}`, range, index + 1)
			);
		}
		catch(error) { G.error('✖', error, error.stack); throw error; }
	});
	eleMain.querySelector('download-button[adaptive-audio]').addEventListener('click', async () => {
		try {
			const formatAudio = formats.all.find(format => format.itag == selectAudiosAdaptive.value);
			const modeDownloadAudio = await detectDownloadMode(formatAudio);
			const nameSaveAudio = `${nameSavePrefix}@${renderBitrate(formatAudio.bitrate).trim()}(${formatAudio.itag}).${formatAudio.ext}`;

			await createDownloadTask(formatAudio, eleTasks, modeDownloadAudio, nameSaveAudio);
		}
		catch(error) { G.error('✖', error, error.stack); throw error; }
	});
	eleMain.querySelector('download-button[adaptive-mixed]').addEventListener('click', async () => {
		try {
			const formatVideo = formats.all.find(format => format.itag == selectVideosAdaptive.value);
			const formatAudio = formats.all.find(format => format.itag == selectAudiosAdaptive.value);

			const modeDownloadVideo = await detectDownloadMode(formatVideo);
			const modeDownloadAudio = await detectDownloadMode(formatAudio);

			const nameSaveVideo = `${nameSavePrefix}@video-only@${formatVideo.itag}@${formatVideo.qualityLabel}.${formatVideo.ext}`;
			const nameSaveAudio = `${nameSavePrefix}@audio-only@${formatAudio.itag}@${renderBitrate(formatAudio.bitrate).trim()}.${formatAudio.ext}`;
			const nameSaveMixed = `${nameSavePrefix}@${formatVideo.qualityLabel}.${formatAudio.ext}`;

			if(modeDownloadVideo == 'disk-direct' || modeDownloadAudio == 'disk-direct') {
				const ranges = makeRangesBySize(formatVideo.size, sizeVideoMax);


				ranges.forEach((range, index) =>
					createDownloadTask(formatVideo, eleTasks, 'disk-direct', nameSaveVideo + `.part${index + 1}`, range, index + 1)
				);

				createDownloadTask(formatAudio, eleTasks, 'disk-direct', nameSaveAudio);

				createMixinBatch(eleTasks, nameSaveVideo, nameSaveAudio, nameSaveMixed);
			}
			else {
				const [datasVideo, datasAudio] = await Promise.all([
					createDownloadTask(formatVideo, eleTasks, modeDownloadVideo, nameSaveVideo),
					createDownloadTask(formatAudio, eleTasks, modeDownloadAudio, nameSaveAudio),
				]);

				mixinMedia(datasVideo, datasAudio);
			}
		}
		catch(error) { G.error('✖', error, error.stack); throw error; }
	});
};



G.log('running...');

initPanel();

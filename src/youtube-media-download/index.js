const namePackage = 'youtube-media-download';
const { GM_addStyle, GM_getResourceText, GM_getResourceURL } = window.spaceUserScript[namePackage];

/** @type {import('./parse-data.js')} */
const { I } = await import(GM_getResourceURL('parseData'));

/** @type {import('../lib/fetch-manager.js')} */
const { default: FetchManager } = await import(GM_getResourceURL('fetchManager'));


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



const G = {
	log(...params) { globalThis.console.log(`${namePackage}:`, ...params); },
	error(...params) { globalThis.console.error(`${namePackage}:`, ...params); },
};



// 2046MB Memory Limit for Browser
const sizeMixinNeed = Math.pow(2, 17) - 1;
const sizeArrayBufferMax = Math.pow(2, 31) - 1;
const sizeMixinableMax = sizeArrayBufferMax - sizeMixinNeed;



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

	return `${(value / Math.pow(1000, index)).toFixed(2)}${[' bps', 'kbps', 'mbps', 'gbps'][index]}`.padStart(11, ' ');
};

const toHTMLString = string => String(string).replace(/ /g, '&nbsp;');





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









/**
 * @param {YoutubeFormat} formatVideo
 * @param {YoutubeFormat} formatAudio
 */
const detectDownloadMode = (formatVideo, formatAudio) => {
	if(!formatVideo.size) {
		G.log('detectDownloadMode', '✖ unknown video size, use disk-direct mode');

		return 'disk-direct';
	}
	if(formatAudio && !formatAudio.size) {
		G.log('detectDownloadMode', '✖ unknown audio size, use disk-direct mode');

		return 'disk-direct';
	}

	if(formatVideo.size + (formatAudio?.size ?? 0) > sizeMixinableMax) {
		G.log('detectDownloadMode', '✔ large than the max size of mixinable, use disk-direct mode');

		return 'disk-direct';
	}


	G.log('detectDownloadMode', '✔ less than the max size of mixinable, use memory-cache mode');

	return 'memory-cache';
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


const splitURLs = (urlBase, sizePart, sizeMax) => {
	const url = new URL(urlBase);

	const urls = [];

	let sizeAcc = 0;
	do {
		const urlPart = new URL(url);

		const begin = sizeAcc;
		const end = Math.min(sizeAcc += sizePart, sizeMax) - 1;

		// urlPart.searchParams.set('range', `${sizeAcc}-${end}`);

		urls.push([urlPart, begin, end]);
	}
	while(sizeAcc < sizeMax);

	return urls;
};

/**
 * @param {YoutubeFormat} formatVideo
 * @param {YoutubeFormat} formatAudio
 * @param {HTMLDivElement} eleTasks
 */
const createDownloadTask = async (formatVideo, formatAudio, modeSavePre, eMainBox, nameSave) => {
	const eTitleSub = document.createElement('div');
	eTitleSub.setAttribute('sub-title', '');
	eTitleSub.innerHTML = '● 任务';
	eMainBox.appendChild(eTitleSub);


	const eTask = document.createElement('task');
	eTask.innerHTML = GM_getResourceText('task-html');
	eMainBox.appendChild(eTask);


	const eDownloadBox = document.createElement('download-box');
	eTask.appendChild(eDownloadBox);


	const modeSave = modeSavePre == 'auto-detect' ? detectDownloadMode(formatVideo, formatAudio) : modeSavePre;


	const FM = new FetchManager();



	if(modeSave == 'disk-direct') {
		// FM.create(splitURLs(formatVideo.url), () => {

		// });
	}
	else if(modeSave == 'memory-cache') {
		// const sizePart = Math.ceil(formatVideo.size / 5);
		const sizePart = 65535;
		const urls = splitURLs(formatVideo.url, sizePart, formatVideo.size);
		debugger;
		const datasMedia = new Uint8Array(formatVideo.size);

		FM.create(urls, async ([url, begin, end], index) => {
			const eTitle = document.createElement('div');
			eTitle.setAttribute('task-title', '');
			eTitle.innerText = `${formatVideo.mime == 'video' ? '视频' : '图片'} ${formatVideo.qualityLabel || renderBitrate(formatVideo.bitrate).trim()}${urls.length > 1 ? ` 第${index + 1}部分` : ''}`;
			eDownloadBox.appendChild(eTitle);

			const eProgress = document.createElement('progress');
			eProgress.setAttribute('task-progress', '');
			eProgress.setAttribute('min', '0');
			eProgress.setAttribute('max', sizePart);
			eProgress.value = 0;
			eDownloadBox.appendChild(eProgress);

			const ePercent = document.createElement('div');
			ePercent.setAttribute('task-percent', '');
			ePercent.innerHTML = '&nbsp;&nbsp;00.00% &nbsp;&nbsp;&nbsp;0.00MB';
			eDownloadBox.appendChild(ePercent);

			const eSave = document.createElement('a');
			eSave.setAttribute('task-save', '');
			eSave.setAttribute('disable', '');
			eSave.innerText = '保存';
			eDownloadBox.appendChild(eSave);



			const headerGet = new Headers();
			headerGet.append('Range', `bytes=${begin}-${end}`);


			const requestGet = new Request(url, { headers: headerGet });
			const responseGet = await fetch(requestGet);

			const reader = responseGet.body.getReader();





			G.log('download-task', `○ download start, itag: ${formatVideo.itag}, mode: memory`);


			await readReader(reader, async (data, sizeReadAfter, sizeRead) => {
				datasMedia.set(data, begin + sizeRead);

				eProgress.value = sizeReadAfter;

				ePercent.innerHTML = ` ${toHTMLString((sizeReadAfter * 100 / sizePart).toFixed(2).padStart(7, ' '))}% ${toHTMLString(renderSize(sizePart))}`;
			});


			G.log('download-task', '✔ download finish', nameSave);


			eSave.download = eSave.title = `${nameSave}.mp4`;
			eSave.href = URL.createObjectURL(new Blob([datasMedia]));
			eSave.removeAttribute('disable');
		}, 5);
	}


	// const eleTitle = document.createElement('div');
	// eleTitle.setAttribute('task-title', '');
	// eleTitle.innerText = `${format.mime} ${format.qualityLabel || renderBitrate(format.bitrate).trim()}${indexRange ? ` part${indexRange}` : ''}`;
	// eleTask.appendChild(eleTitle);

	// const eleProgress = document.createElement('progress');
	// eleProgress.setAttribute('task-progress', '');
	// eleProgress.setAttribute('min', '0');
	// eleProgress.value = 0;
	// eleTask.appendChild(eleProgress);

	// const elePercent = document.createElement('div');
	// elePercent.setAttribute('task-percent', '');
	// elePercent.innerHTML = '&nbsp;&nbsp;00.00% &nbsp;&nbsp;&nbsp;0.00MB';
	// eleTask.appendChild(elePercent);

	// const eleSave = document.createElement('a');
	// eleSave.setAttribute('task-save', '');
	// eleSave.setAttribute('disable', '');
	// eleSave.innerText = 'SAVE';
	// eleTask.appendChild(eleSave);


	// const task = {
	// 	format,

	// 	eleTitle,
	// 	eleProgress,
	// 	elePercent,
	// 	eleSave,

	// 	updateProgress(now, max) {
	// 		task.eleProgress.value = now;

	// 		task.elePercent.innerHTML = ` ${toHTMLString((now * 100 / max).toFixed(2).padStart(7, ' '))}% ${toHTMLString(renderSize(max))}`;
	// 	}
	// };


	// tasksDownload.push(task);


	// return downloadMedia(format, task, mode, nameSave, range);
};

// const createMixinBatch = (eleTasks, nameVideo, nameAudio, nameMixed) => {
// 	const dataMixin = new Uint8Array(GBK.encode(`
// 		@REM @echo off

// 		echo 合并[视频文件]
// 		copy /B ".\\${nameVideo}.part*" ".\\${nameVideo}"
// 		echo 合并[视频文件] ok

// 		echo 混流[音视频文件]
// 		ffmpeg -y -v quiet -i ".\\${nameVideo}" ${nameAudio ? `-i ".\\${nameAudio}" ` : ''}-vcodec copy -acodec copy ".\\${nameMixed}"
// 		echo 混流[音视频文件] ok

// 		@REM echo 移除[音视频文件]
// 		@REM del ".\\${nameVideo}.part*"
// 		@REM del ".\\${nameVideo}"
// 		${nameAudio ? `@REM del ".\\${nameAudio}"` : ''}
// 		@REM echo 移除[音视频文件] ok

// 		@REM echo 删除脚本自身
// 		@REM del %0
// 		@REM echo 删除脚本自身 ok

// 		pause
// 	`.replace(/\|/g, '_').replace(/\t/g, '').replace(/\n/g, '\r\n')));

// 	const nameBatch = `${nameMixed}.mixin.bat`;


// 	const eleTask = document.createElement('task');
// 	eleTasks.appendChild(eleTask);


// 	const eleTitle = document.createElement('div');
// 	eleTitle.setAttribute('task-title', '');
// 	eleTitle.innerText = `Mixin Script`;
// 	eleTask.appendChild(eleTitle);


// 	const eleSave = document.createElement('a');
// 	eleSave.setAttribute('task-save', '');
// 	eleSave.innerText = 'SAVE';
// 	eleTask.appendChild(eleSave);


// 	eleSave.addEventListener('click', async () => {
// 		const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameBatch });

// 		if(!file) { throw `没有选择文件，无法保存${nameBatch}`; }

// 		const writable = await file.createWritable();

// 		await writable.write({ type: 'write', data: dataMixin });

// 		await writable.close();
// 	});
// };

const init = () => {
	const ePackage = document.createElement(namePackage);
	document.body.appendChild(ePackage);


	GM_addStyle(GM_getResourceText('indexCSS').replace(new RegExp('namePackage', 'g'), namePackage));

	ePackage.innerHTML = GM_getResourceText('indexHTML');


	/** @type {HTMLDivElement} */
	const eButtonShow = ePackage.querySelector('[show-button]');
	/** @type {HTMLDialogElement} */
	const eMainBox = ePackage.querySelector('[main-box]');


	/** @type {HTMLSelectElement} */
	const eVideoSelector = ePackage.querySelector('select[video]');
	/** @type {HTMLSelectElement} */
	const eAudioSelector = ePackage.querySelector('select[audio]');
	/** @type {HTMLSelectElement} */
	const eSaveModeSelector = ePackage.querySelector('select[save-mode]');


	/** @type {HTMLOptGroupElement} */
	const eOptgroupVideosFixed = ePackage.querySelector('[fixed-videos]');
	/** @type {HTMLOptGroupElement} */
	const eOptgroupVideosAdaptive = ePackage.querySelector('[adaptive-videos]');
	/** @type {HTMLOptGroupElement} */
	const eOptgroupAudiosAdaptive = ePackage.querySelector('[adaptive-audios]');


	const formatsVideosFixed = I.formats.filter(format => format.type == 'fixed-video');
	const formatsVideosAdaptive = I.formats.filter(format => format.type == 'adaptive-video');
	const formatsAudio = I.formats.filter(format => format.type == 'adaptive-audio');

	for(const [formats, eOptgroup] of [
		[formatsVideosFixed, eOptgroupVideosFixed],
		[formatsVideosAdaptive, eOptgroupVideosAdaptive],
	]) {
		for(const format of formats) {
			const eleOpiton = document.createElement('option');
			eleOpiton.setAttribute('value', format.itag);
			eOptgroup.appendChild(eleOpiton);

			eleOpiton.innerHTML = `${toHTMLString(format.qualityLabel.padStart(5, ' '))} ${toHTMLString(renderBitrate(format.bitrate))} ${toHTMLString(renderSize(format.size))} ${format.codecs.split(',').map(code => code.trim().split('.')[0]).join('+')}`;
			eleOpiton.title = `${format.width}x${format.height}`;


			const eleOpitonSub = document.createElement('option');
			eleOpitonSub.setAttribute('disabled', '');
			eOptgroup.appendChild(eleOpitonSub);

			eleOpitonSub.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;(${format.itag}) ${format.codecs} | ${format.width}x${format.height}`;
		}
	}

	for(const format of formatsAudio) {
		const eleOption = document.createElement('option');
		eleOption.setAttribute('audio', '');
		eleOption.setAttribute('value', format.itag);
		eOptgroupAudiosAdaptive.appendChild(eleOption);

		eleOption.innerHTML = `${toHTMLString('none'.padStart(5, ' '))} ${toHTMLString(renderBitrate(format.bitrate))} ${toHTMLString(renderSize(format.size))} ${format.codecs.split(',').map(code => code.trim().split('.')[0]).join('+')}`;


		const eleOpitonSub = document.createElement('option');
		eleOpitonSub.setAttribute('disabled', '');
		eOptgroupAudiosAdaptive.appendChild(eleOpitonSub);

		eleOpitonSub.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;(${format.itag}) ${format.codecs}`;
	}



	eVideoSelector.value = String(formatsVideosAdaptive[0].itag);
	eAudioSelector.value = String(formatsAudio[0].itag);


	ePackage.querySelector('download-button').addEventListener('click', async () => {
		try {
			const formatVideo = I.formats.find(format => format.itag == eVideoSelector.value);
			const formatAudio = I.formats.find(format => format.itag == eAudioSelector.value);

			let nameSave = `${I.nameSavePrefix}@${formatVideo.qualityLabel}(${formatVideo.itag})`;

			await createDownloadTask(formatVideo, formatAudio, eSaveModeSelector.value, eMainBox, nameSave);
		}
		catch(error) { G.error('✖', error, error.stack); throw error; }
	});


	eButtonShow.addEventListener('click', () => eMainBox.showModal());
	eMainBox.showModal();
};



G.log('running...');

init();

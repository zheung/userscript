// ==UserScript==
// @name        bilibili-media-fetch
// @namespace   https://danor.app
// @version     2.2.1+26062309
// @author      DanoR
// @description 【哔哩哔哩】视频音频下载
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @require     https://www.unpkg.com/gbk.js@0.3.0/dist/gbk2.min.js
// @require     https://www.unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js
// @match       *://*.bilibili.com/video/*
// @noframes
// ==/UserScript==

/* global FFmpeg, GBK */

import { G } from './lib/logger.js';
import { createSaveLink, fetchFileData, fetchFileSize, readReader } from './lib/util.js';
import { FetchManager, $panels, $states } from './lib/fetch-manager.vue';

import { faFileAudio, faFileVideo, faFilm } from '@fortawesome/free-solid-svg-icons';



/* 预加载 */
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

(async () => {
	try {
		await ffmpeg.load();

		G.info('init-ffmpeg', '✔');
	}
	catch(error) { G.error('init-ffmpeg', '✘', error.message, error.stack); }
})();


const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2).padStart(6, ' ')} ${['By', 'KB', 'MB', 'GB'][index]}`;
};


// 预设ArrayBuffer最大是2046MB
const sizeArrayBufferMax = Math.pow(2, 31) - Math.pow(2, 21);
const sizeAudioMax = Math.pow(2, 27);
const sizeVideoMax = sizeArrayBufferMax - sizeAudioMax;


/* 网页信息处理 */
const PD = unsafeWindow.__playinfo__.data;
const S = unsafeWindow.__INITIAL_STATE__;

const P = {};

P.slot = S.bvid ||
	location.pathname.replace(/\/$/, '')
		.replace('/bangumi/play/', '')
		.replace('/video/', '');

P.title = S.h1Title ?? S?.videoData?.title ?? '(未知标题)';
P.uid = S?.upData?.mid ?? '0';
P.uname = S?.upData?.name ?? '(未知用户)';

P.p = S?.p;
const pages = S?.videoData?.pages;
P.part = pages?.find(page => page.page == P.p)?.part;

const namePrefix = `bilibili@${P.uid}#${P.uname}@${P.slot}#${P.title}` + (pages?.length > 1 ? `@p${P.p}#${P.part}` : '');

/** @type {Object[]} */
const optionsVideo = PD.support_formats.map(formatSupport => (formatSupport.codecs ?? []).map(codec => {
	const video = PD.dash.video.find(v => v.id == formatSupport.quality && v.codecs == codec);

	return {
		id: formatSupport.quality,
		desc: formatSupport.new_description,
		codec: codec.split('.')[0],
		codecFull: codec,
		resolution: video ? `${video.width}x${video.height}@${Number(video.frame_rate).toFixed(0)}` : '',
		bandwidth: video ? renderSize(video.bandwidth) : 0,
		bandwidthRaw: video?.bandwidth ?? 0,
		media: video,
	};
})).flat().filter(o => o);

if(PD.durl?.length) {
	const format = PD.support_formats.find(format => format.quality == PD.quality);

	optionsVideo.push({
		id: format.quality,
		desc: format.new_description,
		codec: '',
		codecFull: '',
		resolution: '',
		bandwidth: 0,
		bandwidthRaw: 0,
		isTrial: true,
		media: PD.durl[0],
	});
}

/** @type {Object[]} */
const optionsAudio = (PD.dash?.audio ?? []).map(audio => ({
	id: audio.id,
	codec: audio.codecs.split('.')[0],
	codecFull: audio.codecs,
	bandwidth: renderSize(audio.bandwidth),
	bandwidthRaw: audio.bandwidth,
	media: audio,
}));

if(PD.dash?.flac?.audio) {
	const audio = PD.dash.flac?.audio;
	optionsAudio.unshift({
		id: audio.id,
		codec: audio.codecs.split('.')[0],
		codecFull: audio.codecs,
		bandwidth: renderSize(audio.bandwidth),
		media: audio,
	});
}



/* 脚本功能 */
const mixinMediaData = async (datasVideo, datasAudio, nameFile, isCloseAfterDownload) => {
	ffmpeg.FS('writeFile', 'video.m4s', datasVideo);
	if(datasAudio) {
		ffmpeg.FS('writeFile', 'audio.m4s', datasAudio);
	}

	await ffmpeg.run('-y', '-v', 'quiet',
		'-i', 'video.m4s',
		...(datasAudio ? ['-i', 'audio.m4s'] : []),
		'-vcodec', 'copy', '-acodec', 'copy', '-strict', 'experimental', 'output.mp4');

	const datasMixin = ffmpeg.FS('readFile', 'output.mp4');

	createSaveLink(nameFile, URL.createObjectURL(new Blob([datasMixin]))).click();

	G.info('save-mixin-media', '✔', nameFile);

	if(isCloseAfterDownload) { setTimeout(() => window.close(), 1000 * 5); }

	return datasMixin;
};



/* 应用 */
const getOptionKey = option => `${option.id}#${option.codecFull}`;
const getOptionLabel = option => option ? `${option.desc || option.bandwidth}#${option.codec}` : null;
const getMediaURL = (option, keyURL) => {
	if(keyURL == 'baseUrl') {
		return option.baseUrl || optionsVideo.base_url || option.url;
	}
	else if(keyURL.startsWith('backupUrl')) {
		const index = keyURL[keyURL.length - 1];

		return option.backupUrl?.[index] || option.backup_url?.[index]
			|| option.backupUrl?.[0] || option.backup_url[0]
			|| option.baseUrl || optionsVideo.base_url || option.url;
	}
};

const getConfig = (key, configs, valueDefault) => configs.find(config => config.key == key)?.value ?? valueDefault;

const filterVideoOptions = configs => {
	const hiddenInvalidFormat = getConfig('hiddenInvalidFormat', configs);
	const codecPrefer = getConfig('codecPrefer', configs);

	return optionsVideo.filter(option => {
		if(hiddenInvalidFormat && option.bandwidth == 0) { return false; }

		const optionsIDSame = optionsVideo.filter(o => o.id == option.id);
		if(codecPrefer
			&& optionsIDSame.find(o => o.codec == codecPrefer)
			&& option.codec != codecPrefer
		) { return false; }

		return true;
	});
};


const FM = new FetchManager();

FM.$willStorageValue = true;
FM.$widthPanel = 'calc(var(--spc) * 120)';


FM.$panels = [{
	id: 'video',
	type: 'select-grid',
	title: '选择源视频',
	heads: [
		{ key: 'desc', text: '标签', keyTitle: 'resolution' },
		{ key: 'codec', text: '编码', keyTitle: 'codecFull' },
		{ key: 'id', text: 'ID' },
		{ key: 'bandwidth', text: '带宽' },
	],
	getOptionKey, getOptionLabel,
	options: filterVideoOptions([
		{ key: 'hiddenInvalidFormat', value: GM_getValue('default-hiddenInvalidFormat', true) },
		{ key: 'codecPrefer', value: GM_getValue('default-codecPrefer', false) },
	]),
	value: optionsVideo.toSorted((a, b) => b.id - a.id || b.bandwidthRaw - a.bandwidthRaw)[0],
}, {
	id: 'audio',
	type: 'select-grid',
	title: '选择源音频',
	heads: [
		{ key: 'id', text: 'ID' },
		{ key: 'codec', text: '编码' },
		{ key: 'bandwidth', text: '带宽' },
	],
	getOptionKey, getOptionLabel,
	options: optionsAudio,
	value: optionsAudio[0] ?? null,
}, {
	id: 'functions',
	// title: '功能',
	type: 'functions-collapseless',
	functions: [{
		id: 'fetch-audio-single',
		text: '下载完整视频',
		icon: faFilm,
		async handle(states) {
			const panels = states.$panels.value;
			const configs = panels.find(panel => panel.id == 'configs').configs;

			const optionVideo = panels.find(panel => panel.id == 'video')?.value;
			if(!optionVideo) { return alert(`【${GM_info.script.name}】\n没有源视频`); }

			const optionAudio = panels.find(panel => panel.id == 'audio')?.value;
			if(!optionAudio) { return alert(`【${GM_info.script.name}】\n没有源音频`); }

			const video = optionVideo?.media;
			const audio = optionAudio?.media;

			const urlVideo = video ? getMediaURL(video, getConfig('keyURLVideoPrefer', configs)) : null;
			const urlAudio = audio ? getMediaURL(audio, getConfig('keyURLAudioPrefer', configs)) : null;

			const sizeVideo = urlVideo ? await fetchFileSize(urlVideo) : 0;
			const sizeAudio = urlAudio ? await fetchFileSize(urlAudio) : 0;

			const labelVideo = getOptionLabel(optionVideo);
			const labelAudio = getOptionLabel(optionAudio);
			const nameSaveVideo = `${namePrefix}@源视频#${labelVideo}.m4s`.replace(/[~/]/g, '_');
			const nameSaveAudio = `${namePrefix}@源音频#${labelAudio}.m4s`.replace(/[~/]/g, '_');

			const labelMixin = `${Math.min(video.width, video.height)}p#${video.bandwidth}`;
			const nameMixin = !optionVideo.isTrial
				? `${namePrefix}@${labelMixin}.mp4`.replace(/[~/]/g, '_')
				: `${namePrefix}@trial.mp4`.replace(/[~/]/g, '_');


			const panelProgs = states.$panels.value.find(panel => panel.id == 'progresses');

			panelProgs.progs.push({ name: `源视频[${labelVideo}]\n${renderSize(sizeVideo)}`, text: '', value: 0, max: sizeVideo });
			const progVideo = panelProgs.progs[panelProgs.progs.length - 1];
			panelProgs.progs.push({ name: `源音频[${labelAudio}]\n${renderSize(sizeAudio)}`, text: '', value: 0, max: sizeAudio });
			const progAudio = panelProgs.progs[panelProgs.progs.length - 1];


			if(sizeVideo >= sizeVideoMax) {
				let dirn = await window.showDirectoryPicker({ id: 'bilibili-media-save', mode: 'readwrite' });


				// 大文件：使用 File System Access API 流式写入，避免内存溢出
				const fetchLargeVideo = async () => {
					progVideo.text = '';
					progVideo.value = 0;
					progVideo.button = null;


					/** @type {FileSystemFileHandle} */
					let fileHandle;
					try {
						fileHandle = await dirn.getFileHandle(nameSaveVideo, { create: true });
					}
					catch {
						progVideo.text = '<span style="color: var(--cFail)">已取消</span>';
						progVideo.button = { text: '下载', click: fetchLargeVideo };

						return;
					}
					if(!fileHandle) {
						progVideo.text = '<span style="color: var(--cFail)">已取消</span>';
						progVideo.button = { text: '下载', click: fetchLargeVideo };

						return;
					}


					const abortController = new AbortController();
					progVideo.button = { text: '取消', click: () => { abortController.abort(); } };

					let writable;
					try {
						const response = await fetch(urlVideo, { signal: abortController.signal });
						const reader = response.body.getReader();
						writable = await fileHandle.createWritable();

						let throttle = 0;
						await readReader(reader, async (data, sizeReadAfter) => {
							await writable.write(data);

							if(!(throttle++ % 10) || sizeReadAfter == sizeVideo) {
								progVideo.value = sizeReadAfter;
								progVideo.text = `${(sizeReadAfter * 100 / sizeVideo).toFixed(1).padStart(5, ' ')}%`;
							}
						});

						await writable.close();

						progVideo.text = `<span style="color: var(--cOkay)">${progVideo.text}</span>`;
						progVideo.button = null;
					}
					catch(error) {
						if(writable) {
							try { await writable.abort(); } catch { void 0; }
						}

						if(error.name == 'AbortError') {
							progVideo.text = '<span style="color: var(--cFail)">已取消</span>';
						}
						else {
							progVideo.error = error;
							progVideo.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;
						}

						progVideo.button = { text: '下载', click: fetchLargeVideo };
					}
				};
				const fetchLargeAudio = async () => {
					progAudio.text = '';
					progAudio.value = 0;
					progAudio.button = null;


					/** @type {FileSystemFileHandle} */
					let fileHandle;
					try {
						fileHandle = await dirn.getFileHandle(nameSaveAudio, { create: true });
					}
					catch {
						progAudio.text = '<span style="color: var(--cFail)">已取消</span>';
						progAudio.button = { text: '下载', click: fetchLargeAudio };

						return;
					}
					if(!fileHandle) {
						progAudio.text = '<span style="color: var(--cFail)">已取消</span>';
						progAudio.button = { text: '下载', click: fetchLargeAudio };

						return;
					}


					const abortController = new AbortController();
					progAudio.button = { text: '取消', click: () => { abortController.abort(); } };

					let writable;
					try {
						const response = await fetch(urlAudio, { signal: abortController.signal });
						const reader = response.body.getReader();
						writable = await fileHandle.createWritable();

						let throttle = 0;
						await readReader(reader, async (data, sizeReadAfter) => {
							await writable.write(data);

							if(!(throttle++ % 10) || sizeReadAfter == sizeAudio) {
								progAudio.value = sizeReadAfter;
								progAudio.text = `${(sizeReadAfter * 100 / sizeAudio).toFixed(1).padStart(5, ' ')}%`;
							}
						});

						await writable.close();

						progAudio.text = `<span style="color: var(--cOkay)">${progAudio.text}</span>`;
						progAudio.button = null;
					}
					catch(error) {
						if(writable) {
							try { await writable.abort(); } catch { void 0; }
						}

						if(error.name == 'AbortError') {
							progAudio.text = '<span style="color: var(--cFail)">已取消</span>';
						}
						else {
							progAudio.error = error;
							progAudio.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;
						}

						progAudio.button = { text: '下载', click: fetchLargeAudio };
					}
				};
				const saveLargeMixin = async () => {
					const dataMixin = new Uint8Array(GBK.encode(`
						@echo off

						echo 混流[音视频文件]
						ffmpeg -y -v quiet -i "${nameSaveVideo}" ${sizeAudio ? `-i "${nameSaveAudio}" ` : ''}-vcodec copy -acodec copy "${nameMixin}"
						echo 混流[音视频文件] 完成

						@REM echo 移除[音视频文件]
						@REM del "${nameSaveVideo}"
						@REM del "${nameSaveVideo}"
						${sizeAudio ? `@REM del "${nameSaveAudio}"` : ''}
						@REM echo 移除[音视频文件] 完成

						@REM echo 删除脚本自身
						@REM del %0
						@REM echo 删除脚本自身 完成
					`.trim().replace(/\|/g, '_').replace(/\t/g, '').replace(/\n/g, '\r\n')));
					const sizeMixin = dataMixin.length;

					const nameMinxinSave = `bilibili@${P.uid}@${P.slot}.mixin.bat`;


					panelProgs.progs.push({ name: `混流脚本`, text: '', value: 0, max: sizeMixin });
					const progMixin = panelProgs.progs[panelProgs.progs.length - 1];


					let writable;
					try {
						const fileHandle = await dirn.getFileHandle(nameMinxinSave, { create: true });
						writable = await fileHandle.createWritable();

						writable.write(dataMixin);

						await writable.close();

						progMixin.value = sizeMixin;
						progMixin.text = `<span style="color: var(--cOkay)">100.0%</span>`;
						progMixin.button = null;
					}
					catch(error) {
						progMixin.error = error;
						progMixin.text = `<span style="color: var(--cFail)">保存错误, ${error.message ?? error}</span>`;
						progMixin.button = { text: '保存', click: saveLargeMixin };
					}
				};


				if(!dirn) {
					progVideo.text = '<span style="color: var(--cFail)">未选择文件夹</span>';
					progVideo.button = { text: '下载', click: fetchLargeVideo };

					progAudio.text = '<span style="color: var(--cFail)">未选择文件夹</span>';
					progAudio.button = { text: '下载', click: fetchLargeAudio };

					panelProgs.progs.unshift({
						name: `选择文件夹`, text: '', value: 1, max: 1,
						button: {
							text: '选择', click: async () => {
								dirn = await window.showDirectoryPicker({ id: 'bilibili-media-save', mode: 'readwrite' });

								if(dirn) {
									try {
										await Promise.all([
											fetchLargeVideo(),
											fetchLargeAudio(),
										]);

										saveLargeMixin();
									}
									catch { void 0; }
								}
							}
						},
					});

					return;
				}


				try {
					await Promise.all([
						fetchLargeVideo(),
						fetchLargeAudio(),
					]);

					saveLargeMixin();
				}
				catch { void 0; }
			}
			else {
				let throttleVideo = 0;
				let throttleAudio = 0;
				const [datasVideo, datasAudio] = await Promise.all([
					urlVideo ? fetchFileData(urlVideo, {
						size: sizeVideo,
						nameSave: nameSaveVideo,
						atProgress: (value) => {
							if(!(throttleVideo++ % 10) || value == sizeVideo) {
								progVideo.value = value;

								progVideo.text = `${(value * 100 / sizeVideo).toFixed(1).padStart(5, ' ')}%`;
							}
						},
						atFinish() { G.info('下载源视频', '✔'); },
						atError(error) {
							progVideo.error = error; progVideo.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;

							G.error('下载源视频', '✘', error?.message ?? error, error?.stack);
						},
					}).then(datas => {
						progVideo.text = `<span style="color: var(--cOkay)">${progVideo.text}</span>`;
						progVideo.button = { text: '下载', click: () => createSaveLink(nameSaveVideo, URL.createObjectURL(new Blob([datas]))).click() };

						return datas;
					}) : null,

					urlAudio ? fetchFileData(urlAudio, {
						size: sizeAudio,
						nameSave: nameSaveAudio,
						atProgress: (value) => {
							if(!(throttleAudio++ % 10) || value == sizeAudio) {
								progAudio.value = value;

								progAudio.text = `${(value * 100 / sizeAudio).toFixed(1).padStart(5, ' ')}%`;
							}
						},
						atFinish() { G.info('下载源音频', '✔'); },
						atError(error) {
							progAudio.error = error; progAudio.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;

							G.error('下载源音频', '✘', error?.message ?? error, error?.stack);
						},
					}).then(datas => {
						progAudio.text = `<span style="color: var(--cOkay)">${progAudio.text}</span>`;
						progAudio.button = { text: '下载', click: () => createSaveLink(nameSaveAudio, URL.createObjectURL(new Blob([datas]))).click() };

						return datas;
					}) : null,
				]);



				panelProgs.progs.push({ name: `完整视频[${labelMixin}]`, text: '<span>混流中...</span>', value: 0, max: 1 });
				const progMixin = panelProgs.progs[panelProgs.progs.length - 1];


				if(!ffmpeg.isLoaded()) {
					progMixin.text = '<span style="color: var(--cWarn)">ffmpeg加载中...</span>';

					const { promise, resolve } = Promise.withResolvers();

					setInterval(() => ffmpeg.isLoaded() ? resolve() : void 0, 1000 * 2);
					await promise;
				}


				const datasMixin = await mixinMediaData(datasVideo, datasAudio, nameMixin);

				progMixin.name = `完整视频[${labelMixin}]\n${renderSize(datasMixin.length)}`;
				progMixin.value = 1;
				progMixin.text = '<span style="color: var(--cOkay)">已混流</span>';
				progMixin.button = { text: '下载', click: () => createSaveLink(nameMixin, URL.createObjectURL(new Blob([datasMixin]))).click() };
			}
		}
	}, {
		id: 'fetch-audio-single',
		text: '下载源视频',
		icon: faFileVideo,
		async handle(states) {
			const panels = states.$panels.value;
			const configs = panels.find(panel => panel.id == 'configs').configs;

			const option = panels.find(panel => panel.id == 'video')?.value;
			if(!option) { return alert(`【${GM_info.script.name}】\n没有选择源视频`); }

			const video = option?.media;

			const url = video ? getMediaURL(video, getConfig('keyURLVideoPrefer', configs)) : null;

			const size = url ? await fetchFileSize(url) : 0;

			const label = getOptionLabel(option);
			const nameSave = `${namePrefix}@源视频#${label}.m4s`.replace(/[~/]/g, '_');


			const panelProgs = panels.find(panel => panel.id == 'progresses');

			panelProgs.progs.push({ name: `源视频[${label}]\n${renderSize(size)}`, text: '', value: 0, max: size });
			const prog = panelProgs.progs[panelProgs.progs.length - 1];


			if(size >= sizeArrayBufferMax) {
				// 大文件：使用 File System Access API 流式写入，避免内存溢出
				const fetchLarge = async () => {
					prog.text = '';
					prog.value = 0;
					prog.button = null;


					/** @type {FileSystemFileHandle} */
					let fileHandle;
					try {
						fileHandle = await unsafeWindow.showSaveFilePicker({ suggestedName: nameSave });
					}
					catch {
						prog.text = '<span style="color: var(--cFail)">已取消</span>';
						prog.button = { text: '下载', click: fetchLarge };

						return;
					}
					if(!fileHandle) {
						prog.text = '<span style="color: var(--cFail)">已取消</span>';
						prog.button = { text: '下载', click: fetchLarge };

						return;
					}


					const abortController = new AbortController();
					prog.button = { text: '取消', click: () => { abortController.abort(); } };

					let writable;
					try {
						const response = await fetch(url, { signal: abortController.signal });
						const reader = response.body.getReader();
						writable = await fileHandle.createWritable();

						let throttle = 0;
						await readReader(reader, async (data, sizeReadAfter) => {
							await writable.write(data);

							if(!(throttle++ % 10) || sizeReadAfter == size) {
								prog.value = sizeReadAfter;
								prog.text = `${(sizeReadAfter * 100 / size).toFixed(1).padStart(5, ' ')}%`;
							}
						});

						await writable.close();

						prog.text = `<span style="color: var(--cOkay)">${prog.text}</span>`;
						prog.button = null;
					}
					catch(error) {
						if(writable) {
							try { await writable.abort(); } catch { void 0; }
						}

						if(error.name == 'AbortError') {
							prog.text = '<span style="color: var(--cFail)">已取消</span>';
						}
						else {
							prog.error = error;
							prog.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;
						}

						prog.button = { text: '下载', click: fetchLarge };
					}
				};

				await fetchLarge();
			}
			else {
				let throttle = 0;
				const datasMedia = await fetchFileData({ url, nameLog: `源视频#${label}`, nameSave, size }, {
					saveImmediately: false,
					updateProg: (error, value) => {
						if(error) {
							prog.error = error;
							prog.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`;

							return;
						}

						if(!(throttle++ % 10) || value == size) {
							prog.value = value;
							prog.text = `${(value * 100 / size).toFixed(1).padStart(5, ' ')}%`;
						}
					},
				});

				prog.text = `<span style="color: var(--cOkay)">${prog.text}</span>`;
				prog.button = { text: '下载', click: () => createSaveLink(nameSave, URL.createObjectURL(new Blob([datasMedia]))).click() };
			}
		}
	}, {
		id: 'fetch-audio-single',
		text: '下载源音频',
		icon: faFileAudio,
		async handle(states) {
			const panels = states.$panels.value;
			const configs = panels.find(panel => panel.id == 'configs').configs;

			const option = panels.find(panel => panel.id == 'audio')?.value;
			if(!option) { return alert(`【${GM_info.script.name}】\n没有选择源音频`); }

			const audio = option?.media;

			const url = audio ? getMediaURL(audio, getConfig('keyURLAudioPrefer', configs)) : null;

			const size = url ? await fetchFileSize(url) : 0;

			const label = getOptionLabel(option);
			const nameSave = `${namePrefix}@源音频#${label}.m4s`.replace(/[~/]/g, '_');


			const panelProgs = panels.find(panel => panel.id == 'progresses');

			panelProgs.progs.push({ name: `源音频[${label}]\n${renderSize(size)}`, text: '', value: 0, max: size });
			const prog = panelProgs.progs[panelProgs.progs.length - 1];


			let throttle = 0;
			const datasMedia = await fetchFileData({ url, nameLog: `源音频#${label}`, nameSave, size }, {
				saveImmediately: false,
				updateProg: (error, value) => {
					if(error) { prog.error = error; return prog.text = `<span style="color: var(--cFail)">下载错误, ${error.message ?? error}</span>`; }

					if(!(throttle++ % 10) || value == size) {
						prog.value = value;

						prog.text = `${(value * 100 / size).toFixed(1).padStart(5, ' ')}%`;
					}
				},
			});

			prog.text = `<span style="color: var(--cOkay)">${prog.text}</span>`;
			prog.button = { text: '下载', click: () => createSaveLink(nameSave, URL.createObjectURL(new Blob([datasMedia]))).click() };
		}
	}]
}, {
	id: 'progresses',
	title: '进度',
	type: 'progresses',
	progs: [],
}, {
	id: 'configs',
	title: '选项',
	type: 'configs',
	closedDefault: true,
	configs: [{
		key: 'keyURLVideoPrefer',
		value: GM_getValue('default-keyURLVideoPrefer', 'baseUrl'),
		type: 'switch-button',
		label: '视频偏好CDN',
		options: [{ text: '基础', value: 'baseUrl' }, { text: '后备1', value: 'backupUrl1' }, { text: '后备2', value: 'backupUrl2' }, { text: '后备3', value: 'backupUrl3' }],
		// click(config, panel, states, handleDefault) { handleDefault(config, panel, states); }
	}, {
		key: 'keyURLAudioPrefer',
		value: GM_getValue('default-keyURLAudioPrefer', 'baseUrl'),
		type: 'switch-button',
		label: '音频偏好CDN',
		options: [{ text: '基础', value: 'baseUrl' }, { text: '后备1', value: 'backupUrl1' }, { text: '后备2', value: 'backupUrl2' }, { text: '后备3', value: 'backupUrl3' }],
	}, {
		key: 'codecPrefer',
		value: GM_getValue('default-codecPrefer', false),
		type: 'switch-button',
		label: '偏好编码',
		options: [{ text: 'AVC', value: 'avc1' }, { text: 'AV1', value: 'av01' }, { text: 'HEVC', value: 'hev1' }, { text: '无', value: false }],
		click(config, panelConfig, states, handleDefault) {
			handleDefault(config, panelConfig, states);

			const panel = states.$panels.value.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(panelConfig.configs);
		}
	}, {
		key: 'hiddenInvalidFormat',
		value: GM_getValue('default-hiddenInvalidFormat', true),
		type: 'switch-button',
		label: '无效格式',
		options: [{ text: '隐藏', value: true }, { text: '显示', value: false }],
		click(config, panelConfig, states, handleDefault) {
			handleDefault(config);

			const panel = states.$panels.value.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(panelConfig.configs);
		}
	}],
}];


const intervalAutoStart = setInterval(() => {
	if(!localStorage.getItem(`${GM_info.script.name}/auto-start`)) { return clearInterval(intervalAutoStart); }
	if(!ffmpeg.isLoaded()) { return; }
	if(!$panels.value?.length) { return; }

	clearInterval(intervalAutoStart);

	$panels.value
		.find(panel => panel.id == 'functions')?.functions
		.find(func => func.id == 'fetch-audio-single')
		?.handle($states);
}, 1000);

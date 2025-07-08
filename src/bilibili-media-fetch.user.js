// ==UserScript==
// @name        bilibili-media-fetch
// @description 2025.07.08 18
// @namespace   https://danor.app
// @version     0.0.4
// @author      DanoR
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @require     https://www.unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js
// @match       *://*.bilibili.com/video/*
// @noframes
// ==/UserScript==

/* global FFmpeg */

import FetchManager from './lib/fetch-manager.js';
import { G } from './lib/logger.js';

import { faFileAudio, faFileVideo, faFilm } from '@fortawesome/free-solid-svg-icons';



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

		if(localStorage.getItem(`${GM_info.script.name}/auto-start`)) {
			// download();
		}
	}
	catch(error) { G.error('init-ffmpeg', '✖', error.message, error.stack); }
})();


const renderSize = value => {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2).padStart(6, ' ')} ${['By', 'KB', 'MB', 'GB'][index]}`;
};


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

	const a = document.createElement('a');
	a.download = nameFile;
	a.href = URL.createObjectURL(new Blob([datasMixin]));
	a.click();

	G.info('save-mixin-media', '✔', a.download);

	if(isCloseAfterDownload) { setTimeout(() => window.close(), 1000 * 5); }
};


/* 应用 */
const getOptionKey = option => `${option.id}#${option.codecFull}`;
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


const FM = new FetchManager();

FM.$willStorageValue = true;
FM.$widthPanel = 'calc(var(--spc) * 120)';

const valuesStoraged = {
	keyURLVideoPrefer: GM_getValue('default-keyURLVideoPrefer', 'baseUrl'),
	keyURLAudioPrefer: GM_getValue('default-keyURLAudioPrefer', 'baseUrl'),
	hiddenInvalidFormat: GM_getValue('default-hiddenInvalidFormat', true),
	codecPrefer: GM_getValue('default-codecPrefer', false),
};
const filterVideoOptions = values => optionsVideo
	.filter(option => {
		if(values.hiddenInvalidFormat && option.bandwidth == 0) { return false; }


		const optionsIDSame = optionsVideo.filter(o => o.id == option.id);
		if(values.codecPrefer
			&& optionsIDSame.find(o => o.codec == values.codecPrefer)
			&& option.codec != values.codecPrefer
		) { return false; }


		return true;
	});


FM.$panels = [{
	id: 'video',
	type: 'select-grid',
	title: '选择视频源',
	keyValue: 'video',
	heads: [
		{ key: 'desc', text: '标签', keyTitle: 'resolution' },
		{ key: 'codec', text: '编码', keyTitle: 'codecFull' },
		{ key: 'id', text: 'ID' },
		{ key: 'bandwidth', text: '带宽' },
	],
	options: filterVideoOptions(valuesStoraged),
	handle: { getOptionKey }
}, {
	id: 'audio',
	type: 'select-grid',
	title: '选择音频源',
	keyValue: 'audio',
	heads: [
		{ key: 'id', text: 'ID' },
		{ key: 'codec', text: '编码' },
		{ key: 'bandwidth', text: '带宽' },
	],
	options: optionsAudio,
	handle: { getOptionKey }
}, {
	id: 'functions',
	title: '功能',
	type: 'functions',
	functions: [{
		id: 'fetch-audio-single',
		text: '下载完整视频',
		icon: faFilm,
		async handle(states) {
			if(!ffmpeg.isLoaded()) { G.info('ffmpeg not loaded'); }

			const keyVideo = states.$values.value.video;
			const keyAudio = states.$values.value.audio;

			const optionVideo = optionsVideo.find(video => getOptionKey(video) == keyVideo);
			const optionAudio = optionsAudio.find(audio => getOptionKey(audio) == keyAudio);

			const video = optionVideo?.media;
			const audio = optionAudio?.media;

			const urlVideo = video ? getMediaURL(video, states.$values.value.keyURLVideoPrefer) : null;
			const urlAudio = audio ? getMediaURL(audio, states.$values.value.keyURLAudioPrefer) : null;


			const [datasVideo, datasAudio] = await Promise.all([
				urlVideo ? fetchMediaData({
					url: urlVideo,
					nameLog: '视频',
					nameSave: `${namePrefix}@video#${keyVideo}.m4s`.replace(/[~/]/g, '_'),
					size: await fetchMediaSize(urlVideo),
				}) : null,

				urlAudio ? fetchMediaData({
					url: urlAudio,
					nameLog: '音频',
					nameSave: `${namePrefix}@audio#${keyAudio}.m4s`.replace(/[~/]/g, '_'),
					size: await fetchMediaSize(urlAudio),
				}) : null,
			]);


			const nameMixin = !optionVideo.isTrial
				? `${namePrefix}@${Math.min(video.width, video.height)}p#${video.bandwidth}.mp4`.replace(/[~/]/g, '_')
				: `${namePrefix}@trial.mp4`.replace(/[~/]/g, '_');


			if(ffmpeg.isLoaded()) { mixinMediaData(datasVideo, datasAudio, nameMixin); }
			else { G.info('ffmpeg not loaded'); }
		}
	}, {
		id: 'fetch-audio-single',
		text: '单独下载视频',
		icon: faFileVideo,
		async handle(states) {
			const keyVideo = states.$values.value.video;

			const video = optionsVideo.find(video => getOptionKey(video) == keyVideo)?.media;

			const url = getMediaURL(video, states.$values.value.keyURLVideoPrefer);


			await fetchMediaData({
				url: url,
				nameLog: '视频',
				nameSave: `${namePrefix}@video#${keyVideo}.m4s`.replace(/[~/]/g, '_'),
				size: await fetchMediaSize(url),
			}, { saveImmediately: true });
		}
	}, {
		id: 'fetch-audio-single',
		text: '单独下载音频',
		icon: faFileAudio,
		async handle(states) {
			const keyAudio = states.$values.value.audio;

			const audio = optionsAudio.find(audio => getOptionKey(audio) == keyAudio)?.media;

			const url = getMediaURL(audio, states.$values.value.keyURLAudioPrefer);


			await fetchMediaData({
				url: url,
				nameLog: '音频',
				nameSave: `${namePrefix}@audio#${keyAudio}.m4s`.replace(/[~/]/g, '_'),
				size: await fetchMediaSize(url),
			}, { saveImmediately: true });
		}
	}]
}, {
	id: 'configs',
	title: '选项',
	type: 'configs',
	configs: [{
		key: 'keyURLVideoPrefer',
		type: 'switch-button',
		label: '视频偏好CDN',
		options: [{ text: '基础', value: 'baseUrl' }, { text: '后备1', value: 'backupUrl1' }, { text: '后备2', value: 'backupUrl2' }, { text: '后备3', value: 'backupUrl3' }],
		click(config, states, handleDefault) { handleDefault(config, states); }
	}, {
		key: 'keyURLAudioPrefer',
		type: 'switch-button',
		label: '音频偏好CDN',
		options: [{ text: '基础', value: 'baseUrl' }, { text: '后备1', value: 'backupUrl1' }, { text: '后备2', value: 'backupUrl2' }, { text: '后备3', value: 'backupUrl3' }],
		click(config, states, handleDefault) { handleDefault(config, states); }
	}, {
		key: 'codecPrefer',
		type: 'switch-button',
		label: '偏好编码',
		options: [{ text: 'AVC', value: 'avc1' }, { text: 'AV1', value: 'av01' }, { text: 'HEVC', value: 'hev1' }, { text: '无', value: false }],
		click(config, states, handleDefault) {
			handleDefault(config, states);

			const panel = states.$panels.value.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(states.$values.value);
		}
	}, {
		key: 'hiddenInvalidFormat',
		type: 'switch-button',
		label: '无效格式',
		options: [{ text: '隐藏', value: true }, { text: '显示', value: false }],
		click(config, states, handleDefault) {
			handleDefault(config);

			const panel = states.$panels.value.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(states.$values.value);
		}
	}],

}];

FM.$values = {
	video: getOptionKey(optionsVideo.toSorted((a, b) => b.id - a.id || b.bandwidthRaw - a.bandwidthRaw)[0]),
	audio: optionsAudio[0] ? getOptionKey(optionsAudio[0]) : '',
	keyURLVideoPrefer: valuesStoraged.keyURLVideoPrefer,
	keyURLAudioPrefer: valuesStoraged.keyURLAudioPrefer,
	hiddenInvalidFormat: valuesStoraged.hiddenInvalidFormat,
	codecPrefer: valuesStoraged.codecPrefer,
};

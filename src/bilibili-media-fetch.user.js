// ==UserScript==
// @name        bilibili-media-fetch
// @description 2024.05.17.15
// @namespace   https://danor.app/
// @version     0.0.1
// @author      DanoR
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @match       *://*.bilibili.com/video/*
// @noframes
// ==/UserScript==

import FetchManager from './lib/fetch-manager.js';
import { G } from './lib/logger.js';
import { faFileAudio, faFileVideo, faPhotoVideo } from '@fortawesome/free-solid-svg-icons';



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
const optionsVideo = PD.support_formats.map(formatSupport => formatSupport.codecs.map(codec => {
	const video = PD.dash.video.find(v => v.id == formatSupport.quality && v.codecs == codec);

	return {
		id: formatSupport.quality,
		desc: formatSupport.new_description,
		codec: codec.split('.')[0],
		codecFull: codec,
		resolution: video ? `${video.width}x${video.height}@${Number(video.frame_rate).toFixed(0)}` : '',
		bandwidth: video ? renderSize(video.bandwidth) : 0,
		media: video,
	};
})).flat().filter(o => o);

/** @type {Object[]} */
const optionsAudio = PD.dash.audio.map(audio => ({
	id: audio.id,
	codec: audio.codecs.split('.')[0],
	codecFull: audio.codecs,
	bandwidth: renderSize(audio.bandwidth),
	media: audio,
})).sort((a, b) => b.id - a.id);

if(PD.dash.flac?.audio) {
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

const fetchMediaData = async (info, box) => {
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
		linkMedia.click();


		G.log('download-media', '✔', info.nameLog);


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
const getOptionKey = option => `${option.id}#${option.codecFull}`;


const FM = new FetchManager();

FM.$willStorageValue = true;
FM.$widthPanel = 'calc(var(--spc) * 120)';

const valuesStoraged = {
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
	handle: {
		getOptionKey
	}
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
	handle: {
		getOptionKey
	}
}, {
	id: 'functions',
	title: '功能',
	type: 'functions',
	functions: [{
		id: 'fetch-audio-single',
		text: '下载完整视频',
		icon: faPhotoVideo,
		async handle(C) {
			const keyAudio = C.values.audio;

			const audio = optionsAudio.find(audio => getOptionKey(audio) == keyAudio)?.media;


			const infoFetchMedia = {};
			infoFetchMedia.url = audio.baseUrl;
			infoFetchMedia.nameLog = '视频';
			infoFetchMedia.nameSave = `${namePrefix}@audio#${keyAudio}.m4s`.replace(/[~/]/g, '_');
			infoFetchMedia.size = await fetchMediaSize(infoFetchMedia.url);

			await fetchMediaData(infoFetchMedia);
		}
	}, {
		id: 'fetch-audio-single',
		text: '单独下载视频',
		icon: faFileVideo,
		async handle(C) {
			const keyAudio = C.values.audio;

			const audio = optionsAudio.find(audio => getOptionKey(audio) == keyAudio)?.media;


			const infoFetchMedia = {};
			infoFetchMedia.url = audio.baseUrl;
			infoFetchMedia.nameLog = '视频';
			infoFetchMedia.nameSave = `${namePrefix}@audio#${keyAudio}.m4s`.replace(/[~/]/g, '_');
			infoFetchMedia.size = await fetchMediaSize(infoFetchMedia.url);

			await fetchMediaData(infoFetchMedia);
		}
	}, {
		id: 'fetch-audio-single',
		text: '单独下载音频',
		icon: faFileAudio,
		async handle(C) {
			const keyAudio = C.values.audio;

			const audio = optionsAudio.find(audio => getOptionKey(audio) == keyAudio)?.media;


			const infoFetchMedia = {};
			infoFetchMedia.url = audio.baseUrl;
			infoFetchMedia.nameLog = '视频';
			infoFetchMedia.nameSave = `${namePrefix}@audio#${keyAudio}.m4s`.replace(/[~/]/g, '_');
			infoFetchMedia.size = await fetchMediaSize(infoFetchMedia.url);

			await fetchMediaData(infoFetchMedia);
		}
	}]
}, {
	id: 'configs',
	title: '选项',
	type: 'configs',
	closedDefault: true,
	configs: [{
		key: 'hiddenInvalidFormat',
		type: 'switch-button',
		label: '无效格式',
		options: [{ text: '隐藏', value: true }, { text: '显示', value: false }],
		click(config, C, handleDefault) {
			handleDefault(config, C);

			const panel = C.panels.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(C.values);
		}
	}, {
		key: 'codecPrefer',
		type: 'switch-button',
		label: '偏好编码',
		options: [{ text: 'AVC', value: 'avc1' }, { text: 'AV1', value: 'av01', }, { text: 'HEVC', value: 'hev1', }, { text: '无', value: false }],
		click(config, C, handleDefault) {
			handleDefault(config, C);

			const panel = C.panels.find(panel => panel.id == 'video');

			panel.options = filterVideoOptions(C.values);
		}
	}],

}];

FM.$values = {
	video: getOptionKey(optionsVideo[0]),
	audio: getOptionKey(optionsAudio[0]),
	hiddenInvalidFormat: valuesStoraged.hiddenInvalidFormat,
	codecPrefer: valuesStoraged.codecPrefer,
};

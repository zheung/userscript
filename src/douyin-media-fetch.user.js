// ==UserScript==
// @name        douyin-media-fetch
// @namespace   https://danor.app
// @version     1.0.1+26062309
// @author      DanoR
// @description 【抖音】视频音频下载
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @match       *://*.douyin.com/video/*
// @noframes
// ==/UserScript==

import { G } from './lib/logger.js';
import { fetchFileData, fetchFileSize } from './lib/util.js';
import { hookXHR } from './lib/hook-http-response.js';



hookXHR(
	(url) => url.includes('aweme/v1/web/aweme/detail'),
	async result => {
		const info = JSON.parse(result).aweme_detail;

		G.info('视频信息', info);


		const video = info.video.bit_rate.sort((a, b) => b.play_addr.height - a.play_addr.height || b.bit_rate - a.bit_rate)[0];
		const play = video.play_addr;

		const url = play.url_list[0];
		const size = play.data_size ? await fetchFileSize(url) : null;
		if(!size) { return G.error('视频信息', '未知大小'); }


		const width = play.width;
		const height = play.height;


		const desc = info.desc.replaceAll('@', 'at').replaceAll('#', '');

		const nameSave = `douyin@${info.author.unique_id || info.author.sec_uid}#${info.author.nickname}@${info.aweme_id}#${desc}@${Math.min(width, height)}p#${video.bit_rate}.${video.format}`;


		fetchFileData(url, {
			size, nameSave, willSaveNow: true,
			atFinish() { G.info('下载视频', '✔'); },
			atError(error) { G.error('下载视频', '✘', error?.message ?? error, error?.stack); },
		});
	},
	{ once: true }
);

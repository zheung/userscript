// ==UserScript==
// @name        bilibili-live-show-upower-emoji
// @namespace   https://danor.app
// @version     2.0.0+26062309
// @author      DanoR
// @description 【哔哩哔哩】直播间显示充电表情
// @grant       unsafeWindow
// @match       *://live.bilibili.com/*
// @noframes
// ==/UserScript==

import { G } from './lib/logger.js';
import { hookXHR } from './lib/hook-http-response.js';



(async () => {
	const uid = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__?.roomInitRes?.data?.uid;
	if(!uid) { return G.error('获取[UID]', '✘'); }
	G.info('获取[UID]', '✔', uid);


	const response = await fetch(`https://api.bilibili.com/x/upowerv2/gw/rights/index?up_mid=${uid}`, { credentials: 'include' });
	const result = await response.json();

	const emoteUpower = Object.values(result?.data?.privilege_rights ?? {}).filter(right => right.emote?.locked === false).pop()?.emote;
	if(!emoteUpower) { return G.error('获取[充电表情]', '✘'); }
	G.info('获取[充电表情]', '✔', emoteUpower);


	hookXHR(
		(url) => url.includes('//api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons'),
		(responseText) => {
			const info = JSON.parse(responseText);

			const datas = info.data?.data;
			if(datas instanceof Array == false) { return responseText; }

			const dataInsert = {
				'emoticons': emoteUpower.emojis.map(emoji => ({
					'emoji': emoji.name,
					'descript': emoji.name,
					'url': emoji.icon,
					'is_dynamic': 0,
					'in_player_area': 1,
					'width': 162,
					'height': 162,
					'identity': 99,
					'unlock_need_gift': 0,
					'perm': 1,
					'unlock_need_level': 0,
					'emoticon_value_type': 1,
					'bulge_display': 1,
					'unlock_show_text': '充电',
					'unlock_show_color': '#FF6699',
					'emoticon_unique': `upower_[UPOWER_${uid}_${emoji.name}]`,
					'unlock_show_image': '',
					'emoticon_id': emoji.id
				})),
				'pkg_id': 99999,
				'pkg_name': '包月充电表情',
				'pkg_type': 2,
				'pkg_descript': '',
				'pkg_perm': 1,
				'unlock_identity': 0,
				'unlock_need_gift': 0,
				'current_cover': emoteUpower.emojis[0]?.icon,
				'recently_used_emoticons': [],
				'top_show': {
					'top_left': {
						'image': '',
						'text': '包月充电表情'
					},
					'top_right': {
						'image': '',
						'text': ''
					}
				},
				'top_show_recent': {
					'top_left': {
						'image': '',
						'text': ''
					},
					'top_right': {
						'image': '',
						'text': ''
					}
				}
			};

			datas.splice(
				datas.findIndex(data => data.pkg_name == '房间专属表情') + 1 ||
				datas.findIndex(data => data.pkg_name == 'UP主大表情') + 1 ||
				2 + 1,
				0, dataInsert);


			return JSON.stringify(info);
		},
		{
			willUpdate: true,
		}
	);
})();

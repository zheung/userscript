// ==UserScript==
// @name        twitter-media-download
// @description 2023.07.30 21
// @namespace   https://danor.app/
// @version     1.5.2
// @author      DanoR
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://unpkg.com/notyf@3/notyf.min.js
// @resource    notyf_css https://unpkg.com/notyf@3/notyf.min.css
// @match       *://twitter.com/*
// ==/UserScript==

/* global Notyf */



GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.nz-tmd-notify {
		background: #1da1f2;
		box-shadow: rgb(136 153 166 / 20%) 0px 0px 15px, rgb(136 153 166 / 15%) 0px 0px 3px 1px;
		border-radius: 4px;
		max-width: unset;
	}

	.nz-tmd-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-tmd-notify progress {
		border: none;
	}
	.nz-tmd-notify .prog {
		display: inline-block;
		vertical-align: middle;
	}
	.nz-tmd-notify .save {
		display: inline-block;
		vertical-align: middle;
		color: white;
		text-decoration: none;
		margin-left: 5px;
	}

	.nz-tmd-notify progress::-webkit-progress-bar {
		background-color: #ffffff;
		border-radius: 4px;
	}
	.nz-tmd-notify progress::-webkit-progress-value {
		background: #17bf63;
		border-radius: 4px;
	}

	.nz-tmd-hover1 {
		background-color: rgba(255, 87, 34, 0.1);
	}
	.nz-tmd-hover2 {
		color: rgb(255, 87, 34);
	}
`);

const renderSize = function(value) {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2)} ${['By', 'KB', 'MB', 'GB'][index]}`;
};

const notyf = new Notyf({
	duration: 0,
	position: { x: 'right', y: 'top' },
	types: [
		{
			type: 'tmd',
			icon: false,
			className: 'nz-tmd-notify',
		}
	]
});


const domTextDBox = `
<div class="prog">Preparing...</div>
<progress value="0" max="100"></progress><br>
`;
const openDBox = (id) => {
	const random = (Math.random() * 1000).toFixed(0);
	const noty = notyf.open({
		type: 'tmd',
		message: `<div id="nz-tmd-dbox-${id}-${random}"><div class="title">Tweet: ${id} Fetching...</div><div class="down"></div></div>`
	});

	const dbox = document.querySelector(`#nz-tmd-dbox-${id}-${random}`);
	const boxTitle = dbox.querySelector('.title');
	const boxDown = dbox.querySelector('.down');

	const initer = (text, count) => {
		dbox.title = text;
		boxTitle.innerHTML = boxTitle.innerHTML.replace(' Fetching...', '');
		boxDown.innerHTML = domTextDBox.repeat(count);

		const progs = dbox.querySelectorAll('progress');
		const textsProg = dbox.querySelectorAll('.prog');
		const textsInfo = dbox.querySelectorAll('.info');

		return { progs, textsProg, textsInfo, };
	};

	return { noty, initer };
};


const downloadMedia = async (media, tweet, user, prog, textProg) => {
	const response = await fetch(new Request(media.url, { cache: 'reload' }));
	const reader = response.body.getReader();

	const sizeTotal = +response.headers.get('Content-Length');

	prog.max = sizeTotal;

	let sizeLoaded = 0;
	let datasMedia = new Uint8Array(sizeTotal);
	let isWhile = true;
	while(isWhile) {
		const { done, value } = await reader.read();

		if(!done || sizeLoaded == 0) {
			datasMedia.set(value, sizeLoaded);
			sizeLoaded += value.length;

			textProg.innerHTML = `${media.sort}: [${renderSize(sizeTotal)}] ${(sizeLoaded * 100 / sizeTotal).toFixed(2).padStart(5, '0')}%`;

			prog.value = sizeLoaded;
		}
		else {
			isWhile = false;
		}
	}

	const a = document.createElement('a');
	a.classList.add('save');
	a.innerHTML = 'Save';
	a.download = `twitter@${user.screen_name}@${tweet.id_str}@${media.sort + 1}@${media.name}`;
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	a.click();

	globalThis.console.log(`Saved: ${a.download}`);
};


const downloadTweetMedia = async idTweet => {
	const ct0 = (document.cookie.match(/ct0=(.*?); /) || [])[1];

	const { noty, initer } = openDBox(idTweet);

	const url = new URL('https://twitter.com/i/api/graphql/-Ls3CrSQNo2fRKH6i6Na1A/TweetDetail');
	url.searchParams.set('variables', JSON.stringify({
		'focalTweetId': idTweet,
		'includePromotedContent': true,
		'withBirdwatchNotes': true,
		'withVoice': true
	}));
	url.searchParams.set('features', JSON.stringify({
		'creator_subscriptions_tweet_preview_api_enabled': true,
		'freedom_of_speech_not_reach_fetch_enabled': true,
		'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
		'longform_notetweets_consumption_enabled': true,
		'longform_notetweets_inline_media_enabled': true,
		'longform_notetweets_rich_text_read_enabled': true,
		'responsive_web_edit_tweet_api_enabled': true,
		'responsive_web_enhance_cards_enabled': false,
		'responsive_web_graphql_exclude_directive_enabled': true,
		'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
		'responsive_web_graphql_timeline_navigation_enabled': true,
		'responsive_web_media_download_video_enabled': false,
		'responsive_web_twitter_article_tweet_consumption_enabled': false,
		'rweb_lists_timeline_redesign_enabled': true,
		'standardized_nudges_misinfo': true,
		'tweet_awards_web_tipping_enabled': false,
		'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
		'tweetypie_unmention_optimization_enabled': true,
		'verified_phone_label_enabled': false,
		'view_counts_everywhere_api_enabled': true,
	}));

	const response = await fetch(url, {
		headers: {
			authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
			cookie: `ct0=${ct0}`,
			'x-csrf-token': ct0,
		}
	});

	const details = await response.json();


	const result = details?.data?.threaded_conversation_with_injections?.
		instructions?.find(i => i.type == 'TimelineAddEntries')?.
		entries?.find(i => i.entryId == `tweet-${idTweet}`)?.content?.itemContent?.tweet_results?.result;
	const tweet = (result?.tweet ?? result)?.legacy;
	const user = (result?.tweet ?? result)?.core?.user_results?.result?.legacy;


	const entitiesTweet = tweet.extended_entities || tweet.entities;
	const mediasTweet = entitiesTweet?.media;

	if(!entitiesTweet || !(mediasTweet instanceof Array) || !mediasTweet.length) { return; }


	const { progs, textsProg, textsInfo, } = initer(tweet.full_text, mediasTweet.length);

	const medias = mediasTweet.map((media, sort) => {
		if(media.video_info) {
			const variants = media.video_info.variants;

			let bitrateMax;
			let variant = variants[0];

			if(variants.length > 1) {
				bitrateMax = Math.max(...variants.map(v => v.bitrate).filter(v => v));
				variant = variants.find(v => v.bitrate == bitrateMax);
			}

			return {
				id: (variant.url.match(/\/vid\/(.*?)\..*?$/) || ['', ''])[1].replace('/', '-'),
				name: (variant.url.split('?')[0].match(/\/.*\/(.*)$/) || ['', ''])[1],
				sort,
				type: 'video',
				bitrate: bitrateMax,
				duration: media.duration_millis,
				url: variant.url,
				urlCover: media.media_url_https,
			};
		}
		else {
			const [, id, format] = media.media_url_https.match(/\/media\/(.*?)\.(.*?)$/) || [];

			return {
				id: id,
				name: `${id}.${format}`,
				sort,
				type: 'image',
				width: media.original_info.width,
				height: media.original_info.height,
				format: format,
				url: `https://pbs.twimg.com/media/${id}?format=${format}&name=orig`,
			};
		}
	});

	let unfinish = mediasTweet.length;
	medias.forEach(async (media, i) => {
		await downloadMedia(media, tweet, user, progs[i], textsProg[i], textsInfo[i]);

		unfinish--;

		if(unfinish == 0) {
			setTimeout(() => notyf.dismiss(noty), 14777);
		}
	});
};

const onClickDown = async function(event) {
	event.stopPropagation();

	const idsTweet = [...new Set([...this.querySelectorAll('a[href*="/status/"]')].map(a => a.href.match(/\/status\/(\d+)/)?.[1]))];

	for(const idTweet of idsTweet) {
		downloadTweetMedia(idTweet);
	}
};

/**
 * @param {Element} divOper
 */
const initButton = divOper => {
	const divShare = divOper.lastChild;

	/** @type {Element} */
	const divDown = divShare.cloneNode(true);
	divDown.classList.add('nz-tmd-button');
	divOper.appendChild(divDown);


	const svgDown = divDown.querySelector('svg');
	const pathDown = svgDown.querySelector('path');

	pathDown.setAttribute('d', 'M12,16l-5.7-5.7l1.4-1.4l3.3,3.3V2.6h2v9.6l3.3-3.3l1.4,1.4L12,16z M21,15l0,3.5c0,1.4-1.1,2.5-2.5,2.5h-13 C4.1,21,3,19.9,3,18.5V15h2v3.5C5,18.8,5.2,19,5.5,19h13c0.3,0,0.5-0.2,0.5-0.5l0-3.5H21z');


	divDown.children[0].removeAttribute('aria-label');
	divDown.children[0].removeAttribute('role');
	divDown.children[0].removeAttribute('data-focusable');
	divDown.children[0].removeAttribute('data-testid');
	divDown.children[0].children[0].removeAttribute('dir');


	divDown.addEventListener('mouseover', event => {
		event.stopPropagation();


		const classList1 = divDown.querySelector('.r-1niwhzg')?.classList;

		if(classList1) {
			classList1.add('nz-tmd-hover1');
			classList1.remove('r-1niwhzg');
		}


		const classList2 = divDown.querySelector('.r-14j79pv')?.classList;

		if(classList2) {
			classList2.add('nz-tmd-hover2');
			classList2.remove('r-14j79pv');
		}
	});
	divDown.addEventListener('mouseleave', event => {
		event.stopPropagation();


		const classList1 = divDown.querySelector('.nz-tmd-hover1')?.classList;

		if(classList1) {
			classList1.add('r-1niwhzg');
			classList1.remove('nz-tmd-hover1');
		}


		const classList2 = divDown.querySelector('.nz-tmd-hover2')?.classList;

		if(classList2) {
			classList2.add('r-14j79pv');
			classList2.remove('nz-tmd-hover2');
		}
	});

	return divDown;
};

/**
 * @param {Element} divOper
 */
const initButton2 = function(divOper) {
	const divShare = divOper.lastChild;

	/** @type {Element} */
	const divDown = divShare.cloneNode(true);
	divDown.classList.add('nz-tmd-button');
	divOper.appendChild(divDown);


	const svgDown = divDown.querySelector('svg');
	const pathDown = svgDown.querySelector('path');

	pathDown.setAttribute('d', 'M12,16l-5.7-5.7l1.4-1.4l3.3,3.3V2.6h2v9.6l3.3-3.3l1.4,1.4L12,16z M21,15l0,3.5c0,1.4-1.1,2.5-2.5,2.5h-13 C4.1,21,3,19.9,3,18.5V15h2v3.5C5,18.8,5.2,19,5.5,19h13c0.3,0,0.5-0.2,0.5-0.5l0-3.5H21z');


	divDown.children[0].removeAttribute('aria-expanded');
	divDown.children[0].removeAttribute('aria-haspopup');
	divDown.children[0].removeAttribute('aria-label');
	divDown.children[0].removeAttribute('role');
	divDown.children[0].removeAttribute('data-focusable');


	divDown.addEventListener('mouseover', event => {
		event.stopPropagation();


		const classList1 = divDown.querySelector('.r-1niwhzg')?.classList;

		if(classList1) {
			classList1.add('nz-tmd-hover1');
			classList1.remove('r-1niwhzg');
		}


		const classList2 = divDown.querySelector('.r-14j79pv')?.classList;

		if(classList2) {
			classList2.add('nz-tmd-hover2');
			classList2.remove('r-14j79pv');
		}
	});
	divDown.addEventListener('mouseleave', event => {
		event.stopPropagation();


		const classList1 = divDown.querySelector('.nz-tmd-hover1')?.classList;

		if(classList1) {
			classList1.add('r-1niwhzg');
			classList1.remove('nz-tmd-hover1');
		}


		const classList2 = divDown.querySelector('.nz-tmd-hover2')?.classList;

		if(classList2) {
			classList2.add('r-14j79pv');
			classList2.remove('nz-tmd-hover2');
		}
	});

	return divDown;
};


new MutationObserver(() => {
	try {
		[...document.querySelectorAll('article')]
			.filter(article => article.querySelectorAll('img[src*="pbs.twimg.com/media"], img[src*="pbs.twimg.com/ext_tw_video_thumb"], img[src*="pbs.twimg.com/tweet_video_thumb"], img[src*="pbs.twimg.com/amplify_video_thumb"]').length && !article.querySelectorAll('.nz-tmd-button').length)
			.forEach(article => {
				[...article.querySelectorAll('.r-1kbdv8c')]
					.filter(box => !box.querySelector('div.nz-tmd-button'))
					.forEach(box => initButton(box).addEventListener('click', onClickDown.bind(article)));

				[...article.querySelectorAll('.r-a2tzq0')]
					.filter(box => !box.querySelector('div.nz-tmd-button'))
					.forEach(box => initButton2(box).addEventListener('click', onClickDown.bind(article)));
			});
	}
	catch(error) {
		globalThis.console.error(error.message, error.stack);
	}
}).observe(document.body, { childList: true, subtree: true });

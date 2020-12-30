// ==UserScript==
// @name      Twitter Media Download
// @namespace https://danor.app/
// @version   0.4.1-20201228
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @match     https://twitter.com/*
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
	const response = await fetch(media.url);
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
	a.download = `Twitter@${user.screen_name}@${tweet.id_str}@${media.sort}@${media.name}`;
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	a.click();

	console.log(`Saved: ${a.download}`);
};

const onClickDown = async function(event) {
	event.stopPropagation();

	const tid = (this.querySelector('a[href*="/status/"]').href.match(/\/status\/(\d+)/) || [])[1];
	const ct0 = (document.cookie.match(/ct0=(.*?); /) || [])[1];

	const { noty, initer } = openDBox(tid);

	const response = await fetch(`https://twitter.com/i/api/2/timeline/conversation/${tid}.json?tweet_mode=extended`, {
		headers: {
			authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
			cookie: `ct0=${ct0}`,
			'x-csrf-token': ct0,
		}
	});

	const data = await response.json();

	const tweets = data.globalObjects.tweets;
	const tweetMain = tweets[tid];
	const tweet = tweetMain.quoted_status_id_str ? tweets[tweetMain.quoted_status_id_str] : tweetMain;

	const entitiesTweet = tweet.extended_entities || tweet.entities;
	const mediasTweet = entitiesTweet ? entitiesTweet.media : null;

	const user = data.globalObjects.users[tweet.user_id_str];


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
				urlCover: media.media_url,
			};
		}
		else {
			const [, id, format] = media.media_url.match(/\/media\/(.*?)\.(.*?)$/) || [];

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

const initButton = function(divOper) {
	const divReply = divOper.children[0];
	const divShare = divOper.children[3];

	const divDown = divReply.cloneNode(true);
	divDown.classList.add('nz-tmd-button');
	divDown.querySelector('span.r-n6v787').innerHTML = '下载';
	divOper.insertBefore(divDown, divShare);

	const svgDown = divDown.querySelector('svg');
	const gDown = svgDown.querySelector('g');
	const path1Down = gDown.querySelector('path');
	const path2Down = path1Down.cloneNode();
	gDown.appendChild(path2Down);
	path1Down.setAttribute('d', 'M11.47 14.53c.146.146.338.22.53.22s.384-.073.53-.22l5-5c.293-.293.293-.768 0-1.06s-.768-.294-1.06 0l-3.72 3.72V2c0-.414-.337-.75-.75-.75s-.75.336-.75.75v10.19L7.53 8.47c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l5 5z');
	path2Down.setAttribute('d', 'M21.25 13.25c-.414 0-.75.336-.75.75v5.652c0 .437-.355.792-.792.792H4.292c-.437 0-.792-.355-.792-.792V14c0-.414-.336-.75-.75-.75S2 13.586 2 14v5.652c0 1.264 1.028 2.292 2.292 2.292h15.416c1.264 0 2.292-1.028 2.292-2.292V14c0-.414-.336-.75-.75-.75z');

	divDown.children[0].removeAttribute('aria-label');
	divDown.children[0].removeAttribute('role');
	divDown.children[0].removeAttribute('data-focusable');
	divDown.children[0].removeAttribute('data-testid');
	divDown.children[0].children[0].removeAttribute('dir');

	divDown.addEventListener('mouseover', event => {
		event.stopPropagation();

		divDown.children[0].children[0].style.color = 'rgba(214,214,0)';
		divDown.children[0].children[0].children[0].children[0].style.backgroundColor = 'rgba(214,214,0,0.1)';
	});
	divDown.addEventListener('mouseleave', event => {
		event.stopPropagation();

		divDown.children[0].children[0].style.color = '';
		divDown.children[0].children[0].children[0].children[0].style.backgroundColor = '';
	});

	return divDown;
};

const initButton2 = function(divOper) {
	const divReply = divOper.children[0];
	const divShare = divOper.children[3];

	const divDown = divReply.cloneNode(true);
	divDown.classList.add('nz-tmd-button');
	divOper.insertBefore(divDown, divShare);

	const svgDown = divDown.querySelector('svg');
	const gDown = svgDown.querySelector('g');
	const path1Down = gDown.querySelector('path');
	const path2Down = path1Down.cloneNode();
	gDown.appendChild(path2Down);
	path1Down.setAttribute('d', 'M11.47 14.53c.146.146.338.22.53.22s.384-.073.53-.22l5-5c.293-.293.293-.768 0-1.06s-.768-.294-1.06 0l-3.72 3.72V2c0-.414-.337-.75-.75-.75s-.75.336-.75.75v10.19L7.53 8.47c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l5 5z');
	path2Down.setAttribute('d', 'M21.25 13.25c-.414 0-.75.336-.75.75v5.652c0 .437-.355.792-.792.792H4.292c-.437 0-.792-.355-.792-.792V14c0-.414-.336-.75-.75-.75S2 13.586 2 14v5.652c0 1.264 1.028 2.292 2.292 2.292h15.416c1.264 0 2.292-1.028 2.292-2.292V14c0-.414-.336-.75-.75-.75z');

	divDown.children[0].removeAttribute('aria-expanded');
	divDown.children[0].removeAttribute('aria-haspopup');
	divDown.children[0].removeAttribute('aria-label');
	divDown.children[0].removeAttribute('role');
	divDown.children[0].removeAttribute('data-focusable');

	divDown.addEventListener('mouseover', event => {
		event.stopPropagation();

		divDown.children[0].children[0].style.color = 'rgba(214,214,0)';
		divDown.children[0].children[0].children[0].children[0].style.backgroundColor = 'rgba(214,214,0,0.1)';
	});
	divDown.addEventListener('mouseleave', event => {
		event.stopPropagation();

		divDown.children[0].children[0].style.color = '';
		divDown.children[0].children[0].children[0].children[0].style.backgroundColor = '';
	});

	return divDown;
};

const observer = new MutationObserver(() => {
	try {
		[...document.querySelectorAll('article')]
			.filter(article => article.querySelectorAll('img[src*="pbs.twimg.com/media"], img[src*="pbs.twimg.com/ext_tw_video_thumb"], img[src*="pbs.twimg.com/tweet_video_thumb"]').length && !article.querySelectorAll('.nz-tmd-button').length)
			.forEach(article => {
				[...article.querySelector('.r-1mdbhws')]
					.filter(box => !box.querySelector('div.nz-tmd-button'))
					.forEach(box => initButton(box).addEventListener('click', onClickDown.bind(article)));

				[...article.querySelector('.r-a2tzq0')]
					.filter(box => !box.querySelector('div.nz-tmd-button'))
					.forEach(box => initButton2(box).addEventListener('click', onClickDown.bind(article)));
			});
	}
	catch(error) {
		console.error(error.message, error.stack);
	}
});

observer.observe(document.body, { childList: true, subtree: true });
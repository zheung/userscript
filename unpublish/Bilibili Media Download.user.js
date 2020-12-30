// ==UserScript==
// @name      BiliBili Media Download
// @namespace https://danor.app/
// @version   0.4.2-20201230
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @grant     unsafeWindow
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require   https://cdn.jsdelivr.net/npm/gbk.js@0.3.0/dist/gbk2.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @include   *bilibili.com/bangumi/play/*
// @include   *bilibili.com/video/*
// ==/UserScript==
/* global Notyf, __INITIAL_STATE__, GBK */

GM_addStyle(GM_getResourceText('notyf_css'));
GM_addStyle(`
	.nz-tmd-notify {
		background: #1da1f2;
		box-shadow: rgb(136 153 166 / 20%) 0px 0px 15px, rgb(136 153 166 / 15%) 0px 0px 3px 1px;
		border-radius: 4px;
		max-width: unset;
	}

	.nz-tmd-notify .inline {
		display: inline-block;
		vertical-align: middle;
	}

	.nz-tmd-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-tmd-notify progress {
		border: none;
	}
	.nz-tmd-notify .prog {
		text-align: right;
	}
	.nz-tmd-notify .save {
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
<div class="inline prog">Preparing...</div>
<progress value="0" max="100"></progress><br>
`;
const openDBox = text => {
	const random = (Math.random() * 1000).toFixed(0);
	const noty = notyf.open({
		type: 'tmd',
		message: `<div id="nz-tmd-dbox-${random}"><div class="title">${text} Fetching...</div><div class="down"></div></div>`
	});

	const dbox = document.querySelector(`#nz-tmd-dbox-${random}`);
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


const downloadMedia = async (infos, prog, textProg, i) => {
	const response = await fetch(infos[0]);
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

			textProg.innerHTML = `
				<div class="inline" style="width: 40px">${i}:</div>
				<div class="inline" style="width: 65px">[${renderSize(sizeTotal)}]</div>
				<div class="inline" style="width: 55px">${(sizeLoaded * 100 / sizeTotal).toFixed(2).padStart(5, '0')}%</div>
			`.replace(/\t|\n/g, '');

			prog.value = sizeLoaded;
		}
		else {
			isWhile = false;
		}
	}

	const a = document.createElement('a');
	a.classList.add('inline', 'save');
	a.innerHTML = 'Save';
	a.download = infos[1];
	a.href = URL.createObjectURL(new Blob([datasMedia]));
	textProg.parentNode.insertBefore(a, textProg.nextElementSibling.nextElementSibling);
	a.click();

	console.log(`Saved: ${a.download}`);
};
const downloadBAT = ({ video, audio, output, slot }) => {
	const script = `
@echo off
ffmpeg -y -v quiet -i ".\\${video}" -i ".\\${audio}" -vcodec copy -acodec copy ".\\${output}"
echo ".\\${output}"

del ".\\${video}"
del ".\\${audio}"
echo Done
pause`.replace(/\n/g, '\r\n');

	const a = document.createElement('a');
	a.innerHTML = 'Save';
	a.download = `copy-${slot}.bat`;
	a.href = URL.createObjectURL(new Blob([new Uint8Array(GBK.encode(script))]));
	a.click();

	console.log(`Saved: ${a.download}`);
};

const onClickDown = async function(event) {
	event.stopPropagation();

	const source = unsafeWindow.dashPlayer.player.getSource();
	const video = source.video.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];
	const audio = source.audio.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];

	const slot =
		location.pathname.startsWith('/bangumi/play/') ? location.pathname.replace('/bangumi/play/', '') : (
			location.pathname.startsWith('/video/BV') ? location.pathname.replace('/video/', '') : (
				location.pathname.replace(/^\/|\/$/g, '').split('/').join('-')
			)
		);

	const { noty, initer } = openDBox(__INITIAL_STATE__.h1Title);
	const { progs, textsProg, } = initer('', 2);

	let unfinish = 2;
	[
		[video.baseUrl, `${__INITIAL_STATE__.h1Title}-${slot}-video-${video.height}p.mp4`, `video`],
		[audio.baseUrl, `${__INITIAL_STATE__.h1Title}-${slot}-audio.mp4`, `audio`],
	].forEach(async (infos, i, medias) => {
		await downloadMedia(infos, progs[i], textsProg[i], infos[2]);

		unfinish--;

		if(unfinish == 0) {
			downloadBAT({
				video: medias[0][1],
				audio: medias[1][1],
				output: `${__INITIAL_STATE__.h1Title}-${slot}-${video.height}p-${video.bandwidth}.mp4`,
				slot: `${__INITIAL_STATE__.h1Title}-${slot}`
			});

			setTimeout(() => notyf.dismiss(noty), 14777);
		}
	});
};

const initButton = function() {
	const buttonSetting = document.querySelector('.bilibili-player-video-danmaku-setting');

	if(buttonSetting) {
		const buttonDown = buttonSetting.cloneNode(true);
		buttonSetting.parentNode.insertBefore(buttonDown, buttonSetting.nextElementSibling);

		const svg = buttonDown.querySelector('svg');
		svg.setAttribute('viewBox', '0 -5 26 36');
		svg.innerHTML = '<polygon points="12.732,26 25.464,13.27 18.026,13.27 18.026,0 7.438,0 7.438,13.27 0,13.27" />';

		buttonDown.classList.add('nz-tmd-button');
		buttonDown.title = '下载';
		if(buttonDown.childNodes[1]) { buttonDown.removeChild(buttonDown.childNodes[1]); }

		return buttonDown;
	}

};

const observer = new MutationObserver(() => {
	try {
		if(!document.querySelector('.nz-tmd-button')) {
			const buttonDown = initButton();
			if(buttonDown) { buttonDown.addEventListener('click', onClickDown); }
		}
	}
	catch(error) {
		console.error(error.message, error.stack);
	}
});

observer.observe(document.body, { childList: true, subtree: true });
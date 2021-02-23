// ==UserScript==
// @name      BiliBili Media Download
// @namespace https://danor.app/
// @version   0.5.0-20210205
// @author    Nuogz
// @grant     GM_getResourceText
// @grant     GM_addStyle
// @grant     unsafeWindow
// @require   https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require   https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.9.7/dist/ffmpeg.min.js
// @resource  notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @include   *bilibili.com/bangumi/play/*
// @include   *bilibili.com/video/*
// ==/UserScript==
/* global Notyf, __INITIAL_STATE__, FFmpeg */

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


const downloadMedia = async (infos, prog, textProg, type) => {
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
				<div class="inline" style="width: 40px">${type}:</div>
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

	console.log(`Saved: ${a.download}`);

	return datasMedia;
};
// const downloadBAT = ({ video, audio, output, slot }) => {
// 	const script = `
// @echo off
// ffmpeg -y -v quiet -i ".\\${video}" -i ".\\${audio}" -vcodec copy -acodec copy ".\\${output}"
// echo Mixed ${output}

// del ".\\${video}"
// del ".\\${audio}"
// echo Done
// pause
// del %0`.replace(/\n/g, '\r\n');

// 	const a = document.createElement('a');
// 	a.innerHTML = 'Save';
// 	a.download = `mix ${slot}.bat`;
// 	a.href = URL.createObjectURL(new Blob([new Uint8Array(GBK.encode(script))]));
// 	a.click();

// 	console.log(`Saved: ${a.download}`);
// };

const mediasFinal = {
	video: null,
	audio: null,
	mixin: null,
};
const onClickDown = async function(event) {
	event.stopPropagation();

	const source = unsafeWindow.dashPlayer.player.getSource();
	const video = source.video.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];
	const audio = source.audio.slice().sort((a, b) => b.bandwidth - a.bandwidth)[0];

	const slot = __INITIAL_STATE__.bvid ||
		location.pathname.replace(/\/$/, '')
			.replace('/bangumi/play/', '')
			.replace('/video/', '');

	const title = __INITIAL_STATE__.h1Title ||
		(__INITIAL_STATE__.videoData ? __INITIAL_STATE__.videoData.title : '未知标题');
	const uid = __INITIAL_STATE__.upData ? (__INITIAL_STATE__.upData.mid || '0') : '0';

	const { noty, initer } = openDBox(title);
	const { progs, textsProg, } = initer('', 2);

	let unfinish = 2;
	[
		[video.baseUrl, `${uid}-${slot}-${title}-video-${video.height}p.mp4`, `video`],
		[audio.baseUrl, `${uid}-${slot}-${title}-audio.mp4`, `audio`],
	].forEach(async (infos, i) => {
		mediasFinal[infos[2]] = await downloadMedia(infos, progs[i], textsProg[i], infos[2]);

		unfinish--;

		if(unfinish == 0) {
			// downloadBAT({
			// 	video: medias[0][1],
			// 	audio: medias[1][1],
			// 	output: `${uid}-${slot}-${title}-${video.height}p-${video.bandwidth}.mp4`,
			// 	slot: `${uid}-${slot}-${title}`
			// });
			mixinMedia(`${uid}-${slot}-${title}-${video.height}p-${video.bandwidth}.mp4`);

			setTimeout(() => notyf.dismiss(noty), 24777);
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

const ffmpeg = FFmpeg.createFFmpeg({ log: true });

const mixinMedia = async function(nameFile) {
	if(!mediasFinal.video || !mediasFinal.audio) { return; }

	ffmpeg.FS('writeFile', 'video.mp4', mediasFinal.video);
	ffmpeg.FS('writeFile', 'audio.mp3', mediasFinal.audio);

	await ffmpeg.run('-y', '-v', 'quiet', '-i', 'video.mp4', '-i', 'audio.mp3', '-vcodec', 'copy', '-acodec', 'copy', 'output.mp4');

	const dataFinal = ffmpeg.FS('readFile', 'output.mp4');

	const a = document.createElement('a');
	a.download = nameFile;
	a.href = URL.createObjectURL(new Blob([dataFinal]));
	a.click();

	console.log(`Saved: ${a.download}`);
};

(async () => {
	await ffmpeg.load();

	new MutationObserver(() => {
		try {
			if(!document.querySelector('.nz-tmd-button')) {
				const buttonDown = initButton();
				if(buttonDown) { buttonDown.addEventListener('click', onClickDown); }
			}
		}
		catch(error) {
			console.error(error.message, error.stack);
		}
	}).observe(document.body, { childList: true, subtree: true });
})();
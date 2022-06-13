// ==UserScript==
// @name        bilibili-media-download
// @description bilibili-media-download
// @namespace   https://danor.app/
// @version     0.7.0-2022.06.13.01
// @author      Nuogz
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require     https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require     https://cdn.jsdelivr.net/npm/gbk.js@0.3.0/dist/gbk2.min.js
// @require     https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js
// @resource    notyf_css https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @match       *://*.bilibili.com/bangumi/play/*
// @match       *://*.bilibili.com/video/*
// ==/UserScript==

/* global Notyf, __INITIAL_STATE__, FFmpeg, GBK */


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
		vertical-align: top;
	}

	.nz-tmd-notify>.notyf__wrapper {
		padding-right: 0px;
	}

	.nz-tmd-notify progress {
		width: 100px;
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

	[nz-text-block] {
		text-align: right;
		overflow: hidden;
		white-space: nowrap;
	}
`);

const renderSize = function(value) {
	value = parseFloat(value);
	const index = Math.floor(Math.log(value) / Math.log(1024));

	return `${(value / Math.pow(1024, index)).toFixed(2).padStart(6, '0')} ${['By', 'KB', 'MB', 'GB'][index]}`;
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
<progress value="0" max="100"></progress>
<div class="inline prog">准备中...</div><br>
`;
const openDBox = text => {
	const random = (Math.random() * 1000).toFixed(0);
	const noty = notyf.open({
		type: 'tmd',
		message: `<div id="nz-tmd-dbox-${random}"><div class="title">${text} 准备中...</div><div class="down"></div></div>`
	});

	const dbox = document.querySelector(`#nz-tmd-dbox-${random}`);
	const boxTitle = dbox.querySelector('.title');
	const boxDown = dbox.querySelector('.down');

	const initer = (text, count) => {
		dbox.title = text;
		boxTitle.innerHTML = boxTitle.innerHTML.replace(' 准备中...', '');
		boxDown.innerHTML = domTextDBox.repeat(count);

		const progs = dbox.querySelectorAll('progress');
		const textsProg = dbox.querySelectorAll('.prog');
		const textsInfo = dbox.querySelectorAll('.info');

		return { progs, textsProg, textsInfo, };
	};

	return { noty, initer, boxTitle, boxDown };
};


const writeData = async (reader, handleWrite) => {
	let sizeRead = 0;
	let isWhile = true;

	while(isWhile) {
		const { done, value } = await reader.read();

		if(!done || sizeRead == 0) {
			await handleWrite(value, sizeRead, sizeRead += value.length);
		}
		else {
			isWhile = false;
		}
	}
};

// 最大文件 2046MB
const sizeArrayBufferMax = Math.pow(2, 31) - Math.pow(2, 21);
const sizeAudioMax = Math.pow(2, 27);
const sizeVideoMax = sizeArrayBufferMax - sizeAudioMax;
const symbolOverSize = Symbol('over-size');

const mb1 = 1024 * 1024;
const downloadMedia = async (url, name, nameSave, prog, textProg, isSaveDirect = false) => {
	try {
		const response = await fetch(url);
		const reader = response.body.getReader();


		const sizeTotal = +response.headers.get('Content-Length');

		prog.max = sizeTotal;
		textProg.innerHTML = `<div nz-text-block class="inline" style="width: 200px"></div>`.replace(/\t|\n/g, '');
		const textProgBlock = textProg.querySelector('[nz-text-block]');

		const updateProg = sizeRead => {
			if(sizeRead % mb1 == 0 || sizeRead == sizeTotal) {
				textProgBlock.innerHTML = `${name} ${renderSize(sizeTotal)} ${(sizeRead * 100 / sizeTotal).toFixed(2).padStart(5, '0')}%`;

				prog.value = sizeRead;
			}
		};



		if(!isSaveDirect && sizeTotal <= sizeVideoMax) {
			const datasMedia = new Uint8Array(sizeTotal);

			await writeData(reader, async (data, sizeRead, sizeReadAfter) => {
				datasMedia.set(data, sizeRead);

				updateProg(sizeReadAfter);
			});


			const a = document.createElement('a');
			a.classList.add('inline', 'save');
			a.innerHTML = '[保存]';
			a.download = nameSave;
			a.href = URL.createObjectURL(new Blob([datasMedia]));
			textProg.parentNode.insertBefore(a, textProg.nextElementSibling);


			console.log(`已下载: ${name}`);

			return datasMedia;
		}
		else {
			const a = document.createElement('a');
			a.classList.add('inline', 'save');
			a.innerHTML = '[保存]';
			a.download = nameSave;
			textProg.parentNode.insertBefore(a, textProg.nextElementSibling);
			a.addEventListener('click', async () => {
				const file = await unsafeWindow.showSaveFilePicker({ suggestedName: nameSave });

				if(!file) { throw '没有选择文件'; }


				const writable = await file.createWritable();

				await writeData(reader, async (data, sizeRead, sizeReadAfter) => {
					await writable.write(data);

					updateProg(sizeReadAfter);
				});

				await writable.close();


				console.log(`已保存: ${name}`);
			});


			return symbolOverSize;
		}
	}
	catch(error) {
		prog.hidden = true;

		const textProg_ = textProg;

		textProg_.innerHTML = `
			<div nz-text-block class="inline" style="width: 350px" title="${error.message || error}">${name} error, ${error.message || error}</div>
		`.replace(/\t|\n/g, '');

		throw error;
	}
};

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

	const state = __INITIAL_STATE__;

	const slot = state.bvid ||
		location.pathname.replace(/\/$/, '')
			.replace('/bangumi/play/', '')
			.replace('/video/', '');

	const title = state.h1Title ?? state?.videoData?.title ?? '未知标题';
	const uid = state?.upData?.mid ?? '0';

	const p = state?.p;
	const pages = state?.videoData?.pages;
	const part = pages?.find(page => page.page == p)?.part;

	const { noty, initer, boxTitle, boxDown } = openDBox(title);
	const { progs, textsProg } = initer('', 2);

	boxTitle.addEventListener('click', () => notyf.dismiss(noty));



	const urlVideo = video.baseUrl;
	const nameVideo = 'video.m4s';
	const nameVideoSave = `bilibili-${uid}-${slot}-${title}${pages.length > 1 ? `-p${p}-${part}` : ''}-video-${video.height}p.m4s`;

	const dataVideo = mediasFinal.video = await downloadMedia(urlVideo, nameVideo, nameVideoSave, progs[0], textsProg[0]);


	const urlAudio = audio.baseUrl;
	const nameAudio = 'audio.m4s';
	const nameAudioSave = `bilibili-${uid}-${slot}-${title}${pages.length > 1 ? `-p${p}-${part}` : ''}-audio.m4s`;

	mediasFinal.audio = await downloadMedia(urlAudio, nameAudio, nameAudioSave, progs[1], textsProg[1], dataVideo === symbolOverSize);


	const nameMixin = `bilibili-${uid}-${slot}-${title}${pages.length > 1 ? `-p${p}-${part}` : ''}-${video.height}p-${video.bandwidth}.mp4`;

	if(mediasFinal.video !== symbolOverSize && mediasFinal.audio !== symbolOverSize) {
		mixinMedia(nameMixin);
	}
	else {
		const script = `
		@echo off
		ffmpeg -y -v quiet -i ".\\${nameVideoSave}" -i ".\\${nameAudioSave}" -vcodec copy -acodec copy ".\\${nameMixin}"
		echo 混流 ${nameMixin}

		del ".\\${nameVideoSave}"
		del ".\\${nameAudioSave}"
		echo Done
		del %0`.replace(/\t/g, '').replace(/\n/g, '\r\n');

		const a = document.createElement('a');
		a.classList.add('inline', 'save');
		a.innerHTML = '[保存混流批处理]';
		a.download = `混流 ${nameMixin}.bat`;
		a.href = URL.createObjectURL(new Blob([new Uint8Array(GBK.encode(script))]));
		a.click();

		boxDown.appendChild(a);
	}
};


const initButton = () => {
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


let ffmpegLoad;
try {
	ffmpegLoad = FFmpeg.createFFmpeg({ log: false });
}
catch(error) { console.error(error.message ?? error); }

const ffmpeg = ffmpegLoad;


const mixinMedia = async nameFile => {
	ffmpeg.FS('writeFile', 'video.m4s', mediasFinal.video);
	ffmpeg.FS('writeFile', 'audio.m4s', mediasFinal.audio);

	await ffmpeg.run('-y', '-v', 'quiet', '-i', 'video.m4s', '-i', 'audio.m4s', '-vcodec', 'copy', '-acodec', 'copy', 'output.mp4');

	const dataFinal = ffmpeg.FS('readFile', 'output.mp4');

	const a = document.createElement('a');
	a.download = nameFile;
	a.href = URL.createObjectURL(new Blob([dataFinal]));
	a.click();

	console.log(`Saved: ${a.download}`);
};


(async () => {
	try {
		await ffmpeg.load();
	}
	catch(error) { console.error(error.message ?? error); }


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

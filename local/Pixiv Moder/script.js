// ==UserScript==
// @name         Pixiv Moder
// @description  新窗口Pixiv
// @version      0.3.1-2021.11.22.01
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *://www.pixiv.net/*
// ==/UserScript==

if(self == top) {
	const qs = function(selector) { return document.querySelector(selector); },
		qsa = function(selector) {
			const result = [], arr = document.querySelectorAll(selector);
			let i;

			for(i = 0; i < arr.length; i++) result.push(arr[i]);
			return result;
		};

	if(
		/bookmark_new_illust\.php/.test(location.pathname) ||
		/search\.php/.test(location.pathname) ||
		(/member_illust\.php/.test(location.pathname) && /id=/.test(location.search)) ||
		(/member_illust\.php/.test(location.pathname) && /mode=medium/.test(location.search)) ||
		false
	) {
		(function() {
			console.log('pm', 1, 'work');

			const itr = setInterval(function() {
				const aw = qsa('a.work');
				let i;

				if(!aw.length && !!qs('section#illust-recommend')) {
					console.log('pm', 1, 'nope');
					clearInterval(itr);
				}
				if(!aw.length) return;

				for(i in aw) aw[i].target = '_blank';

				clearInterval(itr);
				console.log('pm', 1, 'done');
			}, 1000);
		})();
	}

	if(
		/bookmark_new_illust\.php/.test(location.pathname) ||
		/search\.php/.test(location.pathname) ||
		(/member_illust\.php/.test(location.pathname) && /id=/.test(location.search)) ||
		false
	) {
		(function() {
			console.log('pm', 2, 'work');

			const itr = setInterval(function() {
				const awm = qsa('a.work.multiple');
				let i;

				if(!awm.length) return;

				for(i in awm)
					awm[i].href = awm[i].href.replace('medium', 'manga');

				clearInterval(itr);
				console.log('pm', 2, 'done');
			}, 1000);
		})();
	}

	if(
		(/member_illust\.php/.test(location.pathname) && /mode=medium/.test(location.search)) ||
		false
	) {
		(function() {
			console.log('pm', 3, 'work');

			const itr = setInterval(function() {
				const dwdd = qs('div.works_display>div'),
					umcb = qs('.ui-modal-close-box'),
					iori = qs('img.original-image');

				if(qs('canvas') || qs('a._work.multiple')) { console.log('pm', 3, 'nope'); clearInterval(itr); }
				if(!dwdd || !umcb || !iori) return;

				dwdd.click();

				if(umcb.style.display != 'block') return;

				iori.style.maxWidth = window.innerWidth + 'px';
				iori.style.maxHeight = window.innerHeight + 'px';
				iori.removeAttribute('width');
				iori.removeAttribute('height');

				clearInterval(itr);
				console.log('pm', 3, 'done');
			}, 1000);
		})();
	}
}
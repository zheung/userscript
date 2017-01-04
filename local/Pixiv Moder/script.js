// ==UserScript==
// @name         Pixiv Moder
// @description  新窗口Pixiv
// @version      0.2.1612312
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *www.pixiv.net/*
// ==/UserScript==

if(self == top) {
	if(
		/bookmark_new_illust\.php/.test(location.pathname) ||
		/search\.php/.test(location.pathname) ||
		/member_illust\.php/.test(location.pathname) ||
		(/member_illust\.php/.test(location.pathname) && /mode=medium/.test(location.search)) ||
		false
	) {
		(function() {
			console.log('pm', 1, 'work');

			var itr = setInterval(function() {
				var aw = document.querySelectorAll('a.work'), i;

				if(document.querySelector('canvas')) { console.log('pm', 1, 'nope'); clearInterval(itr); }
				if(!aw.length) return;

				for(i=0; i<aw.length; i++) aw[i].target = '_blank';

				clearInterval(itr);
				console.log('pm', 1, 'done');
			}, 1000);
		})();
	}

	if(
		/bookmark_new_illust\.php/.test(location.pathname) ||
		/search\.php/.test(location.pathname) ||
		/member_illust\.php/.test(location.pathname) ||
		false
	) {
		(function() {
			console.log('pm', 2, 'work');

			var itr = setInterval(function() {
				var awm = document.querySelectorAll('a.work.multiple'), i;

				if(!awm.length && !!document.querySelector('div.works_display')) { console.log('pm', 2, 'nope'); clearInterval(itr); }
				if(!awm.length) return;

				for(i=0; i<awm.length; i++)
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

			var itr = setInterval(function() {
				var dwdd = document.querySelector('div.works_display>div'),
					umcb = document.querySelector('.ui-modal-close-box'),
					iori = document.querySelector('img.original-image');

				if(!!(document.querySelector('canvas') || document.querySelector('a._work.multiple'))) { console.log('pm', 3, 'nope'); clearInterval(itr); }
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
// ==UserScript==
// @name        bilibili-live-highest-quality-stream-select.user
// @description 2023.08.17.10
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       none
// @match       *://live.bilibili.com/*
// ==/UserScript==



; (function() {
	function process() {
		try {
			const livePlayer = document.querySelector('#live-player');
			livePlayer.dispatchEvent(new Event('mousemove'));
			const qualityWrap = livePlayer.querySelector('.quality-wrap');
			const observer = new MutationObserver(mutations => {
				mutations.some(mutation => {
					try {
						debugger;
						const qualities = mutation.target.querySelectorAll('.list-it');
						if(qualities.length) {
							qualities[0].click();
							livePlayer.dispatchEvent(new Event('mouseleave'));
							return true;
						}
						return false;
					} catch(e) {
						console.error(e);
						return false;
					} finally {
						observer.disconnect();
					}
				});
			});
			observer.observe(qualityWrap, { childList: true, subtree: true });
			qualityWrap.dispatchEvent(new Event('mouseenter'));
		} catch(e) {
			console.error(e);
		}
	}

	function live() {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if(node.nodeName === 'VIDEO') {
						window.setTimeout(process, 600);
						observer.disconnect();
					}
				});
			});
		});
		observer.observe(document, { childList: true, subtree: true });
	}

	live();
})();

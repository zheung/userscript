// ==UserScript==
// @name        bilibili-live-highest-quality-stream-select
// @description 2023.08.17.15
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       none
// @match       *://live.bilibili.com/*
// ==/UserScript==



(async () => {
	const bestify = () => {
		try {
			const domLivePlayer = document.querySelector('#live-player');

			domLivePlayer.dispatchEvent(new Event('mousemove'));


			const domQualityWrap = domLivePlayer.querySelector('.quality-wrap');


			const observerBestify = new MutationObserver(mutations => {
				mutations.some(mutation => {
					try {
						const domsQuality = mutation.target.querySelectorAll('.list-it');

						if(domsQuality.length) {
							domsQuality[0].click();

							domsQuality[0].dispatchEvent(new Event('mouseleave'));
							domLivePlayer.dispatchEvent(new Event('mouseleave'));

							return true;
						}

						return false;
					} catch(error) {
						globalThis.console.error(error);

						return false;
					} finally {
						observerBestify.disconnect();
					}
				});
			});
			observerBestify.observe(domQualityWrap, { childList: true, subtree: true });

			domQualityWrap.dispatchEvent(new Event('mouseenter'));
		}
		catch(error) {
			globalThis.console.error(error);
		}
	};



	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if(node.nodeName == 'VIDEO') {
					window.setTimeout(bestify, 1000 * 0.7);

					observer.disconnect();
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();

// ==UserScript==
// @name        bilibili-auto-fullview
// @description 2025.07.03 19
// @namespace   https://danor.app/
// @version     1.0.0
// @author      DanoR
// @grant       none
// @match       *://www.bilibili.com/video/*
// @noframes
// ==/UserScript==



(async () => {
	const handle = async () => {
		try {
			let elButtom;

			while(!elButtom) {
				elButtom = document.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-web');

				if(elButtom) { elButtom.click(); }

				const { promise, resolve } = Promise.withResolvers();
				setTimeout(resolve, 500); await promise;
			}
		}
		catch(error) {
			globalThis.console.error(error);
		}
	};



	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(/** @param {HTMLElement} node */ node => {
				if(node.nodeName == 'DIV' && node.classList.contains('bpx-player-ctrl-btn') && node.classList.contains('bpx-player-ctrl-web')) {
					window.setTimeout(handle, 1000 * 0.7);

					observer.disconnect();
				}
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();

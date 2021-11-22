// ==UserScript==
// @name         FormHelper
// @description  填表助手
// @version      0.0.0
// @namespace    DanoR Script
// @author       DanoR
// @run-at       document-end
// @grant        none
// @include      *
// ==/UserScript==

if(self == top) {
	(function() {
		console.log('FromHelper Gogo');

		const itr = setInterval(function() {
			const u = document.querySelector('input.pass-text-input-userName'), p = document.querySelector('input.pass-text-input-password');

			if(!u) return;


			const xhr = new XMLHttpRequest();

			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4 && xhr.status == 200) {
					const r = JSON.parse(xhr.responseText);

					u.value = r.u;
					p.value = r.p;
				}
			};

			xhr.open('GET', 'http://localhost/fh/pwd?c=danor&d=' + location.host, true);
			xhr.send();

			clearInterval(itr);
			console.log('FromHelper Done');
		}, 500);
	})();
}

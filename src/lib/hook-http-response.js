export function hookFetch(tester, handleResponse) {
	const fetchVanilla = unsafeWindow.fetch;


	unsafeWindow.fetch = async function(url) {
		const response = await fetchVanilla.apply(this, arguments);

		if(tester(url, arguments)) {
			handleResponse(response.clone(), arguments);
		}

		return response;
	};
}


export function hookXHR(tester, handle) {
	const openXHRProto = XMLHttpRequest.prototype.open;
	const sendXHRProto = XMLHttpRequest.prototype.send;


	XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
		if(tester(url, method)) {
			this.$hooked = true;
			this.$url = url;
			this.$method = method;
		}


		return openXHRProto.apply(this, arguments);
	};

	XMLHttpRequest.prototype.send = function() {
		if(this.$hooked) {
			const oldOnReady = this.onreadystatechange;


			this.onreadystatechange = function() {
				if(this.readyState === 4 && this.status === 200) {
					handle(this.responseText, this.$url);
				}
				return oldOnReady.apply(this, arguments);
			};
		}


		return sendXHRProto.apply(this, arguments);
	};
}

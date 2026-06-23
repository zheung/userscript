/** @import { XHRHookTester, XHRHookHandle, XHRHook, HookXHROption, FetchHookTester, FetchHookHandle, FetchHook, HookedFetch } from './hook-http-response.d.ts' */



/**
 * 安装 Fetch 钩子
 *
 * 拦截页面所有 fetch 请求，当 tester 返回 true 时调用 handle。
 * 首次调用会替换 unsafeWindow.fetch，后续调用只追加钩子到列表末尾。
 *
 * @param {FetchHookTester} tester
 * @param {FetchHookHandle} handle
 * @returns {HookedFetch}
 */
export function hookFetch(tester, handle) {
	let fetch = unsafeWindow.fetch;

	if(!fetch.hooks) {
		const fetchVanilla = fetch;
		const hooks = [];

		const fetchHook = async function(url) {
			const response = await fetchVanilla.apply(this, arguments);

			// eslint-disable-next-line no-shadow
			for(const { tester, handle } of hooks) {
				if(tester(url, arguments)) {
					handle(response.clone(), arguments, hooks);
				}
			}

			return response;
		};
		fetchHook.fetchVanilla = fetchVanilla;
		fetchHook.hookFetch = hookFetch;
		fetchHook.hooks = hooks;


		fetch = unsafeWindow.fetch = fetchHook;
	}

	fetch.hooks.push({ tester, handle });


	return fetch;
}


const XMLHttpRequestVanilla = XMLHttpRequest;

/**
 * XMLHttpRequest 代理类
 *
 * 通过 Proxy 包装原生 XMLHttpRequest，在属性 getter 中注入钩子逻辑。
 * 首次调用 hookXHR 时会替换全局 XMLHttpRequest 为此类。
 *
 * 代理实例上会附加以下元数据：
 * - `$open`: `{ method, url, async, username, password }`
 * - `$bodySend`: send() 传入的 body
 */
class XMLHttpRequestHook {
	/** @type {XHRHook[]} */
	static hooks = [];

	constructor() {
		const xhr = new XMLHttpRequestVanilla(...arguments);

		const proxy = new Proxy(xhr, {
			get(target, prop) {
				const value = target[prop];

				if(typeof value == 'function') {
					if(prop == 'open') {
						return function open(method, url, async, username, password) {
							target.$open = { method, url, async, username, password };

							return target.open(method, url, async, username, password);
						};
					}

					if(prop == 'send') {
						return function send(body) {
							target.$bodySend = body;

							return target.send(body);
						};
					}


					return value.bind(target);
				}


				if(prop == 'responseText' || prop == 'response') {
					const hooks = XMLHttpRequestHook.hooks;

					for(const hook of hooks) {
						const {
							tester, handle,
							prop: propHook = 'responseText',
							readyState = 4,
							status = 200,
							willUpdate = false,
							once = false,
						} = hook;


						if(prop != propHook) { continue; }
						if(target.readyState != readyState || target.status != status) { continue; }

						const { method, url, async, username, password } = target.$open ?? {};

						if(!tester(url, method, async, username, password, target.$bodySend, target)) { continue; }


						if(once) { hooks.splice(hooks.findIndex(h => h === hook), 1); }

						if(willUpdate) { return handle(target[prop], target); }

						setTimeout(() => handle(target[prop], target), 0);


						return target[prop];
					}
				}


				return value;
			},
			set(target, prop, value) {
				target[prop] = value;

				return true;
			}
		});


		return proxy;
	}
}

/**
 * 安装 XHR 钩子
 *
 * 通过 Proxy 代理 XMLHttpRequest 来拦截所有 XHR 请求。
 * 首次调用会替换 unsafeWindow.XMLHttpRequest，后续调用只追加钩子到列表末尾。
 *
 * @param {XHRHookTester} tester
 * @param {XHRHookHandle} handle
 * @param {HookXHROption} [options={}]
 */
export function hookXHR(tester, handle, options = {}) {
	if(!XMLHttpRequest.hooks) { unsafeWindow.XMLHttpRequest = XMLHttpRequestHook; }


	XMLHttpRequestHook.hooks.push({ tester, handle, ...options });
}

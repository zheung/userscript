/**
 * Fetch 钩子 — 测试函数
 *
 * 在每次 fetch 请求返回后调用，返回 `true` 时触发对应的 handle。
 *
 * @param url  - fetch 的第一个参数（URL 字符串或 Request 对象）
 * @param args - fetch 调用时的原始 arguments 对象
 */
export type FetchHookTester = (
	url: RequestInfo | URL,
	args: IArguments,
) => boolean;


/**
 * Fetch 钩子 — 处理函数
 *
 * tester 返回 true 时被调用。
 *
 * @param response - fetch 响应的克隆副本，可安全读取 body
 * @param args     - fetch 调用时的原始 arguments
 * @param hooks    - 当前所有钩子列表，可用于自移除等操作
 */
export type FetchHookHandle = (
	response: Response,
	args: IArguments,
	hooks: FetchHook[],
) => void | Promise<void>;


/** Fetch 钩子对象 */
export interface FetchHook {
	tester: FetchHookTester;
	handle: FetchHookHandle;
}


/**
 * 被 hookFetch 增强后的 fetch 函数
 *
 * 在原生 fetch 上挂载了钩子管理相关属性，同时保持与原生 fetch 相同的调用签名。
 */
export interface HookedFetch {
	(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
	/** 原始未被修改的 fetch */
	fetchVanilla: typeof fetch;
	/** 用于追加钩子的 hookFetch 自身引用 */
	hookFetch: typeof hookFetch;
	/** 当前已注册的钩子列表 */
	hooks: FetchHook[];
}



/**
 * XHR 钩子 — 测试函数
 *
 * 在 XHR readyState / status 满足条件时调用，返回 `true` 时触发对应的 handle。
 *
 * @param url      - open() 的 url 参数
 * @param method   - open() 的 method 参数
 * @param async    - open() 的 async 参数
 * @param username - open() 的 username 参数
 * @param password - open() 的 password 参数
 * @param body     - send() 的 body 参数
 * @param xhr      - 原始 XMLHttpRequest 实例
 */
export type XHRHookTester = (
	url: Parameters<XMLHttpRequest['open']>[1],
	method: Parameters<XMLHttpRequest['open']>[0],
	async: Parameters<XMLHttpRequest['open']>[2],
	username: Parameters<XMLHttpRequest['open']>[3],
	password: Parameters<XMLHttpRequest['open']>[4],
	body: Parameters<XMLHttpRequest['send']>[0],
	xhr: XMLHttpRequest,
) => boolean;


/**
 * XHR 钩子 — 处理函数
 *
 * tester 返回 true 时被调用。
 *
 * - 当 `willUpdate=true` 时，返回值将替换原始响应值（同步模式）
 * - 当 `willUpdate=false` 时，通过 setTimeout 异步调用，返回值无意义
 *
 * @param value  - 当前响应值（responseText 或 response）
 * @param target - 原始 XMLHttpRequest 实例
 * @returns willUpdate 为 true 时，返回新值替换原值；否则返回值被忽略
 */
export type XHRHookHandle = (
	value: XMLHttpRequest['responseText'] | XMLHttpRequest['response'],
	target: XMLHttpRequest,
) => XMLHttpRequest['responseText'] | XMLHttpRequest['response'] | void;


/** XHR 钩子对象 */
export interface XHRHook {
	tester: XHRHookTester;
	handle: XHRHookHandle;
	/** 要拦截的属性名 @default 'responseText' */
	prop?: string;
	/** 触发 readyState @default 4 (DONE) */
	readyState?: number;
	/** 触发 HTTP 状态码 @default 200 */
	status?: number;
	/** 是否替换原值（handle 返回值作为新值） @default false */
	willUpdate?: boolean;
	/** 触发一次后自动移除 @default false */
	once?: boolean;
}


/** XHR 钩子选项（hookXHR 的 options 参数类型） */
export interface HookXHROption {
	prop?: XHRHook['prop'];
	readyState?: XHRHook['readyState'];
	status?: XHRHook['status'];
	willUpdate?: XHRHook['willUpdate'];
	once?: XHRHook['once'];
}



/**
 * 安装 Fetch 钩子
 *
 * 拦截页面所有 fetch 请求，当 tester 返回 true 时调用 handle。
 * **首次调用**会替换 `unsafeWindow.fetch`，后续调用只追加钩子到列表末尾。
 *
 * @param tester - 测试函数，返回 `true` 时触发处理
 * @param handle - 处理函数，接收响应的克隆副本
 * @returns 增强后的 fetch 函数（可继续追加钩子）
 *
 * @example
 * ```js
 * hookFetch(
 *   url => url.includes('/api/target'),
 *   async (response, args, hooks) => {
 *     const data = await response.json();
 *     console.log(data);
 *   }
 * );
 * ```
 */
export function hookFetch(
	tester: FetchHookTester,
	handle: FetchHookHandle,
): HookedFetch;


/**
 * 安装 XHR 钩子
 *
 * 通过 Proxy 代理 XMLHttpRequest 构造函数来拦截所有 XHR 请求。
 * **首次调用**会替换 `unsafeWindow.XMLHttpRequest`，后续调用只追加钩子到列表末尾。
 *
 * @param tester  - 测试函数，返回 `true` 时触发处理
 * @param handle  - 处理函数，处理响应值
 * @param options - 可选配置
 *
 * @example
 * ```js
 * // 修改 JSON 响应
 * hookXHR(
 *   url => url.includes('/api/data'),
 *   responseText => {
 *     const data = JSON.parse(responseText);
 *     data.injected = true;
 *     return JSON.stringify(data);
 *   },
 *   { willUpdate: true }
 * );
 *
 * // 只读不修改
 * hookXHR(
 *   url => url.includes('/api/log'),
 *   responseText => console.log(JSON.parse(responseText))
 * );
 * ```
 */
export function hookXHR(
	tester: XHRHookTester,
	handle: XHRHookHandle,
	options?: HookXHROption,
): void;


/**
 * XMLHttpRequest 代理类
 *
 * 通过 Proxy 包装原生 XMLHttpRequest，在属性访问 getter 中注入钩子逻辑。
 * 首次调用 hookXHR 时会替换全局 `XMLHttpRequest` 为此类。
 *
 * 代理实例上会附加以下元数据：
 * - `$open`: `{ method, url, async, username, password }` — open() 调用参数
 * - `$bodySend`: send() 传入的 body
 */
export class XMLHttpRequestHook {
	/** 全局钩子注册表，所有代理实例共享 */
	static hooks: XHRHook[];
	constructor();
}

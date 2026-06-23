/**
 * 流读取回调
 *
 * @param data           - 当前读取到的数据块
 * @param sizeReadAfter  - 本次读取后累计字节数
 * @param sizeReadBefore - 本次读取前累计字节数
 */
export type ReadReaderHandle = (
	data: Uint8Array,
	sizeReadAfter: number,
	sizeReadBefore: number,
) => Promise<void>;


/** 文件数据获取选项 */
export interface FetchFileDataOption {
	/** 文件预期大小（预知时传入可避免分片合并开销） */
	size?: number;
	/** 保存时的文件名 */
	nameSave?: string;
	/** 获取完成后是否立即触发下载 @default false */
	willSaveNow?: boolean;
	/**
	 * 进度回调
	 * @param sizeRead - 当前已读取字节数
	 */
	atProgress?: (sizeRead: number, url: string, options: FetchFileDataOption) => void;
	/**
	 * 完成回调
	 * @param data - 完整的文件 Uint8Array 数据
	 */
	atFinish?: (data: Uint8Array, url: string, options: FetchFileDataOption) => void;
	/** 错误回调 */
	atError?: (error: Error, url: string, options: FetchFileDataOption) => void;
}



/**
 * 查询单个元素
 * @param selector - CSS 选择器
 * @param element  - 搜索根元素 @default document
 * @returns 匹配的第一个元素，无匹配时返回 null
 */
export function querySelector(selector: string, element?: Document | Element): Element | null;


/**
 * 查询所有匹配元素
 * @param selector - CSS 选择器
 * @param element  - 搜索根元素 @default document
 * @returns 匹配的元素数组（始终为数组，无匹配时为空数组）
 */
export function querySelectorAll(selector: string, element?: Document | Element): Element[];



/**
 * 通过创建 \<a\> 标签触发文件下载
 * @param url  - 文件 URL
 * @param name - 保存文件名
 */
export function saveFile(url: string, name?: string): void;

/**
 * 创建一个预配置的保存链接元素
 *
 * 该元素带有 `saver` 属性标记，可配合 saveFile 使用。
 *
 * @param download  - download 属性（文件名）
 * @param href      - 链接地址
 * @param innerHTML - 链接内部 HTML @default ''
 * @param title     - title 属性（悬停提示）
 */
export function createSaveLink(
	download?: string,
	href?: string,
	innerHTML?: string,
	title?: string,
): HTMLAnchorElement;



/**
 * 获取远程文件大小（通过 HEAD 或 GET + Content-Length）
 * @param url - 文件 URL
 * @returns 文件字节数
 */
export function fetchFileSize(url: string): Promise<number>;

/**
 * 逐块读取 ReadableStream
 *
 * 持续读取直到流结束，每读取一块数据就调用一次 handle。
 *
 * @param reader - 流读取器
 * @param handle - 每块数据的回调
 */
export function readReader(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	handle: ReadReaderHandle,
): Promise<void>;

/**
 * 获取远程文件完整数据
 *
 * 根据是否预知文件大小自动选择最优策略：
 * - 有 `options.size` → 预分配 Uint8Array 一次写入（零拷贝）
 * - 无 `options.size` → 分片收集后合并
 *
 * @param url     - 文件 URL
 * @param options - 可选配置（大小、回调等）
 * @returns 文件完整二进制数据
 *
 * @example
 * ```js
 * // 已知大小 — 高性能模式
 * const data = await fetchFileData(url, {
 *   size: await fetchFileSize(url),
 *   atProgress: (read, url, opt) => console.log(`${read} / ${opt.size}`),
 * });
 *
 * // 未知大小 — 分片模式
 * const data = await fetchFileData(url, {
 *   willSaveNow: true,
 *   nameSave: 'file.bin',
 * });
 * ```
 */
export function fetchFileData(
	url: string,
	options?: FetchFileDataOption,
): Promise<Uint8Array>;

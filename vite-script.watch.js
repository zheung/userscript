import { C } from '@nuogz/pangu/index.js?config=_';

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import pluginVue from '@vitejs/plugin-vue';
import pluginUno from 'unocss/vite';



if('2' in process.argv == false) { throw Error('缺少目标脚本参数'); }


const dirWorking = process.cwd();
const fileScript = process.argv[2];
const pathScript = resolve(dirWorking, fileScript);
const pathParsedScript = parse(pathScript);


const textScript = readFileSync(pathScript, 'utf-8');
const nameMetaScript = textScript.match(/==UserScript==.*(?:@name +(.+?)\n).*==\/UserScript==/ms)?.[1];

globalThis.console.log('脚本文件', pathParsedScript.base);
globalThis.console.log('脚本名称', nameMetaScript);



const dirPackage = fileURLToPath(new URL('.', import.meta.url));
const pathEntry = resolve(dirPackage, 'src', 'index.html');
writeFileSync(pathEntry,
	readFileSync(pathEntry, 'utf-8').replace(
		/src=".*?"/,
		`src="${relative(parse(pathEntry).dir, pathScript).replaceAll('\\', '\\\\')}"`
	)
);



/** @type {import('vite').Rollup.OutputPluginOption} */
const pluginUserscriptMixin = {
	name: 'rollup-plugin-userscript-mixin',
	generateBundle: {
		order: 'post',
		handler(options, bundle) {
			const outputs = Object.values(bundle);
			for(const key in bundle) { delete bundle[key]; }

			let code = outputs.find(o => o.name == 'index' && o.code)?.code;

			const assetStyle = outputs.find(o => o.fileName?.endsWith('.css') && o.source);
			if(assetStyle) { code = `\nGM_addStyle(\`${assetStyle.source.trim()}\`);\n${code}`; }


			if(code) {
				this.emitFile({
					type: 'prebuilt-chunk',
					fileName: `${nameMetaScript}.user.js`,
					code
				});
			}
		}
	}
};



/** @type {import('vite').Rollup.RollupWatcher} */
const watcherRollup = await build({
	mode: 'production',
	clearScreen: false,
	plugins: [
		pluginUno(),
		pluginVue({
			template: {
				compilerOptions: {
					isCustomElement: tag => /^((module-|comp-|p-).+?|module)$/.test(tag)
				}
			}
		})
	],
	root: resolve(dirPackage, 'src'),
	base: './',
	build: {
		target: 'esnext',
		minify: false,
		modulePreload: { polyfill: false },
		write: false,
		watch: { include: [fileScript] },
		outDir: C.dirDist,
		emptyOutDir: false,
		rollupOptions: {
			output: { plugins: [pluginUserscriptMixin] }
		}
	},
	optimizeDeps: {
		esbuildOptions: { target: 'esnext' }
	},
});

watcherRollup.on('event', event => {
	if(event.code == 'BUNDLE_START') { return globalThis.console.log('脚本构建开始'); }
	if(event.code != 'BUNDLE_END') { return; }

	globalThis.console.log('脚本构建完成');

	const url = `http://userscript.localhost/${nameMetaScript}.user.js`;
	globalThis.console.log('本地安装地址', url);

	if(C.openLink && C.pathChrome) { spawnSync(C.pathChrome, [url]); }
});

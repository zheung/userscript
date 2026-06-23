import { C } from '@nuogz/pangu/index.js?config=_';

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import pluginVue from '@vitejs/plugin-vue';
import pluginUno from 'unocss/vite';



if('2' in process.argv == false) { throw Error('缺少目标脚本参数'); }


const dirnWorking = process.cwd();
const fileScript = process.argv[2];
const pathScript = resolve(dirnWorking, fileScript);
const pathParsedScript = parse(pathScript);


const textScript = readFileSync(pathScript, 'utf-8');
const meta = textScript.match(/\/\/ ==UserScript==.*?==\/UserScript==/ms)?.[0]?.trim();
const nameMetaScript = meta.match(/==UserScript==.*(?:@name +(.+?)\n).*==\/UserScript==/ms)?.[1];

globalThis.console.log('脚本文件', pathParsedScript.base);
globalThis.console.log('脚本名称', nameMetaScript);
globalThis.console.log('脚本Meta');
globalThis.console.log(meta);


const dirnPackage = fileURLToPath(new URL('.', import.meta.url));
const pathEntry = resolve(dirnPackage, 'src', 'index.html');
writeFileSync(pathEntry,
	readFileSync(pathEntry, 'utf-8').replace(
		/src=".*?"/,
		`src="${relative(parse(pathEntry).dir, pathScript).replaceAll('\\', '\\\\')}"`
	)
);


const { output: outputs } = await build({
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
	root: resolve(dirnPackage, 'src'),
	base: './',
	build: {
		target: 'esnext',
		minify: false,
		modulePreload: { polyfill: false },
		write: false,
	},
});



let code = outputs.find(o => o.name == 'index' && o.code)?.code;

const codeStyle = outputs.find(o => o.fileName?.endsWith('.css') && o.source);
if(codeStyle) { code = `\nGM_addStyle(\`${codeStyle.source.trim()}\`);\n` + code; }


if(code) {
	code = `${meta}\n${code}`;

	writeFileSync(resolve(C.dirnDist, `${nameMetaScript}.user.js`), code);
}

const url = `http://userscript.localhost/${nameMetaScript}.user.js`;
globalThis.console.log('本地安装地址', url);

if(C.openLink && C.pathChrome) { spawnSync(C.pathChrome, [url]); }

import { C } from '@nuogz/pangu/index.js?config=_';

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

import { rollup } from 'rollup';
import pluginSASS from 'rollup-plugin-sass';
import { string as pluginString } from 'rollup-plugin-string';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';
import pluginReplace from '@rollup/plugin-replace';
import pluginCommonjs from '@rollup/plugin-commonjs';

import postcss from 'postcss';
import pluginUNOPostCSS from '@unocss/postcss';
import postcssPrefixSelector from 'postcss-prefix-selector';


if('2' in process.argv == false) { throw Error('缺少目标脚本参数'); }


const cwd = process.cwd();
const fileInput = process.argv[2];
const pathInput = resolve(cwd, fileInput);
const pathParsedInput = parse(pathInput);

const textInput = readFileSync(pathInput, 'utf-8');
const nameMetaInput = textInput.match(/==UserScript==.*(?:@name +(.+?)\n).*==\/UserScript==/ms)?.[1];

const pathOutput = resolve(C.dirDist, `${nameMetaInput}.user.js`);

globalThis.console.log('目标脚本', pathParsedInput.base);
globalThis.console.log('脚本名称', nameMetaInput);

const bundle = await rollup({
	input: pathInput,
	plugins: [
		pluginSASS({
			api: 'modern',
			output: false,
			processor: (css, from) => postcss([
				pluginUNOPostCSS(),
				postcssPrefixSelector({
					prefix: `danor-${nameMetaInput}`,
					transform: (prefix, selector, prefixedSelector) =>
						['html', 'body'].includes(selector) ? prefix : prefixedSelector
				}),
			])
				.process(css, { from })
				.then(result => result.css),
		}),
		pluginString({
			include: '**/*.html',
		}),
		pluginNodeResolve(),
		pluginCommonjs(),
		pluginReplace({
			'preventAssignment': true,
			'process.env.NODE_ENV': JSON.stringify('production'),
		})
	]
});

const output = await bundle.write({ file: pathOutput, format: 'esm', generatedCode: 'es2015', inlineDynamicImports: true });


if(output.output.length) {
	// 出现因上一段代码不规范，导致两段代码连在一起的情况，故追加换行符到文件头中
	writeFileSync(pathOutput, '\n' + readFileSync(pathOutput, 'utf-8'));

	spawnSync(C.pathChrome, [`http://userscript.localhost/${parse(pathOutput).base}`]);
}

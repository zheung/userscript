import './rollup-script.env.js';
import { C } from '@nuogz/pangu';

import { spawnSync } from 'child_process';
import { parse, resolve } from 'path';

import { rollup } from 'rollup';



if('2' in process.argv == false) { throw Error('缺少目标脚本参数'); }


const cwd = process.cwd();
const fileInput = process.argv[2];
const pathInput = resolve(cwd, fileInput);
const infoInput = parse(pathInput);

const pathOutput = resolve(C.dirDist, infoInput.base);


globalThis.console.log('目标脚本', infoInput.base);


const bundle = await rollup({ input: pathInput });

const output = await bundle.write({ file: pathOutput, format: 'esm' });


if(output.output.length) {
	spawnSync(C.pathChrome, [pathOutput]);
}

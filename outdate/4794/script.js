// ==UserScript==
// @name         Bangumi.tv(Bangumi 番组计划) HomePage Anime Chinese-Name Shower
// @description  Bangumi.tv(Bangumi 番组计划)-首页-动画-中文名称-显示-不智能
// @version      0.4.1504201354
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      http://bangumi.tv/
// @include      http://bgm.tv/
// ==/UserScript==

//替换数据
var wordsName =
	{
	//	'':'',
	//	15年04月番
		'ジョジョの奇妙な冒険 スターダストクルセイダース エジプト編':'JOJO的奇妙冒险 星尘斗士 埃及篇',
	//	14年10月番
		'ワールドトリガー':'境界触发者',
	//	长篇
		'ドラゴンボール改 魔人ブウ編':'龙珠改 魔人布欧篇',
		'ONE PIECE':'海贼王',
	//	旧番
		'ツバサ・クロニクル 第2シリーズ':'翼·年代记 第二部'
	};
//替换代码
var as = document.querySelectorAll('div.tinyHeader>a:nth-of-type(2)');
var spans = document.querySelectorAll('li.clearit[subject_type=\'2\']>a.subjectItem.title>span');
var as2 = document.querySelectorAll('div.clearit[subject_type=\'2\']>div.header.clearit>div.headerInner>h3>a.l');

var i;

for(i=0; i<as.length; i++)
	if(wordsName[as[i].innerHTML]) {
		as[i].innerHTML = wordsName[as[i].innerHTML];
		spans[i].innerHTML = wordsName[spans[i].innerHTML];
		as2[i].innerHTML = wordsName[as2[i].innerHTML];
	}
// ==UserScript==
// @name         Bangumi.tv(Bangumi 番组计划) HomePage Anime Chinese-Name Shower
// @description  Bangumi.tv(Bangumi 番组计划)-首页-动画-中文名称-显示-不智能
// @version      0.4.1411130339
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      http://bangumi.tv/
// @include      http://bgm.tv/
// ==/UserScript==

//替换数据
var words =
{
//	"":"",
//	14年10月番
	"弱虫ペダル GRANDE ROAD":"飙速宅男 GRANDE ROAD",
	"旦那が何を言っているかわからない件":"关于完全听不懂老公在说什么的事",
	"愛・天地無用!":"爱·天地无用!",
	"デンキ街の本屋さん":"电器街的漫画店",
//	14年07月番
	"PSYCHO-PASS サイコパス 新編集版":"心理测量者 新编集版",
	"ソードアート・オンラインII":"刀剑神域 第二季",
	"白銀の意思 アルジェヴォルン":"白银的意志",
	"アカメが斬る!":"斩·赤红之瞳!",
	"フランチェスカ":"法兰雀丝卡",
	"ヤマノススメ セカンドシーズン":"向山进发 第二季",
//	长篇
	"ドラゴンボール改 魔人ブウ編":"龙珠改 魔人布欧篇",
	"FAIRY TAIL 新シリーズ":"妖精的尾巴 第二期",
	"美少女戦士セーラームーンCrystal":"美少女战士 Crystal",
	"ONE PIECE":"海贼王"
};
//替换代码
var as = document.querySelectorAll("div.tinyHeader>a:nth-of-type(2)");
var spans = document.querySelectorAll("li.clearit[subject_type=\"2\"]>a.subjectItem.title>span");
var as2 = document.querySelectorAll("div.clearit[subject_type=\"2\"]>div.header.clearit>div.headerInner>h3>a.l");

for(i=0; i<as.length; i++)
	if(words[as[i].innerHTML])
	{
		as[i].innerHTML = words[as[i].innerHTML];
		spans[i].innerHTML = words[spans[i].innerHTML];
		as2[i].innerHTML = words[as2[i].innerHTML];
	}
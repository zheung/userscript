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
//	"":"",
//	15年04月番
	"ベイビーステップ 第2シリーズ":"网球优等生 第二季",
	"やはり俺の青春ラブコメはまちがっている。続":"我的青春恋爱物语果然有问题 续",
	"旦那が何を言っているかわからない件 2スレ目":"关于完全听不懂老公在说什么的事 第二季",
	"ハロー!!きんいろモザイク":"Hello!! 黄金拼图",
	"VAMPIRE HOLMES":"吸血鬼福尔摩斯",
	"電波教師":"电波教师",
	"SHOW BY ROCK!!":"Show By Rock!!",
	"アルスラーン戦記":"亚尔斯兰战记",
	"ダンジョンに出会いを求めるのは間違っているだろうか":"在地下城寻求邂逅是否搞错了什么",
	"ハイスクールD×D BorN":"High School D×D BorN",
	"終わりのセラフ":"终结的炽天使",
	"ガンスリンガーストラトス":"枪神斯托拉塔斯",
	"プラスティック・メモリーズ":"可塑性记忆",
	"血界戦線":"血界战线",
	"境界のRINNE":"境界的轮回",
	"響け!ユーフォニアム":"吹响！上低音号",
	"レーカン!":"灵感少女",
	"俺物語!!":"俺物语!!",
	"トリアージX":"绝命制裁X",
	"高宮なすのです! 〜てーきゅうスピンオフ〜":"我是高宫茄乃",
	"てーきゅう 4期":"网球并不可笑嘛 第四季",
	"ミカグラ学園組曲":"御神乐学园组曲",
	"浦和の調ちゃん":"浦和小调",
	"えとたま":"干支魂",
	"シドニアの騎士 第九惑星戦役":"希德尼娅的骑士 第九行星战役",
	"パンチライン":"Punch Line",
	"放課後のプレアデス":"放学后的昴星团",
	"山田くんと7人の魔女":"山田君与7个魔女",
	"聖闘士星矢 黄金魂 -soul of gold-":"圣斗士星矢 黄金魂",
//	15年01月番
	"ぱんきす!2次元":"PUNKISS！2次元",
	"黒子のバスケ 第3期":"黑子的篮球 第三季",
	"ジョジョの奇妙な冒険 スターダストクルセイダース エジプト編":"JOJO的奇妙冒险 星尘斗士 埃及篇",
//	14年10月番
	"ワールドトリガー":"境界触发者",
//	长篇
	"ドラゴンボール改 魔人ブウ編":"龙珠改 魔人布欧篇",
	"FAIRY TAIL 新シリーズ":"妖精的尾巴 第二期",
	"美少女戦士セーラームーンCrystal":"美少女战士 Crystal",
	"ONE PIECE":"海贼王",
//	旧番
	"ツバサ・クロニクル 第2シリーズ":"翼·年代记 第二部"
};
//替换代码
var as = document.querySelectorAll("div.tinyHeader>a:nth-of-type(2)");
var spans = document.querySelectorAll("li.clearit[subject_type=\"2\"]>a.subjectItem.title>span");
var as2 = document.querySelectorAll("div.clearit[subject_type=\"2\"]>div.header.clearit>div.headerInner>h3>a.l");

for(i=0; i<as.length; i++)
	if(wordsName[as[i].innerHTML])
	{
		as[i].innerHTML = wordsName[as[i].innerHTML];
		spans[i].innerHTML = wordsName[spans[i].innerHTML];
		as2[i].innerHTML = wordsName[as2[i].innerHTML];
	}
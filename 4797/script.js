// ==UserScript==
// @name         Forum(Discuz! X) Base-Profile One-Clicked Filler
// @description  Discuz! X-论坛-基本资料-一键填写
// @version      0.7.1411130633
// @author       DanoR
// @namespace    http://weibo.com/zheung
// @grant        none
// @include      *op=base*
// ==/UserScript==

document.querySelector("button#profilesubmitbtn.pn.pnc").parentNode.innerHTML += "<button id=\"fill\"type=\"button\" class=\"pnc pn\"><strong>填写</strong></button>";
document.querySelector("button#fill.pn.pnc").onclick = fill;

function fill()
{
	var privacys = document.querySelectorAll("td.p>select");
	for(i=0; i<privacys.length; i++) privacys[i].value = 3;

	document.querySelector("input#realname.px").value = "";
	document.querySelector("input#affectivestatus.px").value = "单身";
	document.querySelector("input#lookingfor.px").value = "寂寞";

	document.querySelector("select#gender.ps").value = "1";
	document.querySelector("select#bloodtype.ps").value = "O";

	var year = document.querySelector("select#birthyear.ps");
	year.value = "1993"; year.onchange();
	var month = document.querySelector("select#birthmonth.ps");
	month.value = "8"; month.onchange();
	document.querySelector("select#birthday.ps").value = "10";

	var provinceBirth = document.querySelector("select#birthprovince.ps");
	provinceBirth.value = "广东省";
	provinceBirth.onchange();
	provinceBirth.onchange();

	var provinceReside = document.querySelector("select#resideprovince.ps");
	provinceReside.value = "广东省";
	provinceReside.onchange();

	var intervalID = setInterval(function()
	{
		var cityBirth = document.querySelector("select#birthcity.ps");
		if(cityBirth) cityBirth.value = "广州市";
		var cityReside = document.querySelector("select#residecity.ps");
		if(cityReside) cityReside.value = "广州市";

		if(cityBirth.value == "广州市" && cityReside.value == "广州市") clearInterval(intervalID);
	},2014);
}
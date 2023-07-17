document.querySelectorAll('.ssd-module').forEach((ele, index) => {
	const url = getComputedStyle(ele).backgroundImage.replace(/url\(|\.avif|[)"]/g, '');
	const suffix = url.split('.').pop();
	const a = document.createElement('a');
	a.download = `${index}.${suffix}`;
	a.innerHTML = `${index}.${suffix}`;
	a.target = '_blank';
	a.href = url;
	a.click();
	// document.body.appendChild(a);
});

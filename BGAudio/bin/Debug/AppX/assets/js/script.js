/* Search */
$('.header .logo, .header .search-icon').click(function(e) {
	e.preventDefault();
	$('.header .audio-field').show();
});
$('.search-close').click(function(e) {
	e.preventDefault(); 
	$('.header .audio-field').hide();
});
/* /Search */

/* Tabs - Nav */
$('.nav a').click(function(e) {
	e.preventDefault();
	$('.nav a span').removeClass('on');
	$(this).addClass('on').siblings('a').removeClass('on');
	$(this).children('span').addClass('on');
});
/* /Tabs - Nav */

/* Tabs - Content */
$('.nav .trending').click(function(e) {
	e.preventDefault();
	$('.tab.trending').show().siblings('div').hide();
});
$('.nav .discover').click(function(e) {
	e.preventDefault();
	$('.tab.discover').show().siblings('div').hide();
});
$('.nav .favorite').click(function(e) {
	e.preventDefault();
	$('.tab.favorite').show().siblings('div').hide();
});
/* /Tabs - Content */

var list = document.querySelector('.tab.discover');
for (var i = list.children.length; i >= 0; i--) {
   // list.appendChild(list.children[Math.random() * i | 0]);
}

$("section").on("swipeleft", '.trending', function (e) {
    e.preventDefault();
    $('.tab.discover').fadeIn("slow").siblings('div').hide();
    //icons on off
    $('.ui-link').removeClass('on');
    $('.icon').removeClass('on');
    $('.discover').addClass('on').siblings('a').removeClass('on');
    $('.discover').children('span').addClass('on');
});

$("section").on("swiperight", '.discover', function (e) {
    e.preventDefault();
    $('.tab.trending').fadeIn("slow").siblings('div').hide();
    //icons on off
    $('.ui-link').removeClass('on');
    $('.icon').removeClass('on');
    $('.trending').addClass('on').siblings('a').removeClass('on');
    $('.trending').children('span').addClass('on');
});

$("section").on("swipeleft", '.discover', function (e) {
    e.preventDefault();
    $('.tab.favorite').fadeIn("slow").siblings('div').hide();

    //icons on off
    $('.ui-link').removeClass('on');
    $('.icon').removeClass('on');
    $('.favorite').addClass('on').siblings('a').removeClass('on');
    $('.favorite').children('span').addClass('on');
});

$("section").on("swiperight", '.favorite', function (e) {
    e.preventDefault();
    $('.tab.discover').fadeIn("slow").siblings('div').hide();

    //icons on off
    $('.ui-link').removeClass('on');
    $('.icon').removeClass('on');
    $('.discover').addClass('on').siblings('a').removeClass('on');
    $('.discover').children('span').addClass('on');
});



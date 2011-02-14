/***
|''Name''|FancyBoxPluginAddOns|
|''Description''|Adds some add on features to the FancyBoxPlugin|
|''Author''|PMario|
|''Version''|0.1.0|
|''Status''|''beta''|
|''Source''|http://fancybox-plugin.tiddlyspace.com/|
|''License''|http://www.opensource.org/licenses/mit-license.php|
|''CoreVersion''|2.5.0|
|''Requires''|FancyBoxPlugin|
|''Keywords''|light box fancybox add on addon|
!Documentation
<<<
*[[FancyBoxPluginInfo|http://fancybox.tiddlyspace.com/#About]]
<<<
!Description
<<<
Adds some functions to FancyBoxPlugin, that are described at: http://fancybox.net/blog Tips&Tricks
At the moment, there are 3 different titles and an automaticSlideShow addOn available.
<<<
!!!Usage: showTitleOnHover, titleFormatSpecial, titleFormatTip7
<<<
See: Example_AdvancedTitles_1
Somewhere in the ''Default'' section use:
{{{
onComplete: showTitleOnHover
// showTitleOnHover has to be used with onComplete!

titleFormat: titleFormatSpecial
}}}
See: Example_AdvancedTitles_2
{{{
titleFormat: titleFormatTip7
}}}
<<<
!!!Usage: automaticSlideShow
See: Example_AutomaticSlideShow
<<<
{{{
showCloseButton: false
// hide the close button, because it is part of the title.

titlePosition: inside
// inside, outside, over

cyclic: true
// If you set cyclic to true, you'll have an endless loop.

slideShowInterval: 3000
// defines the interval, to switch to the next pictureLink

slideShowAutostart: false
// If slideShowAutostart is set to true, the show is started automatically.


//the following parameters must be set 

titleFormat: automaticSlideShow_title
// defines the SlideShow title, with start and stop buttons.

onComplete: automaticSlideShow_onComplete
// internal functions to initialize everything in the right way

onClosed: automaticSlideShow_onClosed
// clear the timeout loop. 
}}}
<<<
!!!!StyleSheet
add this to your StyleSheet
<<<
{{{
#tip7-title { text-align: left; overflow: auto; }
#tip7-title b { display: block; margin-right: 80px; }
#tip7-title span { float: right; text-align: right; }
}}}
<<<
***/
//{{{

version.extensions.FancyBox.AddOns = {
	major: 0,
	minor: 1,
	revision: 0,
	date: new Date(2011, 2, 9)
};

(function ($) {

	config.macros.fancyBox.addOns = {
		getAttachment: function(title, opts) {
			var picURI;
			picURI = (opts.thumbHost) ? opts.thumbHost + title : '';

			if (!picURI) {
				picURI = (config.macros.attach) ? config.macros.attach.getAttachment(title) : title;
			}
		return picURI;	
		}

	};

//********
// Shows the picture title only, if the picture is hovered.
	config.macros.fancyBox.addOns.showTitleOnHover = function () {
		jQuery("#fancybox-title").hide();
		jQuery("#fancybox-outer").mouseover(function () {
			jQuery("#fancybox-title").show();
		});

		jQuery("#fancybox-outer").mouseout(function () {
			jQuery("#fancybox-title").hide();
		});
	};

//********
// Different Title formatting
	config.macros.fancyBox.addOns.titleFormatSpecial = function (title, currentArray, currentIndex, currentOpts) {
		return '<span id="fancybox-title-over">Image ' + (currentIndex + 1) + ' / ' + currentArray.length + (title.length ? ' &nbsp; ' + title : '') + '</span>';
	};

//********
// Title formatted like the Tip7 from the original library. 
	config.macros.fancyBox.addOns.titleFormatTip7 = function (title, currentArray, currentIndex, currentOpts) {
		var picture = config.macros.fancyBox.addOns.getAttachment('close.png', currentOpts);
		
		return '<div id="tip7-title">'+
					'<span>'+
							'<a href="javascript:;" onclick="jQuery.fancybox.close();">'+
								'<img alt="Close" src="'+picture+'" />'+
							'</a>'+
					'</span>' + (title && title.length ? '<b>' + title + '</b>' : '') + 'Image ' + (currentIndex + 1) + ' of ' + currentArray.length + '</div>';
	};

//********
// automatic slide show addOn
	var ass;
	config.macros.fancyBox.addOns.automaticSlideShow = ass = {
		interval: 6000,
		status : '',
		idTimeout: null,
	
		onTimeout : function () {
			jQuery.fancybox.next();
			ass.setSlideshowTimer('active');
		},
			
		setSlideshowTimer:  function(status) {
			ass.status = status;
		
			if (ass.status === 'active') {
				ass.idTimeout = setTimeout(ass.onTimeout, ass.interval);
			}
			else {
				clearTimeout(ass.idTimeout);
			}
		}
	};

	config.macros.fancyBox.addOns.automaticSlideShow_onComplete = function (currentArray, currentIndex, currentOpts) {
		ass.interval = (currentOpts.slideShowInterval) ? currentOpts.slideShowInterval : 6000;		
		if ((currentOpts.slideShowAutostart === true) && (ass.status ==='')) {
			ass.startSlideshowTimer();
		}
		if ((currentIndex === (currentArray.length - 1)) && (currentOpts.cyclic===false)) {
			ass.setSlideshowTimer('paused');
		}
	};

	config.macros.fancyBox.addOns.automaticSlideShow_onClosed = function (currentArray, currentIndex, currentOpts) {
		ass.setSlideshowTimer('');
	};

	config.macros.fancyBox.addOns.automaticSlideShow_title = function (title, currentArray, currentIndex, currentOpts) {
		var closeImg = config.macros.fancyBox.addOns.getAttachment('close.png', currentOpts);
		var playImg = config.macros.fancyBox.addOns.getAttachment('play.png', currentOpts);
		var pauseImg = config.macros.fancyBox.addOns.getAttachment('pause.png', currentOpts);

		var starter =	'<a href="javascript:;" onclick="config.macros.fancyBox.addOns.automaticSlideShow.setSlideshowTimer(\'active\');">'+
								'<img alt="Start" src="'+playImg+'" />'+
						'</a>';
		var stopper =	'<a href="javascript:;" onclick="config.macros.fancyBox.addOns.automaticSlideShow.setSlideshowTimer(\'paused\');">'+
								'<img alt="Stop" src="'+pauseImg+'" />'+
						'</a>';
	
		return '<div id="tip7-title">'+  
					'<span>' + 
							'<a href="javascript:;" onclick="jQuery.fancybox.close();">'+
								'<img alt="Close" src="'+closeImg+'" />'+
							'</a><br />' + starter + stopper +
					'</span>' + (title && title.length ? '<b>' + title + '</b>' : '') + 'Image ' + (currentIndex + 1) + ' of ' + currentArray.length + '</div>';
	};
// end of automaticSlideShow
//********

})(jQuery);

//}}}

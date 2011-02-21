/***
|''Name''|FancyBoxPlugin|
|''Description''|Wraps the jQuery.fancybox() function into a TiddlyWiki friendly macro|
|''Author''|PMario|
|''Version''|0.4.9|
|''Status''|''beta''|
|''Source''|http://fancybox-plugin.tiddlyspace.com/|
|''License''|http://www.opensource.org/licenses/mit-license.php|
|''CoreVersion''|2.5.0|
|''Keywords''|light box fancybox|
!Documentation
*[[FancyBoxPluginInfo|http://fancybox.tiddlyspace.com/#About]]
!!!Description
<<<
Wraps the jQuery.fancybox() function into a TiddlyWiki friendly macro
<<<
!!!!Usage
<<<
Used in a tiddler, the macro assumes, that ''only'' pictures inside this tiddler will open the lightbox.
The default mode is "slides". If there are several pictures in one tiddler and you click one, a slideshow of all of them will be created.
{{{
<<fancyBox>>
}}}
If you add the {{{mode:picture}}} parameter it will open the lightbox in single picture mode.
{{{
<<fancyBox mode:picture>>
}}}

Used with ViewTemplate
{{{
<span macro='fancyBox'></span>
or
<span macro='fancyBox mode:picture'></span>
}}}
<<<
!!!!StyleSheet
<<<
*add this to your StyleSheet
{{{
[[FancyBoxStyleSheet]]
}}}
<<<
!!!!~AttachFilePluginFormatters
<<<
If AttachFilePluginFormatters plugin is available, it will be used.
<<<
!!!!Further readings
<<<
see: http://fancybox.net/api
<<<
***/
//{{{

version.extensions.FancyBox = {
	major: 0,
	minor: 4,
	revision: 9,
	date: new Date(2011, 2, 21)
};

(function ($) {
	var me;

	config.macros.fancyBox = me = {
		// should be done for easy localisation
		locale: {
			txtNoConfigTiddler: "%0: configuration tiddler doesn't exist",
			slideShowParamMissing: "fancyBox: slideShow parameter missing. See documentation!",
			buttonParamMissing: "fancyBox: button parameter missing. See documentation!",
			slideShowConfigMissing: "fancyBox: SlideShow configuration tiddler missing or wrong name!",
			txtSlideRefMissing: 'Slide reference in [[%0]] is missing'
		},

		fix: {
			txtDefaultMode: 'slide' // do not translate
		},

		getPictureInfo: function(title, opts) {
			var picURI;
			picURI = (opts.thumbHost) ? opts.thumbHost + title : '';

			if (!picURI) {
				picURI = (config.macros.attach) ? config.macros.attach.getAttachment(title) : title;
			}
			return picURI;	
		},
				
		setFbAdvanced: function (conf, params) {
			// set the fancyBox advanced options
			var p = ['type', 'href', 'title', 'content', 'orig', 'index'];
			
			var tmp; 
			for (var i=0, im = p.length; i<im; i += 1) {
				tmp = getParam( params, p[i], undefined);
				if (tmp) {conf[p[i]] = tmp;} 
			}

			// console.log({'conf':conf});
			return conf;
		},

		createElement: function (tagName, thumbURI, picURI, label, relId, alt, data) {
			picURI = picURI.replace(/ /g, '%20');
			return '<span class="twfb-list twfb-' + tagName + '">' + 
						'<a class="imageLink" rel="' + relId + '" href=' + picURI + '>' + 
							'<img title="' + label + '" alt="' + alt + '" src="' + thumbURI + '" />' + 
						'</a>' + 
					'</span>';
		},

		createStack: function () {
			var xx;
			// createTiddlyElement( parent, element, id, className, text, attribs)
			xx = createTiddlyElement(place, 'div', null, 'stackLeft');
			xx = createTiddlyElement(xx, 'div', null, 'stackRight');
			xx = createTiddlyElement(xx, 'div', null, 'stackNormal');
			return xx;
		},

		calcTextSlices: function (text) {
			var slices = {};

			var helper = {
				'true': true,
				'false': false,
				'null': null
			};

			store.slicesRE.lastIndex = 0;
			var m = store.slicesRE.exec(text);
			while (m) {
				if (m[2]) {
					if (isNaN(m[3])) {
						slices[m[2]] = (m[3] in helper) ? helper[m[3]] : m[3];
					}
					else {
						slices[m[2]] = parseFloat(m[3]);
					}
				} else {
					if (isNaN(m[6])) {
						slices[m[5]] = (m[6] in helper) ? helper[m[6]] : m[6];
					}
					else {
						slices[m[5]] = parseFloat(m[6]);
					}
				}
				m = store.slicesRE.exec(text);
			}
			return slices;
		},

		rdSettings: function (cName, offline) {
			var settings = {};
			var text;
			var offName, title = cName;

			var section = null;
			var pos = title.indexOf(config.textPrimitives.sectionSeparator);
			if (pos != -1) {
				section = title.substr(pos + config.textPrimitives.sectionSeparator.length);
				title = title.substr(0, pos);
			}

			offName = (title) ? title + '##Offline' : tiddler.title + '##Offline';
			cName = (title) ? cName : tiddler.title + cName;

			title = (title) ? title : tiddler.title;
			
			if (store.tiddlerExists(title)) {
				// read Offline config if offline
				if (offline) {text = store.getTiddlerText(offName);}
				//	console.log({'cName':cName, 'offName':offName, 'text':text});
				// if there is no offline section use the defaults section
				text = (text) ? text : store.getTiddlerText(cName);
				settings = me.calcTextSlices(text);
				//	console.log({'settings':settings});
			}
			// some special handling, due to jQuery.fancybox() library structure.
			if (settings.swf) {
				settings.swf = $.parseJSON(settings.swf);
			}
			if (settings.href) {
				settings.href = settings.href.replace(/youtube.com\/watch\?v=/i, 'youtube.com/v/');
				settings.href = settings.href.replace(/ /g, '%20');
			}

			var p = ['onComplete', 'onStart', 'onCancel', 'onCleanup', 'onClosed', 'titleFormat'];
			var cmfa = config.macros.fancyBox.addOns;

			var x;
			for (var i = 0, im = p.length; i<im; i += 1) {
				x = settings[p[i]];
				if (x) {
					settings[p[i]] = (cmfa && cmfa[x]) ? cmfa[x] : null;
				}
			}

			// console.log('settings: ', settings, 'x:', x);
			return settings;
		},

		// creates a fancybox friendly DOM structure
		thumbList: function (list, data) {
			var label, slide, elem, thumbURI, picURI, alt = '';
			var relId = '';
			var cma = (config.macros.attach) ? config.macros.attach : null;

			data.selector = '#' + data.genIdA + ' a.imageLink';

			// createTiddlyElement(parent, element, id, className, text, attribs)
			var listElem = createTiddlyElement(place, 'div', data.genIdA, 'imgStack');

			if (data.hide) {
				$(listElem).hide();
			}

			if (['slide', 'pictureLinkSlide'].contains(data.mode)) {
				relId = data.genIdA;
			}

			var i, im;
			// if picHost is not defined check for info from attachment
			if (!data.picHost && cma.getAttachment) {
				for (i = 0, im = list.length; i < im; i += 1) {
					slide = store.getTiddlerText(list[i].title + '##slide');

					thumbURI = cma.getAttachment(list[i].title);
					picURI = (data.conf.href) ? data.conf.href : (slide) ? cma.getAttachment(slide.trim()) : thumbURI;

					if (!slide && !data.conf.href && !data.picHost) {
						list[i].label = me.locale.txtSlideRefMissing.format([list[i].title]);
					}

					label = (list[i].label) ? list[i].label : '';
					alt = (alt) ? alt : label;
					elem = this.createElement(data.tagName, thumbURI, picURI, label, relId, alt);
					jQuery(elem).appendTo($(listElem)[0]);				
				}
			}
			else {
				for (i = 0, im = list.length; i < im; i += 1) {
					thumbURI = (data.thumbHost) ? data.thumbHost + list[i].title : list[i].title;
					picURI = (data.conf.href) ? data.conf.href : (data.picHost) ? data.picHost + list[i].title : list[i].title;

					label = (list[i].label) ? list[i].label : '';
					alt = (alt) ? alt : label;
					elem = this.createElement(data.tagName, thumbURI, picURI, label, relId, alt);
					jQuery(elem).appendTo($(listElem)[0]);				}
			}
			return data;
		},

		// click Event
		buttonSlideShow: function () {
			var data = $(this).data('data');
			var index = data.conf.index || 0;
			var elems;

			data.mode = 'manual';
			elems = me.activateBox(data);

			if (elems.length > index) {
				$(elems[index]).trigger('click');
			}
		},

		activateBox: function (data) {
			$(data.selector).each(function (index, element) {
				$(this).attr('title', $(element).children('img').attr('title'));
			});

			if (['picture', 'pictureLink'].contains(data.mode)) {
				return jQuery(data.selector).fancybox(data.conf);
			}
			else {
				// mode: 'slide', 'selector', 
				return jQuery(data.selector).attr('rel', data.genIdA).fancybox(data.conf);
			}
		},
		// activate Box
		idGenerator: function () {
			var date = new Date();
			var random = Math.floor(Math.random() * 1000);

			return Crypto.hexSha1Str(date.getTime() + '@' + document.location.href + '-' + random);
		},

		rdSlideInfo: function (list, data){
			var fbTitle, fbInfo = '';
			
			for ( var i=0; i<list.length; i += 1 ) {
				if (data.titleSection) {
					fbTitle = store.getTiddlerText(list[i].title + '##' + data.titleSection);
					fbTitle = (fbTitle) ? fbTitle.trim() : '';
				}
				if (data.infoSection) {
					fbInfo = store.getTiddlerText(list[i].title + '##' + data.infoSection);
					fbInfo = (fbInfo)? fbInfo.trim():'';
				}

				list[i].label = (list[i].label) ? list[i].label : (fbTitle) ? fbTitle : ''; 
				list[i].fbInfo = fbInfo;
			}
			// console.log({'rdSlideInfo.list':list});
			return list;
		},
		
		handler: function (place, macroName, params, wikifier, paramString, tiddler) {
			params = paramString.parseParams('pictureLink', null, true);

			var conf = {}; // everything, that comes from fancyBox library
			var data = {}; // fancxBox TW data + conf
			var btn;

			data.mode = me.fix.txtDefaultMode;

			// fancyBox can be called with several pictures.
			var pictureLink = getParam(params, 'pictureLink', undefined);
			if (pictureLink) {
				data.src = 'pictureLink';
				data.mode = 'pictureLink';
				data.tagName = 'pictureLink';
				pictureLink = params[0].pictureLink;
				if (pictureLink.length > 1) {
					data.mode = 'pictureLinkSlide'; // creates a slideshow
				}
			}

			// if several pics are called several labels are needed. 
			// label is used, because title is used by fancyBox library allready.
			var label = getParam(params, 'label', undefined);
			if (label) {
				label = params[0].label;
			}

			// may be slideShowLinkList is needed ToDo
			// var slideShowId = getParam(params, 'slideShow', undefined);
			// set defaults like: FancyBoxConfig
			var configId = getParam(params, 'defaults', undefined);
			if (configId) {
				// get alternative setting if TW is offline.
				conf = me.rdSettings(configId, (document.location.protocol === "file:"));
			}

			configId = getParam(params, 'fancy', undefined);
			if (configId) {
				var tmp = me.rdSettings(configId);
				conf = merge(conf, tmp);
			}

			// set advanced params from macro params
			data.conf = me.setFbAdvanced(conf, params);

			// set the selector
			var selector = getParam(params, 'selector', undefined);
			if (selector) {
				data.selector = selector;
				data.mode = 'selector';
			}

			data.sortField = getParam(params, 'sort', 'title'); // ToDo
			// sets paths for thumbs and pics. relative file paths are possible
			// named params overwrite the global settings.
			var thumbHost = getParam(params, 'thumbHost', undefined); // needs to be defined!
			var picHost = getParam(params, 'picHost', undefined);

			data.thumbHost = (thumbHost) ? thumbHost : conf.thumbHost;
			data.picHost = (picHost) ? picHost : conf.picHost;

			// if tag is used, all pics are part of the TW .. create an overview.
			var tagName = getParam(params, 'tag', undefined);
			if (tagName) {
				data.mode = 'tag';
				data.src = 'tag';
				data.tagName = tagName;
			}

			// titleSection .. references the given sections to be used as the picture title
			// only overwritten by named param title.
			var titleSection = getParam(params, 'titleSection', undefined);
			data.titleSection = (titleSection) ? titleSection : (data.conf.titleSection)? data.conf.titleSection : '';

			// docuSection .. references the given section to be used as the picture info, displayed with special titles
			var infoSection = getParam(params, 'infoSection', undefined);
			data.infoSection = (infoSection) ? infoSection : (data.conf.infoSection)? data.conf.infoSection : '';

			// set slideShow like: SlideShowExample
			var txtImageButton = getParam(params, 'imageButton', undefined);
			var txtImageStack = getParam(params, 'imageStack', undefined);
			var txtButton = getParam(params, 'button', undefined);

			if (txtImageButton) {
				data.mode = 'imageButton';
				data.hide = true;
			}
			else if (txtButton) {
				data.mode = 'button';
				data.hide = true;
			}
			else if (txtImageStack) {
				data.mode = 'imageStack';
				data.hide = true;
			}

			// possible modes: 'slide' (default), 'picture'
			// mode set by user overwrites all guesses!
			var mode = getParam(params, 'mode', undefined);
			data.mode = (mode) ? mode : data.mode;

			var genId = me.idGenerator();
			data.genIdA = 'A' + genId.substr(1, 6);

			var tlist, xlist;
			switch (data.src) {
			case 'tag':
				tlist = store.getTaggedTiddlers(data.tagName, data.sortField);
				xlist = me.rdSlideInfo(tlist, data);
				data = me.thumbList( xlist, data);
				break; // 'tag'
			case 'pictureLink':
				tlist = [];
				for (var i = 0; i < pictureLink.length; i += 1) {
					tlist.push({
						'title': pictureLink[i]
					});
					tlist[i].label = (label && label[i]) ? label[i] : '';
				}

				tlist = me.rdSlideInfo(tlist,data);
				data = me.thumbList(tlist, data);
				break; // 'tag'
			case 'list':
				// get the list of [img[prettyLink|pic][externalLink]]
				// Better done with <<tiddler LinkedTiddler>> and selector !!!
				break; // 'list'
			}

			// console.log({'data':data});
			switch (data.mode) {

			case 'imageStack':
				if ($.browser.mozilla || $.browser.webkit) {place = me.createStack();}
				txtImageButton = txtImageStack;
				// console.log('imageStack:', place);
				// fall through is by intention
			case 'imageButton':
				// automatically makes use of AttachFilePluginFormatters
				// check dependencies ToDo
				data.tagName = data.tagName || 'manual';

				// createTiddlyButton(parent, text, tooltip, action, className, id, accessKey, attribs)
				btn = createTiddlyButton(place, '', null, me.buttonSlideShow);

				$(btn).removeClass('button');
				wikify(txtImageButton, btn);

				$(btn).data('data', data);

				return;
			//	break; // button
			case 'button':
				// check dependencies ToDo
				data.tagName = data.tagName || 'manual';

				// createTiddlyButton(parent, text, tooltip, action, className, id, accessKey, attribs)
				btn = createTiddlyButton(place, txtButton, null, me.buttonSlideShow);

				$(btn).data('data', data);

				return;
			//	break; // button
			case 'tag':
				data.selector = '.twfb-' + data.tagName + ' a';
				me.activateBox(data);
				break; // tag
			case 'pictureLink':
			case 'pictureLinkSlide':
				data.selector = '#' + data.genIdA + ' a.imageLink';
				me.activateBox(data);
				break; // tag
			case 'list':
				break; // list
			case 'selector':
				me.activateBox(data);
				break; // xxx
		//	case 'slide':
			default:
				// limit selection to containing tiddler, if there is no selector param
				// 'a.imageLink' is default produced by [img[picture.jpg][http:// .. ]]
				// imageMacro is different ???!!!  ToDo
				var container = story.findContainingTiddler(place);

				$(container).find('.viewer').attr('id', data.genIdA);

				data.selector = '#' + data.genIdA + ' a.imageLink';

				me.activateBox(data);
				break; // xxx
			} // switch
		} // handler
	}; // end plugin
})(jQuery);

//}}}

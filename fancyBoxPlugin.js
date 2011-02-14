/***
|''Name''|FancyBoxPlugin|
|''Description''|Wraps the jQuery.fancybox() function into a TiddlyWiki friendly macro|
|''Author''|PMario|
|''Version''|0.4.4|
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
{{
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
	revision: 4,
	date: new Date(2011, 2, 13)
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

		setFbAdvanced: function (conf, params) {
			// set the fancyBox advanced options
			var type = getParam(params, 'type', undefined); // Forces content type. Can be set to 'image', 'ajax', 'iframe', 'swf' or 'inline'
			var href = getParam(params, 'href', undefined); // Forces content source
			var title = getParam(params, 'title', undefined); // Forces title
			var content = getParam(params, 'content', undefined); // Forces content (can be any html data)
			var orig = getParam(params, 'orig', undefined); // Sets object whos position and dimensions will be used by 'elastic' transition
			var index = getParam(params, 'index', undefined); // Custom start index of manually created gallery (since 1.3.1)
			// Set the params only if available
			if (type) {
				conf.type = type;
			}
			if (href) {
				conf.href = href;
			}
			if (title) {
				conf.title = title;
			}
			if (content) {
				conf.content = content;
			}
			if (orig) {
				conf.orig = orig;
			}
			if (index) {
				conf.index = index;
			}

			return conf;
		},

		createElement: function (tagName, thumbURI, picURI, label, relId, alt, data) {
			return '<span class="twfb-list twfb-' + tagName + '">' + '<a class="imageLink" rel="' + relId + '" href=' + picURI + '>' + '<img title="' + label + '" alt="' + alt + '" src="' + thumbURI + '" />' + '</a>' + '</span>';
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
						slices[m[2]] = parseInt(m[3]);
					}
				} else {
					if (isNaN(m[6])) {
						slices[m[5]] = (m[6] in helper) ? helper[m[6]] : m[6];
					}
					else {
						slices[m[5]] = parseInt(m[6]);
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

			var pos = title.indexOf(config.textPrimitives.sectionSeparator);
			var section = null;
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
			if (settings.swf) {
				settings.swf = $.parseJSON(settings.swf);
			}
			if (settings.href) {
				settings.href = settings.href.replace(/youtube.com\/watch\?v=/i, 'youtube.com/v/');
			}

			var cmfa = config.macros.fancyBox.addOns;
			var x = settings.onComplete;
			if (x) {
				settings.onComplete = (cmfa[x]) ? cmfa[x] : null;
			}

			x = settings.onStart;
			if (x) {
				settings.onStart = (cmfa[x]) ? cmfa[x] : null;
			}

			x = settings.onCancel;
			if (x) {
				settings.onCancel = (cmfa[x]) ? cmfa[x] : null;
			}

			x = settings.onCleanup;
			if (x) {
				settings.onCleanup = (cmfa[x]) ? cmfa[x] : null;
			}

			x = settings.onClosed;
			if (x) {
				settings.onClosed = (cmfa[x]) ? cmfa[x] : null;
			}

			x = settings.titleFormat;
			if (x) {
				settings.titleFormat = (cmfa[x]) ? cmfa[x] : null;
			}

			//			console.log('settings: ', settings, 'x:', x);
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

			// ToDo clean up redundant code
			if (!data.picHost && cma.getAttachment) {
				for (var i = 0; i < list.length; i += 1) {
					slide = store.getTiddlerText(list[i].title + '##slide');

					thumbURI = cma.getAttachment(list[i].title);
					picURI = (data.conf.href) ? data.conf.href : (slide) ? cma.getAttachment(slide.trim()) : thumbURI;

					if (!slide && !data.conf.href) {
						list[i].label = me.locale.txtSlideRefMissing.format([list[i].title]);
					}

					label = (list[i].label) ? list[i].label : '';
					alt = (alt) ? alt : label;
					elem = this.createElement(data.tagName, thumbURI, picURI, label, relId, alt);

					jQuery(elem).appendTo($(listElem)[0]);
				}
			}
			else {
				for (var i = 0; i < list.length; i += 1) {
					thumbURI = (data.thumbHost) ? data.thumbHost + list[i].title : list[i].title;
					picURI = (data.conf.href) ? data.conf.href : (data.picHost) ? data.picHost + list[i].title : list[i].title;

					label = (list[i].label) ? list[i].label : '';
					alt = (alt) ? alt : label;
					elem = this.createElement(data.tagName, thumbURI, picURI, label, relId, alt);

					jQuery(elem).appendTo($(listElem)[0]);
				}
			}
			return data;
		},
		// End slide
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
			var space = 'fancybox.tiddlyspace.com';
			var date = new Date();
			var time = date.getTime();
			var random = Math.floor(Math.random() * 1000);

			return Crypto.hexSha1Str(time + '@' + space + '-' + random);
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

			// set slideShow like: SlideShowExample
			var txtImageButton = getParam(params, 'imageButton', undefined);
			var txtButton = getParam(params, 'button', undefined);

			if (txtImageButton) {
				data.mode = 'imageButton';
				data.hide = true;
			}
			else if (txtButton) {
				data.mode = 'button';
				data.hide = true;
			}

			// possible modes: 'slide' (default), 'picture'
			// mode set by user overwrites all guesses!
			var mode = getParam(params, 'mode', undefined);
			data.mode = (mode) ? mode : data.mode;

			var genId = me.idGenerator();
			data.genIdA = 'A' + genId.substr(1, 6);

			var tlist;
			switch (data.src) {
			case 'tag':
				tlist = store.getTaggedTiddlers(data.tagName, data.sortField);
				data = me.thumbList(tlist, data);
				break; // 'tag'
			case 'pictureLink':
				tlist = [];
				for (var i = 0; i < pictureLink.length; i += 1) {
					tlist.push({
						'title': pictureLink[i]
					});
					tlist[i].label = (label && label[i]) ? label[i] : '';
				}

				data = me.thumbList(tlist, data);
				break; // 'tag'
			case 'list':
				// get the list of [img[prettyLink|pic][externalLink]]
				// Better done with <<tiddler LinkedTiddler>> and selector !!!
				break; // 'list'
			}

			console.log({'data':data});
			switch (data.mode) {
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
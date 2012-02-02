/***
|''Name''|FancyBoxPlugin|
|''Description''|Wraps the jQuery.fancybox() function into a TiddlyWiki friendly macro|
|''Author''|PMario|
|''Version''|0.4.13|
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
	revision: 13,
	date: new Date(2011, 2, 26)
};

(function ($) {
	var me;

	config.macros.fancyBox = me = {
		// should be done for easy localisation
		locale: {
		},

		getPictureInfo: function(title, opts, elem) {
			var picURI;
			picURI = (opts[elem]) ? opts[elem] + encodeURIComponent(title) : '';

			if (!picURI) {
				picURI = (config.macros.attach) ? config.macros.attach.getAttachment(title) : encodeURIComponent(title);
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
//			return conf;
		},

		createElement: function (tag, thumbURI, picURI, label, relId, alt, data) {
			return '<span class="twfb-list twfb-' + tag + '">' + 
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

		helper : {
			'true': true,
			'false': false,
			'null': null
		},

		calcTextSlices: function (text) {
			var slices = {};

			store.slicesRE.lastIndex = 0;
			var m = store.slicesRE.exec(text);
			while (m) {
				if (m[2]) {
					if (isNaN(m[3])) {
						slices[m[2]] = (m[3] in me.helper) ? me.helper[m[3]] : m[3];
					}
					else {
						slices[m[2]] = parseFloat(m[3]);
					}
				} else {
					if (isNaN(m[6])) {
						slices[m[5]] = (m[6] in me.helper) ? me.helper[m[6]] : m[6];
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
				// if there is no offline section use the defaults section
				text = (text) ? text : store.getTiddlerText(cName);
				settings = me.calcTextSlices(text);
			}

			// some special handling, due to jQuery.fancybox() library structure.
			if (settings.swf) {
				settings.swf = $.parseJSON(settings.swf);
			}
			if (settings.href) {
				settings.href = settings.href.replace(/youtube.com\/watch\?v=/i, 'youtube.com/v/');
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
			return settings;
		},

		// creates a fancybox friendly DOM structure
		thumbList: function (list, data) {
			var label, slide, elem, thumbURI, picURI;
			var relId = '';
			var cma = (config.macros.attach) ? config.macros.attach : null;

			data.selector = '#' + data.genIdA + ' a.imageLink';

			// createTiddlyElement(parent, element, id, className, text, attribs)
			var listElem = createTiddlyElement(place, 'span', data.genIdA, 'imgStack');

			if (data.hide) {
				$(listElem).hide();
			}

			if (data.mode != 'picture') {
				relId = data.genIdA;
			}

			var i, im;
			// if picHost is not defined check for info from attachment
			if (!data.picHost && cma.getAttachment) {
				for (i = 0, im = list.length; i < im; i += 1) {
					slide = store.getTiddlerText(list[i].title + '##slide');
					
					// check for slide field 
					if (!slide) {
						slide = (list[i].fields.slide)? list[i].fields.slide : '';
					} 
						
					thumbURI = me.getPictureInfo(list[i].title, data, 'thumbHost');
					picURI = (data.conf.href) ? data.conf.href : (slide) ? cma.getAttachment(slide.trim()) : thumbURI;

					label = (data.list[i].label) ? data.list[i].label : '';
					elem = this.createElement(data.tag, thumbURI, picURI, label, relId, label);
					jQuery(elem).appendTo($(listElem)[0]);				
				}
			}
			else {
				for (i = 0, im = list.length; i < im; i += 1) {
					thumbURI = (data.thumbHost) ? data.thumbHost + encodeURIComponent(list[i].title) : encodeURIComponent(list[i].title);
					picURI = (data.conf.href) ? data.conf.href : (data.picHost) ? data.picHost + encodeURIComponent(list[i].title) : encodeURIComponent(list[i].title);

					label = (data.list[i].label) ? data.list[i].label : '';
					elem = this.createElement(data.tag, thumbURI, picURI, label, relId, label);
					jQuery(elem).appendTo($(listElem)[0]);				}
			}
			// return data;
		},

		// click Event
		buttonSlideShow: function () {
			var data = $(this).data('data');
			var index = data.conf.index || 0;
			var elems;

			elems = me.activateBox(data);

			if (elems.length > index) {
				$(elems[index]).trigger('click');
			}
		},

		activateBox: function (data) {
			$(data.selector).each(function (index, element) {
				// if (! $(this).attr('title')) {
					$(this).attr('title', $(element).children('img').attr('title'));
				// } 
			});

			if (['picture'].contains(data.mode)) {
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
			var co = config.options;
			var fbLabel, fbInfo = '';
			var lit, tmpLabel;

			var titleRegexp;
			var match; 

			for ( var i=0; i<list.length; i += 1 ) {
				fbLabel = '';
				// using the tiddler title as slideshow title is default behaviour
				// If one doesn't want it set useTiddlerTitle to false
				// cutExtension is default true 
				lit = list[i].title;
				if (data.useTiddlerTitle) {
					titleRegexp = /^(.*)\./mg;		// ToDo check why it needs new init ?!?!
					match = titleRegexp.exec(lit);
					
					tmpLabel = (data.cutExtension && (match!==null)) ? match[1] : lit;
				}

				if (data.labelSection) {
					fbLabel = store.getTiddlerText(list[i].title + '##' + data.labelSection);
					fbLabel = (fbLabel) ? fbLabel : '';
					
					if (!fbLabel) {
						fbLabel = (list[i].fields[data.labelSection])? list[i].fields[data.labelSection] : '';
					}
				}
				if (data.infoSection) {
					fbInfo = store.getTiddlerText(lit + '##' + data.infoSection);
					fbInfo = (fbInfo)? fbInfo : '';

					if (!fbInfo) {
						fbInfo = (list[i].fields[data.infoSection.toLowerCase()])? list[i].fields[data.infoSection.toLowerCase()] : '';
					}
				}
				tmpLabel = (data.list[i].label) ? data.list[i].label : (fbLabel) ? fbLabel : tmpLabel;
				data.list[i].label = tmpLabel;
				data.list[i].fbInfo = fbInfo;
			} // for
		},

		defaults: {
			display: 'slide',				// slide or picture
			useTiddlerTitle: true,
			cutExtension: true,
			sortField: 'title',
			labelSection: 'label',
			infoSection: 'info'
			
		},

		handler: function (place, macroName, params, wikifier, paramString, tiddler) {
			params = paramString.parseParams('pictureLink', null, true);

			var btn;
			var conf = {};		// everything, that comes from Defaults or Fancy sections
			var data = {};		// data that will be used to decide

			data = merge(data, me.defaults);
			data.list= [];		// label information

			// pictureLink catches all unnamed params. It can be an array.
			var pictureLink = getParam(params, 'pictureLink', undefined);
			if (pictureLink) {
				data.src = 'pictureLink';
				data.display = 'pictureLink';
				data.tag = 'pictureLink';
				pictureLink = params[0].pictureLink;
				if (pictureLink.length > 1) {
					data.display = 'pictureLinkSlide'; // creates a slideshow
				}
			}

			// if several pics are called several labels are needed. 
			// label is used, because title is used by fancyBox library allready.
			var label = getParam(params, 'label', undefined);
			if (label) {
				label = params[0].label;
			}

			// paramContainer contains: tiddlerName, tiddlerName##sectionName or ##sectionName
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

			me.setFbAdvanced(conf, params);
	
			data.conf = conf;

			// params that set the data.src
			var sourceSetters = ['tag', 'pictureLink'];

			// params that set the data.display 
			// 'mode' is not a mode setter. It belongs to optionalParams
			var displaySetters = ['tag', 'imageButton', 'button', 'imageStack', 'selector'];

			// these are optional params which are used by FancyBoxPlugin.
			pc = ['useTiddlerTitle', 'cutExtension', 'selector', 
				'thumbHost', 'picHost', 'labelSection', 'infoSection', 
				'tag', 'imageButton', 'imageStack', 'button', 'mode', 'sortField', 'rbLink'];

			var setDisplay, setSrc;
			for (i=0, im=pc.length; i<im; i += 1) {
				content = getParam(params, pc[i], '');
				content = (content in me.helper) ? me.helper : content; // chk: true, false, null

				setDisplay = false;
				setSrc = false;
								
				if (content) {
					data[pc[i]] = content;
					setDisplay = displaySetters.contains(pc[i]);
					setSrc  = sourceSetters.contains(pc[i]);
				}
				else if (data.conf[pc[i]]) {
					data[pc[i]] = data.conf[pc[i]];
					setDisplay = displaySetters.contains(pc[i]);
					setSrc  = sourceSetters.contains(pc[i]);
				}

				// don't modify them if not needed.
				if (setDisplay) {data.display = pc[i];}
				if (setSrc) {data.src = pc[i];}
			} // for

			var genId = me.idGenerator();
			data.genIdA = 'A' + genId.substr(1, 5);

			var tlist, tid;
			switch (data.src) {
			case 'tag':
				tlist = store.getTaggedTiddlers(data.tag, data.sortField);
				for (i = 0; i < tlist.length; i += 1) {
					data.list[i] = {'label':''};
				}
				me.rdSlideInfo( tlist, data);				
				break; // 'tag'
			case 'pictureLink':
				tlist = [];
				for (i = 0; i < pictureLink.length; i += 1) {
					tid = store.getTiddler( pictureLink[i]);
					if (tid) {
						tlist.push(tid);
						data.list[i] = {'label': (label && label[i]) ? label[i] : ''};
					} // if (tid) ..
				} // for ..
				me.rdSlideInfo(tlist,data);
				break; // 'tag'
			}

			// console.log({'data':data});
			switch (data.display) {
			case 'imageStack':
				if ($.browser.mozilla || $.browser.webkit) {place = me.createStack();}
				// fall through is by intention
			case 'imageButton':
				data.hide = true;	// hide the DOM structure
				data.tag = data.tag || 'button';

				me.thumbList(tlist, data);

				// createTiddlyButton(parent, text, tooltip, action, className, id, accessKey, attribs)
				btn = createTiddlyButton(place, '', null, me.buttonSlideShow);
				$(btn).removeClass('button');
				wikify(data.imageButton || data.imageStack, btn);
				$(btn).data('data', data);
				return;
			//	break; // button
			case 'button':
				// check dependencies ToDo
				data.tag = data.tag || 'button';
				data.hide = true;

				me.thumbList(tlist, data);
				
				// createTiddlyButton(parent, text, tooltip, action, className, id, accessKey, attribs)
				btn = createTiddlyButton(place, data.button, null, me.buttonSlideShow);
				$(btn).data('data', data);
				return;
			//	break; // button
			case 'tag':
				me.thumbList(tlist, data);
				data.selector = '.twfb-' + data.tag + ' a';
				me.activateBox(data);
				break; // tag
			case 'pictureLink':
			case 'pictureLinkSlide':
				me.thumbList(tlist, data);
				data.selector = '#' + data.genIdA + ' a.imageLink';
				me.activateBox(data);
				break; // tag
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

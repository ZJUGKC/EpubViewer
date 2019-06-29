
  function getQueryString(name) {
    var result = window.location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {
        return "";
    }
    return result[1];
  }

    document.onreadystatechange = function () {

      if (document.readyState == "complete") {

        if(getQueryString('book')!=''){
          var str=getQueryString('book');
          window.reader = ePubReader(str, {
                          restore: true
                    });
        }
        else{
          var md5 = localStorage.getItem('key');  
          console.log(md5);
          bookDB.open(function () {
            bookDB.getBookWithKey(md5,function (result) {
                    var bookPath=result.content;
                    window.reader = ePubReader(bookPath, {
                          restore: true
                    });
              });
          });
        }         
      }
    };


var EPUBJS = EPUBJS || {};
EPUBJS.reader = {};
EPUBJS.reader.plugins = {}; 

(function(root, $) {

	var previousReader = root.ePubReader || {};


	var ePubReader = root.ePubReader = function(path, options) {
		
  
		return new EPUBJS.Reader(path, options);
	};


})(window, jQuery);



EPUBJS.Reader = function(bookPath, _options) {
	var reader = this;
	var book;
	var $viewer = $("#viewer");
	var parameters;

	this.settings =  {
		bookPath : bookPath,
		restore : false,
		reload : false,
		bookmarks : undefined,
		annotations : undefined,
		contained : undefined,
		bookKey : undefined,
		styles : undefined,
		sidebarReflow: false,
		generatePagination: false,
		history: true
	};

	this.book = book = new ePub(this.settings.bookPath, this.settings);

	this.offline = false;
	this.sidebarOpen = false;

	this.rendition = book.renderTo("viewer", {
		ignoreClass: "annotator-hl",
		width: "100%",
		height: "100%"
	});

  this.displayed = this.rendition.display();


  
	book.ready.then(function () {
		reader.ReaderController = EPUBJS.reader.ReaderController.call(reader, book);
		reader.SettingsController = EPUBJS.reader.SettingsController.call(reader, book);
		reader.ControlsController = EPUBJS.reader.ControlsController.call(reader, book);
		reader.SidebarController = EPUBJS.reader.SidebarController.call(reader, book);
	
	}.bind(this)).then(function() {
		reader.ReaderController.hideLoader();
	}.bind(this));



	book.loaded.metadata.then(function(meta) {
		reader.MetaController = EPUBJS.reader.MetaController.call(reader, meta);
	});

	book.loaded.navigation.then(function(navigation) {
		reader.TocController = EPUBJS.reader.TocController.call(reader, navigation);
	});

	window.addEventListener("beforeunload", this.unload.bind(this), false);

	return this;
};


EPUBJS.reader.ControlsController = function(book) {
	var reader = this;
	var rendition = this.rendition;

	var $store = $("#store"),
			$fullscreen = $("#fullscreen"),
			$fullscreenicon = $("#fullscreenicon"),
			$cancelfullscreenicon = $("#cancelfullscreenicon"),
			$slider = $("#slider"),
			$main = $("#main"),
			$sidebar = $("#sidebar"),
			$settings = $("#setting"),
			$bookmark = $("#bookmark");

	$slider.on("click", function () {
		if(reader.sidebarOpen) {
			reader.SidebarController.hide();
			$slider.addClass("icon-menu");
			$slider.removeClass("icon-right");
		} else {
			reader.SidebarController.show();
			$slider.addClass("icon-right");
			$slider.removeClass("icon-menu");
		}
	});


	rendition.on('relocated', function(location){
		var cfi = location.start.cfi;
		var cfiFragment = "#" + cfi;
		reader.currentLocationCfi = cfi;

	});

	return {};
};

EPUBJS.reader.MetaController = function(meta) {
	var title = meta.title,
			author = meta.creator;

	var $title = $("#book-title"),
			$author = $("#chapter-title"),
			$dash = $("#title-seperator");

		document.title = title+" – "+author;

		$title.html(title);
		$author.html(author);
		$dash.show();
};



EPUBJS.reader.ReaderController = function(book) {
	var $main = $("#main"),
			$divider = $("#divider"),
			$loader = $("#loader"),
			$next = $("#next"),
			$prev = $("#prev");
	var reader = this;
	var book = this.book;
	var rendition = this.rendition;
	var slideIn = function() {
		var currentPosition = rendition.currentLocation().start.cfi;
		if (reader.settings.sidebarReflow){
			$main.removeClass('single');
			$main.one("transitionend", function(){
				rendition.resize();
			});
		} else {
			$main.removeClass("closed");
		}
	};

	var slideOut = function() {
		var location = rendition.currentLocation();
		if (!location) {
			return;
		}
		var currentPosition = location.start.cfi;
		if (reader.settings.sidebarReflow){
			$main.addClass('single');
			$main.one("transitionend", function(){
				rendition.resize();
			});
		} else {
			$main.addClass("closed");
		}
	};

	var showLoader = function() {
		$loader.show();
		hideDivider();
	};

	var hideLoader = function() {
		$loader.hide();

	};

	var showDivider = function() {
		$divider.addClass("show");
	};

	var hideDivider = function() {
		$divider.removeClass("show");
	};

	var keylock = false;

	var arrowKeys = function(e) {
		if(e.keyCode == 37) {

			if(book.package.metadata.direction === "rtl") {
				rendition.next();
			} else {
				rendition.prev();
			}

			$prev.addClass("active");

			keylock = true;
			setTimeout(function(){
				keylock = false;
				$prev.removeClass("active");
			}, 100);

			 e.preventDefault();
		}
		if(e.keyCode == 39) {

			if(book.package.metadata.direction === "rtl") {
				rendition.prev();
			} else {
				rendition.next();
			}

			$next.addClass("active");

			keylock = true;
			setTimeout(function(){
				keylock = false;
				$next.removeClass("active");
			}, 100);

			 e.preventDefault();
		}
	}

	document.addEventListener('keydown', arrowKeys, false);

	$next.on("click", function(e){

		if(book.package.metadata.direction === "rtl") {
			rendition.prev();
		} else {
			rendition.next();
		}

		e.preventDefault();
	});

	$prev.on("click", function(e){

		if(book.package.metadata.direction === "rtl") {
			rendition.next();
		} else {
			rendition.prev();
		}

		e.preventDefault();
	});

	rendition.on("layout", function(props){
		if(props.spread === true) {
			showDivider();
		} else {
			hideDivider();
		}
	});

	rendition.on('relocated', function(location){
		if (location.atStart) {
			$prev.addClass("disabled");
		}
		if (location.atEnd) {
			$next.addClass("disabled");
		}
	});

	return {
		"slideOut" : slideOut,
		"slideIn"  : slideIn,
		"showLoader" : showLoader,
		"hideLoader" : hideLoader,
		"showDivider" : showDivider,
		"hideDivider" : hideDivider,
		"arrowKeys" : arrowKeys
	};
};

EPUBJS.reader.SettingsController = function() {
	var book = this.book;
	var reader = this;
	var $settings = $("#settings-modal"),
			$overlay = $(".overlay");

	var show = function() {
		$settings.addClass("md-show");
	};

	var hide = function() {
		$settings.removeClass("md-show");
	};

	var $sidebarReflowSetting = $('#sidebarReflow');

	$sidebarReflowSetting.on('click', function() {
		reader.settings.sidebarReflow = !reader.settings.sidebarReflow;
	});

	$settings.find(".closer").on("click", function() {
		hide();
	});

	$overlay.on("click", function() {
		hide();
	});

	return {
		"show" : show,
		"hide" : hide
	};
};

EPUBJS.reader.SidebarController = function(book) {
	var reader = this;

	var $sidebar = $("#sidebar"),
			$panels = $("#panels");

	var activePanel = "Toc";

	var changePanelTo = function(viewName) {
		var controllerName = viewName + "Controller";
		
		if(activePanel == viewName || typeof reader[controllerName] === 'undefined' ) return;
		reader[activePanel+ "Controller"].hide();
		reader[controllerName].show();
		activePanel = viewName;

		$panels.find('.active').removeClass("active");
		$panels.find("#show-" + viewName ).addClass("active");
	};
	
	var getActivePanel = function() {
		return activePanel;
	};
	
	var show = function() {
		reader.sidebarOpen = true;
		reader.ReaderController.slideOut();
		$sidebar.addClass("open");
	}

	var hide = function() {
		reader.sidebarOpen = false;
		reader.ReaderController.slideIn();
		$sidebar.removeClass("open");
	}

	$panels.find(".show_view").on("click", function(event) {
		var view = $(this).data("view");

		changePanelTo(view);
		event.preventDefault();
	});

	return {
		'show' : show,
		'hide' : hide,
		'getActivePanel' : getActivePanel,
		'changePanelTo' : changePanelTo
	};
};
EPUBJS.reader.TocController = function(toc) {
	var book = this.book;
	var rendition = this.rendition;

	var $list = $("#tocView"),
			docfrag = document.createDocumentFragment();

	var currentChapter = false;

	var generateTocItems = function(toc, level) {
		var container = document.createElement("ul");

		if(!level) level = 1;

		toc.forEach(function(chapter) {
			var listitem = document.createElement("li"),
					link = document.createElement("a");
					toggle = document.createElement("a");

			var subitems;

			listitem.id = "toc-"+chapter.id;
			listitem.classList.add('list_item');

			link.textContent = chapter.label;
			link.href = chapter.href;

			link.classList.add('toc_link');

			listitem.appendChild(link);

			if(chapter.subitems && chapter.subitems.length > 0) {
				level++;
				subitems = generateTocItems(chapter.subitems, level);
				toggle.classList.add('toc_toggle');

				listitem.insertBefore(toggle, link);
				listitem.appendChild(subitems);
			}


			container.appendChild(listitem);

		});

		return container;
	};

	var onShow = function() {
		$list.show();
	};

	var onHide = function() {
		$list.hide();
	};

	var chapterChange = function(e) {
		var id = e.id,
				$item = $list.find("#toc-"+id),
				$current = $list.find(".currentChapter"),
				$open = $list.find('.openChapter');

		if($item.length){

			if($item != $current && $item.has(currentChapter).length > 0) {
				$current.removeClass("currentChapter");
			}

			$item.addClass("currentChapter");

			$item.parents('li').addClass("openChapter");
		}
	};

	rendition.on('renderered', chapterChange);

  rendition.hooks.content.register(function (content) {
      let section = book.section(content.sectionIndex);
      let mathml = section.properties.includes("mathml");

      if (mathml) {
        return content.addScript('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/MathJax.js?config=TeX-MML-AM_CHTML');
       	
      }
    });
  
	var tocitems = generateTocItems(toc);

	docfrag.appendChild(tocitems);

	$list.append(docfrag);
	$list.find(".toc_link").on("click", function(event){
			var url = this.getAttribute('href');

			event.preventDefault();

			rendition.display(url);

			$list.find(".currentChapter")
					.addClass("openChapter")
					.removeClass("currentChapter");

			$(this).parent('li').addClass("currentChapter");

	});

	$list.find(".toc_toggle").on("click", function(event){
			var $el = $(this).parent('li'),
					open = $el.hasClass("openChapter");

			event.preventDefault();
			if(open){
				$el.removeClass("openChapter");
			} else {
				$el.addClass("openChapter");
			}
	});

	return {
		"show" : onShow,
		"hide" : onHide
	};
};

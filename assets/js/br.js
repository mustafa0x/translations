/*
Copyright(c)2008-2016 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

    BookReader is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BookReader is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with BookReader.  If not, see <http://www.gnu.org/licenses/>.

    The BookReader source is hosted at http://github.com/internetarchive/bookreader/

*/

// BookReader()
//______________________________________________________________________________
// After you instantiate this object, you must supply the following
// book-specific functions, before calling init().  Some of these functions
// can just be stubs for simple books.
//  - getPageWidth()
//  - getPageHeight()
//  - getPageURI()
//  - getPageSide()
//  - canRotatePage()
//  - getPageNum()
//  - getSpreadIndices()
// You must also add a numLeafs property before calling init().

function BookReader() {

    // Mode constants
    this.constMode1up = 1;
    this.constMode2up = 2;
    this.constModeThumb = 3;

    this.reduce  = 4;
    this.padding = 10;          // Padding in 1up

    this.mode    = this.constMode1up;
    this.ui = 'full';           // UI mode
    this.uiAutoHide = false;    // Controls whether nav/toolbar will autohide

    // thumbnail mode
    this.thumbWidth = 100; // will be overridden during prepareThumbnailView
    this.thumbRowBuffer = 2; // number of rows to pre-cache out a view
    this.thumbColumns = 6; // default
    this.thumbMaxLoading = 4; // number of thumbnails to load at once
    this.thumbPadding = 10; // spacing between thumbnails
    this.displayedRows=[];

    this.displayedIndices = [];
    //this.indicesToDisplay = [];
    this.imgs = {};
    this.prefetchedImgs = {}; //an object with numeric keys cooresponding to page index

    this.timer     = null;
    this.animating = false;
    this.auto      = false;
    this.autoTimer = null;
    this.flipSpeed = 'fast';

    this.twoPagePopUp = null;
    this.leafEdgeTmp  = null;
    this.embedPopup = null;
    this.printPopup = null;

    this.searchTerm = '';
    this.searchResults = null;

    this.firstIndex = null;

    this.lastDisplayableIndex2up = null;

    // Should be overriden (before init) by custom implmentations.
    this.logoURL = 'https://www.archive.org';

    // Base URL for UI images - should be overriden (before init) by
    // custom implementations.
    // $$$ This is the same directory as the images referenced by relative
    //     path in the CSS.  Would be better to automagically find that path.
    this.imagesBaseURL = '/bookreader/images/';


    // Zoom levels
    // $$$ provide finer grained zooming
    /*
    this.reductionFactors = [ {reduce: 0.5, autofit: null},
                              {reduce: 1, autofit: null},
                              {reduce: 2, autofit: null},
                              {reduce: 4, autofit: null},
                              {reduce: 8, autofit: null},
                              {reduce: 16, autofit: null} ];
    */
    /* The autofit code ensures that fit to width and fit to height will be available */
    this.reductionFactors = [ {reduce: 0.5, autofit: null},
                          {reduce: 1, autofit: null},
                          {reduce: 2, autofit: null},
                          {reduce: 3, autofit: null},
                          {reduce: 4, autofit: null},
                          {reduce: 6, autofit: null} ];


    // Object to hold parameters related to 1up mode
    this.onePage = {
        autofit: 'width'                                     // valid values are height, width, none
    };

    // Object to hold parameters related to 2up mode
    this.twoPage = {
        coverInternalPadding: 0, // Width of cover
        coverExternalPadding: 0, // Padding outside of cover
        bookSpineDivWidth: 64,    // Width of book spine  $$$ consider sizing based on book length
        autofit: 'auto'
    };

    // This object/dictionary controls which optional features are enabled
    // XXXmang in progress
    this.features = {
        // search
        // read aloud
        // open library entry
        // table of contents
        // embed/share ui
        // info ui
    };

    // Text-to-Speech params
    this.ttsPlaying     = false;
    this.ttsIndex       = null;  //leaf index
    this.ttsPosition    = -1;    //chunk (paragraph) number
    this.ttsBuffering   = false;
    this.ttsPoller      = null;
    this.ttsFormat      = null;

    // Themes
    this.themes = {
        ia: 'BookReader-ia.css',
        ol: null
    };
    this.default_theme = 'ol';
    this.theme = 'ol';

    this.bookUrl = null;
    this.bookUrlText = null;
    this.bookUrlTitle = null;

    // Fields used to populate the info window
    this.metadata = [];
    this.thumbnail = null;
    this.bookUrlMoreInfo = null;

    // Settings for mobile
    this.enableMobileNav = true;
    this.mobileNavTitle = 'Internet Archive';

    // Experimental Controls (eg b/w)
    this.enableExperimentalControls = false;

    return this;
};

(function ($) {
// init()
//______________________________________________________________________________
BookReader.prototype.init = function() {

    var startIndex = undefined;
    this.pageScale = this.reduce; // preserve current reduce

    // Find start index and mode if set in location hash
    var params = {};
    if (window.location.hash) {
        // params explicitly set in URL
        params = this.paramsFromFragment(window.location.hash);
    } else {
        // params not explicitly set, use defaults if we have them
        if ('defaults' in this) {
            params = this.paramsFromFragment(this.defaults);
        }
    }

    // Sanitize/process parameters

    if ('undefined' != typeof(params.index)) {
        startIndex = params.index;
    } else if ('undefined' != typeof(params.page)) {
        startIndex = this.getPageIndex(params.page);
    }

    if ('undefined' == typeof(startIndex)) {
        if ('undefined' != typeof(this.titleLeaf)) {
            // title leaf is known - but only use as default if book has a few pages
            if (this.numLeafs > 2) {
                startIndex = this.leafNumToIndex(this.titleLeaf);
            }
        }
    }

    if ('undefined' == typeof(startIndex)) {
        startIndex = 0;
    }

    // Use params or browser width to set view mode
    var nextMode;
    if ('undefined' != typeof(params.mode)) {
        nextMode = params.mode;
    } else if (this.ui == 'full') {
      // In full mode, we set the default based on width
      if ($(window).width() > 800) {
        nextMode = this.constMode2up;
      } else {
        nextMode = this.constMode1up;
      }
    } else {
      nextMode = this.constMode2up;
    }

    if (this.canSwitchToMode(nextMode)) {
      this.mode = nextMode;
    } else {
      this.mode = this.constMode1up;
    }

    // Set document title -- may have already been set in enclosing html for
    // search engine visibility
    document.title = this.shortTitle(50);

    $("#BookReader").empty().removeClass().addClass("ui-" + this.ui);

    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
    $("#BookReader").append("<div id='BRcontainer' dir='ltr'></div>");
    $("#BRcontainer").append("<div id='BRpageview'></div>");

    $("#BRcontainer").bind('scroll', this, function(e) {
        e.data.loadLeafs();
    });

    this.setupKeyListeners();
    this.setupHashListener();

    $(window).bind('resize', this, function(e) {
        //console.log('resize!');

        if (1 == e.data.mode) {
            //console.log('centering 1page view');
            if (e.data.autofit) {
                e.data.resizePageView();
            }
            e.data.centerPageView();
            $('#BRpageview').empty()
            e.data.displayedIndices = [];
            e.data.updateSearchHilites(); //deletes hilights but does not call remove()
            e.data.loadLeafs();
        } else if (3 == e.data.mode){
            e.data.prepareThumbnailView();
        } else {
            //console.log('drawing 2 page view');

            // We only need to prepare again in autofit (size of spread changes)
            if (e.data.twoPage.autofit) {
                e.data.prepareTwoPageView();
            } else {
                // Re-center if the scrollbars have disappeared
                var center = e.data.twoPageGetViewCenter();
                var doRecenter = false;
                if (e.data.twoPage.totalWidth < $('#BRcontainer').prop('clientWidth')) {
                    center.percentageX = 0.5;
                    doRecenter = true;
                }
                if (e.data.twoPage.totalHeight < $('#BRcontainer').prop('clientHeight')) {
                    center.percentageY = 0.5;
                    doRecenter = true;
                }
                if (doRecenter) {
                    e.data.twoPageCenterView(center.percentageX, center.percentageY);
                }
            }
        }
    });

    if (this.protected) {
        $(document).on('contextmenu dragstart', '.BRpagediv1up', function(e) {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpageimage', function(e) {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpagedivthumb', function(e) {
            return false;
        });
        $('.BRicon.share').hide();
    }

    // $('.BRpagediv1up').bind('mousedown', this, function(e) {
    //     // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
    //     //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
    //     return false;
    // });

    // $$$ refactor this so it's enough to set the first index and call preparePageView
    //     (get rid of mode-specific logic at this point)
    if (1 == this.mode) {
        this.firstIndex = startIndex;
        this.prepareOnePageView();
        this.jumpToIndex(startIndex);
    } else if (3 == this.mode) {
        this.firstIndex = startIndex;
        this.prepareThumbnailView();
        this.jumpToIndex(startIndex);
    } else {
        this.displayedIndices=[0];
        this.firstIndex = startIndex;
        this.displayedIndices = [this.firstIndex];
        //console.log('titleLeaf: %d', this.titleLeaf);
        //console.log('displayedIndices: %s', this.displayedIndices);
        this.prepareTwoPageView();
    }

    // Enact other parts of initial params
    this.updateFromParams(params);

    // If we didn't already enable a theme, do it now
    if ('undefined' == typeof(params.theme)) {
        this.updateTheme(this.theme);
    }

    // We init the nav bar after the params processing so that the nav slider knows where
    // it should start (doesn't jump after init)
    if (this.ui == "embed") {
        this.initEmbedNavbar();
    } else {
        this.initNavbar();
    }
    this.bindNavigationHandlers();

    // Set strings in the UI
    this.initUIStrings();

    // Add a class if this is a touch enabled device
    isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
    if (isTouchDevice) {
      $("body").addClass("touch");
    } else {
      $("body").addClass("no-touch");
    }

    // Add class to body for mode. Responsiveness is disabled in embed.
    $("body").addClass("br-ui-" + this.ui);

    $(document).trigger("BookReader:PostInit");
}

BookReader.prototype.setupKeyListeners = function() {
    var self = this;

    var KEY_PGUP = 33;
    var KEY_PGDOWN = 34;
    var KEY_END = 35;
    var KEY_HOME = 36;

    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;

    // We use document here instead of window to avoid a bug in jQuery on IE7
    $(document).keydown(function(e) {

        // Keyboard navigation
        if (!self.keyboardNavigationIsDisabled(e)) {
            switch(e.keyCode) {
                case KEY_PGUP:
                case KEY_UP:
                    // In 1up mode page scrolling is handled by browser
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.prev();
                    }
                    break;
                case KEY_DOWN:
                case KEY_PGDOWN:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.next();
                    }
                    break;
                case KEY_END:
                    e.preventDefault();
                    self.last();
                    break;
                case KEY_HOME:
                    e.preventDefault();
                    self.first();
                    break;
                case KEY_LEFT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.left();
                    }
                    break;
                case KEY_RIGHT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.right();
                    }
                    break;
            }
        }
    });
}

// drawLeafs()
//______________________________________________________________________________
BookReader.prototype.drawLeafs = function() {
    if (1 == this.mode) {
        this.drawLeafsOnePage();
    } else if (3 == this.mode) {
        this.drawLeafsThumbnail();
    } else {
        this.drawLeafsTwoPage();
    }

}

// bindGestures(jElement)
//______________________________________________________________________________
BookReader.prototype.bindGestures = function(jElement) {
}

// drawLeafsOnePage()
//______________________________________________________________________________
BookReader.prototype.drawLeafsOnePage = function() {
    //alert('drawing leafs!');
    this.timer = null;


    var scrollTop = $('#BRcontainer').prop('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();
    //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

    var indicesToDisplay = [];

    var i;
    var leafTop = 0;
    var leafBottom = 0;
    for (i=0; i<this.numLeafs; i++) {
        var height  = parseInt(this._getPageHeight(i)/this.reduce);

        leafBottom += height;
        //console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView | bottomInView | middleInView) {
            //console.log('displayed: ' + this.displayedIndices);
            //console.log('to display: ' + i);
            indicesToDisplay.push(i);
        }
        leafTop += height +10;
        leafBottom += 10;
    }

    // Based of the pages displayed in the view we set the current index
    // $$$ we should consider the page in the center of the view to be the current one
    var firstIndexToDraw  = indicesToDisplay[0];
    if (firstIndexToDraw != this.firstIndex) {
        this.willChangeToIndex(firstIndexToDraw);
    }
    this.firstIndex = firstIndexToDraw;

    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedIndices.length > 0) {
        this.updateLocationHash();
    }

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }

    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.numLeafs-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }

    leafTop = 0;
    var i;
    for (i=0; i<firstIndexToDraw; i++) {
        leafTop += parseInt(this._getPageHeight(i)/this.reduce) +10;
    }

    //var viewWidth = $('#BRpageview').width(); //includes scroll bar width
    var viewWidth = $('#BRcontainer').prop('scrollWidth');


    for (i=0; i<indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];
        var height  = parseInt(this._getPageHeight(index)/this.reduce);

        if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {
            var width   = parseInt(this._getPageWidth(index)/this.reduce);
            //console.log("displaying leaf " + indicesToDisplay[i] + ' leafTop=' +leafTop);
            var div = document.createElement("div");
            div.className = 'BRpagediv1up';
            div.id = 'pagediv'+index;
            div.style.position = "absolute";
            $(div).css('top', leafTop + 'px');
            var left = (viewWidth-width)>>1;
            if (left<0) left = 0;
            $(div).css('left', left+'px');
            $(div).css('width', width+'px');
            $(div).css('height', height+'px');
            //$(div).text('loading...');

            $('#BRpageview').append(div);

            var el = (this.ext === 'svg' || this.ext === 'html') ? 'object' : 'img',
                attr = (this.ext === 'svg' || this.ext === 'html') ? 'data' : 'src',
                img = document.createElement(el);
            img[attr] = this._getPageURI(index, this.reduce, 0);
            $(img).addClass('BRnoselect');
            $(img).css('width', width+'px');
            $(img).css('height', height+'px');
            $(div).append(img);

        } else {
            //console.log("not displaying " + indicesToDisplay[i] + ' score=' + jQuery.inArray(indicesToDisplay[i], this.displayedIndices));
        }

        leafTop += height +10;

    }

    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            var index = this.displayedIndices[i];
            //console.log('Removing leaf ' + index);
            //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
            $('#pagediv'+index).remove();
        } else {
            //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
        }
    }

    this.displayedIndices = indicesToDisplay.slice();
    this.updateSearchHilites();

    if (null != this.getPageNum(firstIndexToDraw))  {
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce);

}

// loadLeafs()
//______________________________________________________________________________
BookReader.prototype.loadLeafs = function() {


    var self = this;
    if (null == this.timer) {
        this.timer=setTimeout(function(){self.drawLeafs()},250);
    } else {
        clearTimeout(this.timer);
        this.timer=setTimeout(function(){self.drawLeafs()},250);
    }
}

// zoom(direction)
//
// Pass 1 to zoom in, anything else to zoom out
//______________________________________________________________________________
BookReader.prototype.zoom = function(direction) {
    switch (this.mode) {
        case this.constMode1up:
            if (direction == 1) {
                // XXX other cases
                return this.zoom1up('in');
            } else {
                return this.zoom1up('out');
            }

        case this.constMode2up:
            if (direction == 1) {
                // XXX other cases
                return this.zoom2up('in');
            } else {
                return this.zoom2up('out');
            }

        case this.constModeThumb:
            // XXX update zoomThumb for named directions
            return this.zoomThumb(direction);

    }
}

// zoom1up(dir)
//______________________________________________________________________________
BookReader.prototype.zoom1up = function(direction) {

    if (2 == this.mode) {     //can only zoom in 1-page mode
        this.switchMode(1);
        return;
    }

    var reduceFactor = this.nextReduce(this.reduce, direction, this.onePage.reductionFactors);

    if (this.reduce == reduceFactor.reduce) {
        // Already at this level
        return;
    }

    this.reduce = reduceFactor.reduce; // $$$ incorporate into function
    this.onePage.autofit = reduceFactor.autofit;

    this.pageScale = this.reduce; // preserve current reduce
    this.resizePageView();

    $('#BRpageview').empty()
    this.displayedIndices = [];
    this.loadLeafs();

    this.updateToolbarZoom(this.reduce);

    // Recalculate search hilites
    this.removeSearchHilites();
    this.updateSearchHilites();

}

// resizePageView()
//______________________________________________________________________________
BookReader.prototype.resizePageView = function() {
    // $$$ This code assumes 1up mode
    //     e.g. does not preserve position in thumbnail mode
    //     See http://bugs.launchpad.net/bookreader/+bug/552972

    switch (this.mode) {
        case this.constMode1up:
        case this.constMode2up:
            this.resizePageView1up(); // $$$ necessary in non-1up mode?
            break;
        case this.constModeThumb:
            this.prepareThumbnailView( this.currentIndex() );
            break;
        default:
            alert('Resize not implemented for this mode');
    }
}

// Resize the current one page view
BookReader.prototype.resizePageView1up = function() {
    var i;
    var viewHeight = 0;
    //var viewWidth  = $('#BRcontainer').width(); //includes scrollBar
    var viewWidth  = $('#BRcontainer').prop('clientWidth');

    var oldScrollTop  = $('#BRcontainer').prop('scrollTop');
    var oldScrollLeft = $('#BRcontainer').prop('scrollLeft');

    var oldPageViewHeight = $('#BRpageview').height();
    var oldPageViewWidth = $('#BRpageview').width();

    // May have come here after preparing the view, in which case the scrollTop and view height are not set

    var scrollRatio = 0;
    if (oldScrollTop > 0) {
        // We have scrolled - implies view has been set up
        var oldCenterY = this.centerY1up();
        var oldCenterX = this.centerX1up();
        scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
        // Have not scrolled, e.g. because in new container

        // We set the scroll ratio so that the current index will still be considered the
        // current index in drawLeafsOnePage after we create the new view container

        // Make sure this will count as current page after resize
        // console.log('fudging for index ' + this.currentIndex() + ' (page ' + this.getPageNum(this.currentIndex()) + ')');
        var fudgeFactor = (this.getPageHeight(this.currentIndex()) / this.reduce) * 0.6;
        var oldLeafTop = this.onePageGetPageTop(this.currentIndex()) + fudgeFactor;
        var oldViewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);
        scrollRatio = oldLeafTop / oldViewDimensions.height;
    }

    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors( $('#BRcontainer').prop('clientWidth'),
                                           $('#BRcontainer').prop('clientHeight') );
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
        var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
        this.reduce = reductionFactor.reduce;
    }

    var viewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);
    $('#BRpageview').height(viewDimensions.height);
    $('#BRpageview').width(viewDimensions.width);

    var newCenterY = scrollRatio*viewDimensions.height;
    var newTop = Math.max(0, Math.floor( newCenterY - $('#BRcontainer').height()/2 ));
    $('#BRcontainer').prop('scrollTop', newTop);

    // We use clientWidth here to avoid miscalculating due to scroll bar
    var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    var newLeft = newCenterX - $('#BRcontainer').prop('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    $('#BRcontainer').prop('scrollLeft', newLeft);
    //console.log('oldCenterX ' + oldCenterX + ' newCenterX ' + newCenterX + ' newLeft ' + newLeft);

    //this.centerPageView();
    this.loadLeafs();

    this.removeSearchHilites();
    this.updateSearchHilites();
}

// Calculate the dimensions for a one page view with images at the given reduce and padding
BookReader.prototype.onePageCalculateViewDimensions = function(reduce, padding) {
    var viewWidth = 0;
    var viewHeight = 0;
    for (i=0; i<this.numLeafs; i++) {
        viewHeight += parseInt(this._getPageHeight(i)/this.reduce) + this.padding;
        var width = parseInt(this._getPageWidth(i)/this.reduce);
        if (width>viewWidth) viewWidth=width;
    }
    return { width: viewWidth, height: viewHeight }
}

// centerX1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerX1up = function() {
    var centerX;
    if ($('#BRpageview').width() < $('#BRcontainer').prop('clientWidth')) { // fully shown
        centerX = $('#BRpageview').width();
    } else {
        centerX = $('#BRcontainer').prop('scrollLeft') + $('#BRcontainer').prop('clientWidth') / 2;
    }
    centerX = Math.floor(centerX);
    return centerX;
}

// centerY1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerY1up = function() {
    var centerY = $('#BRcontainer').prop('scrollTop') + $('#BRcontainer').height() / 2;
    return Math.floor(centerY);
}

// centerPageView()
//______________________________________________________________________________
BookReader.prototype.centerPageView = function() {

    var scrollWidth  = $('#BRcontainer').prop('scrollWidth');
    var clientWidth  =  $('#BRcontainer').prop('clientWidth');
    //console.log('sW='+scrollWidth+' cW='+clientWidth);
    if (scrollWidth > clientWidth) {
        $('#BRcontainer').prop('scrollLeft', (scrollWidth-clientWidth)/2);
    }

}

// quantizeReduce(reduce)
//______________________________________________________________________________
// Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
BookReader.prototype.quantizeReduce = function(reduce, reductionFactors) {
    var quantized = reductionFactors[0].reduce;
    var distance = Math.abs(reduce - quantized);
    for (var i = 1; i < reductionFactors.length; i++) {
        newDistance = Math.abs(reduce - reductionFactors[i].reduce);
        if (newDistance < distance) {
            distance = newDistance;
            quantized = reductionFactors[i].reduce;
        }
    }

    return quantized;
}

// reductionFactors should be array of sorted reduction factors
// e.g. [ {reduce: 0.25, autofit: null}, {reduce: 0.3, autofit: 'width'}, {reduce: 1, autofit: null} ]
BookReader.prototype.nextReduce = function( currentReduce, direction, reductionFactors ) {

    // XXX add 'closest', to replace quantize function

    if (direction == 'in') {
        var newReduceIndex = 0;

        for (var i = 1; i < reductionFactors.length; i++) {
            if (reductionFactors[i].reduce < currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];

    } else if (direction == 'out') { // zoom out
        var lastIndex = reductionFactors.length - 1;
        var newReduceIndex = lastIndex;

        for (var i = lastIndex; i >= 0; i--) {
            if (reductionFactors[i].reduce > currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    }

    // Asked for specific autofit mode
    for (var i = 0; i < reductionFactors.length; i++) {
        if (reductionFactors[i].autofit == direction) {
            return reductionFactors[i];
        }
    }

    alert('Could not find reduction factor for direction ' + direction);
    return reductionFactors[0];

}

BookReader.prototype._reduceSort = function(a, b) {
    return a.reduce - b.reduce;
}

// jumpToPage()
//______________________________________________________________________________
// Attempts to jump to page.  Returns true if page could be found, false otherwise.
BookReader.prototype.jumpToPage = function(pageNum) {

    var pageIndex;

    // Check for special "leaf"
    var re = new RegExp('^leaf(\\d+)');
    leafMatch = re.exec(pageNum);
    if (leafMatch) {
        console.log(leafMatch[1]);
        pageIndex = this.leafNumToIndex(parseInt(leafMatch[1],10));
        if (pageIndex === null) {
            pageIndex = undefined; // to match return type of getPageIndex
        }

    } else {
        pageIndex = this.getPageIndex(pageNum);
    }

    if ('undefined' != typeof(pageIndex)) {
        var leafTop = 0;
        var h;
        this.jumpToIndex(pageIndex);
        $('#BRcontainer').prop('scrollTop', leafTop);
        return true;
    }

    // Page not found
    return false;
}

// jumpToIndex()
//______________________________________________________________________________
BookReader.prototype.jumpToIndex = function(index, pageX, pageY) {

    this.willChangeToIndex(index);

    this.ttsStop();

    if (this.constMode2up == this.mode) {
        this.autoStop();

        // By checking against min/max we do nothing if requested index
        // is current
        if (index < Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipBackToIndex(index);
        } else if (index > Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipFwdToIndex(index);
        }

    } else if (this.constModeThumb == this.mode) {
        var viewWidth = $('#BRcontainer').prop('scrollWidth') - 20; // width minus buffer
        var i;
        var leafWidth = 0;
        var leafHeight = 0;
        var rightPos = 0;
        var bottomPos = 0;
        var rowHeight = 0;
        var leafTop = 0;
        var leafIndex = 0;

        for (i=0; i<(index+1); i++) {
            leafWidth = this.thumbWidth;
            if (rightPos + (leafWidth + this.thumbPadding) > viewWidth){
                rightPos = 0;
                rowHeight = 0;
                leafIndex = 0;
            }

            leafHeight = parseInt((this.getPageHeight(leafIndex)*this.thumbWidth)/this.getPageWidth(leafIndex), 10);
            if (leafHeight > rowHeight) { rowHeight = leafHeight; }
            if (leafIndex==0) { leafTop = bottomPos; }
            if (leafIndex==0) { bottomPos += this.thumbPadding + rowHeight; }
            rightPos += leafWidth + this.thumbPadding;
            leafIndex++;
        }
        this.firstIndex=index;
        if ($('#BRcontainer').prop('scrollTop') == leafTop) {
            this.loadLeafs();
        } else {
            $('#BRcontainer').animate({scrollTop: leafTop },'fast');
        }
    } else {
        // 1up
        var leafTop = this.onePageGetPageTop(index);

        if (pageY) {
            //console.log('pageY ' + pageY);
            var offset = parseInt( (pageY) / this.reduce);
            offset -= $('#BRcontainer').prop('clientHeight') >> 1;
            //console.log( 'jumping to ' + leafTop + ' ' + offset);
            leafTop += offset;
        } else {
            // Show page just a little below the top
            leafTop -= this.padding / 2;
        }

        if (pageX) {
            var offset = parseInt( (pageX) / this.reduce);
            offset -= $('#BRcontainer').prop('clientWidth') >> 1;
            leafLeft += offset;
        } else {
            // Preserve left position
            leafLeft = $('#BRcontainer').scrollLeft();
        }

        //$('#BRcontainer').prop('scrollTop', leafTop);
        $('#BRcontainer').animate({scrollTop: leafTop, scrollLeft: leafLeft },'fast');
    }
}

// switchMode()
//______________________________________________________________________________
BookReader.prototype.switchMode = function(mode) {
}

//prepareOnePageView()
//______________________________________________________________________________
BookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();

    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });

    $("#BRcontainer").append("<div id='BRpageview'></div>");

    // Attaches to first child - child must be present
    $('#BRcontainer').dragscrollable();
    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));

    this.resizePageView();

    this.jumpToIndex(startLeaf);
    this.displayedIndices = [];

    this.drawLeafsOnePage();
}

BookReader.prototype.onePageGetAutofitWidth = function() {
    var widthPadding = 20;
    return (this.getMedianPageSize().width + 0.0) / ($('#BRcontainer').prop('clientWidth') - widthPadding * 2);
}

BookReader.prototype.onePageGetAutofitHeight = function() {
    return (this.getMedianPageSize().height + 0.0) / ($('#BRcontainer').prop('clientHeight') - this.padding * 2); // make sure a little of adjacent pages show
}

// Returns where the top of the page with given index should be in one page view
BookReader.prototype.onePageGetPageTop = function(index)
{
    var i;
    var leafTop = 0;
    var leafLeft = 0;
    var h;
    for (i=0; i<index; i++) {
        h = parseInt(this._getPageHeight(i)/this.reduce);
        leafTop += h + this.padding;
    }
    return leafTop;
}

BookReader.prototype.getMedianPageSize = function() {
    if (this._medianPageSize) {
        return this._medianPageSize;
    }

    // A little expensive but we just do it once
    var widths = [];
    var heights = [];
    for (var i = 0; i < this.numLeafs; i++) {
        widths.push(this.getPageWidth(i));
        heights.push(this.getPageHeight(i));
    }

    widths.sort();
    heights.sort();

    this._medianPageSize = { width: widths[parseInt(widths.length / 2)], height: heights[parseInt(heights.length / 2)] };
    return this._medianPageSize;
}

// Update the reduction factors for 1up mode given the available width and height.  Recalculates
// the autofit reduction factors.
BookReader.prototype.onePageCalculateReductionFactors = function( width, height ) {
    this.onePage.reductionFactors = this.reductionFactors.concat(
        [
            { reduce: this.onePageGetAutofitWidth(), autofit: 'width' },
            { reduce: this.onePageGetAutofitHeight(), autofit: 'height'}
        ]);
    this.onePage.reductionFactors.sort(this._reduceSort);
}

// currentIndex()
//______________________________________________________________________________
// Returns the currently active index.
BookReader.prototype.currentIndex = function() {
    // $$$ we should be cleaner with our idea of which index is active in 1up/2up
    if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
        return this.firstIndex; // $$$ TODO page in center of view would be better
    } else if (this.mode == this.constMode2up) {
        // Only allow indices that are actually present in book
        return BookReader.util.clamp(this.firstIndex, 0, this.numLeafs - 1);
    } else {
        throw 'currentIndex called for unimplemented mode ' + this.mode;
    }
}

// setCurrentIndex(index)
//______________________________________________________________________________
// Sets the idea of current index without triggering other actions such as animation.
// Compare to jumpToIndex which animates to that index
BookReader.prototype.setCurrentIndex = function(index) {
    this.firstIndex = index;
}


// right()
//______________________________________________________________________________
// Flip the right page over onto the left
BookReader.prototype.right = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.next();
    } else {
        // RTL
        this.prev();
    }
}

// rightmost()
//______________________________________________________________________________
// Flip to the rightmost page
BookReader.prototype.rightmost = function() {
    if ('rl' != this.pageProgression) {
        this.last();
    } else {
        this.first();
    }
}

// left()
//______________________________________________________________________________
// Flip the left page over onto the right.
BookReader.prototype.left = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.prev();
    } else {
        // RTL
        this.next();
    }
}

// leftmost()
//______________________________________________________________________________
// Flip to the leftmost page
BookReader.prototype.leftmost = function() {
    if ('rl' != this.pageProgression) {
        this.first();
    } else {
        this.last();
    }
}

// next()
//______________________________________________________________________________
BookReader.prototype.next = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipFwdToIndex(null);
    } else {
        if (this.firstIndex < this.lastDisplayableIndex()) {
            this.jumpToIndex(this.firstIndex+1);
        }
    }
}

// prev()
//______________________________________________________________________________
BookReader.prototype.prev = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipBackToIndex(null);
    } else {
        if (this.firstIndex >= 1) {
            this.jumpToIndex(this.firstIndex-1);
        }
    }
}

BookReader.prototype.first = function() {
    this.jumpToIndex(this.firstDisplayableIndex());
}

BookReader.prototype.last = function() {
    this.jumpToIndex(this.lastDisplayableIndex());
}

// scrollDown()
//______________________________________________________________________________
// Scrolls down one screen view
BookReader.prototype.scrollDown = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.next();
        }

        $('#BRcontainer').animate(
            { scrollTop: '+=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// scrollUp()
//______________________________________________________________________________
// Scrolls up one screen view
BookReader.prototype.scrollUp = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.prev();
        }

        $('#BRcontainer').animate(
            { scrollTop: '-=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// _scrollAmount()
//______________________________________________________________________________
// The amount to scroll vertically in integer pixels
BookReader.prototype._scrollAmount = function() {
    if (this.constMode1up == this.mode) {
        // Overlap by % of page size
        return parseInt($('#BRcontainer').prop('clientHeight') - this.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
    }

    return parseInt(0.9 * $('#BRcontainer').prop('clientHeight'));
}


// flipBackToIndex()
//______________________________________________________________________________
// to flip back one spread, pass index=null
BookReader.prototype.flipBackToIndex = function(index) {

    if (1 == this.mode) return;

    var leftIndex = this.twoPage.currentIndexL;

    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = leftIndex-2;
    }
    //if (index<0) return;

    this.willChangeToIndex(index);

    var previousIndices = this.getSpreadIndices(index);

    if (previousIndices[0] < this.firstDisplayableIndex() || previousIndices[1] < this.firstDisplayableIndex()) {
        return;
    }

    this.animating = true;

    if ('rl' != this.pageProgression) {
        // Assume LTR and we are going backward
        this.prepareFlipLeftToRight(previousIndices[0], previousIndices[1]);
        this.flipLeftToRight(previousIndices[0], previousIndices[1]);
    } else {
        // RTL and going backward
        var gutter = this.prepareFlipRightToLeft(previousIndices[0], previousIndices[1]);
        this.flipRightToLeft(previousIndices[0], previousIndices[1], gutter);
    }
}

/*
 * Put handlers here for when we will navigate to a new page
 */
BookReader.prototype.willChangeToIndex = function(index)
{
    // Update navbar position icon - leads page change animation
    this.updateNavIndex(index);
}

// prefetchImg()
//______________________________________________________________________________
BookReader.prototype.prefetchImg = function(index) {
    var pageURI = this._getPageURI(index);

    // Load image if not loaded or URI has changed (e.g. due to scaling)
    var loadImage = false;
    if (undefined == this.prefetchedImgs[index]) {
        //console.log('no image for ' + index);
        loadImage = true;
    } else if (pageURI != this.prefetchedImgs[index].uri) {
        //console.log('uri changed for ' + index);
        loadImage = true;
    }

    if (loadImage) {
        //console.log('prefetching ' + index);
        var img = document.createElement("img");
        $(img).addClass('BRpageimage').addClass('BRnoselect');
        if (index < 0 || index > (this.numLeafs - 1) ) {
            // Facing page at beginning or end, or beyond
            $(img).addClass('BRemptypage');
        }
        img.src = pageURI;
        img.uri = pageURI; // browser may rewrite src so we stash raw URI here
        this.prefetchedImgs[index] = img;
    }
}


// pruneUnusedImgs()
//______________________________________________________________________________
BookReader.prototype.pruneUnusedImgs = function() {
    //console.log('current: ' + this.twoPage.currentIndexL + ' ' + this.twoPage.currentIndexR);
    for (var key in this.prefetchedImgs) {
        //console.log('key is ' + key);
        if ((key != this.twoPage.currentIndexL) && (key != this.twoPage.currentIndexR)) {
            //console.log('removing key '+ key);
            $(this.prefetchedImgs[key]).remove();
        }
        if ((key < this.twoPage.currentIndexL-4) || (key > this.twoPage.currentIndexR+4)) {
            //console.log('deleting key '+ key);
            delete this.prefetchedImgs[key];
        }
    }
}

// prefetch()
//______________________________________________________________________________
BookReader.prototype.prefetch = function() {

    // $$$ We should check here if the current indices have finished
    //     loading (with some timeout) before loading more page images
    //     See https://bugs.edge.launchpad.net/bookreader/+bug/511391

    // prefetch visible pages first
    this.prefetchImg(this.twoPage.currentIndexL);
    this.prefetchImg(this.twoPage.currentIndexR);

    var adjacentPagesToLoad = 3;

    var lowCurrent = Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    var highCurrent = Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR);

    var start = Math.max(lowCurrent - adjacentPagesToLoad, 0);
    var end = Math.min(highCurrent + adjacentPagesToLoad, this.numLeafs - 1);

    // Load images spreading out from current
    for (var i = 1; i <= adjacentPagesToLoad; i++) {
        var goingDown = lowCurrent - i;
        if (goingDown >= start) {
            this.prefetchImg(goingDown);
        }
        var goingUp = highCurrent + i;
        if (goingUp <= end) {
            this.prefetchImg(goingUp);
        }
    }

    /*
    var lim = this.twoPage.currentIndexL-4;
    var i;
    lim = Math.max(lim, 0);
    for (i = lim; i < this.twoPage.currentIndexL; i++) {
        this.prefetchImg(i);
    }

    if (this.numLeafs > (this.twoPage.currentIndexR+1)) {
        lim = Math.min(this.twoPage.currentIndexR+4, this.numLeafs-1);
        for (i=this.twoPage.currentIndexR+1; i<=lim; i++) {
            this.prefetchImg(i);
        }
    }
    */
}

// keyboardNavigationIsDisabled(event)
//   - returns true if keyboard navigation should be disabled for the event
//______________________________________________________________________________
BookReader.prototype.keyboardNavigationIsDisabled = function(event) {
    if (event.target.tagName == "INPUT") {
        return true;
    }
    return false;
}

// leafEdgeWidth
//______________________________________________________________________________
// Returns the width of the leaf edge div for the page with index given
BookReader.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.getPageSide(pindex) == 'L') && (this.pageProgression != 'rl')) {
        return parseInt( (pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    }
}

// initNavbar
//______________________________________________________________________________
// Initialize the navigation bar.
// $$$ this could also add the base elements to the DOM, so disabling the nav bar
//     could be as simple as not calling this function
BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar

    $('#BookReader').append(
      "<div id=\"BRnav\" class=\"BRnavDesktop\">"
      +"  <div id=\"BRpage\">"
           +"<button class=\"BRicon book_left\"></button>"
           +"<button class=\"BRicon book_right\"></button>"
           +"<button class='BRicon zoom_out'></button>"
           +"<button class='BRicon zoom_in'></button>"
           +"<button class=\"BRicon full toggle-fs\"></button>"
           +"<span class=\"desktop-only\">&nbsp;&nbsp;</span>"
           +"<button class=\"BRicon onepg desktop-only\"></button>"
           +"<button class=\"BRicon twopg desktop-only\"></button>"
           +"<button class=\"BRicon thumb desktop-only\"></button>"
      +"  </div>"
      +"  <div id=\"BRnavpos\">"
      +"    <div id=\"BRpager\"></div>"
      +"    <div id=\"BRnavline\">"
      +"      <div class=\"BRnavend\" id=\"BRnavleft\"></div>"
      +"      <div class=\"BRnavend\" id=\"BRnavright\"></div>"
      +"    </div>"
      +"  </div>"
      +"  <div id=\"BRnavCntlBtm\" class=\"BRnavCntl BRdn\"></div>"
      +"</div>"
    );
    var self = this;
    $('#BRpager').slider({
        animate: true,
        min: 0,
        max: this.numLeafs - 1,
        value: ('rl' != self.pageProgression) ? this.currentIndex() : this.numLeafs - this.currentIndex()
    })
    .bind('slide', function(event, ui) {
        var num = 'rl' != self.pageProgression ? ui.value : (self.numLeafs - 1 - ui.value);
        self.updateNavPageNum(num);
        $("#pagenum").show();
        return true;
    })
    .bind('slidechange', function(event, ui) {
        var num = 'rl' != self.pageProgression ? ui.value : (self.numLeafs - 1 - ui.value);
        self.updateNavPageNum(num);
        $("#pagenum").hide(); // hiding now but will show later

        // recursion prevention for jumpToIndex
        if ( $(this).data('swallowchange') ) {
            $(this).data('swallowchange', false);
        } else {
            self.jumpToIndex(num);
        }
        return true;
    })
    .hover(function() {
            $("#pagenum").show();
        },function(){
            // XXXmang not triggering on iPad - probably due to touch event translation layer
            $("#pagenum").hide();
        }
    );

    //append icon to handle
    $('#BRpager .ui-slider-handle')
      .append('<div id="pagenum"><span class="currentpage"></span></div>');
      //.wrap('<div class="ui-handle-helper-parent"></div>').parent(); // XXXmang is this used for hiding the tooltip?

    this.updateNavPageNum(this.currentIndex());

    // $("#BRzoombtn").draggable({axis:'y',containment:'parent'});

    /* Initial hiding
        $('#BRtoolbar').delay(3000).animate({top:-40});
        $('#BRnav').delay(3000).animate({bottom:-53});
        changeArrow();
        $('.BRnavCntl').delay(3000).animate({height:'43px'}).delay(1000).animate({opacity:.25},1000);
    */
}

BookReader.prototype.updateNavPageNum = function(index) {
    var pageNum = this.getPageNum(index);
    var pageStr;
    if (pageNum[0] == 'n') { // funny index
        pageStr = index + 1 + ' / ' + this.numLeafs; // Accessible index starts at 0 (alas) so we add 1 to make human
    } else {
        pageStr = 'Page ' + pageNum;
    }

    $('#pagenum .currentpage').text(pageStr);
}

/*
 * Update the nav bar display - does not cause navigation.
 */
BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    var num = 'rl' != this.pageProgression ? index : (this.numLeafs - 1 - index);
    $('#BRpager').data('swallowchange', true).slider('value', num);
}
BookReader.prototype.updateToolbarZoom = function(reduce) {
}
// bindNavigationHandlers
//______________________________________________________________________________
// Bind navigation handlers
BookReader.prototype.bindNavigationHandlers = function() {

    var self = this; // closure
    jIcons = $('.BRicon');

    jIcons.filter('.book_left').click(function(e) {
        self.ttsStop();
        self.left();
        return false;
    });

    jIcons.filter('.book_right').click(function(e) {
        self.ttsStop();
        self.right();
        return false;
    });

    jIcons.filter('.zoom_in').bind('click', function() {
        self.ttsStop();
        self.zoom(1);
        return false;
    });

    jIcons.filter('.zoom_out').bind('click', function() {
        self.ttsStop();
        self.zoom(-1);
        return false;
    });

    this.initSwipeData();

    $(document).off('mousemove.navigation', '#BookReader');
    $(document).on(
      'mousemove.navigation',
      '#BookReader',
      { 'br': this },
      this.navigationMousemoveHandler
    );

    $(document).off('mousedown.swipe', '.BRpageimage');
    $(document).on(
      'mousedown.swipe',
      '.BRpageimage',
      { 'br': this },
      this.swipeMousedownHandler
    );

    this.bindMozTouchHandlers();
}

// unbindNavigationHandlers
//______________________________________________________________________________
// Unbind navigation handlers
BookReader.prototype.unbindNavigationHandlers = function() {
    $(document).off('mousemove.navigation', '#BookReader');
}

// navigationMousemoveHandler
//______________________________________________________________________________
// Handle mousemove related to navigation.  Bind at #BookReader level to allow autohide.
BookReader.prototype.navigationMousemoveHandler = function(event) {
    // $$$ possibly not great to be calling this for every mousemove

    if (event.data['br'].uiAutoHide) {
        var navkey = $(document).height() - 75;
        if ((event.pageY < 76) || (event.pageY > navkey)) {
            // inside or near navigation elements
            event.data['br'].hideNavigation();
        } else {
            event.data['br'].showNavigation();
        }
    }
}

BookReader.prototype.initSwipeData = function(clientX, clientY) {
    /*
     * Based on the really quite awesome "Today's Guardian" at http://guardian.gyford.com/
     */
    this._swipe = {
        mightBeSwiping: false,
        didSwipe: false,
        mightBeDraggin: false,
        didDrag: false,
        startTime: (new Date).getTime(),
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastY: clientY,
        deltaX: 0,
        deltaY: 0,
        deltaT: 0
    }
}

BookReader.prototype.swipeMousedownHandler = function(event) {
    //console.log('swipe mousedown');
    //console.log(event);

    var self = event.data['br'];

    // We should be the last bubble point for the page images
    // Disable image drag and select, but keep right-click
    if (event.which == 3) {
        if (self.protected) {
            return false;
        }
        return true;
    }

    $(event.target).bind('mouseout.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mouseup.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mousemove.swipe',
        { 'br': self },
        self.swipeMousemoveHandler
    );

    self.initSwipeData(event.clientX, event.clientY);
    self._swipe.mightBeSwiping = true;
    self._swipe.mightBeDragging = true;

    event.preventDefault();
    event.returnValue  = false;
    event.cancelBubble = true;
    return false;
}

BookReader.prototype.swipeMousemoveHandler = function(event) {
    //console.log('swipe move ' + event.clientX + ',' + event.clientY);

    var _swipe = event.data['br']._swipe;
    if (! _swipe.mightBeSwiping) {
        return;
    }

    // Update swipe data
    _swipe.deltaX = event.clientX - _swipe.startX;
    _swipe.deltaY = event.clientY - _swipe.startY;
    _swipe.deltaT = (new Date).getTime() - _swipe.startTime;

    var absX = Math.abs(_swipe.deltaX);
    var absY = Math.abs(_swipe.deltaY);

    // Minimum distance in the amount of tim to trigger the swipe
    var minSwipeLength = Math.min($('#BookReader').width() / 5, 80);
    var maxSwipeTime = 400;

    // Check for horizontal swipe
    if (absX > absY && (absX > minSwipeLength) && _swipe.deltaT < maxSwipeTime) {
        //console.log('swipe! ' + _swipe.deltaX + ',' + _swipe.deltaY + ' ' + _swipe.deltaT + 'ms');

        _swipe.mightBeSwiping = false; // only trigger once
        _swipe.didSwipe = true;
        if (event.data['br'].mode == event.data['br'].constMode2up) {
            if (_swipe.deltaX < 0) {
                event.data['br'].right();
            } else {
                event.data['br'].left();
            }
        }
    }

    if ( _swipe.deltaT > maxSwipeTime && !_swipe.didSwipe) {
        if (_swipe.mightBeDragging) {
            // Dragging
            _swipe.didDrag = true;
            $('#BRcontainer')
            .scrollTop($('#BRcontainer').scrollTop() - event.clientY + _swipe.lastY)
            .scrollLeft($('#BRcontainer').scrollLeft() - event.clientX + _swipe.lastX);
        }
    }
    _swipe.lastX = event.clientX;
    _swipe.lastY = event.clientY;

    event.preventDefault();
    event.returnValue  = false;
    event.cancelBubble = true;
    return false;
}
BookReader.prototype.swipeMouseupHandler = function(event) {
    var _swipe = event.data['br']._swipe;
    //console.log('swipe mouseup - did swipe ' + _swipe.didSwipe);
    _swipe.mightBeSwiping = false;
    _swipe.mightBeDragging = false;

    $(event.target).unbind('mouseout.swipe').unbind('mouseup.swipe').unbind('mousemove.swipe');

    if (_swipe.didSwipe || _swipe.didDrag) {
        // Swallow event if completed swipe gesture
        event.preventDefault();
        event.returnValue  = false;
        event.cancelBubble = true;
        return false;
    }
    return true;
}
BookReader.prototype.bindMozTouchHandlers = function() {
    var self = this;

    // Currently only want touch handlers in 2up
    $('#BookReader').bind('MozTouchDown', function(event) {
        //console.log('MozTouchDown ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode == this.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchMove', function(event) {
        //console.log('MozTouchMove - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY)
        if (this.mode == this.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchUp', function(event) {
        //console.log('MozTouchUp - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode == this.constMode2up) {
            event.preventDefault();
        }
    });
}

// navigationIsVisible
//______________________________________________________________________________
// Returns true if the navigation elements are currently visible
BookReader.prototype.navigationIsVisible = function() {
    // $$$ doesn't account for transitioning states, nav must be fully visible to return true
    var toolpos = $('#BRtoolbar').offset();
    var tooltop = toolpos.top;
    if (tooltop == 0) {
        return true;
    }
    return false;
}

// hideNavigation
//______________________________________________________________________________
// Hide navigation elements, if visible
BookReader.prototype.hideNavigation = function() {
    // Check if navigation is showing
    if (this.navigationIsVisible()) {
        // $$$ don't hardcode height
        $('#BRtoolbar').animate({top:-60});
        $('#BRnav').animate({bottom:-60});
        //$('#BRzoomer').animate({right:-26});
    }
}

// showNavigation
//______________________________________________________________________________
// Show navigation elements
BookReader.prototype.showNavigation = function() {
    // Check if navigation is hidden
    if (!this.navigationIsVisible()) {
        $('#BRtoolbar').animate({top:0});
        $('#BRnav').animate({bottom:0});
        //$('#BRzoomer').animate({right:0});
    }
}

// changeArrow
//______________________________________________________________________________
// Change the nav bar arrow
function changeArrow(){
    setTimeout(function(){
        $('#BRnavCntlBtm').removeClass('BRdn').addClass('BRup');
    },3000);
};


// firstDisplayableIndex
//______________________________________________________________________________
// Returns the index of the first visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.firstDisplayableIndex = function() {
    if (this.mode != this.constMode2up) {
        return 0;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(0) == 'L') {
            return 0;
        } else {
            return -1;
        }
    } else {
        // RTL
        if (this.getPageSide(0) == 'R') {
            return 0;
        } else {
            return -1;
        }
    }
}

// lastDisplayableIndex
//______________________________________________________________________________
// Returns the index of the last visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as pa  rt of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.lastDisplayableIndex = function() {

    var lastIndex = this.numLeafs - 1;

    if (this.mode != this.constMode2up) {
        return lastIndex;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(lastIndex) == 'R') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    } else {
        // RTL
        if (this.getPageSide(lastIndex) == 'L') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    }
}


// shortTitle(maximumCharacters)
//________
// Returns a shortened version of the title with the maximum number of characters
BookReader.prototype.shortTitle = function(maximumCharacters) {
    if (this.bookTitle.length < maximumCharacters) {
        return this.bookTitle;
    }

    var title = this.bookTitle.substr(0, maximumCharacters - 3);
    title += '...';
    return title;
}

// Parameter related functions

// updateFromParams(params)
//________
// Update ourselves from the params object.
//
// e.g. this.updateFromParams(this.paramsFromFragment(window.location.hash))
BookReader.prototype.updateFromParams = function(params) {
    if ('undefined' != typeof(params.mode)) {
        this.switchMode(params.mode);
    }

    // process /search
    if ('undefined' != typeof(params.searchTerm)) {
        if (this.searchTerm != params.searchTerm) {
            this.search(params.searchTerm, true);
        }
    }

    // $$$ process /zoom

    // We only respect page if index is not set
    if ('undefined' != typeof(params.index)) {
        if (params.index != this.currentIndex()) {
            this.jumpToIndex(params.index);
        }
    } else if ('undefined' != typeof(params.page)) {
        // $$$ this assumes page numbers are unique
        if (params.page != this.getPageNum(this.currentIndex())) {
            this.jumpToPage(params.page);
        }
    }

    // $$$ process /region
    // $$$ process /highlight

    // $$$ process /theme
    if ('undefined' != typeof(params.theme)) {
        this.updateTheme(params.theme);
    }
}

// paramsFromFragment(urlFragment)
//________
// Returns a object with configuration parametes from a URL fragment.
//
// E.g paramsFromFragment(window.location.hash)
BookReader.prototype.paramsFromFragment = function(urlFragment) {
    // URL fragment syntax specification: http://openlibrary.org/dev/docs/bookurls

    var params = {};

    // For convenience we allow an initial # character (as from window.location.hash)
    // but don't require it
    if (urlFragment.substr(0,1) == '#') {
        urlFragment = urlFragment.substr(1);
    }

    // Simple #nn syntax
    var oldStyleLeafNum = parseInt( /^\d+$/.exec(urlFragment) );
    if ( !isNaN(oldStyleLeafNum) ) {
        params.index = oldStyleLeafNum;

        // Done processing if using old-style syntax
        return params;
    }

    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }

    // Mode
    if ('1up' == urlHash['mode']) {
        params.mode = this.constMode1up;
    } else if ('2up' == urlHash['mode']) {
        params.mode = this.constMode2up;
    } else if ('thumb' == urlHash['mode']) {
        params.mode = this.constModeThumb;
    }

    // Index and page
    if ('undefined' != typeof(urlHash['page'])) {
        // page was set -- may not be int
        params.page = urlHash['page'];
    }
    if ('undefined' != typeof(urlHash['pages']))
        br.numLeafs = +urlHash['pages'];
    if ('undefined' != typeof(urlHash['dir']))
        br.scansDir = urlHash['dir'];
    if ('undefined' != typeof(urlHash['ext']))
        br.ext = urlHash['ext'];

    // $$$ process /region
    // $$$ process /search

    if (urlHash['search'] != undefined) {
        params.searchTerm = BookReader.util.decodeURIComponentPlus(urlHash['search']);
    }

    // $$$ process /highlight

    // $$$ process /theme
    if (urlHash['theme'] != undefined) {
        params.theme = urlHash['theme']
    }

    return params;
}

// paramsFromCurrent()
//________
// Create a params object from the current parameters.
BookReader.prototype.paramsFromCurrent = function() {

    var params = {};

    var index = this.currentIndex();
    var pageNum = this.getPageNum(index);
    if ((pageNum === 0) || pageNum) {
        params.page = pageNum;
    }

    params.index = index;
    params.mode = this.mode;

    // $$$ highlight
    // $$$ region

    // search
    if (this.searchHighlightVisible()) {
        params.searchTerm = this.searchTerm;
    }

    return params;
}

// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
BookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];

    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        if ('undefined' != typeof(params.index)) {
            // Don't have page numbering but we do have the index
            fragments.push('page', 'n' + params.index);
        }
    }

    // $$$ highlight
    // $$$ region

    // mode
    if ('undefined' != typeof(params.mode)) {
        if (params.mode == this.constMode1up) {
            fragments.push('mode', '1up');
        } else if (params.mode == this.constMode2up) {
            fragments.push('mode', '2up');
        } else if (params.mode == this.constModeThumb) {
            fragments.push('mode', 'thumb');
        } else {
            throw 'fragmentFromParams called with unknown mode ' + params.mode;
        }
    }

    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }

    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}

// getPageIndex(pageNum)
//________
// Returns the *highest* index the given page number, or undefined
BookReader.prototype.getPageIndex = function(pageNum) {
    var pageIndices = this.getPageIndices(pageNum);

    if (pageIndices.length > 0) {
        return pageIndices[pageIndices.length - 1];
    }

    return undefined;
}

// getPageIndices(pageNum)
//________
// Returns an array (possibly empty) of the indices with the given page number
BookReader.prototype.getPageIndices = function(pageNum) {
    var indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
        try {
            var pageIntStr = pageNum.slice(1, pageNum.length);
            var pageIndex = parseInt(pageIntStr);
            indices.push(pageIndex);
            return indices;
        } catch(err) {
            // Do nothing... will run through page names and see if one matches
        }
    }

    var i;
    for (i=0; i<this.numLeafs; i++) {
        if (this.getPageNum(i) == pageNum) {
            indices.push(i);
        }
    }

    return indices;
}

// getPageName(index)
//________
// Returns the name of the page as it should be displayed in the user interface
BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
}

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace
BookReader.prototype.updateLocationHash = function() {
    var newHash = '#' + this.fragmentFromParams(this.paramsFromCurrent());
    window.location.replace(newHash);

    // Send an analytics event if the location hash is changed (page flip or mode change),
    // which indicates that the user is actively reading the book. This will cause the
    // archive.org download count for this book to increment.
    // Note that users with Adblock Plus will not send data to analytics.archive.org
    if (typeof(archive_analytics) != 'undefined') {
        if (this.oldLocationHash != newHash) {
            var values = {
                'bookreader': 'user_changed_view',
                'itemid': this.bookId,
                'cache_bust': Math.random()
            }
            // EEK!  offsite embedding and /details/ page books look the same in analytics, otherwise!
            values.offsite=1;
            values.details=0;
            try{
              values.offsite=(                     window.top.location.hostname.match(/\.archive.org$/) ? 0 : 1);
              values.details=(!values.offsite  &&  window.top.location.pathname.match(/^\/details\//)   ? 1 : 0);
            } catch (e){} //avoids embed cross site exceptions -- but on (+) side, means it is and keeps marked offite!

            archive_analytics.send_ping(values, null, 'augment_for_ao_site');
        }
    }

    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}


// setupHashListener
//________
// Listens to the window.hashchange event to detect hash fragment changes
BookReader.prototype.setupHashListener = function() {
    // return // isn't really needed.
    var self = this; // remember who I am

    window.onhashchange = function(ev) {
        var oldHash = ev.oldURL.slice(ev.oldURL.indexOf('#'));
        var newHash = window.location.hash;
        if (newHash == oldHash)
            return;

        self.ttsStop();

        // Queue change if animating
        if (self.animating) {
            self.autoStop();
            self.animationFinishedCallback = function() {
                self.updateFromParams(self.paramsFromFragment(newHash));
            }
        } else { // update immediately
            self.updateFromParams(self.paramsFromFragment(newHash));
        }
    };
}

// canSwitchToMode
//________
// Returns true if we can switch to the requested mode
BookReader.prototype.canSwitchToMode = function(mode) {
    if (mode == this.constMode2up || mode == this.constModeThumb) {
        // check there are enough pages to display
        // $$$ this is a workaround for the mis-feature that we can't display
        //     short books in 2up mode
        if (this.numLeafs < 2) {
            return false;
        }
    }

    return true;
}

// _getPageWidth
//--------
// Returns the page width for the given index, or first or last page if out of range
BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageWidth(index);
}

// _getPageHeight
//--------
// Returns the page height for the given index, or first or last page if out of range
BookReader.prototype._getPageHeight= function(index) {
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageHeight(index);
}

// _getPageURI
//--------
// Returns the page URI or transparent image if out of range
BookReader.prototype._getPageURI = function(index, reduce, rotate) {
    if (index < 0 || index >= this.numLeafs) { // Synthesize page
        return this.imagesBaseURL + "transparent.png";
    }

    if ('undefined' == typeof(reduce)) {
        // reduce not passed in
        // $$$ this probably won't work for thumbnail mode
        var ratio = this.getPageHeight(index) / this.twoPage.height;
        var scale;
        // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
        if (ratio < 2) {
            scale = 1;
        } else if (ratio < 4) {
            scale = 2;
        } else if (ratio < 8) {
            scale = 4;
        } else if (ratio < 16) {
            scale = 8;
        } else  if (ratio < 32) {
            scale = 16;
        } else {
            scale = 32;
        }
        reduce = scale;
    }

    return this.getPageURI(index, reduce, rotate);
}

// Library functions
BookReader.util = {
    disableSelect: function(jObject) {
        // Bind mouse handlers
        // Disable mouse click to avoid selected/highlighted page images - bug 354239
        jObject.bind('mousedown', function(e) {
            // $$$ check here for right-click and don't disable.  Also use jQuery style
            //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
            return false;
        });
        // Special hack for IE7
        jObject[0].onselectstart = function(e) { return false; };
    },

    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Given value and maximum, calculate a percentage suitable for CSS
    cssPercentage: function(value, max) {
        return (((value + 0.0) / max) * 100) + '%';
    },

    notInArray: function(value, array) {
        // inArray returns -1 or undefined if value not in array
        return ! (jQuery.inArray(value, array) >= 0);
    },

    getIFrameDocument: function(iframe) {
        // Adapted from http://xkr.us/articles/dom/iframe-document/
        var outer = (iframe.contentWindow || iframe.contentDocument);
        return (outer.document || outer);
    },

    escapeHTML: function (str) {
        return(
            str.replace(/&/g,'&amp;').
                replace(/>/g,'&gt;').
                replace(/</g,'&lt;').
                replace(/"/g,'&quot;')
        );
    },

    decodeURIComponentPlus: function(value) {
        // Decodes a URI component and converts '+' to ' '
        return decodeURIComponent(value).replace(/\+/g, ' ');
    },

    encodeURIComponentPlus: function(value) {
        // Encodes a URI component and converts ' ' to '+'
        return encodeURIComponent(value).replace(/%20/g, '+');
    }
    // The final property here must NOT have a comma after it - IE7
}

BookReader.prototype.updateSearchHilites = function() {};
BookReader.prototype.removeSearchHilites = function() {};
BookReader.prototype.updateTheme = function(theme) {}
BookReader.prototype.searchHighlightVisible = function() {};
BookReader.prototype.ttsStop = function() {};
BookReader.prototype.initUIStrings = function() {}

BookReader.prototype.getPageNum = function(index) {
  return index+1;
}
BookReader.prototype.getPageSide = function(index) {
    return index % 2 === 0 ? 'R' : 'L';
}
// This function returns the left and right indices for the user-visible
// spread that contains the given index.  The return values may be
// null if there is no facing page or the index is invalid.
BookReader.prototype.getSpreadIndices = function(pindex) {
    var spreadIndices = [null, null];
    if ('rl' == this.pageProgression) {
        // Right to Left
        if (this.getPageSide(pindex) == 'R') {
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex + 1;
        } else {
            // Given index was LHS
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex - 1;
        }
    } else {
        // Left to right
        if (this.getPageSide(pindex) == 'L') {
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex + 1;
        } else {
            // Given index was RHS
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex - 1;
        }
    }

    return spreadIndices;
}

})(jQuery);

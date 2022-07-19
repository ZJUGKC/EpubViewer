# EpubViewer

A tool for viewing epub file.

## Third-party software

The third-party software packages are listed as follows:

* jQuery

	https://code.jquery.com/

	https://code.jquery.com/jquery-3.6.0.min.js

* jszip

	https://www.bootcdn.cn/jszip/

	https://cdn.bootcdn.net/ajax/libs/jszip/3.10.0/jszip.min.js

* epub.js

	https://cdn.jsdelivr.net/npm/epubjs/dist/

	https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js

* screenfull

	https://cdnjs.com/libraries/screenfull.js

	https://cdnjs.cloudflare.com/ajax/libs/screenfull.js/5.2.0/screenfull.min.js

	https://github.com/sindresorhus/screenfull.js

## Usage

Compress the folder `EpubReader` to a zip file,
which can be loaded into `Chrome` or `FireFox` as an extension file.

## FireFox

If the content of epub file cannot be displayed correctly,
you can open a url `about:config` and change the value of variable `security.csp.enable`
from `true` to `false`.

## Problems

* The API `cfiFromPercentage` may not work properly for inputting percentage
or clicking the slider bar.

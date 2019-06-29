/*
** Xin YUAN, 2019, BSD (2)
*/

/*
Author: Zhang Xingyu
*/

var isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;

// for Firefox
if (isFirefox) {
    browser.browserAction.onClicked.addListener(
        function () {
            var url = browser.runtime.getURL('src/index.html');
            browser.tabs.create({
                url: url
            });
        }
    );
} else {
    // for Chrome
    chrome.browserAction.onClicked.addListener(
        function () {
            var url = chrome.runtime.getURL('src/index.html');
            chrome.tabs.create({
                url: url
            });
        }
    );
}

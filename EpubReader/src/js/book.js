(function (log, win) {
    var bookDB = win.bookDB = {};
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var thisdb;

    var request = indexedDB.open("books");

    bookDB.open = function (success, error) {
        var request = indexedDB.open("books");

        request.onsuccess = function (e) {
            thisdb = e.target.result;
            success(thisdb);
        };

        request.onerror = error;
    };

    bookDB.addBook = function (book, success, error) {

        var t = thisdb.transaction('books', 'readwrite');
        var store = t.objectStore('books');
        var req = store.put(book);

        req.onsuccess = success ;
        req.onerror = error ;
    };

    bookDB.deleteBookWithKey = function (key, success, error) {

        var t = thisdb.transaction('books', 'readwrite');
        var store = t.objectStore('books');
        var req = store.delete(key);

        req.onsuccess = success ;
        req.onerror = error ;
    };

    bookDB.getBookWithKey = function (key, success, error) {

        var t = thisdb.transaction('books', 'readonly');
        var store = t.objectStore('books');
        var req = store.get(key);

        if (success) {
            req.onsuccess = function (e) {
                success(e.target.result);
            };
        }

        req.onerror = error ;
    };

    bookDB.getAll = function (success, error) {
        var t = thisdb.transaction('books', 'readonly');
        var store = t.objectStore('books');
        var req = store.openCursor();
        var result = [];

        req.onsuccess = function (e) {
            var cursor = e.target.result;

            if (cursor) {
                result.push(cursor.value);
                cursor.continue();
            } else {
                success(result);
            }
        };

        req.onerror = error ;
    };

    //版本不一致时
    request.onupgradeneeded = function (event) {
        thisdb = request.result;
         if(!thisdb.objectStoreNames.contains("books")) {
            thisdb.createObjectStore('books', {
                keyPath: 'key'
            });
            thisdb.close();
        }
    };
   

}(window.console.log, window));
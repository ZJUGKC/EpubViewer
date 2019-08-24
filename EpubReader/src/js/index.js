/*
** Xin YUAN, 2019, BSD (2)
*/

/*
Author: Zhang Xingyu

Book Page
*/

function Book(key, name, content) {
    this.key = key;
    this.name = name;
    this.content = content;
}

window.onload = function () {
    bookDB.open(function () {
        bookDB.getAll(
            function (books) {
                books.forEach(function (book) {
                    addBookToPage(book);
                });
            });
    });
};

document.getElementById('getLocal')
    .addEventListener('click', function(e){
        document.getElementById('add-book').click();
    });

document.getElementById('add-book')
    .addEventListener('change', function (e) {

        var firstFile = e.target.files[0];
        var name = firstFile.name;

        if (window.FileReader) {
            var reader = new FileReader();

            reader.readAsArrayBuffer(firstFile);

            reader.onload = function (e) {
                bookInfo = new Book(name, name, e.target.result);
                addBookToPage(bookInfo);

                bookDB.open();
                bookDB.addBook(bookInfo);

            }.bind(this);
        }
    });

document.getElementById('getCloud')
    .addEventListener('click', function (e) {
        var style = document.getElementById('cloud-book').style.display;
        if (style === "" || style === "none") {
            document.getElementById('cloud-book').style.display = "block";
        } else {
            document.getElementById('cloud-book').style.display = "none";
        }
    });

document.getElementById('cloud-book')
    .addEventListener('keypress', function (e) {
        if (e.keyCode === 13) {
            var url = document.getElementById('cloud-book').value;
            location.href = "reader.html?book=" + url;
        }
    }, true);

document.getElementsByClassName('book-list')[0]
    .addEventListener('click', function (e) {
        var target = e.target;
        var parent = this;
        var index1 = target.className.baseVal.indexOf('delete');
        var index2 = target.parentNode.className.baseVal.indexOf('delete');

        if (index1 >= 0) {
            console.log('index1');
            var book = target.parentNode.parentNode.parentNode.parentNode.parentNode;
            console.log(book);
            bookDB.open(
                function () {
                    var md5 = book.getAttribute('data-key');
                    bookDB.deleteBookWithKey(md5,
                        function () {
                            parent.removeChild(book);
                        }
                    );
                }
            );
        } else if (index2 >= 0) {
            console.log('index2');
            var book = target.parentNode.parentNode.parentNode.parentNode.parentNode;
            console.log(book);

            bookDB.open(
                function () {
                    var md5 = book.getAttribute('data-key');
                    bookDB.deleteBookWithKey(md5,
                        function () {
                            parent.removeChild(book);
                        }
                    );
                }
            );
        }
    });

document.getElementsByClassName('book-list')[0]
    .addEventListener('click', function (e) {
        var target = e.target;
        var index=target.className.indexOf('open-book');
        if (index >= 0) {
            var book = target.parentNode.parentNode.parentNode.parentNode;
            localStorage.setItem('key', book.getAttribute('data-key')); 
            //location.href = 'reader.html';
            window.open('reader.html');
        }
    });

function addBookToPage(obj) {

    var list = document.getElementsByClassName('book-list')[0];
    var book = document.createElement('div');

    var str1 = '<div class="book-head background"><div class="cover"><div class="cover-border"><div class="book-title">';
    var str2 = '</div></div></div><div class="mask-content"><div class="mak-top clear"><svg class="icon-delete " title="delete" viewBox="0 0 24 24" ><path class="svgpath" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg></div><div class="mask-bottom"><button class="open-book btn-flat"> </button></div></div><div class="mask"></div></div><div class="book-body"></div><div class="book-control"></div>';

    book.className = 'book';
    book.setAttribute('data-key', obj.key);
    book.setAttribute('book-name', obj.name);

    book.innerHTML = str1 + obj.name + str2;
    list.appendChild(book);
}

/*
** Xin YUAN, 2019, BSD (2)
*/

/*
Author: Zhang Xingyu

Reader functions

Reviser: Qian Chengliang
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (factory((global.RSVP = global.RSVP || {})));
}(this, (function (exports) {
    'use strict';

    function indexOf(callbacks, callback) {
        for (var i = 0, l = callbacks.length; i < l; i++) {
            if (callbacks[i] === callback) {
                return i;
            }
        }

        return -1;
    }

    function callbacksFor(object) {
        var callbacks = object._promiseCallbacks;

        if (!callbacks) {
            callbacks = object._promiseCallbacks = {};
        }

        return callbacks;
    }

    /**
     @class RSVP.EventTarget
     */
    var EventTarget = {

        /**
         `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
         Example:
         ```javascript
         let object = {};
         RSVP.EventTarget.mixin(object);
         object.on('finished', function(event) {
      // handle event
    });
         object.trigger('finished', { detail: value });
         ```
         `EventTarget.mixin` also works with prototypes:
         ```javascript
         let Person = function() {};
         RSVP.EventTarget.mixin(Person.prototype);
         let yehuda = new Person();
         let tom = new Person();
         yehuda.on('poke', function(event) {
      console.log('Yehuda says OW');
    });
         tom.on('poke', function(event) {
      console.log('Tom says OW');
    });
         yehuda.trigger('poke');
         tom.trigger('poke');
         ```
         @method mixin
         @for RSVP.EventTarget
         @private
         @param {Object} object object to extend with EventTarget methods
         */
        mixin: function (object) {
            object['on'] = this['on'];
            object['off'] = this['off'];
            object['trigger'] = this['trigger'];
            object._promiseCallbacks = undefined;
            return object;
        },


        /**
         Registers a callback to be executed when `eventName` is triggered
         ```javascript
         object.on('event', function(eventInfo){
      // handle the event
    });
         object.trigger('event');
         ```
         @method on
         @for RSVP.EventTarget
         @private
         @param {String} eventName name of the event to listen for
         @param {Function} callback function to be called when the event is triggered.
         */
        on: function (eventName, callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('Callback must be a function');
            }

            var allCallbacks = callbacksFor(this),
                callbacks = void 0;

            callbacks = allCallbacks[eventName];

            if (!callbacks) {
                callbacks = allCallbacks[eventName] = [];
            }

            if (indexOf(callbacks, callback) === -1) {
                callbacks.push(callback);
            }
        },


        /**
         You can use `off` to stop firing a particular callback for an event:
         ```javascript
         function doStuff() { // do stuff! }
         object.on('stuff', doStuff);
         object.trigger('stuff'); // doStuff will be called
         // Unregister ONLY the doStuff callback
         object.off('stuff', doStuff);
         object.trigger('stuff'); // doStuff will NOT be called
         ```
         If you don't pass a `callback` argument to `off`, ALL callbacks for the
         event will not be executed when the event fires. For example:
         ```javascript
         let callback1 = function(){};
         let callback2 = function(){};
         object.on('stuff', callback1);
         object.on('stuff', callback2);
         object.trigger('stuff'); // callback1 and callback2 will be executed.
         object.off('stuff');
         object.trigger('stuff'); // callback1 and callback2 will not be executed!
         ```
         @method off
         @for RSVP.EventTarget
         @private
         @param {String} eventName event to stop listening to
         @param {Function} callback optional argument. If given, only the function
         given will be removed from the event's callback queue. If no `callback`
         argument is given, all callbacks will be removed from the event's callback
         queue.
         */
        off: function (eventName, callback) {
            var allCallbacks = callbacksFor(this),
                callbacks = void 0,
                index = void 0;

            if (!callback) {
                allCallbacks[eventName] = [];
                return;
            }

            callbacks = allCallbacks[eventName];

            index = indexOf(callbacks, callback);

            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        },


        /**
         Use `trigger` to fire custom events. For example:
         ```javascript
         object.on('foo', function(){
      console.log('foo event happened!');
    });
         object.trigger('foo');
         // 'foo event happened!' logged to the console
         ```
         You can also pass a value as a second argument to `trigger` that will be
         passed as an argument to all event listeners for the event:
         ```javascript
         object.on('foo', function(value){
      console.log(value.name);
    });
         object.trigger('foo', { name: 'bar' });
         // 'bar' logged to the console
         ```
         @method trigger
         @for RSVP.EventTarget
         @private
         @param {String} eventName name of the event to be triggered
         @param {*} options optional value to be passed to any event handlers for
         the given `eventName`
         */
        trigger: function (eventName, options, label) {
            var allCallbacks = callbacksFor(this),
                callbacks = void 0,
                callback = void 0;

            if (callbacks = allCallbacks[eventName]) {
                // Don't cache the callbacks.length since it may grow
                for (var i = 0; i < callbacks.length; i++) {
                    callback = callbacks[i];

                    callback(options, label);
                }
            }
        }
    };


    var config = {
        instrument: false
    };

    EventTarget['mixin'](config);

    function configure(name, value) {
        if (arguments.length === 2) {
            config[name] = value;
        } else {
            return config[name];
        }
    }

    function objectOrFunction(x) {
        var type = typeof x;
        return x !== null && (type === 'object' || type === 'function');
    }

    function isFunction(x) {
        return typeof x === 'function';
    }

    function isObject(x) {
        return x !== null && typeof x === 'object';
    }

    function isMaybeThenable(x) {
        return x !== null && typeof x === 'object';
    }

    var _isArray = void 0;
    if (Array.isArray) {
        _isArray = Array.isArray;
    } else {
        _isArray = function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        };
    }

    var isArray = _isArray;

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function () {
        return new Date().getTime();
    };

    var queue = [];

    function scheduleFlush() {
        setTimeout(function () {
            for (var i = 0; i < queue.length; i++) {
                var entry = queue[i];

                var payload = entry.payload;

                payload.guid = payload.key + payload.id;
                payload.childGuid = payload.key + payload.childId;
                if (payload.error) {
                    payload.stack = payload.error.stack;
                }

                config['trigger'](entry.name, entry.payload);
            }
            queue.length = 0;
        }, 50);
    }

    function instrument(eventName, promise, child) {
        if (1 === queue.push({
            name: eventName,
            payload: {
                key: promise._guidKey,
                id: promise._id,
                eventName: eventName,
                detail: promise._result,
                childId: child && child._id,
                label: promise._label,
                timeStamp: now(),
                error: config["instrument-with-stack"] ? new Error(promise._label) : null
            }
        })) {
            scheduleFlush();
        }
    }

    /**
     `RSVP.Promise.resolve` returns a promise that will become resolved with the
     passed `value`. It is shorthand for the following:

     ```javascript
     let promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

     promise.then(function(value){
    // value === 1
  });
     ```

     Instead of writing the above, your code now simply becomes the following:

     ```javascript
     let promise = RSVP.Promise.resolve(1);

     promise.then(function(value){
    // value === 1
  });
     ```

     @method resolve
     @static
     @param {*} object value that the returned promise will be resolved with
     @param {String} label optional string for identifying the returned promise.
     Useful for tooling.
     @return {Promise} a promise that will become fulfilled with the given
     `value`
     */
    function resolve$1(object, label) {
        /*jshint validthis:true */
        var Constructor = this;

        if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
        }

        var promise = new Constructor(noop, label);
        resolve(promise, object);
        return promise;
    }

    function withOwnPromise() {
        return new TypeError('A promises callback cannot return that same promise.');
    }

    function noop() {
    }

    var PENDING = void 0;
    var FULFILLED = 1;
    var REJECTED = 2;

    var GET_THEN_ERROR = new ErrorObject();

    function getThen(promise) {
        try {
            return promise.then;
        } catch (error) {
            GET_THEN_ERROR.error = error;
            return GET_THEN_ERROR;
        }
    }

    function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
        try {
            then$$1.call(value, fulfillmentHandler, rejectionHandler);
        } catch (e) {
            return e;
        }
    }

    function handleForeignThenable(promise, thenable, then$$1) {
        config.async(function (promise) {
            var sealed = false;
            var error = tryThen(then$$1, thenable, function (value) {
                if (sealed) {
                    return;
                }
                sealed = true;
                if (thenable !== value) {
                    resolve(promise, value, undefined);
                } else {
                    fulfill(promise, value);
                }
            }, function (reason) {
                if (sealed) {
                    return;
                }
                sealed = true;

                reject(promise, reason);
            }, 'Settle: ' + (promise._label || ' unknown promise'));

            if (!sealed && error) {
                sealed = true;
                reject(promise, error);
            }
        }, promise);
    }

    function handleOwnThenable(promise, thenable) {
        if (thenable._state === FULFILLED) {
            fulfill(promise, thenable._result);
        } else if (thenable._state === REJECTED) {
            thenable._onError = null;
            reject(promise, thenable._result);
        } else {
            subscribe(thenable, undefined, function (value) {
                if (thenable !== value) {
                    resolve(promise, value, undefined);
                } else {
                    fulfill(promise, value);
                }
            }, function (reason) {
                return reject(promise, reason);
            });
        }
    }

    function handleMaybeThenable(promise, maybeThenable, then$$1) {
        var isOwnThenable = maybeThenable.constructor === promise.constructor && then$$1 === then && promise.constructor.resolve === resolve$1;

        if (isOwnThenable) {
            handleOwnThenable(promise, maybeThenable);
        } else if (then$$1 === GET_THEN_ERROR) {
            reject(promise, GET_THEN_ERROR.error);
            GET_THEN_ERROR.error = null;
        } else if (isFunction(then$$1)) {
            handleForeignThenable(promise, maybeThenable, then$$1);
        } else {
            fulfill(promise, maybeThenable);
        }
    }

    function resolve(promise, value) {
        if (promise === value) {
            fulfill(promise, value);
        } else if (objectOrFunction(value)) {
            handleMaybeThenable(promise, value, getThen(value));
        } else {
            fulfill(promise, value);
        }
    }

    function publishRejection(promise) {
        if (promise._onError) {
            promise._onError(promise._result);
        }

        publish(promise);
    }

    function fulfill(promise, value) {
        if (promise._state !== PENDING) {
            return;
        }

        promise._result = value;
        promise._state = FULFILLED;

        if (promise._subscribers.length === 0) {
            if (config.instrument) {
                instrument('fulfilled', promise);
            }
        } else {
            config.async(publish, promise);
        }
    }

    function reject(promise, reason) {
        if (promise._state !== PENDING) {
            return;
        }
        promise._state = REJECTED;
        promise._result = reason;
        config.async(publishRejection, promise);
    }

    function subscribe(parent, child, onFulfillment, onRejection) {
        var subscribers = parent._subscribers;
        var length = subscribers.length;

        parent._onError = null;

        subscribers[length] = child;
        subscribers[length + FULFILLED] = onFulfillment;
        subscribers[length + REJECTED] = onRejection;

        if (length === 0 && parent._state) {
            config.async(publish, parent);
        }
    }

    function publish(promise) {
        var subscribers = promise._subscribers;
        var settled = promise._state;

        if (config.instrument) {
            instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
        }

        if (subscribers.length === 0) {
            return;
        }

        var child = void 0,
            callback = void 0,
            result = promise._result;

        for (var i = 0; i < subscribers.length; i += 3) {
            child = subscribers[i];
            callback = subscribers[i + settled];

            if (child) {
                invokeCallback(settled, child, callback, result);
            } else {
                callback(result);
            }
        }

        promise._subscribers.length = 0;
    }

    function ErrorObject() {
        this.error = null;
    }

    var TRY_CATCH_ERROR = new ErrorObject();

    function tryCatch(callback, result) {
        try {
            return callback(result);
        } catch (e) {
            TRY_CATCH_ERROR.error = e;
            return TRY_CATCH_ERROR;
        }
    }

    function invokeCallback(state, promise, callback, result) {
        var hasCallback = isFunction(callback);
        var value = void 0,
            error = void 0;

        if (hasCallback) {
            value = tryCatch(callback, result);

            if (value === TRY_CATCH_ERROR) {
                error = value.error;
                value.error = null; // release
            } else if (value === promise) {
                reject(promise, withOwnPromise());
                return;
            }
        } else {
            value = result;
        }

        if (promise._state !== PENDING) {
            // noop
        } else if (hasCallback && error === undefined) {
            resolve(promise, value);
        } else if (error !== undefined) {
            reject(promise, error);
        } else if (state === FULFILLED) {
            fulfill(promise, value);
        } else if (state === REJECTED) {
            reject(promise, value);
        }
    }

    function initializePromise(promise, resolver) {
        var resolved = false;
        try {
            resolver(function (value) {
                if (resolved) {
                    return;
                }
                resolved = true;
                resolve(promise, value);
            }, function (reason) {
                if (resolved) {
                    return;
                }
                resolved = true;
                reject(promise, reason);
            });
        } catch (e) {
            reject(promise, e);
        }
    }

    function then(onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;

        if (state === FULFILLED && !onFulfillment || state === REJECTED && !onRejection) {
            config.instrument && instrument('chained', parent, parent);
            return parent;
        }

        parent._onError = null;

        var child = new parent.constructor(noop, label);
        var result = parent._result;

        config.instrument && instrument('chained', parent, child);

        if (state === PENDING) {
            subscribe(parent, child, onFulfillment, onRejection);
        } else {
            var callback = state === FULFILLED ? onFulfillment : onRejection;
            config.async(function () {
                return invokeCallback(state, child, callback, result);
            });
        }

        return child;
    }

    var Enumerator = function () {
        function Enumerator(Constructor, input, abortOnReject, label) {
            this._instanceConstructor = Constructor;
            this.promise = new Constructor(noop, label);
            this._abortOnReject = abortOnReject;

            this._init.apply(this, arguments);
        }

        Enumerator.prototype._init = function _init(Constructor, input) {
            var len = input.length || 0;
            this.length = len;
            this._remaining = len;
            this._result = new Array(len);

            this._enumerate(input);
            if (this._remaining === 0) {
                fulfill(this.promise, this._result);
            }
        };

        Enumerator.prototype._enumerate = function _enumerate(input) {
            var length = this.length;
            var promise = this.promise;

            for (var i = 0; promise._state === PENDING && i < length; i++) {
                this._eachEntry(input[i], i);
            }
        };

        Enumerator.prototype._settleMaybeThenable = function _settleMaybeThenable(entry, i) {
            var c = this._instanceConstructor;
            var resolve$$1 = c.resolve;

            if (resolve$$1 === resolve$1) {
                var then$$1 = getThen(entry);

                if (then$$1 === then && entry._state !== PENDING) {
                    entry._onError = null;
                    this._settledAt(entry._state, i, entry._result);
                } else if (typeof then$$1 !== 'function') {
                    this._remaining--;
                    this._result[i] = this._makeResult(FULFILLED, i, entry);
                } else if (c === Promise) {
                    var promise = new c(noop);
                    handleMaybeThenable(promise, entry, then$$1);
                    this._willSettleAt(promise, i);
                } else {
                    this._willSettleAt(new c(function (resolve$$1) {
                        return resolve$$1(entry);
                    }), i);
                }
            } else {
                this._willSettleAt(resolve$$1(entry), i);
            }
        };

        Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
            if (isMaybeThenable(entry)) {
                this._settleMaybeThenable(entry, i);
            } else {
                this._remaining--;
                this._result[i] = this._makeResult(FULFILLED, i, entry);
            }
        };

        Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
            var promise = this.promise;

            if (promise._state === PENDING) {
                if (this._abortOnReject && state === REJECTED) {
                    reject(promise, value);
                } else {
                    this._remaining--;
                    this._result[i] = this._makeResult(state, i, value);
                    if (this._remaining === 0) {
                        fulfill(promise, this._result);
                    }
                }
            }
        };

        Enumerator.prototype._makeResult = function _makeResult(state, i, value) {
            return value;
        };

        Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
            var enumerator = this;

            subscribe(promise, undefined, function (value) {
                return enumerator._settledAt(FULFILLED, i, value);
            }, function (reason) {
                return enumerator._settledAt(REJECTED, i, reason);
            });
        };

        return Enumerator;
    }();


    function makeSettledResult(state, position, value) {
        if (state === FULFILLED) {
            return {
                state: 'fulfilled',
                value: value
            };
        } else {
            return {
                state: 'rejected',
                reason: value
            };
        }
    }

    /**
     `RSVP.Promise.all` accepts an array of promises, and returns a new promise which
     is fulfilled with an array of fulfillment values for the passed promises, or
     rejected with the reason of the first passed promise to be rejected. It casts all
     elements of the passed iterable to promises as it runs this algorithm.

     Example:

     ```javascript
     let promise1 = RSVP.resolve(1);
     let promise2 = RSVP.resolve(2);
     let promise3 = RSVP.resolve(3);
     let promises = [ promise1, promise2, promise3 ];

     RSVP.Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
     ```

     If any of the `promises` given to `RSVP.all` are rejected, the first promise
     that is rejected will be given as an argument to the returned promises's
     rejection handler. For example:

     Example:

     ```javascript
     let promise1 = RSVP.resolve(1);
     let promise2 = RSVP.reject(new Error("2"));
     let promise3 = RSVP.reject(new Error("3"));
     let promises = [ promise1, promise2, promise3 ];

     RSVP.Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
     ```

     @method all
     @static
     @param {Array} entries array of promises
     @param {String} label optional string for labeling the promise.
     Useful for tooling.
     @return {Promise} promise that is fulfilled when all `promises` have been
     fulfilled, or rejected if any of them become rejected.
     @static
     */
    function all(entries, label) {
        if (!isArray(entries)) {
            return this.reject(new TypeError("Promise.all must be called with an array"), label);
        }
        return new Enumerator(this, entries, true /* abort on reject */, label).promise;
    }

    /**
     `RSVP.Promise.race` returns a new promise which is settled in the same way as the
     first passed promise to settle.

     Example:

     ```javascript
     let promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

     let promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

     RSVP.Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
     ```

     `RSVP.Promise.race` is deterministic in that only the state of the first
     settled promise matters. For example, even if other promises given to the
     `promises` array argument are resolved, but the first settled promise has
     become rejected before the other promises became fulfilled, the returned
     promise will become rejected:

     ```javascript
     let promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

     let promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

     RSVP.Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
     ```

     An example real-world use case is implementing timeouts:

     ```javascript
     RSVP.Promise.race([ajax('foo.json'), timeout(5000)])
     ```

     @method race
     @static
     @param {Array} entries array of promises to observe
     @param {String} label optional string for describing the promise returned.
     Useful for tooling.
     @return {Promise} a promise which settles in the same way as the first passed
     promise to settle.
     */
    function race(entries, label) {
        /*jshint validthis:true */
        var Constructor = this;

        var promise = new Constructor(noop, label);

        if (!isArray(entries)) {
            reject(promise, new TypeError('Promise.race must be called with an array'));
            return promise;
        }

        for (var i = 0; promise._state === PENDING && i < entries.length; i++) {
            subscribe(Constructor.resolve(entries[i]), undefined, function (value) {
                return resolve(promise, value);
            }, function (reason) {
                return reject(promise, reason);
            });
        }

        return promise;
    }

    /**
     `RSVP.Promise.reject` returns a promise rejected with the passed `reason`.
     It is shorthand for the following:

     ```javascript
     let promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

     promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
     ```

     Instead of writing the above, your code now simply becomes the following:

     ```javascript
     let promise = RSVP.Promise.reject(new Error('WHOOPS'));

     promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
     ```

     @method reject
     @static
     @param {*} reason value that the returned promise will be rejected with.
     @param {String} label optional string for identifying the returned promise.
     Useful for tooling.
     @return {Promise} a promise rejected with the given `reason`.
     */
    function reject$1(reason, label) {
        /*jshint validthis:true */
        var Constructor = this;
        var promise = new Constructor(noop, label);
        reject(promise, reason);
        return promise;
    }

    var guidKey = 'rsvp_' + now() + '-';
    var counter = 0;

    function needsResolver() {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function needsNew() {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }


    var Promise = function () {
        function Promise(resolver, label) {
            this._id = counter++;
            this._label = label;
            this._state = undefined;
            this._result = undefined;
            this._subscribers = [];

            config.instrument && instrument('created', this);

            if (noop !== resolver) {
                typeof resolver !== 'function' && needsResolver();
                this instanceof Promise ? initializePromise(this, resolver) : needsNew();
            }
        }

        Promise.prototype._onError = function _onError(reason) {
            var _this = this;

            config.after(function () {
                if (_this._onError) {
                    config.trigger('error', reason, _this._label);
                }
            });
        };

        /**
         `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
         as the catch block of a try/catch statement.

         ```js
         function findAuthor(){
      throw new Error('couldn\'t find that author');
    }

         // synchronous
         try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }

         // async with promises
         findAuthor().catch(function(reason){
      // something went wrong
    });
         ```

         @method catch
         @param {Function} onRejection
         @param {String} label optional string for labeling the promise.
         Useful for tooling.
         @return {Promise}
         */


        Promise.prototype.catch = function _catch(onRejection, label) {
            return this.then(undefined, onRejection, label);
        };

        /**
         `finally` will be invoked regardless of the promise's fate just as native
         try/catch/finally behaves

         Synchronous example:

         ```js
         findAuthor() {
      if (Math.random() > 0.5) {
        throw new Error();
      }
      return new Author();
    }

         try {
      return findAuthor(); // succeed or fail
    } catch(error) {
      return findOtherAuthor();
    } finally {
      // always runs
      // doesn't affect the return value
    }
         ```

         Asynchronous example:

         ```js
         findAuthor().catch(function(reason){
      return findOtherAuthor();
    }).finally(function(){
      // author was either found, or not
    });
         ```

         @method finally
         @param {Function} callback
         @param {String} label optional string for labeling the promise.
         Useful for tooling.
         @return {Promise}
         */


        Promise.prototype.finally = function _finally(callback, label) {
            var promise = this;
            var constructor = promise.constructor;

            return promise.then(function (value) {
                return constructor.resolve(callback()).then(function () {
                    return value;
                });
            }, function (reason) {
                return constructor.resolve(callback()).then(function () {
                    throw reason;
                });
            }, label);
        };

        return Promise;
    }();


    Promise.cast = resolve$1; // deprecated
    Promise.all = all;
    Promise.race = race;
    Promise.resolve = resolve$1;
    Promise.reject = reject$1;

    Promise.prototype._guidKey = guidKey;


    Promise.prototype.then = then;

    function Result() {
        this.value = undefined;
    }

    var ERROR = new Result();
    var GET_THEN_ERROR$1 = new Result();

    function getThen$1(obj) {
        try {
            return obj.then;
        } catch (error) {
            ERROR.value = error;
            return ERROR;
        }
    }

    function tryApply(f, s, a) {
        try {
            f.apply(s, a);
        } catch (error) {
            ERROR.value = error;
            return ERROR;
        }
    }

    function makeObject(_, argumentNames) {
        var obj = {};
        var length = _.length;
        var args = new Array(length);

        for (var x = 0; x < length; x++) {
            args[x] = _[x];
        }

        for (var i = 0; i < argumentNames.length; i++) {
            var name = argumentNames[i];
            obj[name] = args[i + 1];
        }

        return obj;
    }

    function arrayResult(_) {
        var length = _.length;
        var args = new Array(length - 1);

        for (var i = 1; i < length; i++) {
            args[i - 1] = _[i];
        }

        return args;
    }

    function wrapThenable(then, promise) {
        return {
            then: function (onFulFillment, onRejection) {
                return then.call(promise, onFulFillment, onRejection);
            }
        };
    }


    function denodeify(nodeFunc, options) {
        var fn = function () {
            var self = this;
            var l = arguments.length;
            var args = new Array(l + 1);
            var promiseInput = false;

            for (var i = 0; i < l; ++i) {
                var arg = arguments[i];

                if (!promiseInput) {
                    // TODO: clean this up
                    promiseInput = needsPromiseInput(arg);
                    if (promiseInput === GET_THEN_ERROR$1) {
                        var p = new Promise(noop);
                        reject(p, GET_THEN_ERROR$1.value);
                        return p;
                    } else if (promiseInput && promiseInput !== true) {
                        arg = wrapThenable(promiseInput, arg);
                    }
                }
                args[i] = arg;
            }

            var promise = new Promise(noop);

            args[l] = function (err, val) {
                if (err) reject(promise, err); else if (options === undefined) resolve(promise, val); else if (options === true) resolve(promise, arrayResult(arguments)); else if (isArray(options)) resolve(promise, makeObject(arguments, options)); else resolve(promise, val);
            };

            if (promiseInput) {
                return handlePromiseInput(promise, args, nodeFunc, self);
            } else {
                return handleValueInput(promise, args, nodeFunc, self);
            }
        };

        fn.__proto__ = nodeFunc;

        return fn;
    }

    function handleValueInput(promise, args, nodeFunc, self) {
        var result = tryApply(nodeFunc, self, args);
        if (result === ERROR) {
            reject(promise, result.value);
        }
        return promise;
    }

    function handlePromiseInput(promise, args, nodeFunc, self) {
        return Promise.all(args).then(function (args) {
            var result = tryApply(nodeFunc, self, args);
            if (result === ERROR) {
                reject(promise, result.value);
            }
            return promise;
        });
    }

    function needsPromiseInput(arg) {
        if (arg && typeof arg === 'object') {
            if (arg.constructor === Promise) {
                return true;
            } else {
                return getThen$1(arg);
            }
        } else {
            return false;
        }
    }

    /**
     This is a convenient alias for `RSVP.Promise.all`.

     @method all
     @static
     @for RSVP
     @param {Array} array Array of promises.
     @param {String} label An optional label. This is useful
     for tooling.
     */
    function all$1(array, label) {
        return Promise.all(array, label);
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var AllSettled = function (_Enumerator) {
        _inherits(AllSettled, _Enumerator);

        function AllSettled(Constructor, entries, label) {
            return _possibleConstructorReturn(this, _Enumerator.call(this, Constructor, entries, false /* don't abort on reject */, label));
        }

        return AllSettled;
    }(Enumerator);

    AllSettled.prototype._makeResult = makeSettledResult;

    /**
     `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
     a fail-fast method, it waits until all the promises have returned and
     shows you all the results. This is useful if you want to handle multiple
     promises' failure states together as a set.
     Returns a promise that is fulfilled when all the given promises have been
     settled. The return promise is fulfilled with an array of the states of
     the promises passed into the `promises` array argument.
     Each state object will either indicate fulfillment or rejection, and
     provide the corresponding value or reason. The states will take one of
     the following formats:
     ```javascript
     { state: 'fulfilled', value: value }
     or
     { state: 'rejected', reason: reason }
     ```
     Example:
     ```javascript
     let promise1 = RSVP.Promise.resolve(1);
     let promise2 = RSVP.Promise.reject(new Error('2'));
     let promise3 = RSVP.Promise.reject(new Error('3'));
     let promises = [ promise1, promise2, promise3 ];
     RSVP.allSettled(promises).then(function(array){
  // array == [
  //   { state: 'fulfilled', value: 1 },
  //   { state: 'rejected', reason: Error },
  //   { state: 'rejected', reason: Error }
  // ]
  // Note that for the second item, reason.message will be '2', and for the
  // third item, reason.message will be '3'.
}, function(error) {
  // Not run. (This block would only be called if allSettled had failed,
  // for instance if passed an incorrect argument type.)
});
     ```
     @method allSettled
     @static
     @for RSVP
     @param {Array} entries
     @param {String} label - optional string that describes the promise.
     Useful for tooling.
     @return {Promise} promise that is fulfilled with an array of the settled
     states of the constituent promises.
     */

    function allSettled(entries, label) {
        if (!isArray(entries)) {
            return Promise.reject(new TypeError("Promise.allSettled must be called with an array"), label);
        }

        return new AllSettled(Promise, entries, label).promise;
    }

    /**
     This is a convenient alias for `RSVP.Promise.race`.

     @method race
     @static
     @for RSVP
     @param {Array} array Array of promises.
     @param {String} label An optional label. This is useful
     for tooling.
     */
    function race$1(array, label) {
        return Promise.race(array, label);
    }

    function _possibleConstructorReturn$1(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits$1(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var PromiseHash = function (_Enumerator) {
        _inherits$1(PromiseHash, _Enumerator);

        function PromiseHash(Constructor, object) {
            var abortOnReject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var label = arguments[3];
            return _possibleConstructorReturn$1(this, _Enumerator.call(this, Constructor, object, abortOnReject, label));
        }

        PromiseHash.prototype._init = function _init(Constructor, object) {
            this._result = {};

            this._enumerate(object);
            if (this._remaining === 0) {
                fulfill(this.promise, this._result);
            }
        };

        PromiseHash.prototype._enumerate = function _enumerate(input) {
            var promise = this.promise;
            var results = [];

            for (var key in input) {
                if (hasOwnProperty.call(input, key)) {
                    results.push({
                        position: key,
                        entry: input[key]
                    });
                }
            }

            var length = results.length;
            this._remaining = length;
            var result = void 0;

            for (var i = 0; promise._state === PENDING && i < length; i++) {
                result = results[i];
                this._eachEntry(result.entry, result.position);
            }
        };

        return PromiseHash;
    }(Enumerator);


    function hash(object, label) {
        if (!isObject(object)) {
            return Promise.reject(new TypeError("Promise.hash must be called with an object"), label);
        }

        return new PromiseHash(Promise, object, label).promise;
    }

    function _possibleConstructorReturn$2(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits$2(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var HashSettled = function (_PromiseHash) {
        _inherits$2(HashSettled, _PromiseHash);

        function HashSettled(Constructor, object, label) {
            return _possibleConstructorReturn$2(this, _PromiseHash.call(this, Constructor, object, false, label));
        }

        return HashSettled;
    }(PromiseHash);

    HashSettled.prototype._makeResult = makeSettledResult;


    function hashSettled(object, label) {
        if (!isObject(object)) {
            return Promise.reject(new TypeError("RSVP.hashSettled must be called with an object"), label);
        }

        return new HashSettled(Promise, object, false, label).promise;
    }


    function rethrow(reason) {
        setTimeout(function () {
            throw reason;
        });
        throw reason;
    }

    function defer(label) {
        var deferred = {resolve: undefined, reject: undefined};

        deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        }, label);

        return deferred;
    }


    function map(promises, mapFn, label) {
        if (!isArray(promises)) {
            return Promise.reject(new TypeError("RSVP.map must be called with an array"), label);
        }

        if (!isFunction(mapFn)) {
            return Promise.reject(new TypeError("RSVP.map expects a function as a second argument"), label);
        }

        return Promise.all(promises, label).then(function (values) {
            var length = values.length;
            var results = new Array(length);

            for (var i = 0; i < length; i++) {
                results[i] = mapFn(values[i]);
            }

            return Promise.all(results, label);
        });
    }


    function resolve$2(value, label) {
        return Promise.resolve(value, label);
    }

    function reject$2(reason, label) {
        return Promise.reject(reason, label);
    }


    function resolveAll(promises, label) {
        return Promise.all(promises, label);
    }

    function resolveSingle(promise, label) {
        return Promise.resolve(promise, label).then(function (promises) {
            return resolveAll(promises, label);
        });
    }

    function filter(promises, filterFn, label) {
        if (!isArray(promises) && !(isObject(promises) && promises.then !== undefined)) {
            return Promise.reject(new TypeError("RSVP.filter must be called with an array or promise"), label);
        }

        if (!isFunction(filterFn)) {
            return Promise.reject(new TypeError("RSVP.filter expects function as a second argument"), label);
        }

        var promise = isArray(promises) ? resolveAll(promises, label) : resolveSingle(promises, label);
        return promise.then(function (values) {
            var length = values.length;
            var filtered = new Array(length);

            for (var i = 0; i < length; i++) {
                filtered[i] = filterFn(values[i]);
            }

            return resolveAll(filtered, label).then(function (filtered) {
                var results = new Array(length);
                var newLength = 0;

                for (var _i = 0; _i < length; _i++) {
                    if (filtered[_i]) {
                        results[newLength] = values[_i];
                        newLength++;
                    }
                }

                results.length = newLength;

                return results;
            });
        });
    }


    var len = 0;
    var vertxNext = void 0;

    function asap(callback, arg) {
        queue$1[len] = callback;
        queue$1[len + 1] = arg;
        len += 2;
        if (len === 2) {
            // If len is 1, that means that we need to schedule an async flush.
            // If additional callbacks are queued before the queue is flushed, they
            // will be processed by this flush that we are scheduling.
            scheduleFlush$1();
        }
    }

    var browserWindow = typeof window !== 'undefined' ? window : undefined;
    var browserGlobal = browserWindow || {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
    var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
    function useNextTick() {
        var nextTick = process.nextTick;
        // node version 0.10.x displays a deprecation warning when nextTick is used recursively
        // setImmediate should be used instead instead
        var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
        if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
            nextTick = setImmediate;
        }
        return function () {
            return nextTick(flush);
        };
    }

// vertx
    function useVertxTimer() {
        if (typeof vertxNext !== 'undefined') {
            return function () {
                vertxNext(flush);
            };
        }
        return useSetTimeout();
    }

    function useMutationObserver() {
        var iterations = 0;
        var observer = new BrowserMutationObserver(flush);
        var node = document.createTextNode('');
        observer.observe(node, {characterData: true});

        return function () {
            return node.data = iterations = ++iterations % 2;
        };
    }

// web worker
    function useMessageChannel() {
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        return function () {
            return channel.port2.postMessage(0);
        };
    }

    function useSetTimeout() {
        return function () {
            return setTimeout(flush, 1);
        };
    }

    var queue$1 = new Array(1000);

    function flush() {
        for (var i = 0; i < len; i += 2) {
            var callback = queue$1[i];
            var arg = queue$1[i + 1];

            callback(arg);

            queue$1[i] = undefined;
            queue$1[i + 1] = undefined;
        }

        len = 0;
    }

    function attemptVertex() {
        try {
            var r = require;
            var vertx = r('vertx');
            vertxNext = vertx.runOnLoop || vertx.runOnContext;
            return useVertxTimer();
        } catch (e) {
            return useSetTimeout();
        }
    }

    var scheduleFlush$1 = void 0;
// Decide what async method to use to triggering processing of queued callbacks:
    if (isNode) {
        scheduleFlush$1 = useNextTick();
    } else if (BrowserMutationObserver) {
        scheduleFlush$1 = useMutationObserver();
    } else if (isWorker) {
        scheduleFlush$1 = useMessageChannel();
    } else if (browserWindow === undefined && typeof require === 'function') {
        scheduleFlush$1 = attemptVertex();
    } else {
        scheduleFlush$1 = useSetTimeout();
    }

    var platform = void 0;

    /* global self */
    if (typeof self === 'object') {
        platform = self;

        /* global global */
    } else if (typeof global === 'object') {
        platform = global;
    } else {
        throw new Error('no global: `self` or `global` found');
    }

    var _asap$cast$Promise$Ev;

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true, writable: true});
        } else {
            obj[key] = value;
        }
        return obj;
    }

// defaults
    config.async = asap;
    config.after = function (cb) {
        return setTimeout(cb, 0);
    };
    var cast = resolve$2;

    var async = function (callback, arg) {
        return config.async(callback, arg);
    };

    function on() {
        config['on'].apply(config, arguments);
    }

    function off() {
        config['off'].apply(config, arguments);
    }

// Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window['__PROMISE_INSTRUMENTATION__'] === 'object') {
        var callbacks = window['__PROMISE_INSTRUMENTATION__'];
        configure('instrument', true);
        for (var eventName in callbacks) {
            if (callbacks.hasOwnProperty(eventName)) {
                on(eventName, callbacks[eventName]);
            }
        }
    }


    var rsvp = (_asap$cast$Promise$Ev = {
        asap: asap,
        cast: cast,
        Promise: Promise,
        EventTarget: EventTarget,
        all: all$1,
        allSettled: allSettled,
        race: race$1,
        hash: hash,
        hashSettled: hashSettled,
        rethrow: rethrow,
        defer: defer,
        denodeify: denodeify,
        configure: configure,
        on: on,
        off: off,
        resolve: resolve$2,
        reject: reject$2,
        map: map
    }, _defineProperty(_asap$cast$Promise$Ev, 'async', async), _defineProperty(_asap$cast$Promise$Ev, 'filter', filter), _asap$cast$Promise$Ev);


    exports['default'] = rsvp;
    exports.asap = asap;
    exports.cast = cast;
    exports.Promise = Promise;
    exports.EventTarget = EventTarget;
    exports.all = all$1;
    exports.allSettled = allSettled;
    exports.race = race$1;
    exports.hash = hash;
    exports.hashSettled = hashSettled;
    exports.rethrow = rethrow;
    exports.defer = defer;
    exports.denodeify = denodeify;
    exports.configure = configure;
    exports.on = on;
    exports.off = off;
    exports.resolve = resolve$2;
    exports.reject = reject$2;
    exports.map = map;
    exports.async = async;
    exports.filter = filter;

    Object.defineProperty(exports, '__esModule', {value: true});

})));


var EPUBJS = EPUBJS || {};
EPUBJS.core = {};
EPUBJS.reader = {};
EPUBJS.reader.plugins = {};


function getQueryString(name) {
    var result = window.location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {
        return "";
    }
    return result[1];
}

document.onreadystatechange = function () {

    if (document.readyState === "complete") {

        if (getQueryString('book') !== '') {
            var str = getQueryString('book');
            window.reader = ePubReader(str, {
                restore: true
            });
            console.log(String.fromCharCode.apply(null, new Uint16Array(str)));

        } else {
            var md5 = localStorage.getItem('key');
            // console.log(md5);
            bookDB.open(function () {
                bookDB.getBookWithKey(md5, function (result) {
                    var bookPath = result.content;
                    window.reader = ePubReader(bookPath, {
                        restore: true
                    });
                });
            });
        }
    }
};


EPUBJS.core = {};


EPUBJS.core.getEl = function (elem) {
    return document.getElementById(elem);
};

//-- Get all elements for a class
EPUBJS.core.getEls = function (classes) {
    return document.getElementsByClassName(classes);
};

EPUBJS.core.request = function (url, type, withCredentials) {
    var supportsURL = window.URL;
    var BLOB_RESPONSE = supportsURL ? "blob" : "arraybuffer";
    var deferred = new RSVP.defer();
    var xhr = new XMLHttpRequest();
    var uri;

    //-- Check from PDF.js:
    //   https://github.com/mozilla/pdf.js/blob/master/web/compatibility.js
    var xhrPrototype = XMLHttpRequest.prototype;

    var handler = function () {
        var r;

        if (this.readyState !== this.DONE) return;

        if ((this.status === 200 || this.status === 0) && this.response) { // Android & Firefox reporting 0 for local & blob urls
            if (type === 'xml') {
                // If this.responseXML wasn't set, try to parse using a DOMParser from text
                if (!this.responseXML) {
                    r = new DOMParser().parseFromString(this.response, "application/xml");
                } else {
                    r = this.responseXML;
                }
            } else if (type === 'xhtml') {
                if (!this.responseXML) {
                    r = new DOMParser().parseFromString(this.response, "application/xhtml+xml");
                } else {
                    r = this.responseXML;
                }
            } else if (type === 'html') {
                if (!this.responseXML) {
                    r = new DOMParser().parseFromString(this.response, "text/html");
                } else {
                    r = this.responseXML;
                }
            } else if (type === 'json') {
                r = JSON.parse(this.response);
            } else if (type === 'blob') {
                if (supportsURL) {
                    r = this.response;
                } else {
                    //-- Safari doesn't support responseType blob, so create a blob from arraybuffer
                    r = new Blob([this.response]);
                }
            } else {
                r = this.response;
            }

            deferred.resolve(r);
        } else {
            deferred.reject({
                message: this.response,
                stack: new Error().stack
            });
        }
    };

    if (!('overrideMimeType' in xhrPrototype)) {
        // IE10 might have response, but not overrideMimeType
        Object.defineProperty(xhrPrototype, 'overrideMimeType', {
            value: function xmlHttpRequestOverrideMimeType(mimeType) {
            }
        });
    }

    xhr.onreadystatechange = handler;
    xhr.open("GET", url, true);

    if (withCredentials) {
        xhr.withCredentials = true;
    }

    // If type isn't set, determine it from the file extension
    if (!type) {
        uri = EPUBJS.core.uri(url);
        type = uri.extension;
        type = {
            'htm': 'html'
        }[type] || type;
    }

    if (type === 'blob') {
        xhr.responseType = BLOB_RESPONSE;
    }

    if (type === "json") {
        xhr.setRequestHeader("Accept", "application/json");
    }

    if (type === 'xml') {
        xhr.responseType = "document";
        xhr.overrideMimeType('text/xml'); // for OPF parsing
    }

    if (type === 'xhtml') {
        xhr.responseType = "document";
    }

    if (type === 'html') {
        xhr.responseType = "document";
    }

    if (type === "binary") {
        xhr.responseType = "arraybuffer";
    }

    xhr.send();

    return deferred.promise;
};


EPUBJS.core.toArray = function (obj) {
    var arr = [];

    for (var member in obj) {
        var newitm;
        if (obj.hasOwnProperty(member)) {
            newitm = obj[member];
            newitm.ident = member;
            arr.push(newitm);
        }
    }

    return arr;
};

//-- Parse the different parts of a url, returning a object
EPUBJS.core.uri = function (url) {
    var uri = {
            protocol: '',
            host: '',
            path: '',
            origin: '',
            directory: '',
            base: '',
            filename: '',
            extension: '',
            fragment: '',
            href: url
        },
        blob = url.indexOf('blob:'),
        doubleSlash = url.indexOf('://'),
        search = url.indexOf('?'),
        fragment = url.indexOf("#"),
        withoutProtocol,
        dot,
        firstSlash;

    if (blob === 0) {
        uri.protocol = "blob";
        uri.base = url.indexOf(0, fragment);
        return uri;
    }

    if (fragment !== -1) {
        uri.fragment = url.slice(fragment + 1);
        url = url.slice(0, fragment);
    }

    if (search !== -1) {
        uri.search = url.slice(search + 1);
        url = url.slice(0, search);
        href = uri.href;
    }

    if (doubleSlash !== -1) {
        uri.protocol = url.slice(0, doubleSlash);
        withoutProtocol = url.slice(doubleSlash + 3);
        firstSlash = withoutProtocol.indexOf('/');

        if (firstSlash === -1) {
            uri.host = uri.path;
            uri.path = "";
        } else {
            uri.host = withoutProtocol.slice(0, firstSlash);
            uri.path = withoutProtocol.slice(firstSlash);
        }


        uri.origin = uri.protocol + "://" + uri.host;

        uri.directory = EPUBJS.core.folder(uri.path);

        uri.base = uri.origin + uri.directory;
        // return origin;
    } else {
        uri.path = url;
        uri.directory = EPUBJS.core.folder(url);
        uri.base = uri.directory;
    }

    //-- Filename
    uri.filename = url.replace(uri.base, '');
    dot = uri.filename.lastIndexOf('.');
    if (dot !== -1) {
        uri.extension = uri.filename.slice(dot + 1);
    }
    return uri;
};

//-- Parse out the folder, will return everything before the last slash

EPUBJS.core.folder = function (url) {

    var lastSlash = url.lastIndexOf('/');

    if (lastSlash === -1) var folder = '';

    folder = url.slice(0, lastSlash + 1);

    return folder;

};

//-- https://github.com/ebidel/filer.js/blob/master/src/filer.js#L128
EPUBJS.core.dataURLToBlob = function (dataURL) {
    var BASE64_MARKER = ';base64,',
        parts, contentType, raw, rawLength, uInt8Array;

    if (dataURL.indexOf(BASE64_MARKER) === -1) {
        parts = dataURL.split(',');
        contentType = parts[0].split(':')[1];
        raw = parts[1];

        return new Blob([raw], {type: contentType});
    }

    parts = dataURL.split(BASE64_MARKER);
    contentType = parts[0].split(':')[1];
    raw = window.atob(parts[1]);
    rawLength = raw.length;

    uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
};

//-- Load scripts async: http://stackoverflow.com/questions/7718935/load-scripts-asynchronously
EPUBJS.core.addScript = function (src, callback, target) {
    var s, r;
    r = false;
    s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = false;
    s.src = src;
    s.onload = s.onreadystatechange = function () {
        if (!r && (!this.readyState || this.readyState === 'complete')) {
            r = true;
            if (callback) callback();
        }
    };
    target = target || document.body;
    target.appendChild(s);
};

EPUBJS.core.addScripts = function (srcArr, callback, target) {
    var total = srcArr.length,
        curr = 0,
        cb = function () {
            curr++;
            if (total === curr) {
                if (callback) callback();
            } else {
                EPUBJS.core.addScript(srcArr[curr], cb, target);
            }
        };

    EPUBJS.core.addScript(srcArr[curr], cb, target);
};

EPUBJS.core.addCss = function (src, callback, target) {
    var s, r;
    r = false;
    s = document.createElement('link');
    s.type = 'text/css';
    s.rel = "stylesheet";
    s.href = src;
    s.onload = s.onreadystatechange = function () {
        if (!r && (!this.readyState || this.readyState === 'complete')) {
            r = true;
            if (callback) callback();
        }
    };
    target = target || document.body;
    target.appendChild(s);
};

EPUBJS.core.prefixed = function (unprefixed) {
    var vendors = ["Webkit", "Moz", "O", "ms"],
        prefixes = ['-Webkit-', '-moz-', '-o-', '-ms-'],
        upper = unprefixed[0].toUpperCase() + unprefixed.slice(1),
        length = vendors.length;

    if (typeof (document.documentElement.style[unprefixed]) != 'undefined') {
        return unprefixed;
    }

    for (var i = 0; i < length; i++) {
        if (typeof (document.documentElement.style[vendors[i] + upper]) != 'undefined') {
            return vendors[i] + upper;
        }
    }

    return unprefixed;
};

EPUBJS.core.resolveUrl = function (base, path) {
    var url,
        segments = [],
        uri = EPUBJS.core.uri(path),
        folders = base.split("/"),
        paths;

    if (uri.host) {
        return path;
    }

    folders.pop();

    paths = path.split("/");
    paths.forEach(function (p) {
        if (p === "..") {
            folders.pop();
        } else {
            segments.push(p);
        }
    });

    url = folders.concat(segments);

    return url.join("/");
};

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
EPUBJS.core.uuid = function () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
};

// Fast quicksort insert for sorted array -- based on:
// http://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
EPUBJS.core.insert = function (item, array, compareFunction) {
    var location = EPUBJS.core.locationOf(item, array, compareFunction);
    array.splice(location, 0, item);

    return location;
};

EPUBJS.core.locationOf = function (item, array, compareFunction, _start, _end) {
    var start = _start || 0;
    var end = _end || array.length;
    var pivot = parseInt(start + (end - start) / 2);
    var compared;
    if (!compareFunction) {
        compareFunction = function (a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            if (a = b) return 0;
        };
    }
    if (end - start <= 0) {
        return pivot;
    }

    compared = compareFunction(array[pivot], item);
    if (end - start === 1) {
        return compared > 0 ? pivot : pivot + 1;
    }

    if (compared === 0) {
        return pivot;
    }
    if (compared === -1) {
        return EPUBJS.core.locationOf(item, array, compareFunction, pivot, end);
    } else {
        return EPUBJS.core.locationOf(item, array, compareFunction, start, pivot);
    }
};

EPUBJS.core.indexOfSorted = function (item, array, compareFunction, _start, _end) {
    var start = _start || 0;
    var end = _end || array.length;
    var pivot = parseInt(start + (end - start) / 2);
    var compared;
    if (!compareFunction) {
        compareFunction = function (a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            if (a = b) return 0;
        };
    }
    if (end - start <= 0) {
        return -1; // Not found
    }

    compared = compareFunction(array[pivot], item);
    if (end - start === 1) {
        return compared === 0 ? pivot : -1;
    }
    if (compared === 0) {
        return pivot; // Found
    }
    if (compared === -1) {
        return EPUBJS.core.indexOfSorted(item, array, compareFunction, pivot, end);
    } else {
        return EPUBJS.core.indexOfSorted(item, array, compareFunction, start, pivot);
    }
};


EPUBJS.core.queue = function (_scope) {
    var _q = [];
    var scope = _scope;
    // Add an item to the queue
    var enqueue = function (funcName, args, context) {
        _q.push({
            "funcName": funcName,
            "args": args,
            "context": context
        });
        return _q;
    };
    // Run one item
    var dequeue = function () {
        var inwait;
        if (_q.length) {
            inwait = _q.shift();
            // Defer to any current tasks
            // setTimeout(function(){
            scope[inwait.funcName].apply(inwait.context || scope, inwait.args);
            // }, 0);
        }
    };

    // Run All
    var flush = function () {
        while (_q.length) {
            dequeue();
        }
    };
    // Clear all items in wait
    var clear = function () {
        _q = [];
    };

    var length = function () {
        return _q.length;
    };

    return {
        "enqueue": enqueue,
        "dequeue": dequeue,
        "flush": flush,
        "clear": clear,
        "length": length
    };
};

// From: https://code.google.com/p/fbug/source/browse/branches/firebug1.10/content/firebug/lib/xpath.js
/**
 * Gets an XPath for an element which describes its hierarchical location.
 */
EPUBJS.core.getElementXPath = function (element) {
    if (element && element.id) {
        return '//*[@id="' + element.id + '"]';
    } else {
        return EPUBJS.core.getElementTreeXPath(element);
    }
};

EPUBJS.core.getElementTreeXPath = function (element) {
    var paths = [];
    var isXhtml = (element.ownerDocument.documentElement.getAttribute('xmlns') === "http://www.w3.org/1999/xhtml");
    var index, nodeName, tagName, pathIndex;

    if (element.nodeType === Node.TEXT_NODE) {
        // index = Array.prototype.indexOf.call(element.parentNode.childNodes, element) + 1;
        index = EPUBJS.core.indexOfTextNode(element) + 1;

        paths.push("text()[" + index + "]");
        element = element.parentNode;
    }

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType === 1; element = element.parentNode) {
        index = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            // Ignore document type declaration.
            if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) {
                continue;
            }
            if (sibling.nodeName === element.nodeName) {
                ++index;
            }
        }
        nodeName = element.nodeName.toLowerCase();
        tagName = (isXhtml ? "xhtml:" + nodeName : nodeName);
        pathIndex = (index ? "[" + (index + 1) + "]" : "");
        paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "./" + paths.join("/") : null;
};

EPUBJS.core.nsResolver = function (prefix) {
    var ns = {
        'xhtml': 'http://www.w3.org/1999/xhtml',
        'epub': 'http://www.idpf.org/2007/ops'
    };
    return ns[prefix] || null;
};

EPUBJS.core.cleanStringForXpath = function (str) {
    var parts = str.match(/[^'"]+|['"]/g);
    parts = parts.map(function (part) {
        if (part === "'") {
            return '\"\'\"'; // output "'"
        }

        if (part === '"') {
            return "\'\"\'"; // output '"'
        }
        return "\'" + part + "\'";
    });
    return "concat(\'\'," + parts.join(",") + ")";
};

EPUBJS.core.indexOfTextNode = function (textNode) {
    var parent = textNode.parentNode;
    var children = parent.childNodes;
    var sib;
    var index = -1;
    for (var i = 0; i < children.length; i++) {
        sib = children[i];
        if (sib.nodeType === Node.TEXT_NODE) {
            index++;
        }
        if (sib === textNode) break;
    }

    return index;
};

// Underscore
EPUBJS.core.defaults = function (obj) {
    for (var i = 1, length = arguments.length; i < length; i++) {
        var source = arguments[i];
        for (var prop in source) {
            if (obj[prop] === void 0) obj[prop] = source[prop];
        }
    }
    return obj;
};

EPUBJS.core.extend = function (target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        if (!source) return;
        Object.getOwnPropertyNames(source).forEach(function (propName) {
            Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
        });
    });
    return target;
};

EPUBJS.core.clone = function (obj) {
    return EPUBJS.core.isArray(obj) ? obj.slice() : EPUBJS.core.extend({}, obj);
};

EPUBJS.core.isElement = function (obj) {
    return !!(obj && obj.nodeType === 1);
};

EPUBJS.core.isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

EPUBJS.core.isString = function (str) {
    return (typeof str === 'string' || str instanceof String);
};

EPUBJS.core.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

// Lodash
EPUBJS.core.values = function (object) {
    var index = -1;
    var props, length, result;

    if (!object) return [];

    props = Object.keys(object);
    length = props.length;
    result = Array(length);

    while (++index < length) {
        result[index] = object[props[index]];
    }
    return result;
};

EPUBJS.core.indexOfNode = function (node, typeId) {
    var parent = node.parentNode;
    var children = parent.childNodes;
    var sib;
    var index = -1;
    for (var i = 0; i < children.length; i++) {
        sib = children[i];
        if (sib.nodeType === typeId) {
            index++;
        }
        if (sib === node) break;
    }

    return index;
};

EPUBJS.core.indexOfTextNode = function (textNode) {
    return EPUBJS.core.indexOfNode(textNode, TEXT_NODE);
};

EPUBJS.core.indexOfElementNode = function (elementNode) {
    return EPUBJS.core.indexOfNode(elementNode, ELEMENT_NODE);
};


(function (root, $) {

    var previousReader = root.ePubReader || {};
    var ePubReader = root.ePubReader = function (path, options) {

        return new EPUBJS.Reader(path, options);
    };

})(window, jQuery);

var relocateType = "null";

EPUBJS.Reader = function (bookPath, _options) {
    var reader = this;
    var book;
    var $viewer = $("#viewer");
    var parameters;

    this.settings = {
        bookPath: bookPath,
        restore: false,
        reload: false,
        bookmarks: undefined,
        annotations: undefined,
        contained: undefined,
        bookKey: undefined,
        styles: undefined,
        sidebarReflow: false,
        generatePagination: false,
        history: true
    };

    //ePub
    this.book = book = new ePub(this.settings.bookPath, this.settings);
    // console.log('book-name ' +  this.settings.bookPath.);

    this.sidebarOpen = false;
    if (!this.settings.bookmarks) {
        this.settings.bookmarks = [];
    }

    //slider
    var input_page = document.getElementById("current-percent");

    var rendition = book.renderTo("viewer", {
        width: "100%",
        height: "100%"
    });

    this.rendition = rendition;

    this.displayed = displayed = rendition.display();

    book.ready.then(function () {

        reader.ReaderController = EPUBJS.reader.ReaderController.call(reader, book);
        reader.SettingsController = EPUBJS.reader.SettingsController.call(reader, book);
        reader.ControlsController = EPUBJS.reader.ControlsController.call(reader, book);
        reader.SidebarController = EPUBJS.reader.SidebarController.call(reader, book);
        reader.BookmarksController = EPUBJS.reader.BookmarksController.call(reader, book);
        var key = book.key() + "-locations";
        var stored = localStorage.getItem(key);
        if (stored) {
            return book.locations.load(stored);
        } else {
            return book.locations.generate(1600);
        }
    }).then(function () {

        input_page.addEventListener("change", function () {
            var cfi = book.locations.cfiFromPercentage(input_page.value / 100);
            console.log("input: " + input_page.value + " cfi: " + cfi);
            rendition.display(cfi);
            relocateType = "input";
        }, false);

        var sliderline;
        var controls;

        displayed.then(function () {
            console.log("displayed");
            sliderline = document.createElement("input");
            controls = document.getElementById("controls");
            controls.appendChild(sliderline);
            sliderline.setAttribute("type", "range");
            sliderline.setAttribute("min", 0);
            sliderline.setAttribute("max", 100);
            sliderline.setAttribute("step", 1);
            sliderline.setAttribute("value", 0);
            sliderline.addEventListener("change", function () {
                var percentage = 0;
                if (book.package.metadata.direction === "rtl") {
                    percentage = 100 - sliderline.value;
                } else {
                    percentage = sliderline.value;
                }
                var cfi = book.locations.cfiFromPercentage(percentage / 100);
                rendition.display(cfi);
                console.log("sliderline: " + percentage + " cfi: " + cfi);
                input_page.value = percentage;
                relocateType = "slide";
            }, false);

            controls.style.display = "block";
            if (book.package.metadata.direction === "rtl") {
                sliderline.value = 100;
            } else {
                sliderline.value = 0;
            }
            input_page.value = 0;
        });

        rendition.on("relocated", function (location) {
            console.log("relocated");
            if (relocateType === "slide") return;
            var percent = book.locations.percentageFromCfi(location.start.cfi);
            var percentage = Math.floor(percent * 100);
            console.log('percentage: ' + percentage + ' total: ' + book.locations._locations.length);
            if (book.package.metadata.direction === "rtl") {
                sliderline.value = 100 - percentage;
            } else {
                sliderline.value = percentage;
            }
            input_page.value = percentage;
        });

        localStorage.setItem(book.key() + "-locations", book.locations.save());

    });

    book.loaded.metadata.then(function (meta) {
        reader.MetaController = EPUBJS.reader.MetaController.call(reader, meta);
    });

    book.loaded.navigation.then(function (navigation) {
        reader.TocController = EPUBJS.reader.TocController.call(reader, navigation);
    });

    window.addEventListener("beforeunload", this.unload.bind(this), false);

    return this;
};

EPUBJS.reader.ControlsController = function (book) {
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
        $bookmark = $("#bookmark"),
        $showToc = $("#show-Toc"),
        $showSideBar = $("#show-Sidebar");

    // 开启菜单
    $slider.on("click", function () {
        if (!reader.sidebarOpen) {
            reader.SidebarController.show();
            $showToc.addClass("icon-right");
            $slider.removeClass("icon-menu");
            $showSideBar.addClass("icon-menu");
        }
    });

    $showSideBar.on("click", function () {
        reader.SidebarController.show();
    });


    //关闭菜单
    $showToc.on("click", function () {
        if (reader.sidebarOpen) {
            reader.SidebarController.hide();
            $slider.addClass("icon-menu");
        }
    });

    if (typeof screenfull !== 'undefined') {
        $fullscreen.on("click", function () {
            screenfull.toggle($('#container')[0]);
        });
        if (screenfull.raw) {
            document.addEventListener(screenfull.raw.fullscreenchange, function () {
                fullscreen = screenfull.isFullscreen;
                if (fullscreen) {
                    $fullscreen
                        .addClass("icon-resize-small")
                        .removeClass("icon-resize-full");
                } else {
                    $fullscreen
                        .addClass("icon-resize-full")
                        .removeClass("icon-resize-small");
                }
            });
        }
    }


    $bookmark.on("click", function () {
        var cfi = reader.rendition.currentLocation().start.cfi;
        var bookmarked = reader.isBookmarked(cfi);

        if (bookmarked === -1) { //-- Add bookmark
            reader.addBookmark(cfi);
            $bookmark
                .addClass("icon-bookmark")
                .removeClass("icon-bookmark-empty");
        } else { //-- Remove Bookmark
            reader.removeBookmark(cfi);
            $bookmark
                .removeClass("icon-bookmark")
                .addClass("icon-bookmark-empty");
        }

    });


    return {};
};

EPUBJS.reader.MetaController = function (meta) {
    var title = meta.title,
        author = meta.creator;

    var $title = $("#book-title"),
        $author = $("#chapter-title"),
        $dash = $("#title-seperator");

    document.title = title + " – " + author;

    $title.html(title);
    $author.html(author);
    $dash.show();
};

EPUBJS.reader.ReaderController = function (book) {
    var $main = $("#main"),
        $divider = $("#divider"),
        $loader = $("#loader"),
        $next = $("#next"),
        $prev = $("#prev");
    var reader = this;
    var book = this.book;
    var rendition = this.rendition;
    var slideIn = function () {
        var currentPosition = rendition.currentLocation().start.cfi;
        if (reader.settings.sidebarReflow) {
            $main.removeClass('single');
            $main.one("transitionend", function () {
                rendition.resize();
            });
        } else {
            $main.removeClass("closed");
        }
    };

    var slideOut = function () {
        var location = rendition.currentLocation();
        if (!location) {
            return;
        }
        var currentPosition = location.start.cfi;
        if (reader.settings.sidebarReflow) {
            $main.addClass('single');
            $main.one("transitionend", function () {
                rendition.resize();
            });
        } else {
            $main.addClass("closed");
        }
    };

    var showLoader = function () {
        $loader.show();
        hideDivider();
    };

    var hideLoader = function () {
        $loader.hide();
    };

    var showDivider = function () {
        $divider.addClass("show");
    };

    var hideDivider = function () {
        $divider.removeClass("show");
    };

    var keylock = false;

    var arrowKeys = function (e) {
        relocateType = "key";

        if (e.keyCode === 37) {

            if (book.package.metadata.direction === "rtl") {
                rendition.next();
            } else {
                rendition.prev();
            }

            $prev.addClass("active");

            console.log("right key pressed");
            keylock = true;
            setTimeout(function () {
                keylock = false;
                $prev.removeClass("active");
            }, 100);

            e.preventDefault();
        }
        if (e.keyCode === 39) {

            if (book.package.metadata.direction === "rtl") {
                rendition.prev();
            } else {
                rendition.next();
            }

            $next.addClass("active");

            console.log("left key pressed");
            keylock = true;
            setTimeout(function () {
                keylock = false;
                $next.removeClass("active");
            }, 100);

            e.preventDefault();
        }
    };

    document.addEventListener('keydown', arrowKeys, false);

    $next.on("click", function (e) {
        relocateType = "arrow";

        console.log("right arrow clicked");
        if (book.package.metadata.direction === "rtl") {
            rendition.prev();
        } else {
            rendition.next();
        }

        e.preventDefault();
    });

    $prev.on("click", function (e) {
        relocateType = "arrow";

        console.log("left arrow clicked");
        if (book.package.metadata.direction === "rtl") {
            rendition.next();
        } else {
            rendition.prev();
        }

        e.preventDefault();
    });

    rendition.on("layout", function (props) {
        if (props.spread === true) {
            showDivider();
        } else {
            hideDivider();
        }
    });

    rendition.on('relocated', function (location) {
        if (location.atStart) {
            $prev.addClass("disabled");
        }
        if (location.atEnd) {
            $next.addClass("disabled");
        }
    });

    return {
        "slideOut": slideOut,
        "slideIn": slideIn,
        "showLoader": showLoader,
        "hideLoader": hideLoader,
        "showDivider": showDivider,
        "hideDivider": hideDivider,
        "arrowKeys": arrowKeys
    };
};

EPUBJS.reader.SettingsController = function () {
    var book = this.book;
    var reader = this;
    var $settings = $("#settings-modal"),
        $overlay = $(".overlay");

    var show = function () {
        $settings.addClass("md-show");
    };

    var hide = function () {
        $settings.removeClass("md-show");
    };

    var $sidebarReflowSetting = $('#sidebarReflow');

    $sidebarReflowSetting.on('click', function () {
        reader.settings.sidebarReflow = !reader.settings.sidebarReflow;
    });

    $settings.find(".closer").on("click", function () {
        hide();
    });

    $overlay.on("click", function () {
        hide();
    });

    return {
        "show": show,
        "hide": hide
    };
};


EPUBJS.reader.SidebarController = function (book) {
    var reader = this;

    var $sidebar = $("#sidebar"),
        $panels = $("#panels");

    var activePanel = "Toc";

    var changePanelTo = function (viewName) {
        var controllerName = viewName + "Controller";

        if (activePanel === viewName || typeof reader[controllerName] === 'undefined') return;
        reader[activePanel + "Controller"].hide();
        reader[controllerName].show();
        activePanel = viewName;

        $panels.find('.active').removeClass("active");
        $panels.find("#show-" + viewName).addClass("active");
    };

    var getActivePanel = function () {
        return activePanel;
    };

    var show = function () {
        reader.sidebarOpen = true;
        reader.ReaderController.slideOut();
        $sidebar.addClass("open");
    };

    var hide = function () {
        reader.sidebarOpen = false;
        reader.ReaderController.slideIn();
        $sidebar.removeClass("open");
    };

    $panels.find(".show_view").on("click", function (event) {
        var view = $(this).data("view");

        changePanelTo(view);
        event.preventDefault();
    });

    return {
        'show': show,
        'hide': hide,
        'getActivePanel': getActivePanel,
        'changePanelTo': changePanelTo
    };
};

EPUBJS.reader.TocController = function (toc) {
    var book = this.book;
    var rendition = this.rendition;

    var $list = $("#tocView"),
        docfrag = document.createDocumentFragment();

    var currentChapter = false;

    var generateTocItems = function (toc, level) {
        var container = document.createElement("ul");

        if (!level) level = 1;

        toc.forEach(function (chapter) {
            var listitem = document.createElement("li"),
                link = document.createElement("a");
            toggle = document.createElement("a");

            var subitems;

            listitem.id = "toc-" + chapter.id;
            listitem.classList.add('list_item');

            link.textContent = chapter.label;
            link.href = chapter.href;

            link.classList.add('toc_link');

            listitem.appendChild(link);

            if (chapter.subitems && chapter.subitems.length > 0) {
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

    var onShow = function () {
        $list.show();
    };

    var onHide = function () {
        $list.hide();
    };

    var chapterChange = function (e) {
        var id = e.id,
            $item = $list.find("#toc-" + id),
            $current = $list.find(".currentChapter"),
            $open = $list.find('.openChapter');

        if ($item.length) {

            if ($item !== $current && $item.has(currentChapter).length > 0) {
                $current.removeClass("currentChapter");
            }

            $item.addClass("currentChapter");

            $item.parents('li').addClass("openChapter");
        }
    };

    rendition.on('renderered', chapterChange);

    /*
        //MATH
        rendition.hooks.content.register(function (content) {
            let section = book.section(content.sectionIndex);
            let mathml = section.properties.includes("mathml");

            if (mathml) {
                return content.addScript('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/MathJax.js?config=TeX-MML-AM_CHTML');
            }
        });
    */

    var tocitems = generateTocItems(toc);

    docfrag.appendChild(tocitems);

    $list.append(docfrag);
    $list.find(".toc_link").on("click", function (event) {
        var url = this.getAttribute('href');

        event.preventDefault();

        rendition.display(url);

        $list.find(".currentChapter")
            .addClass("openChapter")
            .removeClass("currentChapter");

        $(this).parent('li').addClass("currentChapter");

    });

    $list.find(".toc_toggle").on("click", function (event) {
        var $el = $(this).parent('li'),
            open = $el.hasClass("openChapter");

        event.preventDefault();
        if (open) {
            $el.removeClass("openChapter");
        } else {
            $el.addClass("openChapter");
        }
    });

    return {
        "show": onShow,
        "hide": onHide
    };
};

RSVP.EventTarget.mixin(EPUBJS.Reader.prototype);

EPUBJS.reader.BookmarksController = function () {
    var reader = this;
    var book = this.book;
    var rendition = this.rendition;

    var $bookmarks = $("#bookmarksView"),
        $list = $bookmarks.find("#bookmarks");

    var docfrag = document.createDocumentFragment();

    var show = function () {
        $bookmarks.show();
    };

    var hide = function () {
        $bookmarks.hide();
    };

    var counter = 0;

    var createBookmarkItem = function (cfi) {
        var listitem = document.createElement("li"),
            link = document.createElement("a");

        listitem.id = "bookmark-" + counter;
        listitem.classList.add('list_item');

        var spineItem = book.spine.get(cfi);
        var tocItem;
        if (spineItem.index in book.navigation.toc) {
            tocItem = book.navigation.toc[spineItem.index];
            link.textContent = tocItem.label;
        } else {
            link.textContent = cfi;
        }

        link.href = cfi;

        link.classList.add('bookmark_link');

        link.addEventListener("click", function (event) {
            var cfi = this.getAttribute('href');
            rendition.display(cfi);
            event.preventDefault();
        }, false);

        listitem.appendChild(link);

        counter++;

        return listitem;
    };

    this.settings.bookmarks.forEach(function (cfi) {
        var bookmark = createBookmarkItem(cfi);
        docfrag.appendChild(bookmark);
    });

    $list.append(docfrag);

    this.on("reader:bookmarked", function (cfi) {
        var item = createBookmarkItem(cfi);
        $list.append(item);
    });
    //
    // this.on("reader:unbookmarked", function (index) {
    //     var $item = $("#bookmark-" + index);
    //     $item.remove();
    // });

    return {
        "show": show,
        "hide": hide,
        "createBookmarkItem": createBookmarkItem,
        "list": $list
    };
};

EPUBJS.Reader.prototype.applySavedSettings = function () {
    var stored;

    if (!localStorage) {
        return false;
    }

    try {
        stored = JSON.parse(localStorage.getItem(this.settings.bookKey));
    } catch (e) { // parsing error of localStorage
        return false;
    }

    if (stored) {
        // Merge styles
        if (stored.styles) {
            this.settings.styles = EPUBJS.core.defaults(this.settings.styles || {}, stored.styles);
        }
        // Merge the rest
        this.settings = EPUBJS.core.defaults(this.settings, stored);
        return true;
    } else {
        return false;
    }
};


EPUBJS.Reader.prototype.unload = function () {
    if (this.settings.restore && localStorage) {
        this.saveSettings();
    }
};

EPUBJS.Reader.prototype.addBookmark = function (cfi) {
    var present = this.isBookmarked(cfi);
    if (present > -1) return;

    this.settings.bookmarks.push(cfi);

    this.trigger("reader:bookmarked", cfi);
    // var item = createBookmarkItem(cfi);
    // $list.append(item);
};

EPUBJS.Reader.prototype.removeBookmark = function (cfi) {
    var bookmark = this.isBookmarked(cfi);
    if (bookmark === -1) return;

    this.settings.bookmarks.splice(bookmark, 1);

    this.trigger("reader:unbookmarked", bookmark);

};


EPUBJS.Reader.prototype.isBookmarked = function (cfi) {
    var bookmarks = this.settings.bookmarks;

    return bookmarks.indexOf(cfi);
};

EPUBJS.Reader.prototype.clearBookmarks = function () {
    this.settings.bookmarks = [];
};


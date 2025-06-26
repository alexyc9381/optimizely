/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var UniversalPolyfills = (function () {
    function UniversalPolyfills() {
    }
    UniversalPolyfills.init = function () {
        if (this.initialized)
            return;
        this.polyfillPromise();
        this.polyfillFetch();
        this.polyfillIntersectionObserver();
        this.polyfillPerformanceObserver();
        this.polyfillRequestIdleCallback();
        this.polyfillCustomEvent();
        this.polyfillAssign();
        this.polyfillArrayIncludes();
        this.polyfillStringIncludes();
        this.polyfillConsole();
        this.initialized = true;
    };
    UniversalPolyfills.polyfillPromise = function () {
        if (typeof Promise === 'undefined') {
            window.Promise = (function () {
                function PromisePolyfill(executor) {
                    this.state = 'pending';
                    this.handlers = [];
                    try {
                        executor(this.resolve.bind(this), this.reject.bind(this));
                    }
                    catch (error) {
                        this.reject(error);
                    }
                }
                PromisePolyfill.prototype.resolve = function (value) {
                    var _this = this;
                    if (this.state === 'pending') {
                        this.state = 'fulfilled';
                        this.value = value;
                        this.handlers.forEach(function (handler) { return _this.handle(handler); });
                        this.handlers = [];
                    }
                };
                PromisePolyfill.prototype.reject = function (error) {
                    var _this = this;
                    if (this.state === 'pending') {
                        this.state = 'rejected';
                        this.value = error;
                        this.handlers.forEach(function (handler) { return _this.handle(handler); });
                        this.handlers = [];
                    }
                };
                PromisePolyfill.prototype.handle = function (handler) {
                    if (this.state === 'pending') {
                        this.handlers.push(handler);
                    }
                    else {
                        if (this.state === 'fulfilled' && handler.onFulfilled) {
                            try {
                                var result = handler.onFulfilled(this.value);
                                handler.resolve(result);
                            }
                            catch (error) {
                                handler.reject(error);
                            }
                        }
                        else if (this.state === 'rejected' && handler.onRejected) {
                            try {
                                var result = handler.onRejected(this.value);
                                handler.resolve(result);
                            }
                            catch (error) {
                                handler.reject(error);
                            }
                        }
                        else if (this.state === 'fulfilled') {
                            handler.resolve(this.value);
                        }
                        else {
                            handler.reject(this.value);
                        }
                    }
                };
                PromisePolyfill.prototype.then = function (onFulfilled, onRejected) {
                    var _this = this;
                    return new PromisePolyfill(function (resolve, reject) {
                        _this.handle({
                            onFulfilled: onFulfilled,
                            onRejected: onRejected,
                            resolve: resolve,
                            reject: reject
                        });
                    });
                };
                PromisePolyfill.prototype.catch = function (onRejected) {
                    return this.then(undefined, onRejected);
                };
                PromisePolyfill.resolve = function (value) {
                    return new PromisePolyfill(function (resolve) { return resolve(value); });
                };
                PromisePolyfill.reject = function (error) {
                    return new PromisePolyfill(function (_, reject) { return reject(error); });
                };
                PromisePolyfill.all = function (promises) {
                    return new PromisePolyfill(function (resolve, reject) {
                        if (promises.length === 0) {
                            resolve([]);
                            return;
                        }
                        var resolvedCount = 0;
                        var results = new Array(promises.length);
                        promises.forEach(function (promise, index) {
                            promise.then(function (value) {
                                results[index] = value;
                                resolvedCount++;
                                if (resolvedCount === promises.length) {
                                    resolve(results);
                                }
                            }, reject);
                        });
                    });
                };
                return PromisePolyfill;
            }());
        }
    };
    UniversalPolyfills.polyfillFetch = function () {
        if (typeof fetch === 'undefined') {
            window.fetch = function (url, options) {
                if (options === void 0) { options = {}; }
                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    var method = options.method || 'GET';
                    xhr.open(method, url);
                    if (options.headers) {
                        Object.keys(options.headers).forEach(function (key) {
                            xhr.setRequestHeader(key, options.headers[key]);
                        });
                    }
                    xhr.onload = function () {
                        var response = {
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Map(),
                            json: function () { return Promise.resolve(JSON.parse(xhr.responseText)); },
                            text: function () { return Promise.resolve(xhr.responseText); }
                        };
                        resolve(response);
                    };
                    xhr.onerror = function () { return reject(new Error('Network Error')); };
                    xhr.send(options.body || null);
                });
            };
        }
    };
    UniversalPolyfills.polyfillIntersectionObserver = function () {
        if (typeof IntersectionObserver === 'undefined') {
            window.IntersectionObserver = (function () {
                function IntersectionObserverPolyfill(callback) {
                    this.elements = new Set();
                    this.callback = callback;
                }
                IntersectionObserverPolyfill.prototype.observe = function (element) {
                    var _this = this;
                    this.elements.add(element);
                    setTimeout(function () {
                        _this.callback([{
                                target: element,
                                isIntersecting: true,
                                intersectionRatio: 1
                            }]);
                    }, 0);
                };
                IntersectionObserverPolyfill.prototype.unobserve = function (element) {
                    this.elements.delete(element);
                };
                IntersectionObserverPolyfill.prototype.disconnect = function () {
                    this.elements.clear();
                };
                return IntersectionObserverPolyfill;
            }());
        }
    };
    UniversalPolyfills.polyfillPerformanceObserver = function () {
        if (typeof PerformanceObserver === 'undefined') {
            window.PerformanceObserver = (function () {
                function PerformanceObserverPolyfill(callback) {
                    this.callback = callback;
                }
                PerformanceObserverPolyfill.prototype.observe = function () {
                    var _this = this;
                    setTimeout(function () {
                        _this.callback({ getEntries: function () { return []; } });
                    }, 0);
                };
                PerformanceObserverPolyfill.prototype.disconnect = function () {
                };
                return PerformanceObserverPolyfill;
            }());
        }
    };
    UniversalPolyfills.polyfillRequestIdleCallback = function () {
        if (typeof window !== 'undefined' && !window.requestIdleCallback) {
            window.requestIdleCallback = function (callback, options) {
                var start = Date.now();
                var timeout = (options === null || options === void 0 ? void 0 : options.timeout) || 0;
                return setTimeout(function () {
                    var timeRemaining = Math.max(0, 50 - (Date.now() - start));
                    var deadline = {
                        didTimeout: timeout > 0 && (Date.now() - start) >= timeout,
                        timeRemaining: function () { return timeRemaining; }
                    };
                    callback(deadline);
                }, 1);
            };
            window.cancelIdleCallback = function (id) {
                clearTimeout(id);
            };
        }
    };
    UniversalPolyfills.polyfillCustomEvent = function () {
        if (typeof CustomEvent === 'undefined') {
            window.CustomEvent = function CustomEventPolyfill(event, params) {
                if (params === void 0) { params = {}; }
                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
                return evt;
            };
        }
    };
    UniversalPolyfills.polyfillAssign = function () {
        if (!Object.assign) {
            Object.assign = function (target) {
                var sources = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    sources[_i - 1] = arguments[_i];
                }
                if (target == null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }
                var to = Object(target);
                for (var index = 0; index < sources.length; index++) {
                    var nextSource = sources[index];
                    if (nextSource != null) {
                        for (var nextKey in nextSource) {
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                return to;
            };
        }
    };
    UniversalPolyfills.polyfillArrayIncludes = function () {
        if (!Array.prototype.includes) {
            Array.prototype.includes = function (searchElement, fromIndex) {
                var n = parseInt(String(fromIndex || 0)) || 0;
                if (n >= this.length)
                    return false;
                var start = n >= 0 ? n : Math.max(0, this.length + n);
                for (var i = start; i < this.length; i++) {
                    if (this[i] === searchElement)
                        return true;
                }
                return false;
            };
        }
    };
    UniversalPolyfills.polyfillStringIncludes = function () {
        if (!String.prototype.includes) {
            String.prototype.includes = function (search, start) {
                if (typeof start !== 'number') {
                    start = 0;
                }
                if (start + search.length > this.length) {
                    return false;
                }
                else {
                    return this.indexOf(search, start) !== -1;
                }
            };
        }
    };
    UniversalPolyfills.polyfillConsole = function () {
        if (typeof console === 'undefined') {
            window.console = {
                log: function () { },
                warn: function () { },
                error: function () { },
                info: function () { },
                debug: function () { },
                trace: function () { },
                group: function () { },
                groupEnd: function () { },
                time: function () { },
                timeEnd: function () { }
            };
        }
    };
    UniversalPolyfills.isModernBrowser = function () {
        return !!(typeof Promise !== 'undefined' &&
            typeof fetch !== 'undefined' &&
            typeof IntersectionObserver !== 'undefined' &&
            typeof PerformanceObserver !== 'undefined' &&
            typeof CustomEvent !== 'undefined' &&
            Object.assign &&
            Array.prototype.includes &&
            String.prototype.includes);
    };
    UniversalPolyfills.getCompatibilityReport = function () {
        var features = {
            Promise: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            IntersectionObserver: typeof IntersectionObserver !== 'undefined',
            PerformanceObserver: typeof PerformanceObserver !== 'undefined',
            requestIdleCallback: typeof window !== 'undefined' && typeof window.requestIdleCallback !== 'undefined',
            CustomEvent: typeof CustomEvent !== 'undefined',
            ObjectAssign: !!Object.assign,
            ArrayIncludes: !!Array.prototype.includes,
            StringIncludes: !!String.prototype.includes,
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof Storage !== 'undefined'
        };
        var polyfillsNeeded = Object.keys(features).filter(function (key) { return !features[key]; });
        return {
            isModern: this.isModernBrowser(),
            features: features,
            polyfillsNeeded: polyfillsNeeded
        };
    };
    UniversalPolyfills.initialized = false;
    return UniversalPolyfills;
}());

function generateVisitorId() {
    return 'v_' + generateRandomId(16);
}
function generateSessionId() {
    return 's_' + generateRandomId(12) + '_' + Date.now();
}
function generateRandomId(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateId$1() {
    if (isBrowser() && window.crypto && window.crypto.getRandomValues) {
        var array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function now$1() {
    return Date.now();
}
function debounce(func, wait, immediate) {
    if (immediate === void 0) { immediate = false; }
    var timeout = null;
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(void 0, __spreadArray([], __read(args), false));
        };
        var callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(void 0, __spreadArray([], __read(args), false));
    });
}
function throttle(func, limit) {
    var inThrottle;
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(void 0, __spreadArray([], __read(args), false));
            inThrottle = true;
            setTimeout(function () { return inThrottle = false; }, limit);
        }
    });
}
function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
function safeJsonParse(json, fallback) {
    if (fallback === void 0) { fallback = null; }
    try {
        return JSON.parse(json);
    }
    catch (_a) {
        return fallback;
    }
}
function safeJsonStringify(obj, fallback) {
    if (fallback === void 0) { fallback = '{}'; }
    try {
        return JSON.stringify(obj);
    }
    catch (_a) {
        return fallback;
    }
}
function getCurrentUrl() {
    if (!isBrowser())
        return '';
    return window.location.href.split('#')[0].split('?')[0];
}
function getCurrentTitle() {
    if (!isBrowser())
        return '';
    return document.title || '';
}
function getReferrer() {
    if (!isBrowser())
        return '';
    return document.referrer || '';
}
function getUserAgent() {
    if (!isBrowser())
        return 'server';
    return navigator.userAgent || '';
}
function detectPlatform() {
    if (!isBrowser())
        return 'server';
    var userAgent = getUserAgent().toLowerCase();
    if (/android/.test(userAgent))
        return 'android';
    if (/iphone|ipad|ipod/.test(userAgent))
        return 'ios';
    if (/windows/.test(userAgent))
        return 'windows';
    if (/mac/.test(userAgent))
        return 'mac';
    if (/linux/.test(userAgent))
        return 'linux';
    return 'unknown';
}
function detectBrowser() {
    if (!isBrowser())
        return 'unknown';
    var userAgent = getUserAgent().toLowerCase();
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent))
        return 'chrome';
    if (/firefox/.test(userAgent))
        return 'firefox';
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent))
        return 'safari';
    if (/edge/.test(userAgent))
        return 'edge';
    if (/opera/.test(userAgent))
        return 'opera';
    return 'unknown';
}
function isElementVisible(element) {
    if (!isBrowser())
        return false;
    var rect = element.getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    var windowWidth = window.innerWidth || document.documentElement.clientWidth;
    return (rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth);
}
function getScrollDepth() {
    if (!isBrowser())
        return 0;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    if (documentHeight <= windowHeight)
        return 100;
    return Math.round((scrollTop + windowHeight) / documentHeight * 100);
}
function domReady(callback) {
    if (!isBrowser()) {
        callback();
        return;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    }
    else {
        callback();
    }
}
function addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    return function () { return element.removeEventListener(event, handler, options); };
}
function simpleHash(str) {
    var hash = 0;
    if (str.length === 0)
        return hash;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
function deepMerge(target, source) {
    var result = __assign({}, target);
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            var sourceValue = source[key];
            var targetValue = result[key];
            if (sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
    }
    return result;
}
function getPlatform() {
    if (!isBrowser())
        return 'server';
    return navigator.platform;
}
function getLanguage() {
    if (!isBrowser())
        return 'en';
    return navigator.language || navigator.userLanguage || 'en';
}
function getTimezoneOffset() {
    if (!isBrowser())
        return 0;
    return new Date().getTimezoneOffset();
}
function shouldAnonymizeIP(ip, settings) {
    return settings.anonymizeIPs && Boolean(ip) && ip !== '127.0.0.1' && ip !== '::1';
}
function anonymizeIPv4(ip) {
    var parts = ip.split('.');
    if (parts.length === 4) {
        return "".concat(parts[0], ".").concat(parts[1], ".").concat(parts[2], ".0");
    }
    return ip;
}
function anonymizeIPv6(ip) {
    var parts = ip.split(':');
    if (parts.length >= 4) {
        return "".concat(parts.slice(0, 4).join(':'), "::");
    }
    return ip;
}
function anonymizeIP(ip) {
    if (!ip)
        return ip;
    if (ip.includes(':')) {
        return anonymizeIPv6(ip);
    }
    else {
        return anonymizeIPv4(ip);
    }
}
function shouldMinimizeData(settings) {
    return settings.dataMinimization;
}
function removePII(data) {
    if (!data || typeof data !== 'object')
        return data;
    var piiFields = [
        'email', 'phone', 'name', 'firstName', 'lastName', 'fullName',
        'address', 'street', 'city', 'zipCode', 'postalCode',
        'ssn', 'socialSecurityNumber', 'creditCard', 'bankAccount',
        'passport', 'driverLicense', 'taxId'
    ];
    var cleaned = __assign({}, data);
    piiFields.forEach(function (field) {
        if (cleaned[field]) {
            delete cleaned[field];
        }
    });
    return cleaned;
}
function hashSensitiveData(data) {
    if (!data)
        return data;
    var hash = 0;
    for (var i = 0; i < data.length; i++) {
        var char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
function isConsentRequired() {
    if (!isBrowser())
        return true;
    var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var euTimezones = [
        'Europe/', 'Atlantic/Azores', 'Atlantic/Madeira', 'Atlantic/Canary'
    ];
    return euTimezones.some(function (tz) { return timezone.startsWith(tz); });
}
function getDoNotTrackStatus() {
    if (!isBrowser())
        return false;
    return navigator.doNotTrack === '1' ||
        window.doNotTrack === '1' ||
        navigator.msDoNotTrack === '1';
}
function areCookiesEnabled() {
    if (!isBrowser())
        return false;
    try {
        document.cookie = 'test_cookie=1';
        var enabled = document.cookie.indexOf('test_cookie=') !== -1;
        document.cookie = 'test_cookie=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
        return enabled;
    }
    catch (_a) {
        return false;
    }
}
function clearAllCookies(domain) {
    if (!isBrowser())
        return;
    var cookies = document.cookie.split(';');
    cookies.forEach(function (cookie) {
        var eqPos = cookie.indexOf('=');
        var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
            document.cookie = "".concat(name, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
            if (domain) {
                document.cookie = "".concat(name, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=").concat(domain);
            }
            var hostname = window.location.hostname;
            if (hostname.includes('.')) {
                var parentDomain = '.' + hostname.split('.').slice(-2).join('.');
                document.cookie = "".concat(name, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=").concat(parentDomain);
            }
        }
    });
}
function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function formatGDPRDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function calculateRetentionExpiry(timestamp, retentionDays) {
    return timestamp + (retentionDays * 24 * 60 * 60 * 1000);
}
function isDataExpired(timestamp, retentionDays) {
    var expiry = calculateRetentionExpiry(timestamp, retentionDays);
    return now$1() > expiry;
}
function isBot() {
    if (!isBrowser())
        return false;
    var userAgent = navigator.userAgent.toLowerCase();
    var botPatterns = [
        'bot', 'crawler', 'spider', 'crawling', 'facebook', 'google', 'yahoo',
        'bing', 'duckduckgo', 'baidu', 'yandex', 'twitter', 'whatsapp', 'telegram'
    ];
    return botPatterns.some(function (pattern) { return userAgent.includes(pattern); });
}

var BehavioralTracker = (function () {
    function BehavioralTracker(config) {
        if (config === void 0) { config = {}; }
        this.name = 'behavioral';
        this._tracker = null;
        this._isActive = false;
        this._startTime = 0;
        this._lastActivity = 0;
        this._scrollEvents = 0;
        this._mouseEvents = 0;
        this._maxScrollDepth = 0;
        this._clickCount = 0;
        this._formInteractions = 0;
        this._mouseMovements = 0;
        this._trackedElements = new Set();
        this._visibilityTimers = new Map();
        this._listeners = [];
        this._lastScrollTime = 0;
        this._config = __assign({ enableClickTracking: true, enableScrollTracking: true, enableFormTracking: true, enableMouseTracking: true, enableVisibilityTracking: true, enablePerformanceTracking: true, scrollThreshold: 25, mouseSampleRate: 100, clickSelector: 'a, button, [role="button"], input[type="submit"], input[type="button"]', formSelector: 'form, input, textarea, select', excludeSelectors: ['.tracking-ignore', '[data-tracking="false"]'], maxScrollEvents: 100, maxMouseEvents: 500 }, config);
    }
    BehavioralTracker.prototype.init = function () {
        var _a;
        if (!isBrowser())
            return;
        this._isActive = true;
        this._startTime = now$1();
        this._lastActivity = now$1();
        this._setupEventListeners();
        this._startEngagementTracking();
        if ((_a = this._tracker) === null || _a === void 0 ? void 0 : _a.config.debug) {
            console.log('BehavioralTracker initialized', this._config);
        }
    };
    BehavioralTracker.prototype.setTracker = function (tracker) {
        this._tracker = tracker;
    };
    BehavioralTracker.prototype._setupEventListeners = function () {
        if (this._config.enableClickTracking) {
            this._setupClickTracking();
        }
        if (this._config.enableScrollTracking) {
            this._setupScrollTracking();
        }
        if (this._config.enableFormTracking) {
            this._setupFormTracking();
        }
        if (this._config.enableMouseTracking) {
            this._setupMouseTracking();
        }
        if (this._config.enableVisibilityTracking) {
            this._setupVisibilityTracking();
        }
        if (this._config.enablePerformanceTracking) {
            this._setupPerformanceTracking();
        }
        this._setupActivityTracking();
    };
    BehavioralTracker.prototype._setupClickTracking = function () {
        var _this = this;
        var handleClick = function (event) {
            if (!_this._isActive || !_this._tracker)
                return;
            var target = event.target;
            if (!target || _this._isExcluded(target))
                return;
            if (!target.matches(_this._config.clickSelector)) {
                var parent_1 = target.parentElement;
                var found = false;
                for (var i = 0; i < 3 && parent_1; i++) {
                    if (parent_1.matches(_this._config.clickSelector)) {
                        found = true;
                        break;
                    }
                    parent_1 = parent_1.parentElement;
                }
                if (!found)
                    return;
            }
            var clickData = {
                element: _this._getElementSelector(target),
                tagName: target.tagName.toLowerCase(),
                className: target.className,
                id: target.id || '',
                text: _this._getElementText(target),
                x: event.clientX,
                y: event.clientY,
                timestamp: now$1()
            };
            _this._trackEvent('click', clickData);
            _this._clickCount++;
            _this._updateActivity();
            if (_this._tracker.config.debug) {
                console.log('Click tracked:', clickData);
            }
        };
        document.addEventListener('click', handleClick, { passive: true });
        this._listeners.push(function () { return document.removeEventListener('click', handleClick); });
    };
    BehavioralTracker.prototype._setupScrollTracking = function () {
        var _this = this;
        var lastScrollTop = 0;
        var handleScroll = throttle(function () {
            if (!_this._isActive || !_this._tracker || _this._scrollEvents >= _this._config.maxScrollEvents)
                return;
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            var currentDepth = Math.round((scrollTop / scrollHeight) * 100);
            _this._maxScrollDepth = Math.max(_this._maxScrollDepth, currentDepth);
            var depthDifference = Math.abs(currentDepth - Math.round((lastScrollTop / scrollHeight) * 100));
            if (depthDifference < _this._config.scrollThreshold) {
                lastScrollTop = scrollTop;
                return;
            }
            var currentTime = now$1();
            var direction = scrollTop > lastScrollTop ? 'down' : 'up';
            var speed = Math.abs(scrollTop - lastScrollTop) / (currentTime - _this._lastScrollTime);
            var scrollData = {
                depth: currentDepth,
                maxDepth: _this._maxScrollDepth,
                direction: direction,
                speed: speed,
                timestamp: currentTime
            };
            _this._trackEvent('scroll', scrollData);
            _this._scrollEvents++;
            _this._updateActivity();
            lastScrollTop = scrollTop;
            _this._lastScrollTime = currentTime;
            if (_this._tracker.config.debug) {
                console.log('Scroll tracked:', scrollData);
            }
        }, 250);
        window.addEventListener('scroll', handleScroll, { passive: true });
        this._listeners.push(function () { return window.removeEventListener('scroll', handleScroll); });
    };
    BehavioralTracker.prototype._setupFormTracking = function () {
        var _this = this;
        var handleFormEvent = function (event, action) {
            var _a;
            if (!_this._isActive || !_this._tracker)
                return;
            var target = event.target;
            if (!target || _this._isExcluded(target))
                return;
            var form = target.closest('form');
            var formData = {
                formId: (form === null || form === void 0 ? void 0 : form.id) || '',
                formName: (form === null || form === void 0 ? void 0 : form.getAttribute('name')) || '',
                field: _this._getElementSelector(target),
                fieldType: target.type || target.tagName.toLowerCase(),
                action: action,
                value: action === 'change' ? (_a = target.value) === null || _a === void 0 ? void 0 : _a.slice(0, 50) : undefined,
                timestamp: now$1()
            };
            _this._trackEvent('form_interaction', formData);
            _this._formInteractions++;
            _this._updateActivity();
            if (_this._tracker.config.debug) {
                console.log('Form interaction tracked:', formData);
            }
        };
        var events = ['focus', 'blur', 'change'];
        events.forEach(function (eventType) {
            var handler = function (event) { return handleFormEvent(event, eventType); };
            document.addEventListener(eventType, handler, { passive: true });
            _this._listeners.push(function () { return document.removeEventListener(eventType, handler); });
        });
        var handleSubmit = function (event) { return handleFormEvent(event, 'submit'); };
        document.addEventListener('submit', handleSubmit, { passive: true });
        this._listeners.push(function () { return document.removeEventListener('submit', handleSubmit); });
    };
    BehavioralTracker.prototype._setupMouseTracking = function () {
        var _this = this;
        var handleMouseMove = throttle(function (event) {
            if (!_this._isActive || !_this._tracker || _this._mouseEvents >= _this._config.maxMouseEvents)
                return;
            var target = event.target;
            var mouseData = {
                x: event.clientX,
                y: event.clientY,
                type: 'move',
                element: target ? _this._getElementSelector(target) : 'document',
                timestamp: now$1()
            };
            _this._trackEvent('mouse_move', mouseData);
            _this._mouseEvents++;
            _this._mouseMovements++;
            _this._updateActivity();
        }, this._config.mouseSampleRate);
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        this._listeners.push(function () { return document.removeEventListener('mousemove', handleMouseMove); });
    };
    BehavioralTracker.prototype._setupVisibilityTracking = function () {
        var _this = this;
        if (!('IntersectionObserver' in window))
            return;
        this._visibilityObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var _a;
                var element = entry.target;
                var isVisible = entry.isIntersecting;
                var timestamp = now$1();
                if (isVisible) {
                    _this._visibilityTimers.set(element, timestamp);
                }
                else {
                    var startTime = _this._visibilityTimers.get(element);
                    if (startTime) {
                        var duration = timestamp - startTime;
                        var visibilityData = {
                            element: _this._getElementSelector(element),
                            visible: false,
                            duration: duration,
                            timestamp: timestamp
                        };
                        _this._trackEvent('element_visibility', visibilityData);
                        _this._visibilityTimers.delete(element);
                        if ((_a = _this._tracker) === null || _a === void 0 ? void 0 : _a.config.debug) {
                            console.log('Element visibility tracked:', visibilityData);
                        }
                    }
                }
            });
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
        var importantElements = document.querySelectorAll('[data-track-visibility], .cta, .product, .pricing');
        importantElements.forEach(function (el) {
            var _a;
            (_a = _this._visibilityObserver) === null || _a === void 0 ? void 0 : _a.observe(el);
            _this._trackedElements.add(el);
        });
    };
    BehavioralTracker.prototype._setupPerformanceTracking = function () {
        var _this = this;
        var _a;
        if (!('PerformanceObserver' in window))
            return;
        try {
            this._performanceObserver = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                entries.forEach(function (entry) {
                    if (entry.entryType === 'largest-contentful-paint') {
                        _this._trackEvent('performance', {
                            metric: 'lcp',
                            value: entry.startTime,
                            timestamp: now$1()
                        });
                    }
                    else if (entry.entryType === 'first-input') {
                        _this._trackEvent('performance', {
                            metric: 'fid',
                            value: entry.processingStart - entry.startTime,
                            timestamp: now$1()
                        });
                    }
                    else if (entry.entryType === 'layout-shift') {
                        _this._trackEvent('performance', {
                            metric: 'cls',
                            value: entry.value,
                            timestamp: now$1()
                        });
                    }
                });
            });
            this._performanceObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        }
        catch (error) {
            if ((_a = this._tracker) === null || _a === void 0 ? void 0 : _a.config.debug) {
                console.warn('Performance tracking not supported:', error);
            }
        }
    };
    BehavioralTracker.prototype._setupActivityTracking = function () {
        var _this = this;
        var activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        var resetIdleTimer = function () {
            if (_this._idleTimer) {
                clearTimeout(_this._idleTimer);
            }
            _this._idleTimer = window.setTimeout(function () {
                _this._trackEvent('user_idle', {
                    duration: 30000,
                    timestamp: now$1()
                });
            }, 30000);
        };
        activityEvents.forEach(function (eventType) {
            document.addEventListener(eventType, resetIdleTimer, { passive: true });
            _this._listeners.push(function () { return document.removeEventListener(eventType, resetIdleTimer); });
        });
        resetIdleTimer();
    };
    BehavioralTracker.prototype._startEngagementTracking = function () {
        var _this = this;
        this._engagementInterval = window.setInterval(function () {
            if (!_this._isActive || !_this._tracker)
                return;
            var metrics = _this._calculateEngagementMetrics();
            _this._trackEvent('engagement_metrics', metrics);
            if (_this._tracker.config.debug) {
                console.log('Engagement metrics:', metrics);
            }
        }, 30000);
    };
    BehavioralTracker.prototype._calculateEngagementMetrics = function () {
        var currentTime = now$1();
        var timeOnPage = currentTime - this._startTime;
        var idleTime = currentTime - this._lastActivity;
        var scrollWeight = Math.min(this._maxScrollDepth / 100, 1) * 25;
        var clickWeight = Math.min(this._clickCount / 5, 1) * 25;
        var formWeight = Math.min(this._formInteractions / 3, 1) * 25;
        var timeWeight = Math.min(timeOnPage / 60000, 1) * 25;
        var engagementScore = Math.round(scrollWeight + clickWeight + formWeight + timeWeight);
        return {
            timeOnPage: timeOnPage,
            scrollDepth: this._maxScrollDepth,
            clickCount: this._clickCount,
            formInteractions: this._formInteractions,
            mouseMovements: this._mouseMovements,
            idleTime: idleTime,
            engagementScore: engagementScore
        };
    };
    BehavioralTracker.prototype._trackEvent = function (type, data) {
        if (!this._tracker)
            return;
        var eventData = {
            type: type,
            element: data.element || type,
            value: data.value || JSON.stringify(data),
            timestamp: data.timestamp || now$1(),
            sessionId: this._tracker.session.sessionId,
            visitorId: this._tracker.session.visitorId,
            metadata: data
        };
        this._tracker.track("behavioral:".concat(type), eventData);
    };
    BehavioralTracker.prototype._updateActivity = function () {
        this._lastActivity = now$1();
    };
    BehavioralTracker.prototype._isExcluded = function (element) {
        return this._config.excludeSelectors.some(function (selector) { return element.matches(selector); });
    };
    BehavioralTracker.prototype._getElementSelector = function (element) {
        if (!element) {
            return 'unknown';
        }
        if (element.id) {
            return "#".concat(element.id);
        }
        if (element.className && typeof element.className === 'string') {
            var classes = element.className.split(' ').filter(function (c) { return c.length > 0; });
            if (classes.length > 0) {
                return ".".concat(classes[0]);
            }
        }
        if (element.tagName) {
            return element.tagName.toLowerCase();
        }
        return 'unknown';
    };
    BehavioralTracker.prototype._getElementText = function (element) {
        var text = element.textContent || element.value || '';
        return text.trim().slice(0, 100);
    };
    BehavioralTracker.prototype.enable = function () {
        this._isActive = true;
    };
    BehavioralTracker.prototype.disable = function () {
        this._isActive = false;
    };
    BehavioralTracker.prototype.destroy = function () {
        var _a;
        this._isActive = false;
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
        }
        if (this._engagementInterval) {
            clearInterval(this._engagementInterval);
        }
        if (this._visibilityObserver) {
            this._visibilityObserver.disconnect();
        }
        if (this._performanceObserver) {
            this._performanceObserver.disconnect();
        }
        this._listeners.forEach(function (removeListener) { return removeListener(); });
        this._listeners = [];
        this._trackedElements.clear();
        this._visibilityTimers.clear();
        if ((_a = this._tracker) === null || _a === void 0 ? void 0 : _a.config.debug) {
            console.log('BehavioralTracker destroyed');
        }
    };
    BehavioralTracker.prototype.getEngagementMetrics = function () {
        return this._calculateEngagementMetrics();
    };
    BehavioralTracker.prototype.trackCustomEvent = function (type, data) {
        this._trackEvent(type, data);
    };
    return BehavioralTracker;
}());

var EventEmitter = (function () {
    function EventEmitter() {
        this._events = new Map();
    }
    EventEmitter.prototype.on = function (event, callback) {
        if (!this._events.has(event)) {
            this._events.set(event, []);
        }
        this._events.get(event).push(callback);
    };
    EventEmitter.prototype.off = function (event, callback) {
        var listeners = this._events.get(event);
        if (listeners) {
            var index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
            if (listeners.length === 0) {
                this._events.delete(event);
            }
        }
    };
    EventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var listeners = this._events.get(event);
        if (listeners) {
            var copy = __spreadArray([], __read(listeners), false);
            copy.forEach(function (callback) {
                try {
                    callback.apply(void 0, __spreadArray([], __read(args), false));
                }
                catch (error) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('Event listener error:', error);
                    }
                }
            });
        }
    };
    EventEmitter.prototype.once = function (event, callback) {
        var _this = this;
        var onceWrapper = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            callback.apply(void 0, __spreadArray([], __read(args), false));
            _this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    };
    EventEmitter.prototype.removeAllListeners = function (event) {
        if (event) {
            this._events.delete(event);
        }
        else {
            this._events.clear();
        }
    };
    EventEmitter.prototype.listenerCount = function (event) {
        var listeners = this._events.get(event);
        return listeners ? listeners.length : 0;
    };
    EventEmitter.prototype.eventNames = function () {
        return Array.from(this._events.keys());
    };
    return EventEmitter;
}());

var now = function () {
    if (isBrowser() && 'performance' in window && performance.now) {
        return performance.now();
    }
    return Date.now();
};
var generateId = function () { return Math.random().toString(36).substr(2, 9); };
var PerformanceOptimizer = (function (_super) {
    __extends(PerformanceOptimizer, _super);
    function PerformanceOptimizer(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.name = 'PerformanceOptimizer';
        _this._isMonitoring = false;
        _this._initialized = false;
        _this._lazyModules = new Map();
        _this._loadedModules = new Set();
        _this._loadingPromises = new Map();
        _this._splitPoints = new Map();
        _this._loadedChunks = new Set();
        _this._memorySnapshots = [];
        _this._memoryThresholds = { warning: 50, critical: 75 };
        _this._detectedLeaks = [];
        _this._cpuProfiles = [];
        _this._taskQueue = [];
        _this._isThrottling = false;
        _this._currentThrottle = 0;
        _this._requestBatches = new Map();
        _this._pendingRequests = [];
        _this._lastFlush = 0;
        _this._coreWebVitals = {
            lcp: 0,
            fid: 0,
            cls: 0
        };
        _this._vitalsHistory = [];
        _this._resourcePriorities = new Map();
        _this._criticalResources = new Set();
        _this._preloadedResources = new Set();
        _this._platformOptimizations = new Map();
        _this._startTime = 0;
        _this._config = _this._getDefaultConfig(config);
        _this._metrics = _this._getInitialMetrics();
        _this._thresholds = _this._getDefaultThresholds();
        return _this;
    }
    PerformanceOptimizer.prototype._getDefaultConfig = function (config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56;
        return {
            enabled: (_a = config.enabled) !== null && _a !== void 0 ? _a : true,
            lazyLoading: {
                enabled: (_c = (_b = config.lazyLoading) === null || _b === void 0 ? void 0 : _b.enabled) !== null && _c !== void 0 ? _c : true,
                threshold: (_e = (_d = config.lazyLoading) === null || _d === void 0 ? void 0 : _d.threshold) !== null && _e !== void 0 ? _e : 50 * 1024,
                modules: (_g = (_f = config.lazyLoading) === null || _f === void 0 ? void 0 : _f.modules) !== null && _g !== void 0 ? _g : [],
                chunkSize: (_j = (_h = config.lazyLoading) === null || _h === void 0 ? void 0 : _h.chunkSize) !== null && _j !== void 0 ? _j : 100 * 1024,
            },
            codesplitting: {
                enabled: (_l = (_k = config.codesplitting) === null || _k === void 0 ? void 0 : _k.enabled) !== null && _l !== void 0 ? _l : true,
                splitPoints: (_o = (_m = config.codesplitting) === null || _m === void 0 ? void 0 : _m.splitPoints) !== null && _o !== void 0 ? _o : [],
                dynamicImports: (_q = (_p = config.codesplitting) === null || _p === void 0 ? void 0 : _p.dynamicImports) !== null && _q !== void 0 ? _q : true,
                preloadCritical: (_s = (_r = config.codesplitting) === null || _r === void 0 ? void 0 : _r.preloadCritical) !== null && _s !== void 0 ? _s : true,
            },
            memoryManagement: {
                enabled: (_u = (_t = config.memoryManagement) === null || _t === void 0 ? void 0 : _t.enabled) !== null && _u !== void 0 ? _u : true,
                maxMemoryUsage: (_w = (_v = config.memoryManagement) === null || _v === void 0 ? void 0 : _v.maxMemoryUsage) !== null && _w !== void 0 ? _w : 100,
                gcInterval: (_y = (_x = config.memoryManagement) === null || _x === void 0 ? void 0 : _x.gcInterval) !== null && _y !== void 0 ? _y : 30000,
                leakDetection: (_0 = (_z = config.memoryManagement) === null || _z === void 0 ? void 0 : _z.leakDetection) !== null && _0 !== void 0 ? _0 : true,
                autoCleanup: (_2 = (_1 = config.memoryManagement) === null || _1 === void 0 ? void 0 : _1.autoCleanup) !== null && _2 !== void 0 ? _2 : true,
                memoryThreshold: (_4 = (_3 = config.memoryManagement) === null || _3 === void 0 ? void 0 : _3.memoryThreshold) !== null && _4 !== void 0 ? _4 : 80,
            },
            cpuThrottling: {
                enabled: (_6 = (_5 = config.cpuThrottling) === null || _5 === void 0 ? void 0 : _5.enabled) !== null && _6 !== void 0 ? _6 : true,
                maxCpuUsage: (_8 = (_7 = config.cpuThrottling) === null || _7 === void 0 ? void 0 : _7.maxCpuUsage) !== null && _8 !== void 0 ? _8 : 70,
                throttleInterval: (_10 = (_9 = config.cpuThrottling) === null || _9 === void 0 ? void 0 : _9.throttleInterval) !== null && _10 !== void 0 ? _10 : 100,
                adaptiveThrottling: (_12 = (_11 = config.cpuThrottling) === null || _11 === void 0 ? void 0 : _11.adaptiveThrottling) !== null && _12 !== void 0 ? _12 : true,
                priorityQueue: (_14 = (_13 = config.cpuThrottling) === null || _13 === void 0 ? void 0 : _13.priorityQueue) !== null && _14 !== void 0 ? _14 : true,
            },
            requestBatching: {
                enabled: (_16 = (_15 = config.requestBatching) === null || _15 === void 0 ? void 0 : _15.enabled) !== null && _16 !== void 0 ? _16 : true,
                batchSize: (_18 = (_17 = config.requestBatching) === null || _17 === void 0 ? void 0 : _17.batchSize) !== null && _18 !== void 0 ? _18 : 10,
                flushInterval: (_20 = (_19 = config.requestBatching) === null || _19 === void 0 ? void 0 : _19.flushInterval) !== null && _20 !== void 0 ? _20 : 5000,
                maxBatchAge: (_22 = (_21 = config.requestBatching) === null || _21 === void 0 ? void 0 : _21.maxBatchAge) !== null && _22 !== void 0 ? _22 : 30000,
                priorityBatching: (_24 = (_23 = config.requestBatching) === null || _23 === void 0 ? void 0 : _23.priorityBatching) !== null && _24 !== void 0 ? _24 : true,
                compression: (_26 = (_25 = config.requestBatching) === null || _25 === void 0 ? void 0 : _25.compression) !== null && _26 !== void 0 ? _26 : true,
            },
            coreWebVitals: {
                enabled: (_28 = (_27 = config.coreWebVitals) === null || _27 === void 0 ? void 0 : _27.enabled) !== null && _28 !== void 0 ? _28 : true,
                lcpThreshold: (_30 = (_29 = config.coreWebVitals) === null || _29 === void 0 ? void 0 : _29.lcpThreshold) !== null && _30 !== void 0 ? _30 : 2500,
                fidThreshold: (_32 = (_31 = config.coreWebVitals) === null || _31 === void 0 ? void 0 : _31.fidThreshold) !== null && _32 !== void 0 ? _32 : 100,
                clsThreshold: (_34 = (_33 = config.coreWebVitals) === null || _33 === void 0 ? void 0 : _33.clsThreshold) !== null && _34 !== void 0 ? _34 : 0.1,
                monitoring: (_36 = (_35 = config.coreWebVitals) === null || _35 === void 0 ? void 0 : _35.monitoring) !== null && _36 !== void 0 ? _36 : true,
                optimization: (_38 = (_37 = config.coreWebVitals) === null || _37 === void 0 ? void 0 : _37.optimization) !== null && _38 !== void 0 ? _38 : true,
            },
            resourcePrioritization: {
                enabled: (_40 = (_39 = config.resourcePrioritization) === null || _39 === void 0 ? void 0 : _39.enabled) !== null && _40 !== void 0 ? _40 : true,
                criticalResources: (_42 = (_41 = config.resourcePrioritization) === null || _41 === void 0 ? void 0 : _41.criticalResources) !== null && _42 !== void 0 ? _42 : [],
                preloadThreshold: (_44 = (_43 = config.resourcePrioritization) === null || _43 === void 0 ? void 0 : _43.preloadThreshold) !== null && _44 !== void 0 ? _44 : 1000,
                deferNonCritical: (_46 = (_45 = config.resourcePrioritization) === null || _45 === void 0 ? void 0 : _45.deferNonCritical) !== null && _46 !== void 0 ? _46 : true,
                adaptivePriority: (_48 = (_47 = config.resourcePrioritization) === null || _47 === void 0 ? void 0 : _47.adaptivePriority) !== null && _48 !== void 0 ? _48 : true,
            },
            crossPlatform: {
                enabled: (_50 = (_49 = config.crossPlatform) === null || _49 === void 0 ? void 0 : _49.enabled) !== null && _50 !== void 0 ? _50 : true,
                frameworkOptimizations: (_52 = (_51 = config.crossPlatform) === null || _51 === void 0 ? void 0 : _51.frameworkOptimizations) !== null && _52 !== void 0 ? _52 : {},
                universalPolyfills: (_54 = (_53 = config.crossPlatform) === null || _53 === void 0 ? void 0 : _53.universalPolyfills) !== null && _54 !== void 0 ? _54 : true,
                adaptiveLoading: (_56 = (_55 = config.crossPlatform) === null || _55 === void 0 ? void 0 : _55.adaptiveLoading) !== null && _56 !== void 0 ? _56 : true,
            },
        };
    };
    PerformanceOptimizer.prototype._getInitialMetrics = function () {
        return {
            loadTime: 0,
            domReady: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            totalBlockingTime: 0,
            timeToInteractive: 0,
            memoryUsage: {
                used: 0,
                total: 0,
                limit: this._config.memoryManagement.maxMemoryUsage * 1024 * 1024,
            },
            cpuUsage: 0,
            networkStats: {
                requests: 0,
                bytesTransferred: 0,
                averageLatency: 0,
            },
            scriptPerformance: {
                initTime: 0,
                executionTime: 0,
                moduleLoadTimes: {},
            },
        };
    };
    PerformanceOptimizer.prototype._getDefaultThresholds = function () {
        return {
            memory: {
                warning: this._config.memoryManagement.memoryThreshold,
                critical: this._config.memoryManagement.maxMemoryUsage,
            },
            cpu: {
                warning: this._config.cpuThrottling.maxCpuUsage * 0.8,
                critical: this._config.cpuThrottling.maxCpuUsage,
            },
            network: {
                latency: 500,
                bandwidth: 1024 * 1024,
            },
            coreWebVitals: {
                lcp: this._config.coreWebVitals.lcpThreshold,
                fid: this._config.coreWebVitals.fidThreshold,
                cls: this._config.coreWebVitals.clsThreshold,
            },
        };
    };
    PerformanceOptimizer.prototype.init = function () {
        if (this._initialized || !this._config.enabled)
            return;
        try {
            if (this._config.lazyLoading.enabled) {
                this._initLazyLoading();
            }
            if (this._config.codesplitting.enabled) {
                this._initCodeSplitting();
            }
            if (this._config.memoryManagement.enabled) {
                this._initMemoryManagement();
            }
            if (this._config.cpuThrottling.enabled) {
                this._initCpuThrottling();
            }
            if (this._config.requestBatching.enabled) {
                this._initRequestBatching();
            }
            if (this._config.coreWebVitals.enabled) {
                this._initCoreWebVitals();
            }
            if (this._config.resourcePrioritization.enabled) {
                this._initResourcePrioritization();
            }
            if (this._config.crossPlatform.enabled) {
                this._initCrossPlatform();
            }
            this._detectPlatform();
            this._measureInitialMetrics();
            this._initialized = true;
            this.emit('performance:initialized', { config: this._config });
        }
        catch (error) {
            console.error('PerformanceOptimizer initialization failed:', error);
            this.emit('performance:error', error);
        }
    };
    PerformanceOptimizer.prototype.destroy = function () {
        this.stopMonitoring();
        if (this._throttleInterval)
            clearInterval(this._throttleInterval);
        if (this._batchInterval)
            clearInterval(this._batchInterval);
        if (this._monitoringInterval)
            clearInterval(this._monitoringInterval);
        if (this._vitalsObserver)
            this._vitalsObserver.disconnect();
        if (this._performanceObserver)
            this._performanceObserver.disconnect();
        if (this._resizeObserver)
            this._resizeObserver.disconnect();
        this._lazyModules.clear();
        this._loadedModules.clear();
        this._loadingPromises.clear();
        this._splitPoints.clear();
        this._loadedChunks.clear();
        this._memorySnapshots = [];
        this._detectedLeaks = [];
        this._cpuProfiles = [];
        this._taskQueue = [];
        this._requestBatches.clear();
        this._pendingRequests = [];
        this._resourcePriorities.clear();
        this._criticalResources.clear();
        this._preloadedResources.clear();
        this._platformOptimizations.clear();
        this._initialized = false;
        this.emit('performance:destroyed');
    };
    PerformanceOptimizer.prototype.configure = function (config) {
        this._config = __assign(__assign({}, this._config), config);
        this._thresholds = this._getDefaultThresholds();
        if (this._initialized) {
            this.destroy();
            this.init();
        }
        this.emit('performance:configured', { config: this._config });
    };
    PerformanceOptimizer.prototype.getConfig = function () {
        return __assign({}, this._config);
    };
    PerformanceOptimizer.prototype._initLazyLoading = function () {
        var _this = this;
        var commonModules = this._config.lazyLoading.modules;
        commonModules.forEach(function (moduleName) {
            _this.registerLazyModule({
                name: moduleName,
                size: 0,
                priority: 'normal',
                dependencies: [],
                loader: function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2, import(moduleName)];
                    });
                }); },
                loaded: false,
            });
        });
    };
    PerformanceOptimizer.prototype.registerLazyModule = function (module) {
        this._lazyModules.set(module.name, module);
        this.emit('performance:module_registered', { module: module.name });
    };
    PerformanceOptimizer.prototype.loadModule = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var module, existingPromise, startTime, loadPromise, result, loadTime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        module = this._lazyModules.get(name);
                        if (!module) {
                            throw new Error("Module '".concat(name, "' not registered for lazy loading"));
                        }
                        if (module.loaded) {
                            return [2, module];
                        }
                        existingPromise = this._loadingPromises.get(name);
                        if (existingPromise) {
                            return [2, existingPromise];
                        }
                        startTime = now();
                        loadPromise = this._loadModuleWithDependencies(module);
                        this._loadingPromises.set(name, loadPromise);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, loadPromise];
                    case 2:
                        result = _a.sent();
                        loadTime = now() - startTime;
                        module.loaded = true;
                        module.loadTime = loadTime;
                        this._loadedModules.add(name);
                        this._loadingPromises.delete(name);
                        if (this._metrics.scriptPerformance) {
                            this._metrics.scriptPerformance.moduleLoadTimes[name] = loadTime;
                        }
                        this.emit('performance:module_loaded', {
                            module: name,
                            loadTime: loadTime,
                            size: module.size
                        });
                        return [2, result];
                    case 3:
                        error_1 = _a.sent();
                        this._loadingPromises.delete(name);
                        this.emit('performance:module_error', { module: name, error: error_1 });
                        throw error_1;
                    case 4: return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._loadModuleWithDependencies = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, dep, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(module.dependencies), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        dep = _b.value;
                        if (!!this._loadedModules.has(dep)) return [3, 3];
                        return [4, this.loadModule(dep)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7];
                    case 7: return [2, module.loader()];
                }
            });
        });
    };
    PerformanceOptimizer.prototype.preloadModules = function (names) {
        return __awaiter(this, void 0, void 0, function () {
            var loadPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loadPromises = names.map(function (name) { return _this.loadModule(name); });
                        return [4, Promise.all(loadPromises)];
                    case 1:
                        _a.sent();
                        this.emit('performance:modules_preloaded', { modules: names });
                        return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._initCodeSplitting = function () {
        if (this._config.codesplitting.preloadCritical) {
            this.preloadCritical();
        }
    };
    PerformanceOptimizer.prototype.registerSplitPoint = function (splitPoint) {
        this._splitPoints.set(splitPoint.name, splitPoint);
        if (splitPoint.critical) {
            this._criticalResources.add(splitPoint.name);
        }
        this.emit('performance:split_point_registered', { splitPoint: splitPoint.name });
    };
    PerformanceOptimizer.prototype.splitCode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var splitPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        splitPromises = [];
                        Array.from(this._splitPoints.entries()).forEach(function (_a) {
                            var _b = __read(_a, 2), name = _b[0], splitPoint = _b[1];
                            if (_this._loadedChunks.has(name))
                                return;
                            if (splitPoint.condition()) {
                                var splitPromise = _this._loadSplitPoint(splitPoint);
                                splitPromises.push(splitPromise);
                            }
                        });
                        return [4, Promise.all(splitPromises)];
                    case 1:
                        _a.sent();
                        this.emit('performance:code_split_complete');
                        return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._loadSplitPoint = function (splitPoint) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, modulePromises, loadTime, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        modulePromises = splitPoint.modules.map(function (module) { return _this.loadModule(module); });
                        return [4, Promise.all(modulePromises)];
                    case 2:
                        _a.sent();
                        this._loadedChunks.add(splitPoint.name);
                        loadTime = now() - startTime;
                        this.emit('performance:split_point_loaded', {
                            splitPoint: splitPoint.name,
                            loadTime: loadTime,
                            modules: splitPoint.modules
                        });
                        return [3, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.emit('performance:split_point_error', {
                            splitPoint: splitPoint.name,
                            error: error_2
                        });
                        throw error_2;
                    case 4: return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype.preloadCritical = function () {
        return __awaiter(this, void 0, void 0, function () {
            var criticalSplitPoints, loadPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        criticalSplitPoints = Array.from(this._splitPoints.values())
                            .filter(function (sp) { return sp.critical || sp.preload; });
                        loadPromises = criticalSplitPoints.map(function (sp) { return _this._loadSplitPoint(sp); });
                        return [4, Promise.all(loadPromises)];
                    case 1:
                        _a.sent();
                        this.emit('performance:critical_preloaded', {
                            count: criticalSplitPoints.length
                        });
                        return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._initMemoryManagement = function () {
        var _this = this;
        if (this._config.memoryManagement.autoCleanup) {
            this._gcInterval = window.setInterval(function () {
                _this._performGarbageCollection();
            }, this._config.memoryManagement.gcInterval);
        }
        if (this._config.memoryManagement.leakDetection) {
            this._startMemoryLeakDetection();
        }
    };
    PerformanceOptimizer.prototype.getMemoryUsage = function () {
        var snapshot = {
            timestamp: now(),
            heapUsed: 0,
            heapTotal: 0,
            external: 0,
        };
        if (isBrowser() && 'memory' in performance) {
            var memory = performance.memory;
            snapshot.heapUsed = memory.usedJSHeapSize || 0;
            snapshot.heapTotal = memory.totalJSHeapSize || 0;
            snapshot.external = memory.totalJSHeapSize - memory.usedJSHeapSize || 0;
        }
        if (this._config.memoryManagement.leakDetection) {
            snapshot.leaks = this.detectMemoryLeaks();
        }
        this._memorySnapshots.push(snapshot);
        if (this._memorySnapshots.length > 100) {
            this._memorySnapshots = this._memorySnapshots.slice(-100);
        }
        return snapshot;
    };
    PerformanceOptimizer.prototype.detectMemoryLeaks = function () {
        var leaks = [];
        if (this._memorySnapshots.length < 5)
            return leaks;
        var recent = this._memorySnapshots.slice(-5);
        var isGrowing = recent.every(function (snapshot, i) {
            return i === 0 || snapshot.heapUsed > recent[i - 1].heapUsed;
        });
        if (isGrowing) {
            var growth = recent[recent.length - 1].heapUsed - recent[0].heapUsed;
            if (growth > 10 * 1024 * 1024) {
                leaks.push({
                    type: 'memory_growth',
                    size: growth,
                    location: 'heap',
                    timestamp: now(),
                    stack: new Error().stack || 'No stack trace available',
                });
            }
        }
        this._detectedLeaks = leaks;
        return leaks;
    };
    PerformanceOptimizer.prototype.cleanup = function () {
        var e_2, _a;
        this._memorySnapshots = this._memorySnapshots.slice(-10);
        this._cpuProfiles = this._cpuProfiles.slice(-10);
        this._vitalsHistory = this._vitalsHistory.slice(-10);
        try {
            for (var _b = __values(this._requestBatches), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), id = _d[0], batch = _d[1];
                if (batch.createdAt < now() - this._config.requestBatching.maxBatchAge) {
                    this._requestBatches.delete(id);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        this.emit('performance:cleanup_complete');
    };
    PerformanceOptimizer.prototype.forceGarbageCollection = function () {
        this._performGarbageCollection();
    };
    PerformanceOptimizer.prototype._performGarbageCollection = function () {
        var beforeSnapshot = this.getMemoryUsage();
        this.cleanup();
        if ('gc' in window && typeof window.gc === 'function') {
            window.gc();
        }
        var afterSnapshot = this.getMemoryUsage();
        var freed = beforeSnapshot.heapUsed - afterSnapshot.heapUsed;
        this._lastGC = now();
        this.emit('performance:gc_performed', { freed: freed, before: beforeSnapshot, after: afterSnapshot });
    };
    PerformanceOptimizer.prototype._startMemoryLeakDetection = function () {
        var _this = this;
        setInterval(function () {
            var usage = _this.getMemoryUsage();
            var threshold = _this._thresholds.memory.warning * 1024 * 1024;
            if (usage.heapUsed > threshold) {
                _this.emit('performance:memory_warning', {
                    usage: usage.heapUsed,
                    threshold: threshold,
                    leaks: usage.leaks
                });
            }
        }, 10000);
    };
    PerformanceOptimizer.prototype._initCpuThrottling = function () {
        if (this._config.cpuThrottling.priorityQueue) {
            this._startTaskQueue();
        }
        if (this._config.cpuThrottling.adaptiveThrottling) {
            this._startCpuMonitoring();
        }
    };
    PerformanceOptimizer.prototype.getCpuUsage = function () {
        var profile = {
            timestamp: now(),
            usage: 0,
            tasks: [],
            throttled: this._isThrottling,
        };
        if (this._taskQueue.length > 0) {
            profile.usage = Math.min(this._taskQueue.length * 10, 100);
        }
        this._cpuProfiles.push(profile);
        if (this._cpuProfiles.length > 50) {
            this._cpuProfiles = this._cpuProfiles.slice(-50);
        }
        return profile;
    };
    PerformanceOptimizer.prototype.throttleCpu = function (enabled) {
        var _this = this;
        this._isThrottling = enabled;
        if (enabled && !this._throttleInterval) {
            this._throttleInterval = window.setInterval(function () {
                _this._processTaskQueue();
            }, this._config.cpuThrottling.throttleInterval);
        }
        else if (!enabled && this._throttleInterval) {
            clearInterval(this._throttleInterval);
            this._throttleInterval = undefined;
        }
        this.emit('performance:cpu_throttling_changed', { enabled: enabled });
    };
    PerformanceOptimizer.prototype.queueTask = function (task, priority) {
        this._taskQueue.push({ fn: task, priority: priority });
        this._taskQueue.sort(function (a, b) {
            var priorities = { critical: 4, high: 3, normal: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
        this.emit('performance:task_queued', { priority: priority, queueSize: this._taskQueue.length });
    };
    PerformanceOptimizer.prototype._startTaskQueue = function () {
        this.throttleCpu(true);
    };
    PerformanceOptimizer.prototype._startCpuMonitoring = function () {
        var _this = this;
        setInterval(function () {
            var profile = _this.getCpuUsage();
            var threshold = _this._thresholds.cpu.warning;
            if (profile.usage > threshold && !_this._isThrottling) {
                _this.throttleCpu(true);
                _this.emit('performance:cpu_throttling_activated', { usage: profile.usage, threshold: threshold });
            }
            else if (profile.usage < threshold * 0.5 && _this._isThrottling) {
                _this.throttleCpu(false);
                _this.emit('performance:cpu_throttling_deactivated', { usage: profile.usage });
            }
        }, 5000);
    };
    PerformanceOptimizer.prototype._processTaskQueue = function () {
        var _this = this;
        if (this._taskQueue.length === 0)
            return;
        var batchSize = this._isThrottling ? 2 : 5;
        var tasksToProcess = this._taskQueue.splice(0, batchSize);
        tasksToProcess.forEach(function (_a) {
            var fn = _a.fn;
            try {
                fn();
            }
            catch (error) {
                _this.emit('performance:task_error', { error: error });
            }
        });
    };
    PerformanceOptimizer.prototype._initRequestBatching = function () {
        var _this = this;
        this._batchInterval = window.setInterval(function () {
            _this._flushOldBatches();
        }, this._config.requestBatching.flushInterval);
    };
    PerformanceOptimizer.prototype.addRequest = function (request) {
        var queuedRequest = __assign(__assign({}, request), { id: generateId(), timestamp: now() });
        this._pendingRequests.push(queuedRequest);
        this._createOrUpdateBatch(queuedRequest);
        this.emit('performance:request_queued', { requestId: queuedRequest.id });
        return queuedRequest.id;
    };
    PerformanceOptimizer.prototype._createOrUpdateBatch = function (request) {
        var e_3, _a;
        var targetBatch;
        try {
            for (var _b = __values(this._requestBatches.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var batch = _c.value;
                if (batch.priority === request.priority &&
                    batch.requests.length < this._config.requestBatching.batchSize) {
                    targetBatch = batch;
                    break;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        if (!targetBatch) {
            targetBatch = {
                id: generateId(),
                requests: [],
                size: 0,
                priority: request.priority,
                createdAt: now(),
                flushAt: now() + this._config.requestBatching.flushInterval,
                compressed: this._config.requestBatching.compression,
            };
            this._requestBatches.set(targetBatch.id, targetBatch);
        }
        targetBatch.requests.push(request);
        targetBatch.size += JSON.stringify(request.data).length;
        if (targetBatch.requests.length >= this._config.requestBatching.batchSize) {
            this.flushBatch(targetBatch.id);
        }
    };
    PerformanceOptimizer.prototype.flushBatch = function (batchId) {
        return __awaiter(this, void 0, void 0, function () {
            var batch, flushPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!batchId) return [3, 3];
                        batch = this._requestBatches.get(batchId);
                        if (!batch) return [3, 2];
                        return [4, this._sendBatch(batch)];
                    case 1:
                        _a.sent();
                        this._requestBatches.delete(batchId);
                        _a.label = 2;
                    case 2: return [3, 5];
                    case 3:
                        flushPromises = Array.from(this._requestBatches.values())
                            .map(function (batch) { return _this._sendBatch(batch); });
                        return [4, Promise.all(flushPromises)];
                    case 4:
                        _a.sent();
                        this._requestBatches.clear();
                        _a.label = 5;
                    case 5:
                        this._lastFlush = now();
                        return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._sendBatch = function (batch) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.emit('performance:batch_sent', {
                        batchId: batch.id,
                        requestCount: batch.requests.length,
                        size: batch.size
                    });
                }
                catch (error) {
                    this.emit('performance:batch_error', { batchId: batch.id, error: error });
                }
                return [2];
            });
        });
    };
    PerformanceOptimizer.prototype._flushOldBatches = function () {
        var e_4, _a;
        var currentTime = now();
        try {
            for (var _b = __values(this._requestBatches), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), id = _d[0], batch = _d[1];
                if (currentTime >= batch.flushAt) {
                    this.flushBatch(id);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    PerformanceOptimizer.prototype.getBatchStatus = function () {
        return Array.from(this._requestBatches.values());
    };
    PerformanceOptimizer.prototype._initCoreWebVitals = function () {
        if (!isBrowser() || !this._config.coreWebVitals.monitoring)
            return;
        this._observeCoreWebVitals();
    };
    PerformanceOptimizer.prototype._observeCoreWebVitals = function () {
        var _this = this;
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                var lcpObserver = new PerformanceObserver(function (list) {
                    var entries = list.getEntries();
                    var lastEntry = entries[entries.length - 1];
                    _this._coreWebVitals.lcp = lastEntry.startTime;
                    _this._updateCoreWebVitals();
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            }
            catch (_a) {
            }
            try {
                var fidObserver = new PerformanceObserver(function (list) {
                    var entries = list.getEntries();
                    entries.forEach(function (entry) {
                        if (entry.processingStart - entry.startTime > 0) {
                            _this._coreWebVitals.fid = entry.processingStart - entry.startTime;
                            _this._updateCoreWebVitals();
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            }
            catch (_b) {
            }
            try {
                var clsObserver = new PerformanceObserver(function (list) {
                    var clsValue = 0;
                    list.getEntries().forEach(function (entry) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    _this._coreWebVitals.cls = clsValue;
                    _this._updateCoreWebVitals();
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            }
            catch (_c) {
            }
        }
    };
    PerformanceOptimizer.prototype._updateCoreWebVitals = function () {
        this._vitalsHistory.push(__assign({}, this._coreWebVitals));
        if (this._vitalsHistory.length > 50) {
            this._vitalsHistory = this._vitalsHistory.slice(-50);
        }
        this.emit('performance:core_web_vitals_updated', this._coreWebVitals);
    };
    PerformanceOptimizer.prototype.measureCoreWebVitals = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(__assign({}, _this._coreWebVitals));
                        }, 100);
                    })];
            });
        });
    };
    PerformanceOptimizer.prototype.optimizeCoreWebVitals = function () {
        if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > this._thresholds.coreWebVitals.lcp) {
            this.preloadCriticalResources();
            this.emit('performance:lcp_optimization_applied');
        }
        if (this._coreWebVitals.fid && this._coreWebVitals.fid > this._thresholds.coreWebVitals.fid) {
            this.throttleCpu(true);
            this.emit('performance:fid_optimization_applied');
        }
        if (this._coreWebVitals.cls && this._coreWebVitals.cls > this._thresholds.coreWebVitals.cls) {
            this.deferNonCriticalResources();
            this.emit('performance:cls_optimization_applied');
        }
    };
    PerformanceOptimizer.prototype.getCoreWebVitalsReport = function () {
        return __assign({}, this._coreWebVitals);
    };
    PerformanceOptimizer.prototype._initResourcePrioritization = function () {
        var _this = this;
        this._config.resourcePrioritization.criticalResources.forEach(function (resource) {
            _this.prioritizeResource({
                resource: resource,
                priority: 'critical',
                timing: 'preload',
            });
        });
    };
    PerformanceOptimizer.prototype.prioritizeResource = function (resource) {
        this._resourcePriorities.set(resource.resource, resource);
        if (resource.priority === 'critical') {
            this._criticalResources.add(resource.resource);
        }
        if (resource.timing === 'defer' || resource.timing === 'lazy') {
            this._preloadedResources.add(resource.resource);
        }
        this.emit('performance:resource_prioritized', { resource: resource.resource, priority: resource.priority });
    };
    PerformanceOptimizer.prototype.preloadCriticalResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var preloadPromises, _a, _b, resource, priority;
            var e_5, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!isBrowser())
                            return [2];
                        preloadPromises = [];
                        try {
                            for (_a = __values(this._criticalResources), _b = _a.next(); !_b.done; _b = _a.next()) {
                                resource = _b.value;
                                priority = this._resourcePriorities.get(resource);
                                if ((priority === null || priority === void 0 ? void 0 : priority.timing) === 'preload') {
                                    preloadPromises.push(this._preloadResource(resource));
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        return [4, Promise.all(preloadPromises)];
                    case 1:
                        _d.sent();
                        this.emit('performance:critical_resources_preloaded', { count: preloadPromises.length });
                        return [2];
                }
            });
        });
    };
    PerformanceOptimizer.prototype._preloadResource = function (resource) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve) {
                        var link = document.createElement('link');
                        link.rel = 'preload';
                        link.href = resource;
                        link.onload = function () { return resolve(); };
                        link.onerror = function () { return resolve(); };
                        document.head.appendChild(link);
                    })];
            });
        });
    };
    PerformanceOptimizer.prototype.deferNonCriticalResources = function () {
        var _this = this;
        if (!isBrowser())
            return;
        this._preloadedResources.forEach(function (resource) {
            var priority = _this._resourcePriorities.get(resource);
            if ((priority === null || priority === void 0 ? void 0 : priority.condition) && !priority.condition()) {
                return;
            }
            _this._loadDeferredResource(resource);
        });
        this.emit('performance:non_critical_resources_deferred');
    };
    PerformanceOptimizer.prototype._loadDeferredResource = function (resource) {
        var _this = this;
        requestIdleCallback(function () {
            _this.emit('performance:deferred_resource_loaded', { resource: resource });
        });
    };
    PerformanceOptimizer.prototype._initCrossPlatform = function () {
        if (this._config.crossPlatform.universalPolyfills) {
            this.enableUniversalPolyfills();
        }
    };
    PerformanceOptimizer.prototype.optimizeForPlatform = function (platform, framework) {
        this._currentPlatform = platform;
        this._currentFramework = framework;
        var optimization = {
            platform: platform,
            framework: framework,
            optimizations: this._config.crossPlatform.frameworkOptimizations[platform] || {},
            polyfills: [],
            fallbacks: [],
        };
        this._platformOptimizations.set(platform, optimization);
        this.emit('performance:platform_optimized', { platform: platform, framework: framework });
    };
    PerformanceOptimizer.prototype.enableUniversalPolyfills = function () {
        var _this = this;
        if (!isBrowser())
            return;
        var polyfills = [
            'requestIdleCallback',
            'IntersectionObserver',
            'PerformanceObserver',
            'ResizeObserver',
        ];
        polyfills.forEach(function (polyfill) {
            if (!(polyfill in window)) {
                _this._addPolyfill(polyfill);
            }
        });
        this.emit('performance:universal_polyfills_enabled');
    };
    PerformanceOptimizer.prototype._addPolyfill = function (name) {
        switch (name) {
            case 'requestIdleCallback':
                if (!('requestIdleCallback' in window)) {
                    window.requestIdleCallback = function (callback) {
                        return setTimeout(callback, 0);
                    };
                }
                break;
        }
    };
    PerformanceOptimizer.prototype._detectPlatform = function () {
        if (!isBrowser()) {
            this._currentPlatform = 'server';
            return;
        }
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('react')) {
            this._currentPlatform = 'react';
        }
        else if (userAgent.includes('vue')) {
            this._currentPlatform = 'vue';
        }
        else if (userAgent.includes('angular')) {
            this._currentPlatform = 'angular';
        }
        else {
            this._currentPlatform = 'vanilla';
        }
        this.optimizeForPlatform(this._currentPlatform);
    };
    PerformanceOptimizer.prototype._measureInitialMetrics = function () {
        var _this = this;
        if (!isBrowser())
            return;
        var startTime = now();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                _this._metrics.domReady = now() - startTime;
            });
        }
        else {
            this._metrics.domReady = 0;
        }
        if (document.readyState !== 'complete') {
            window.addEventListener('load', function () {
                _this._metrics.loadTime = now() - startTime;
            });
        }
        if ('performance' in window && performance.getEntriesByType) {
            var paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(function (entry) {
                if (entry.name === 'first-paint') {
                    _this._metrics.firstPaint = entry.startTime;
                }
                else if (entry.name === 'first-contentful-paint') {
                    _this._metrics.firstContentfulPaint = entry.startTime;
                }
            });
        }
    };
    PerformanceOptimizer.prototype.startMonitoring = function () {
        var _this = this;
        if (this._isMonitoring)
            return;
        this._isMonitoring = true;
        this._monitoringInterval = window.setInterval(function () {
            _this._collectMetrics();
        }, 5000);
        this.emit('performance:monitoring_started');
    };
    PerformanceOptimizer.prototype.stopMonitoring = function () {
        if (!this._isMonitoring)
            return;
        this._isMonitoring = false;
        if (this._monitoringInterval) {
            clearInterval(this._monitoringInterval);
            this._monitoringInterval = undefined;
        }
        this.emit('performance:monitoring_stopped');
    };
    PerformanceOptimizer.prototype._collectMetrics = function () {
        var memorySnapshot = this.getMemoryUsage();
        if (this._metrics.memoryUsage) {
            this._metrics.memoryUsage.used = memorySnapshot.heapUsed;
            this._metrics.memoryUsage.total = memorySnapshot.heapTotal;
        }
        var cpuProfile = this.getCpuUsage();
        this._metrics.cpuUsage = cpuProfile.usage;
        this.emit('performance:metrics_updated', this._metrics);
    };
    PerformanceOptimizer.prototype.getMetrics = function () {
        return __assign({}, this._metrics);
    };
    PerformanceOptimizer.prototype.getThresholds = function () {
        return __assign({}, this._thresholds);
    };
    PerformanceOptimizer.prototype.setThresholds = function (thresholds) {
        this._thresholds = __assign(__assign({}, this._thresholds), thresholds);
        this.emit('performance:thresholds_updated', this._thresholds);
    };
    PerformanceOptimizer.prototype.getOptimizationReport = function () {
        var violations = this._detectViolations();
        var recommendations = this._generateRecommendations();
        var score = this._calculatePerformanceScore();
        var grade = this._getPerformanceGrade(score);
        return {
            timestamp: now(),
            metrics: this._metrics,
            thresholds: this._thresholds,
            violations: violations,
            optimizations: recommendations,
            score: score,
            grade: grade,
        };
    };
    PerformanceOptimizer.prototype._detectViolations = function () {
        var violations = [];
        if (this._metrics.memoryUsage && this._metrics.memoryUsage.used > this._thresholds.memory.critical * 1024 * 1024) {
            violations.push({
                type: 'memory',
                severity: 'critical',
                message: 'Memory usage exceeds critical threshold',
                value: this._metrics.memoryUsage.used,
                threshold: this._thresholds.memory.critical * 1024 * 1024,
                timestamp: now(),
            });
        }
        if (this._metrics.cpuUsage && this._metrics.cpuUsage > this._thresholds.cpu.critical) {
            violations.push({
                type: 'cpu',
                severity: 'critical',
                message: 'CPU usage exceeds critical threshold',
                value: this._metrics.cpuUsage,
                threshold: this._thresholds.cpu.critical,
                timestamp: now(),
            });
        }
        if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > this._thresholds.coreWebVitals.lcp) {
            violations.push({
                type: 'core-web-vitals',
                severity: 'high',
                message: 'Largest Contentful Paint exceeds threshold',
                value: this._coreWebVitals.lcp,
                threshold: this._thresholds.coreWebVitals.lcp,
                timestamp: now(),
            });
        }
        return violations;
    };
    PerformanceOptimizer.prototype._generateRecommendations = function () {
        var _this = this;
        var recommendations = [];
        if (this._detectedLeaks.length > 0) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: 'Memory leaks detected - enable garbage collection',
                impact: 'high',
                effort: 'low',
                action: function () { return _this.forceGarbageCollection(); },
            });
        }
        if (this._loadedModules.size < this._lazyModules.size / 2) {
            recommendations.push({
                type: 'lazy-loading',
                priority: 'medium',
                message: 'Enable lazy loading for better performance',
                impact: 'medium',
                effort: 'low',
                action: function () { return _this.preloadModules(Array.from(_this._lazyModules.keys())); },
            });
        }
        return recommendations;
    };
    PerformanceOptimizer.prototype._calculatePerformanceScore = function () {
        var score = 100;
        var violations = this._detectViolations();
        violations.forEach(function (violation) {
            switch (violation.severity) {
                case 'critical':
                    score -= 20;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        });
        if (this._coreWebVitals.lcp && this._coreWebVitals.lcp > 4000)
            score -= 10;
        if (this._coreWebVitals.fid && this._coreWebVitals.fid > 300)
            score -= 10;
        if (this._coreWebVitals.cls && this._coreWebVitals.cls > 0.25)
            score -= 10;
        return Math.max(0, score);
    };
    PerformanceOptimizer.prototype._getPerformanceGrade = function (score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    };
    return PerformanceOptimizer;
}(EventEmitter));

var TechnologyDetector = (function () {
    function TechnologyDetector() {
        this.name = 'TechnologyDetector';
        this._isEnabled = false;
        this._detectionCache = new Map();
        this._signatures = [];
        this._initializeSignatures();
    }
    TechnologyDetector.prototype.init = function () {
        if (!isBrowser()) {
            return;
        }
        this._isEnabled = true;
        this._performDetection();
    };
    TechnologyDetector.prototype.enable = function () {
        this._isEnabled = true;
    };
    TechnologyDetector.prototype.disable = function () {
        this._isEnabled = false;
    };
    TechnologyDetector.prototype.destroy = function () {
        this._isEnabled = false;
        this._detectionCache.clear();
    };
    TechnologyDetector.prototype.getCurrentTechStack = function () {
        var cached = this._detectionCache.get(window.location.hostname);
        return cached || this._performDetection();
    };
    TechnologyDetector.prototype.redetect = function () {
        this._detectionCache.delete(window.location.hostname);
        return this._performDetection();
    };
    TechnologyDetector.prototype._performDetection = function () {
        var e_1, _a;
        var _b, _c, _d, _e;
        if (!isBrowser() || !this._isEnabled) {
            return {};
        }
        var detected = {
            analytics: [],
            libraries: [],
        };
        try {
            for (var _f = __values(this._signatures), _g = _f.next(); !_g.done; _g = _f.next()) {
                var signature = _g.value;
                var confidence = this._checkSignature(signature);
                if (confidence > 0.5) {
                    switch (signature.category) {
                        case 'cms':
                            detected.cms = signature.name;
                            break;
                        case 'framework':
                            detected.framework = signature.name;
                            break;
                        case 'analytics':
                            if (!((_b = detected.analytics) === null || _b === void 0 ? void 0 : _b.includes(signature.name))) {
                                (_c = detected.analytics) === null || _c === void 0 ? void 0 : _c.push(signature.name);
                            }
                            break;
                        case 'library':
                            if (!((_d = detected.libraries) === null || _d === void 0 ? void 0 : _d.includes(signature.name))) {
                                (_e = detected.libraries) === null || _e === void 0 ? void 0 : _e.push(signature.name);
                            }
                            break;
                        case 'server':
                            detected.server = signature.name;
                            break;
                        case 'hosting':
                            detected.hosting = signature.name;
                            break;
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this._detectionCache.set(window.location.hostname, detected);
        return detected;
    };
    TechnologyDetector.prototype._checkSignature = function (signature) {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d, e_6, _e, e_7, _f;
        var confidence = 0;
        var totalChecks = 0;
        var passedChecks = 0;
        if (signature.checks.dom) {
            totalChecks += signature.checks.dom.length;
            try {
                for (var _g = __values(signature.checks.dom), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var selector = _h.value;
                    if (document.querySelector(selector)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_a = _g.return)) _a.call(_g);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        if (signature.checks.js) {
            totalChecks += signature.checks.js.length;
            try {
                for (var _j = __values(signature.checks.js), _k = _j.next(); !_k.done; _k = _j.next()) {
                    var jsPath = _k.value;
                    if (this._checkJavaScriptObject(jsPath)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_k && !_k.done && (_b = _j.return)) _b.call(_j);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        if (signature.checks.meta) {
            totalChecks += signature.checks.meta.length;
            try {
                for (var _l = __values(signature.checks.meta), _m = _l.next(); !_m.done; _m = _l.next()) {
                    var metaPattern = _m.value;
                    if (this._checkMetaTag(metaPattern)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_m && !_m.done && (_c = _l.return)) _c.call(_l);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        if (signature.checks.text) {
            totalChecks += signature.checks.text.length;
            try {
                for (var _o = __values(signature.checks.text), _p = _o.next(); !_p.done; _p = _o.next()) {
                    var textPattern = _p.value;
                    if (document.documentElement.outerHTML.includes(textPattern)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_p && !_p.done && (_d = _o.return)) _d.call(_o);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
        if (signature.checks.url) {
            totalChecks += signature.checks.url.length;
            try {
                for (var _q = __values(signature.checks.url), _r = _q.next(); !_r.done; _r = _q.next()) {
                    var urlPattern = _r.value;
                    if (this._checkUrlPattern(urlPattern)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_r && !_r.done && (_e = _q.return)) _e.call(_q);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        if (signature.checks.cookies) {
            totalChecks += signature.checks.cookies.length;
            try {
                for (var _s = __values(signature.checks.cookies), _t = _s.next(); !_t.done; _t = _s.next()) {
                    var cookiePattern = _t.value;
                    if (this._checkCookie(cookiePattern)) {
                        passedChecks++;
                    }
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_t && !_t.done && (_f = _s.return)) _f.call(_s);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
        if (totalChecks > 0) {
            confidence = (passedChecks / totalChecks) * signature.confidence;
        }
        return confidence;
    };
    TechnologyDetector.prototype._checkJavaScriptObject = function (path) {
        var e_8, _a;
        try {
            var parts = path.split('.');
            var current = window;
            try {
                for (var parts_1 = __values(parts), parts_1_1 = parts_1.next(); !parts_1_1.done; parts_1_1 = parts_1.next()) {
                    var part = parts_1_1.value;
                    if (current && typeof current === 'object' && part in current) {
                        current = current[part];
                    }
                    else {
                        return false;
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (parts_1_1 && !parts_1_1.done && (_a = parts_1.return)) _a.call(parts_1);
                }
                finally { if (e_8) throw e_8.error; }
            }
            return current !== undefined;
        }
        catch (_b) {
            return false;
        }
    };
    TechnologyDetector.prototype._checkMetaTag = function (pattern) {
        var e_9, _a;
        var metaTags = Array.from(document.querySelectorAll('meta'));
        try {
            for (var metaTags_1 = __values(metaTags), metaTags_1_1 = metaTags_1.next(); !metaTags_1_1.done; metaTags_1_1 = metaTags_1.next()) {
                var meta = metaTags_1_1.value;
                var name_1 = meta.getAttribute('name') || meta.getAttribute('property') || '';
                var content = meta.getAttribute('content') || '';
                if (name_1.includes(pattern) || content.includes(pattern)) {
                    return true;
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (metaTags_1_1 && !metaTags_1_1.done && (_a = metaTags_1.return)) _a.call(metaTags_1);
            }
            finally { if (e_9) throw e_9.error; }
        }
        return false;
    };
    TechnologyDetector.prototype._checkUrlPattern = function (pattern) {
        var e_10, _a, e_11, _b;
        var scripts = Array.from(document.querySelectorAll('script[src]'));
        try {
            for (var scripts_1 = __values(scripts), scripts_1_1 = scripts_1.next(); !scripts_1_1.done; scripts_1_1 = scripts_1.next()) {
                var script = scripts_1_1.value;
                var src = script.getAttribute('src') || '';
                if (src.includes(pattern)) {
                    return true;
                }
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (scripts_1_1 && !scripts_1_1.done && (_a = scripts_1.return)) _a.call(scripts_1);
            }
            finally { if (e_10) throw e_10.error; }
        }
        var links = Array.from(document.querySelectorAll('link[href]'));
        try {
            for (var links_1 = __values(links), links_1_1 = links_1.next(); !links_1_1.done; links_1_1 = links_1.next()) {
                var link = links_1_1.value;
                var href = link.getAttribute('href') || '';
                if (href.includes(pattern)) {
                    return true;
                }
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (links_1_1 && !links_1_1.done && (_b = links_1.return)) _b.call(links_1);
            }
            finally { if (e_11) throw e_11.error; }
        }
        return false;
    };
    TechnologyDetector.prototype._checkCookie = function (pattern) {
        return document.cookie.includes(pattern);
    };
    TechnologyDetector.prototype._initializeSignatures = function () {
        this._signatures = [
            {
                name: 'WordPress',
                category: 'cms',
                confidence: 1.0,
                checks: {
                    meta: ['generator'],
                    text: ['wp-content', 'wp-includes'],
                    js: ['wp'],
                },
            },
            {
                name: 'Shopify',
                category: 'cms',
                confidence: 1.0,
                checks: {
                    js: ['Shopify'],
                    text: ['shopify'],
                    meta: ['shopify'],
                },
            },
            {
                name: 'Drupal',
                category: 'cms',
                confidence: 1.0,
                checks: {
                    meta: ['generator'],
                    text: ['/sites/default/', 'Drupal.settings'],
                    js: ['Drupal'],
                },
            },
            {
                name: 'Squarespace',
                category: 'cms',
                confidence: 1.0,
                checks: {
                    text: ['squarespace'],
                    url: ['squarespace'],
                },
            },
            {
                name: 'Webflow',
                category: 'cms',
                confidence: 1.0,
                checks: {
                    text: ['webflow'],
                    url: ['webflow'],
                },
            },
            {
                name: 'React',
                category: 'framework',
                confidence: 0.9,
                checks: {
                    js: ['React', 'ReactDOM'],
                    text: ['react', 'data-reactroot'],
                },
            },
            {
                name: 'Vue.js',
                category: 'framework',
                confidence: 0.9,
                checks: {
                    js: ['Vue'],
                    text: ['vue'],
                },
            },
            {
                name: 'Angular',
                category: 'framework',
                confidence: 0.9,
                checks: {
                    js: ['ng', 'angular'],
                    text: ['ng-app', 'ng-controller'],
                },
            },
            {
                name: 'Next.js',
                category: 'framework',
                confidence: 1.0,
                checks: {
                    js: ['__NEXT_DATA__'],
                    text: ['_next/static'],
                },
            },
            {
                name: 'Nuxt.js',
                category: 'framework',
                confidence: 1.0,
                checks: {
                    js: ['__NUXT__'],
                    text: ['_nuxt/'],
                },
            },
            {
                name: 'Svelte',
                category: 'framework',
                confidence: 0.9,
                checks: {
                    text: ['svelte'],
                },
            },
            {
                name: 'Google Analytics',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['gtag', 'ga', 'GoogleAnalyticsObject'],
                    url: ['google-analytics.com', 'googletagmanager.com'],
                },
            },
            {
                name: 'Google Tag Manager',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['dataLayer'],
                    url: ['googletagmanager.com'],
                },
            },
            {
                name: 'Mixpanel',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['mixpanel'],
                    url: ['mixpanel.com'],
                },
            },
            {
                name: 'Amplitude',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['amplitude'],
                    url: ['amplitude.com'],
                },
            },
            {
                name: 'Segment',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['analytics'],
                    url: ['segment.com', 'segment.io'],
                },
            },
            {
                name: 'Adobe Analytics',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['s_account', '_satellite'],
                    url: ['omtrdc.net', 'demdex.net'],
                },
            },
            {
                name: 'Hotjar',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['hj'],
                    url: ['hotjar.com'],
                },
            },
            {
                name: 'Facebook Pixel',
                category: 'analytics',
                confidence: 1.0,
                checks: {
                    js: ['fbq'],
                    url: ['facebook.net'],
                },
            },
            {
                name: 'jQuery',
                category: 'library',
                confidence: 1.0,
                checks: {
                    js: ['jQuery', '$'],
                },
            },
            {
                name: 'Lodash',
                category: 'library',
                confidence: 1.0,
                checks: {
                    js: ['_'],
                },
            },
            {
                name: 'D3.js',
                category: 'library',
                confidence: 1.0,
                checks: {
                    js: ['d3'],
                },
            },
            {
                name: 'Chart.js',
                category: 'library',
                confidence: 1.0,
                checks: {
                    js: ['Chart'],
                },
            },
            {
                name: 'Bootstrap',
                category: 'library',
                confidence: 0.8,
                checks: {
                    dom: ['.container', '.row', '.col'],
                    text: ['bootstrap'],
                },
            },
            {
                name: 'Tailwind CSS',
                category: 'library',
                confidence: 0.8,
                checks: {
                    dom: ['[class*="tw-"]', '[class*="bg-"]', '[class*="text-"]'],
                    text: ['tailwind'],
                },
            },
            {
                name: 'WooCommerce',
                category: 'ecommerce',
                confidence: 1.0,
                checks: {
                    text: ['woocommerce', 'wc-'],
                    dom: ['.woocommerce'],
                },
            },
            {
                name: 'Magento',
                category: 'ecommerce',
                confidence: 1.0,
                checks: {
                    text: ['magento', 'Mage.'],
                    js: ['Mage'],
                },
            },
            {
                name: 'Cloudflare',
                category: 'hosting',
                confidence: 0.7,
                checks: {
                    text: ['cloudflare'],
                    url: ['cloudflare'],
                },
            },
            {
                name: 'AWS CloudFront',
                category: 'hosting',
                confidence: 0.7,
                checks: {
                    url: ['cloudfront.net'],
                },
            },
            {
                name: 'Netlify',
                category: 'hosting',
                confidence: 1.0,
                checks: {
                    text: ['netlify'],
                    url: ['netlify'],
                },
            },
            {
                name: 'Vercel',
                category: 'hosting',
                confidence: 1.0,
                checks: {
                    text: ['vercel'],
                    url: ['vercel'],
                },
            },
        ];
    };
    return TechnologyDetector;
}());

var WebSocketManager = (function (_super) {
    __extends(WebSocketManager, _super);
    function WebSocketManager(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.name = 'WebSocketManager';
        _this._socket = null;
        _this._messageQueue = [];
        _this._fallbackTransport = null;
        _this._heartbeatInterval = null;
        _this._heartbeatTimeout = null;
        _this._reconnectTimeout = null;
        _this._queueProcessorInterval = null;
        _this._heartbeatsMissed = 0;
        _this._destroyed = false;
        _this._pendingPings = new Map();
        _this._config = {
            url: config.url || '',
            protocols: config.protocols || [],
            reconnect: config.reconnect !== false,
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            heartbeatInterval: config.heartbeatInterval || 30000,
            messageQueueSize: config.messageQueueSize || 1000,
            enableCompression: config.enableCompression !== false,
            enableFallback: config.enableFallback !== false,
            fallbackUrl: config.fallbackUrl || '',
            timeout: config.timeout || 10000,
            debug: config.debug || false,
        };
        _this._connectionState = {
            status: 'disconnected',
            url: _this._config.url,
            reconnectAttempts: 0,
        };
        _this._metrics = {
            messagesSet: 0,
            messagesReceived: 0,
            reconnections: 0,
            errors: 0,
            averageLatency: 0,
            uptime: 0,
            lastActivity: 0,
        };
        _this._heartbeatConfig = {
            interval: _this._config.heartbeatInterval,
            timeout: 5000,
            maxMissed: 3,
            enabled: true,
        };
        if (_this._config.enableFallback && _this._config.fallbackUrl) {
            _this._fallbackTransport = {
                type: 'http',
                url: _this._config.fallbackUrl,
                enabled: true,
                retryInterval: 10000,
            };
        }
        return _this;
    }
    WebSocketManager.prototype.init = function () {
        if (!isBrowser()) {
            if (this._config.debug) {
                console.warn('[WebSocketManager] Not in browser environment');
            }
            return;
        }
        this._startQueueProcessor();
        if (this._config.debug) {
            console.log('[WebSocketManager] Initialized with config:', this._config);
        }
    };
    WebSocketManager.prototype.setSessionContext = function (sessionId, visitorId) {
        this._sessionId = sessionId;
        this._visitorId = visitorId;
    };
    WebSocketManager.prototype.connect = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var connectUrl;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                if (this._destroyed) {
                    throw new Error('WebSocketManager has been destroyed');
                }
                connectUrl = url || this._config.url;
                if (!connectUrl) {
                    throw new Error('WebSocket URL is required');
                }
                if (((_a = this._socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN && this._connectionState.url === connectUrl) {
                    return [2];
                }
                if (this._socket) {
                    this._cleanupConnection();
                }
                return [2, new Promise(function (resolve, reject) {
                        try {
                            _this._connectionState = __assign(__assign({}, _this._connectionState), { status: 'connecting', url: connectUrl });
                            delete _this._connectionState.lastError;
                            _this._socket = new WebSocket(connectUrl, _this._config.protocols);
                            _this._socket.binaryType = 'arraybuffer';
                            _this._socket.onopen = function (event) {
                                _this._onOpen(event);
                                resolve();
                            };
                            _this._socket.onclose = function (event) {
                                _this._onClose(event);
                            };
                            _this._socket.onerror = function (event) {
                                _this._onError(event);
                                reject(new Error('WebSocket connection failed'));
                            };
                            _this._socket.onmessage = function (event) {
                                _this._onMessage(event);
                            };
                            setTimeout(function () {
                                var _a;
                                if (((_a = _this._socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.CONNECTING) {
                                    _this._socket.close();
                                    reject(new Error('WebSocket connection timeout'));
                                }
                            }, _this._config.timeout);
                        }
                        catch (error) {
                            _this._connectionState.status = 'error';
                            _this._connectionState.lastError = error;
                            reject(error);
                        }
                    })];
            });
        });
    };
    WebSocketManager.prototype.disconnect = function () {
        if (this._socket) {
            this._socket.close(1000, 'Normal closure');
        }
        this._cleanupConnection();
        this._connectionState.status = 'disconnected';
    };
    WebSocketManager.prototype.reconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._connectionState.reconnectAttempts >= this._config.maxReconnectAttempts) {
                            if (this._config.debug) {
                                console.warn('[WebSocketManager] Max reconnect attempts reached');
                            }
                            if (this._config.enableFallback && this._fallbackTransport) {
                                this._activateFallback('Max reconnection attempts reached');
                                return [2];
                            }
                            throw new Error('Max reconnection attempts reached');
                        }
                        this._connectionState.status = 'reconnecting';
                        this._connectionState.reconnectAttempts++;
                        this._metrics.reconnections++;
                        this.emit('connection:reconnecting', this._connectionState);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.connect()];
                    case 2:
                        _a.sent();
                        this._connectionState.reconnectAttempts = 0;
                        this.emit('connection:reconnected', this._connectionState);
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (this._config.debug) {
                            console.error('[WebSocketManager] Reconnection failed:', error_1);
                        }
                        this._scheduleReconnection();
                        throw error_1;
                    case 4: return [2];
                }
            });
        });
    };
    WebSocketManager.prototype.send = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var fullMessage;
            return __generator(this, function (_a) {
                fullMessage = __assign(__assign({}, message), { id: generateId$1(), timestamp: now$1(), sessionId: this._sessionId || 'unknown', visitorId: this._visitorId || 'unknown' });
                if (!this.isConnected) {
                    this._queueMessage(fullMessage);
                    return [2, false];
                }
                try {
                    this._socket.send(JSON.stringify(fullMessage));
                    this._metrics.messagesSet++;
                    this._metrics.lastActivity = now$1();
                    this.emit('message:sent', fullMessage);
                    return [2, true];
                }
                catch (error) {
                    if (this._config.debug) {
                        console.error('[WebSocketManager] Send failed:', error);
                    }
                    this._queueMessage(fullMessage);
                    this.emit('message:failed', { message: fullMessage, error: error });
                    return [2, false];
                }
                return [2];
            });
        });
    };
    WebSocketManager.prototype.sendEvent = function (event_1, data_1) {
        return __awaiter(this, arguments, void 0, function (event, data, priority) {
            if (priority === void 0) { priority = 'normal'; }
            return __generator(this, function (_a) {
                return [2, this.send({
                        type: 'event',
                        data: __assign({ event: event }, data),
                        priority: priority,
                        retry: priority !== 'low',
                    })];
            });
        });
    };
    WebSocketManager.prototype.sendHeartbeat = function () {
        if (!this.isConnected)
            return;
        var pingId = generateId$1();
        var timestamp = now$1();
        this._pendingPings.set(pingId, timestamp);
        this.send({
            type: 'heartbeat',
            data: { pingId: pingId, timestamp: timestamp },
            priority: 'critical',
            retry: false,
        });
        this._heartbeatsMissed = 0;
        this.emit('heartbeat:sent', { timestamp: timestamp });
    };
    WebSocketManager.prototype.getConnectionState = function () {
        return __assign({}, this._connectionState);
    };
    WebSocketManager.prototype.getMetrics = function () {
        var uptime = this._connectionState.connectedAt ?
            now$1() - this._connectionState.connectedAt : 0;
        return __assign(__assign({}, this._metrics), { uptime: uptime });
    };
    WebSocketManager.prototype.clearQueue = function () {
        this._messageQueue = [];
    };
    Object.defineProperty(WebSocketManager.prototype, "isConnected", {
        get: function () {
            var _a;
            return ((_a = this._socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketManager.prototype, "connectionState", {
        get: function () {
            return this._connectionState;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketManager.prototype, "metrics", {
        get: function () {
            return this.getMetrics();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketManager.prototype, "queueSize", {
        get: function () {
            return this._messageQueue.length;
        },
        enumerable: false,
        configurable: true
    });
    WebSocketManager.prototype.destroy = function () {
        this._destroyed = true;
        this.disconnect();
        this._clearTimers();
        this.clearQueue();
        this.removeAllListeners();
        if (this._config.debug) {
            console.log('[WebSocketManager] Destroyed');
        }
    };
    WebSocketManager.prototype._onOpen = function (_event) {
        this._connectionState = __assign(__assign({}, this._connectionState), { status: 'connected', connectedAt: now$1() });
        delete this._connectionState.disconnectedAt;
        delete this._connectionState.lastError;
        if (this._heartbeatConfig.enabled) {
            this._startHeartbeat();
        }
        this._processQueue();
        this.emit('connection:open', this._connectionState);
        if (this._config.debug) {
            console.log('[WebSocketManager] Connected to:', this._connectionState.url);
        }
    };
    WebSocketManager.prototype._onClose = function (event) {
        var wasConnected = this._connectionState.status === 'connected';
        this._connectionState = __assign(__assign({}, this._connectionState), { status: 'disconnected', disconnectedAt: now$1() });
        this._cleanupConnection();
        this.emit('connection:close', this._connectionState);
        if (this._config.debug) {
            console.log('[WebSocketManager] Disconnected:', event.code, event.reason);
        }
        if (this._config.reconnect && wasConnected && !this._destroyed) {
            this._scheduleReconnection();
        }
    };
    WebSocketManager.prototype._onError = function (event) {
        var error = new Error(event.message || 'WebSocket error');
        this._connectionState.lastError = error;
        this._connectionState.status = 'error';
        this._metrics.errors++;
        this.emit('connection:error', { error: error, state: this._connectionState });
        if (this._config.debug) {
            console.error('[WebSocketManager] Error:', error);
        }
    };
    WebSocketManager.prototype._onMessage = function (event) {
        var _a;
        try {
            var message = JSON.parse(event.data);
            this._metrics.messagesReceived++;
            this._metrics.lastActivity = now$1();
            if (message.type === 'heartbeat' && ((_a = message.data) === null || _a === void 0 ? void 0 : _a.pingId)) {
                this._handleHeartbeatResponse(message);
                return;
            }
            if (message.type === 'ack') {
                this._handleAcknowledgment(message);
                return;
            }
            this.emit('message:received', message);
            if (this._config.debug) {
                console.log('[WebSocketManager] Message received:', message);
            }
        }
        catch (error) {
            if (this._config.debug) {
                console.error('[WebSocketManager] Failed to parse message:', error);
            }
        }
    };
    WebSocketManager.prototype._handleHeartbeatResponse = function (message) {
        var _a = message.data, pingId = _a.pingId, timestamp = _a.timestamp;
        if (this._pendingPings.has(pingId)) {
            var sendTime = this._pendingPings.get(pingId);
            var latency = now$1() - sendTime;
            this._connectionState.latency = latency;
            this._metrics.averageLatency =
                (this._metrics.averageLatency + latency) / 2;
            this._pendingPings.delete(pingId);
            this._heartbeatsMissed = 0;
            this.emit('heartbeat:received', { timestamp: timestamp, latency: latency });
        }
    };
    WebSocketManager.prototype._handleAcknowledgment = function (message) {
        var _a;
        var messageId = (_a = message.data) === null || _a === void 0 ? void 0 : _a.messageId;
        if (messageId) {
            this._messageQueue = this._messageQueue.filter(function (msg) { return msg.id !== messageId; });
        }
    };
    WebSocketManager.prototype._queueMessage = function (message) {
        if (this._messageQueue.length >= this._config.messageQueueSize) {
            var dropped = this._messageQueue.shift();
            this.emit('queue:full', { size: this._messageQueue.length, dropped: dropped });
        }
        var queuedMessage = __assign(__assign({}, message), { attempts: 0, nextRetry: now$1(), maxRetries: message.priority === 'critical' ? 5 : 3 });
        this._messageQueue.push(queuedMessage);
        this.emit('message:queued', message);
    };
    WebSocketManager.prototype._processQueue = function () {
        var e_1, _a;
        if (!this.isConnected || this._messageQueue.length === 0) {
            return;
        }
        var messagesToSend = this._messageQueue.filter(function (msg) {
            return msg.nextRetry <= now$1() && msg.attempts < msg.maxRetries;
        });
        var _loop_1 = function (message) {
            try {
                this_1._socket.send(JSON.stringify(message));
                this_1._messageQueue = this_1._messageQueue.filter(function (msg) { return msg.id !== message.id; });
                this_1._metrics.messagesSet++;
                this_1.emit('message:sent', message);
            }
            catch (error) {
                message.attempts++;
                message.nextRetry = now$1() + (message.attempts * 1000);
                if (message.attempts >= message.maxRetries) {
                    this_1._messageQueue = this_1._messageQueue.filter(function (msg) { return msg.id !== message.id; });
                    this_1.emit('message:failed', { message: message, error: error });
                }
            }
        };
        var this_1 = this;
        try {
            for (var messagesToSend_1 = __values(messagesToSend), messagesToSend_1_1 = messagesToSend_1.next(); !messagesToSend_1_1.done; messagesToSend_1_1 = messagesToSend_1.next()) {
                var message = messagesToSend_1_1.value;
                _loop_1(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (messagesToSend_1_1 && !messagesToSend_1_1.done && (_a = messagesToSend_1.return)) _a.call(messagesToSend_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    WebSocketManager.prototype._startQueueProcessor = function () {
        var _this = this;
        if (this._queueProcessorInterval) {
            clearInterval(this._queueProcessorInterval);
        }
        this._queueProcessorInterval = window.setInterval(function () {
            _this._processQueue();
        }, 1000);
    };
    WebSocketManager.prototype._startHeartbeat = function () {
        var _this = this;
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
        }
        this._heartbeatInterval = window.setInterval(function () {
            if (_this.isConnected) {
                _this.sendHeartbeat();
                _this._heartbeatTimeout = window.setTimeout(function () {
                    _this._heartbeatsMissed++;
                    if (_this._heartbeatsMissed >= _this._heartbeatConfig.maxMissed) {
                        if (_this._config.debug) {
                            console.warn('[WebSocketManager] Too many missed heartbeats, reconnecting');
                        }
                        _this.reconnect().catch(function () {
                        });
                    }
                }, _this._heartbeatConfig.timeout);
            }
        }, this._heartbeatConfig.interval);
    };
    WebSocketManager.prototype._scheduleReconnection = function () {
        var _this = this;
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
        }
        var delay = this._config.reconnectInterval *
            Math.pow(1.5, this._connectionState.reconnectAttempts);
        this._reconnectTimeout = window.setTimeout(function () {
            if (!_this._destroyed && _this._connectionState.status !== 'connected') {
                _this.reconnect().catch(function () {
                });
            }
        }, delay);
    };
    WebSocketManager.prototype._activateFallback = function (reason) {
        if (!this._fallbackTransport)
            return;
        this.emit('fallback:activated', {
            reason: reason,
            url: this._fallbackTransport.url
        });
        if (this._config.debug) {
            console.log('[WebSocketManager] Fallback activated:', reason);
        }
    };
    WebSocketManager.prototype._cleanupConnection = function () {
        this._clearTimers();
        this._pendingPings.clear();
        this._heartbeatsMissed = 0;
    };
    WebSocketManager.prototype._clearTimers = function () {
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
        if (this._heartbeatTimeout) {
            clearTimeout(this._heartbeatTimeout);
            this._heartbeatTimeout = null;
        }
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }
        if (this._queueProcessorInterval) {
            clearInterval(this._queueProcessorInterval);
            this._queueProcessorInterval = null;
        }
    };
    return WebSocketManager;
}(EventEmitter));

var SessionManager = (function () {
    function SessionManager(storage, options) {
        if (options === void 0) { options = {}; }
        this._currentSession = null;
        this._fingerprint = null;
        this._listeners = new Map();
        this._destroyed = false;
        this.SESSION_KEY = 'session';
        this.VISITOR_KEY = 'visitor';
        this.FINGERPRINT_KEY = 'fingerprint';
        this.TABS_KEY = 'active_tabs';
        this.HEARTBEAT_KEY = 'heartbeat';
        this._storage = storage;
        this._options = __assign({ sessionTimeout: 30 * 60 * 1000, enableCrossTabs: true, enableFingerprinting: true, fingerprintElements: {
                screen: true,
                timezone: true,
                language: true,
                platform: true,
                plugins: true,
                canvas: false
            }, sessionValidation: true, storagePrefix: 'opt_session_' }, options);
        this._tabId = this._generateTabId();
        if (this._options.enableFingerprinting) {
            this._generateFingerprint();
        }
        if (this._options.enableCrossTabs && isBrowser()) {
            this._setupCrossTabSync();
            this._startHeartbeat();
        }
    }
    SessionManager.prototype.initializeSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var restored, newSession, error_1, fallback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, this._restoreSession()];
                    case 1:
                        restored = _a.sent();
                        if (restored) {
                            this._currentSession = restored;
                            this._emit('session:restored', restored);
                            return [2, restored];
                        }
                        return [4, this._createNewSession()];
                    case 2:
                        newSession = _a.sent();
                        this._currentSession = newSession;
                        this._saveSession(newSession);
                        this._emit('session:created', newSession);
                        return [2, newSession];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Session initialization failed:', error_1);
                        fallback = this._createBasicSession();
                        this._currentSession = fallback;
                        return [2, fallback];
                    case 4: return [2];
                }
            });
        });
    };
    SessionManager.prototype.getCurrentSession = function () {
        return this._currentSession;
    };
    SessionManager.prototype.updateActivity = function () {
        if (!this._currentSession)
            return;
        this._currentSession.lastActivity = now$1();
        this._currentSession.pageViews++;
        this._saveSession(this._currentSession);
    };
    SessionManager.prototype.validateSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reasons, isValid, timeSinceActivity, currentFingerprint, storedFingerprint, criticalMismatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._currentSession) {
                            return [2, {
                                    isValid: false,
                                    reasons: ['No active session'],
                                    fingerprint: this._fingerprint,
                                    lastValidated: now$1()
                                }];
                        }
                        reasons = [];
                        isValid = true;
                        timeSinceActivity = now$1() - this._currentSession.lastActivity;
                        if (timeSinceActivity > this._options.sessionTimeout) {
                            isValid = false;
                            reasons.push('Session timeout exceeded');
                        }
                        if (!(this._options.enableFingerprinting && this._options.sessionValidation)) return [3, 2];
                        return [4, this._generateFingerprint()];
                    case 1:
                        currentFingerprint = _a.sent();
                        storedFingerprint = this._getStoredFingerprint();
                        if (storedFingerprint && currentFingerprint.hash !== storedFingerprint.hash) {
                            criticalMismatch = this._checkCriticalFingerprintMismatch(currentFingerprint, storedFingerprint);
                            if (criticalMismatch) {
                                isValid = false;
                                reasons.push('Session fingerprint validation failed');
                            }
                        }
                        _a.label = 2;
                    case 2: return [2, {
                            isValid: isValid,
                            reasons: reasons,
                            fingerprint: this._fingerprint,
                            lastValidated: now$1()
                        }];
                }
            });
        });
    };
    SessionManager.prototype.invalidateSession = function () {
        if (this._currentSession) {
            this._emit('session:invalid', this._currentSession);
            this._currentSession = null;
            this._storage.remove(this.SESSION_KEY);
        }
    };
    SessionManager.prototype.getFingerprint = function () {
        return this._fingerprint;
    };
    SessionManager.prototype.on = function (event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
    };
    SessionManager.prototype.off = function (event, callback) {
        var listeners = this._listeners.get(event);
        if (listeners) {
            var index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    };
    SessionManager.prototype.destroy = function () {
        if (this._destroyed)
            return;
        if (this._syncTimer) {
            clearInterval(this._syncTimer);
        }
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
        }
        try {
            this._removeFromActiveTabs();
        }
        catch (error) {
        }
        this._listeners.clear();
        this._destroyed = true;
    };
    SessionManager.prototype._restoreSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionData, session, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sessionData = this._storage.get(this.SESSION_KEY);
                        if (!sessionData)
                            return [2, null];
                        session = safeJsonParse(sessionData, null);
                        if (!session)
                            return [2, null];
                        return [4, this._validateStoredSession(session)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.isValid) {
                            this._storage.remove(this.SESSION_KEY);
                            return [2, null];
                        }
                        return [2, session];
                    case 2:
                        _a.sent();
                        return [2, null];
                    case 3: return [2];
                }
            });
        });
    };
    SessionManager.prototype._createNewSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var visitorId, session;
            return __generator(this, function (_a) {
                try {
                    visitorId = this._storage.get(this.VISITOR_KEY) || generateVisitorId();
                    this._storage.set(this.VISITOR_KEY, visitorId);
                }
                catch (error) {
                    visitorId = generateVisitorId();
                }
                session = {
                    sessionId: generateSessionId(),
                    visitorId: visitorId,
                    startTime: now$1(),
                    lastActivity: now$1(),
                    pageViews: 0,
                    platform: detectPlatform(),
                    userAgent: getUserAgent(),
                    referrer: getReferrer(),
                    landingPage: getCurrentUrl()
                };
                try {
                    this._addToActiveTabs();
                }
                catch (error) {
                }
                return [2, session];
            });
        });
    };
    SessionManager.prototype._createBasicSession = function () {
        return {
            sessionId: generateSessionId(),
            visitorId: generateVisitorId(),
            startTime: now$1(),
            lastActivity: now$1(),
            pageViews: 0,
            platform: detectPlatform(),
            userAgent: getUserAgent(),
            referrer: getReferrer(),
            landingPage: getCurrentUrl()
        };
    };
    SessionManager.prototype._saveSession = function (session) {
        try {
            this._storage.set(this.SESSION_KEY, safeJsonStringify(session));
        }
        catch (error) {
            if (this._options.debug) {
                console.warn('Failed to save session:', error);
            }
        }
    };
    SessionManager.prototype._generateFingerprint = function () {
        return __awaiter(this, void 0, void 0, function () {
            var elements, fingerprint, _a, hashString;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!isBrowser()) {
                            this._fingerprint = {
                                screenResolution: 'unknown',
                                timezone: 0,
                                language: 'unknown',
                                platform: 'server',
                                browser: 'unknown',
                                pluginsHash: 'unknown',
                                hash: 'server-side'
                            };
                            return [2, this._fingerprint];
                        }
                        elements = this._options.fingerprintElements;
                        fingerprint = {};
                        if (elements.screen) {
                            fingerprint.screenResolution = "".concat(screen.width, "x").concat(screen.height);
                        }
                        if (elements.timezone) {
                            fingerprint.timezone = new Date().getTimezoneOffset();
                        }
                        if (elements.language) {
                            fingerprint.language = navigator.language || 'unknown';
                        }
                        if (elements.platform) {
                            fingerprint.platform = detectPlatform();
                            fingerprint.browser = detectBrowser();
                        }
                        if (elements.plugins) {
                            fingerprint.pluginsHash = this._hashPlugins();
                        }
                        if (!elements.canvas) return [3, 2];
                        _a = fingerprint;
                        return [4, this._generateCanvasFingerprint()];
                    case 1:
                        _a.canvasHash = _b.sent();
                        _b.label = 2;
                    case 2:
                        hashString = Object.values(fingerprint).join('|');
                        fingerprint.hash = this._simpleHash(hashString).toString();
                        this._fingerprint = fingerprint;
                        this._storage.set(this.FINGERPRINT_KEY, safeJsonStringify(this._fingerprint));
                        return [2, this._fingerprint];
                }
            });
        });
    };
    SessionManager.prototype._getStoredFingerprint = function () {
        var stored = this._storage.get(this.FINGERPRINT_KEY);
        return stored ? safeJsonParse(stored, null) : null;
    };
    SessionManager.prototype._checkCriticalFingerprintMismatch = function (current, stored) {
        return (current.platform !== stored.platform ||
            current.browser !== stored.browser ||
            current.screenResolution !== stored.screenResolution);
    };
    SessionManager.prototype._validateStoredSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var timeSinceActivity, reasons, isValid;
            return __generator(this, function (_a) {
                timeSinceActivity = now$1() - session.lastActivity;
                reasons = [];
                isValid = true;
                if (timeSinceActivity > this._options.sessionTimeout) {
                    isValid = false;
                    reasons.push('Session expired');
                }
                return [2, {
                        isValid: isValid,
                        reasons: reasons,
                        fingerprint: this._fingerprint,
                        lastValidated: now$1()
                    }];
            });
        });
    };
    SessionManager.prototype._setupCrossTabSync = function () {
        var _this = this;
        if (!isBrowser())
            return;
        window.addEventListener('storage', function (event) {
            if (event.key === _this._getStorageKey(_this.SESSION_KEY)) {
                _this._handleSessionSync(event.newValue);
            }
        });
        this._syncTimer = window.setInterval(function () {
            _this._checkTabSync();
        }, 5000);
    };
    SessionManager.prototype._startHeartbeat = function () {
        var _this = this;
        if (!isBrowser())
            return;
        this._heartbeatTimer = window.setInterval(function () {
            _this._updateHeartbeat();
            _this._cleanupInactiveTabs();
        }, 10000);
    };
    SessionManager.prototype._handleSessionSync = function (newSessionData) {
        var _a;
        if (!newSessionData)
            return;
        var session = safeJsonParse(newSessionData, null);
        if (session && session.sessionId !== ((_a = this._currentSession) === null || _a === void 0 ? void 0 : _a.sessionId)) {
            this._currentSession = session;
            this._emit('session:synchronized', session);
        }
    };
    SessionManager.prototype._checkTabSync = function () {
        var activeTabs = this._getActiveTabs();
        var currentTime = now$1();
        var thisTab = activeTabs[this._tabId];
        if (!thisTab || currentTime - thisTab.lastHeartbeat > 30000) {
            this._addToActiveTabs();
        }
    };
    SessionManager.prototype._updateHeartbeat = function () {
        var _a;
        var heartbeat = {
            tabId: this._tabId,
            timestamp: now$1(),
            sessionId: ((_a = this._currentSession) === null || _a === void 0 ? void 0 : _a.sessionId) || 'unknown'
        };
        this._storage.set(this.HEARTBEAT_KEY, safeJsonStringify(heartbeat));
    };
    SessionManager.prototype._getActiveTabs = function () {
        try {
            var stored = this._storage.get(this.TABS_KEY);
            return stored ? safeJsonParse(stored, {}) : {};
        }
        catch (error) {
            return {};
        }
    };
    SessionManager.prototype._addToActiveTabs = function () {
        var _a;
        try {
            var activeTabs = this._getActiveTabs();
            activeTabs[this._tabId] = {
                startTime: now$1(),
                lastHeartbeat: now$1(),
                sessionId: ((_a = this._currentSession) === null || _a === void 0 ? void 0 : _a.sessionId) || 'pending'
            };
            this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
        }
        catch (error) {
        }
    };
    SessionManager.prototype._removeFromActiveTabs = function () {
        try {
            var activeTabs = this._getActiveTabs();
            delete activeTabs[this._tabId];
            this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
        }
        catch (error) {
        }
    };
    SessionManager.prototype._cleanupInactiveTabs = function () {
        var e_1, _a;
        var activeTabs = this._getActiveTabs();
        var currentTime = now$1();
        var hasChanges = false;
        try {
            for (var _b = __values(Object.entries(activeTabs)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), tabId = _d[0], tabData = _d[1];
                if (currentTime - tabData.lastHeartbeat > 60000) {
                    delete activeTabs[tabId];
                    hasChanges = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (hasChanges) {
            this._storage.set(this.TABS_KEY, safeJsonStringify(activeTabs));
        }
    };
    SessionManager.prototype._generateTabId = function () {
        return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + now$1();
    };
    SessionManager.prototype._getStorageKey = function (key) {
        return this._options.storagePrefix + key;
    };
    SessionManager.prototype._hashPlugins = function () {
        if (!isBrowser() || !navigator.plugins)
            return 'unknown';
        var plugins = Array.from(navigator.plugins)
            .map(function (plugin) { return plugin.name; })
            .sort()
            .join('|');
        return this._simpleHash(plugins).toString();
    };
    SessionManager.prototype._generateCanvasFingerprint = function () {
        return __awaiter(this, void 0, void 0, function () {
            var canvas, ctx;
            return __generator(this, function (_a) {
                if (!isBrowser())
                    return [2, 'unknown'];
                try {
                    canvas = document.createElement('canvas');
                    ctx = canvas.getContext('2d');
                    if (!ctx)
                        return [2, 'unknown'];
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('Fingerprint test 🎨', 2, 2);
                    return [2, this._simpleHash(canvas.toDataURL()).toString()];
                }
                catch (_b) {
                    return [2, 'canvas-blocked'];
                }
                return [2];
            });
        });
    };
    SessionManager.prototype._simpleHash = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };
    SessionManager.prototype._emit = function (type, session) {
        var event = {
            type: type,
            session: session,
            timestamp: now$1(),
            tabId: this._tabId
        };
        var listeners = this._listeners.get(type) || [];
        listeners.forEach(function (callback) {
            try {
                callback(event);
            }
            catch (error) {
                console.error('Session event listener error:', error);
            }
        });
    };
    return SessionManager;
}());

var Storage$1 = (function () {
    function Storage(prefix) {
        if (prefix === void 0) { prefix = 'opt_'; }
        this._fallback = new Map();
        this._prefix = prefix;
    }
    Storage.prototype.get = function (key) {
        var prefixedKey = this._prefix + key;
        try {
            if (isBrowser() && window.localStorage) {
                var value = localStorage.getItem(prefixedKey);
                if (value !== null) {
                    var parsed = safeJsonParse(value, null);
                    if (parsed && this._isNotExpired(parsed.expiry)) {
                        return parsed.value;
                    }
                    else if (parsed) {
                        localStorage.removeItem(prefixedKey);
                    }
                }
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser() && window.sessionStorage) {
                var value = sessionStorage.getItem(prefixedKey);
                if (value !== null) {
                    var parsed = safeJsonParse(value, null);
                    if (parsed && this._isNotExpired(parsed.expiry)) {
                        return parsed.value;
                    }
                }
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser()) {
                var cookieValue = this._getCookie(prefixedKey);
                if (cookieValue) {
                    return cookieValue;
                }
            }
        }
        catch (e) {
        }
        return this._fallback.get(prefixedKey) || null;
    };
    Storage.prototype.set = function (key, value, expiry) {
        var _this = this;
        var prefixedKey = this._prefix + key;
        var storageValue = safeJsonStringify({ value: value, expiry: expiry });
        try {
            if (isBrowser() && window.localStorage) {
                localStorage.setItem(prefixedKey, storageValue);
                return;
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser() && window.sessionStorage) {
                sessionStorage.setItem(prefixedKey, storageValue);
                return;
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser() && value.length < 4000) {
                this._setCookie(prefixedKey, value, expiry);
                return;
            }
        }
        catch (e) {
        }
        this._fallback.set(prefixedKey, value);
        if (this._fallback.size > 100) {
            var entries = Array.from(this._fallback.entries());
            entries.slice(0, 20).forEach(function (_a) {
                var _b = __read(_a, 1), k = _b[0];
                return _this._fallback.delete(k);
            });
        }
    };
    Storage.prototype.remove = function (key) {
        var prefixedKey = this._prefix + key;
        try {
            if (isBrowser() && window.localStorage) {
                localStorage.removeItem(prefixedKey);
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser() && window.sessionStorage) {
                sessionStorage.removeItem(prefixedKey);
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser()) {
                this._deleteCookie(prefixedKey);
            }
        }
        catch (e) {
        }
        this._fallback.delete(prefixedKey);
    };
    Storage.prototype.clear = function () {
        var _this = this;
        var keys = this._getAllKeys();
        keys.forEach(function (key) { return _this.remove(key.replace(_this._prefix, '')); });
        this._fallback.clear();
    };
    Storage.prototype._isNotExpired = function (expiry) {
        if (!expiry)
            return true;
        return Date.now() < expiry;
    };
    Storage.prototype._getAllKeys = function () {
        var _this = this;
        var keys = [];
        try {
            if (isBrowser() && window.localStorage) {
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.startsWith(this._prefix)) {
                        keys.push(key);
                    }
                }
            }
        }
        catch (e) {
        }
        try {
            if (isBrowser() && window.sessionStorage) {
                for (var i = 0; i < sessionStorage.length; i++) {
                    var key = sessionStorage.key(i);
                    if (key && key.startsWith(this._prefix)) {
                        keys.push(key);
                    }
                }
            }
        }
        catch (e) {
        }
        this._fallback.forEach(function (_, key) {
            if (key.startsWith(_this._prefix)) {
                keys.push(key);
            }
        });
        return Array.from(new Set(keys));
    };
    Storage.prototype._getCookie = function (name) {
        var _a;
        if (!isBrowser())
            return null;
        var value = "; ".concat(document.cookie);
        var parts = value.split("; ".concat(name, "="));
        if (parts.length === 2) {
            var cookieValue = (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.split(';').shift();
            return cookieValue ? decodeURIComponent(cookieValue) : null;
        }
        return null;
    };
    Storage.prototype._setCookie = function (name, value, expiry) {
        if (!isBrowser())
            return;
        var cookieString = "".concat(name, "=").concat(encodeURIComponent(value), "; path=/");
        if (expiry) {
            var expiryDate = new Date(expiry);
            cookieString += "; expires=".concat(expiryDate.toUTCString());
        }
        if (location.protocol === 'https:') {
            cookieString += '; secure';
        }
        cookieString += '; samesite=lax';
        document.cookie = cookieString;
    };
    Storage.prototype._deleteCookie = function (name) {
        if (!isBrowser())
            return;
        document.cookie = "".concat(name, "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;");
    };
    return Storage;
}());

var Tracker = (function (_super) {
    __extends(Tracker, _super);
    function Tracker() {
        var _this = _super.call(this) || this;
        _this.isInitialized = false;
        _this._modules = new Map();
        _this._eventQueue = [];
        _this._destroyed = false;
        _this._storage = new Storage$1();
        _this._sessionManager = new SessionManager(_this._storage);
        _this.config = {
            apiUrl: '',
            projectId: '',
            debug: false,
            enableGDPR: true,
            sessionTimeout: 30 * 60 * 1000,
            batchSize: 10,
            flushInterval: 5000,
            platform: 'auto',
        };
        _this.session = _this._createEmptySession();
        return _this;
    }
    Tracker.prototype.init = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionOptions, _a, behavioralTracker, technologyDetector, performanceOptimizer, wsConfig, cleanConfig, webSocketManager, error_1;
            var _this = this;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (this.isInitialized) {
                            if (this.config.debug) {
                                console.warn('Tracker already initialized');
                            }
                            return [2];
                        }
                        this.config = deepMerge(this.config, config);
                        if (!this.config.apiUrl || !this.config.projectId) {
                            throw new Error('apiUrl and projectId are required');
                        }
                        this._storage = new Storage$1("opt_".concat(this.config.projectId, "_"));
                        sessionOptions = {
                            sessionTimeout: this.config.sessionTimeout || 30 * 60 * 1000,
                            enableCrossTabs: true,
                            enableFingerprinting: true,
                            sessionValidation: true,
                            storagePrefix: "opt_".concat(this.config.projectId, "_session_"),
                        };
                        this._sessionManager = new SessionManager(this._storage, sessionOptions);
                        this._sessionManager.on('session:created', function (event) {
                            _this.session = event.session;
                            _this.emit('session:created', event);
                            if (_this.config.debug) {
                                console.log('New session created:', event);
                            }
                        });
                        this._sessionManager.on('session:restored', function (event) {
                            _this.session = event.session;
                            _this.emit('session:restored', event);
                            if (_this.config.debug) {
                                console.log('Session restored:', event);
                            }
                        });
                        this._sessionManager.on('session:synchronized', function (event) {
                            _this.session = event.session;
                            _this.emit('session:synchronized', event);
                            if (_this.config.debug) {
                                console.log('Session synchronized across tabs:', event);
                            }
                        });
                        this._sessionManager.on('session:invalid', function (event) {
                            _this.emit('session:invalid', event);
                            if (_this.config.debug) {
                                console.log('Session invalidated:', event);
                            }
                        });
                        _a = this;
                        return [4, this._sessionManager.initializeSession()];
                    case 1:
                        _a.session = _d.sent();
                        behavioralTracker = new BehavioralTracker({
                            enableClickTracking: true,
                            enableScrollTracking: true,
                            enableFormTracking: true,
                            enableMouseTracking: !!this.config.debug,
                            enableVisibilityTracking: true,
                            enablePerformanceTracking: true,
                        });
                        behavioralTracker.setTracker(this);
                        this.use(behavioralTracker);
                        technologyDetector = new TechnologyDetector();
                        this.use(technologyDetector);
                        performanceOptimizer = new PerformanceOptimizer(this.config.performance);
                        this.use(performanceOptimizer);
                        if (((_b = this.config.performance) === null || _b === void 0 ? void 0 : _b.enabled) !== false) {
                            performanceOptimizer.startMonitoring();
                            if (this.config.debug) {
                                console.log('Performance monitoring started');
                            }
                        }
                        if (!(((_c = this.config.websocket) === null || _c === void 0 ? void 0 : _c.enabled) && isBrowser())) return [3, 5];
                        wsConfig = this.config.websocket;
                        cleanConfig = {
                            url: wsConfig.url || '',
                        };
                        if (this.config.debug !== undefined)
                            cleanConfig.debug = this.config.debug;
                        if (wsConfig.protocols)
                            cleanConfig.protocols = wsConfig.protocols;
                        if (wsConfig.reconnect !== undefined)
                            cleanConfig.reconnect = wsConfig.reconnect;
                        if (wsConfig.reconnectInterval)
                            cleanConfig.reconnectInterval = wsConfig.reconnectInterval;
                        if (wsConfig.maxReconnectAttempts)
                            cleanConfig.maxReconnectAttempts = wsConfig.maxReconnectAttempts;
                        if (wsConfig.heartbeatInterval)
                            cleanConfig.heartbeatInterval = wsConfig.heartbeatInterval;
                        if (wsConfig.messageQueueSize)
                            cleanConfig.messageQueueSize = wsConfig.messageQueueSize;
                        if (wsConfig.enableCompression !== undefined)
                            cleanConfig.enableCompression = wsConfig.enableCompression;
                        if (wsConfig.enableFallback !== undefined)
                            cleanConfig.enableFallback = wsConfig.enableFallback;
                        if (wsConfig.fallbackUrl)
                            cleanConfig.fallbackUrl = wsConfig.fallbackUrl;
                        if (wsConfig.timeout)
                            cleanConfig.timeout = wsConfig.timeout;
                        webSocketManager = new WebSocketManager(cleanConfig);
                        webSocketManager.setSessionContext(this.session.sessionId, this.session.visitorId);
                        this.use(webSocketManager);
                        if (!(wsConfig.autoConnect && wsConfig.url)) return [3, 5];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 5]);
                        return [4, webSocketManager.connect()];
                    case 3:
                        _d.sent();
                        if (this.config.debug) {
                            console.log('WebSocket auto-connected');
                        }
                        return [3, 5];
                    case 4:
                        error_1 = _d.sent();
                        if (this.config.debug) {
                            console.warn('WebSocket auto-connect failed:', error_1);
                        }
                        return [3, 5];
                    case 5:
                        this._startFlushTimer();
                        if (isBrowser()) {
                            domReady(function () {
                                _this.pageView();
                            });
                        }
                        this.isInitialized = true;
                        this.emit('initialized', this.config);
                        if (this.config.debug) {
                            console.log('Tracker initialized', {
                                config: this.config,
                                session: this.session,
                                fingerprint: this._sessionManager.getFingerprint(),
                                modules: Array.from(this._modules.keys()),
                            });
                        }
                        return [2];
                }
            });
        });
    };
    Tracker.prototype.track = function (event, data) {
        if (data === void 0) { data = {}; }
        if (!this.isInitialized) {
            if (this.config.debug) {
                console.warn('Tracker not initialized');
            }
            return;
        }
        if (!this.hasConsent()) {
            if (this.config.debug) {
                console.warn('No consent for tracking');
            }
            return;
        }
        var eventData = {
            type: 'custom',
            element: event,
            value: data,
            timestamp: now$1(),
            sessionId: this.session.sessionId,
            visitorId: this.session.visitorId,
            metadata: data,
        };
        this._queueEvent(eventData);
        this.emit('track', eventData);
        if (this.config.debug) {
            console.log('Event tracked', eventData);
        }
    };
    Tracker.prototype.identify = function (visitorId, traits) {
        if (traits === void 0) { traits = {}; }
        if (!this.isInitialized)
            return;
        this.session.visitorId = visitorId;
        this.track('identify', { visitorId: visitorId, traits: traits });
        this.emit('identify', { visitorId: visitorId, traits: traits });
    };
    Tracker.prototype.pageView = function (data) {
        if (data === void 0) { data = {}; }
        if (!this.isInitialized)
            return;
        if (!this.hasConsent())
            return;
        var techStack = this.getTechnologyStack();
        var pageViewData = __assign({ url: getCurrentUrl(), title: getCurrentTitle(), timestamp: now$1(), sessionId: this.session.sessionId, visitorId: this.session.visitorId, referrer: getReferrer() }, data);
        this._sessionManager.updateActivity();
        this.session = this._sessionManager.getCurrentSession() || this.session;
        this._queueEvent({
            type: 'pageview',
            element: pageViewData.url,
            value: pageViewData.title,
            timestamp: pageViewData.timestamp,
            sessionId: pageViewData.sessionId,
            visitorId: pageViewData.visitorId,
            metadata: __assign(__assign({}, pageViewData), { techStack: techStack }),
        });
        this.emit('pageview', __assign(__assign({}, pageViewData), { techStack: techStack }));
        if (this.config.debug) {
            console.log('Page view tracked', __assign(__assign({}, pageViewData), { techStack: techStack }));
        }
    };
    Tracker.prototype.use = function (module) {
        if (this._modules.has(module.name)) {
            if (this.config.debug) {
                console.warn("Module ".concat(module.name, " already registered"));
            }
            return;
        }
        this._modules.set(module.name, module);
        if (this.isInitialized) {
            module.init();
        }
        this.emit('module:added', module);
    };
    Tracker.prototype.getModule = function (name) {
        return this._modules.get(name) || null;
    };
    Tracker.prototype.getTechnologyStack = function () {
        var techModule = this.getModule('TechnologyDetector');
        return techModule ? techModule.getCurrentTechStack() : {};
    };
    Tracker.prototype.connectWebSocket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var webSocketManager;
            return __generator(this, function (_a) {
                webSocketManager = this.getModule('WebSocketManager');
                if (!webSocketManager) {
                    throw new Error('WebSocket module not initialized');
                }
                return [2, webSocketManager.connect()];
            });
        });
    };
    Tracker.prototype.disconnectWebSocket = function () {
        var webSocketManager = this.getModule('WebSocketManager');
        if (webSocketManager) {
            webSocketManager.disconnect();
        }
    };
    Tracker.prototype.sendWebSocketEvent = function (event_1, data_1) {
        return __awaiter(this, arguments, void 0, function (event, data, priority) {
            var webSocketManager;
            if (priority === void 0) { priority = 'normal'; }
            return __generator(this, function (_a) {
                webSocketManager = this.getModule('WebSocketManager');
                if (!webSocketManager) {
                    return [2, false];
                }
                return [2, webSocketManager.sendEvent(event, data, priority)];
            });
        });
    };
    Tracker.prototype.getWebSocketState = function () {
        var webSocketManager = this.getModule('WebSocketManager');
        return webSocketManager ? webSocketManager.getConnectionState() : null;
    };
    Tracker.prototype.getWebSocketMetrics = function () {
        var wsModule = this.getModule('WebSocketManager');
        if (wsModule) {
            return wsModule.getMetrics();
        }
        return null;
    };
    Tracker.prototype.setConsent = function (consent) {
        this._storage.set('consent', JSON.stringify(consent));
        this.emit('consent:changed', consent);
        if (this.config.debug) {
            console.log('Consent updated', consent);
        }
    };
    Tracker.prototype.hasConsent = function () {
        if (!this.config.enableGDPR)
            return true;
        var consentData = this._storage.get('consent');
        if (!consentData)
            return false;
        try {
            var consent = JSON.parse(consentData);
            return consent.hasConsent && consent.purposes.analytics;
        }
        catch (_a) {
            return false;
        }
    };
    Tracker.prototype.showConsentBanner = function () {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            gdprModule.showConsentBanner();
        }
        else if (this.config.debug) {
            console.warn('GDPR Compliance module not found');
        }
    };
    Tracker.prototype.hideConsentBanner = function () {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            gdprModule.hideConsentBanner();
        }
        else if (this.config.debug) {
            console.warn('GDPR Compliance module not found');
        }
    };
    Tracker.prototype.getGDPRConsent = function () {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            return gdprModule.getConsent();
        }
        return null;
    };
    Tracker.prototype.setGDPRConsent = function (consent) {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            gdprModule.setConsent(consent);
        }
        else if (this.config.debug) {
            console.warn('GDPR Compliance module not found');
        }
    };
    Tracker.prototype.withdrawConsent = function (category) {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            gdprModule.withdrawConsent(category);
        }
        else if (this.config.debug) {
            console.warn('GDPR Compliance module not found');
        }
    };
    Tracker.prototype.requestDataAccess = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var gdprModule;
            return __generator(this, function (_a) {
                gdprModule = this.getModule('GDPRCompliance');
                if (gdprModule) {
                    return [2, gdprModule.requestDataAccess(email)];
                }
                throw new Error('GDPR Compliance module not found');
            });
        });
    };
    Tracker.prototype.requestDataDeletion = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var gdprModule;
            return __generator(this, function (_a) {
                gdprModule = this.getModule('GDPRCompliance');
                if (gdprModule) {
                    return [2, gdprModule.requestDataDeletion(email)];
                }
                throw new Error('GDPR Compliance module not found');
            });
        });
    };
    Tracker.prototype.requestDataPortability = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var gdprModule;
            return __generator(this, function (_a) {
                gdprModule = this.getModule('GDPRCompliance');
                if (gdprModule) {
                    return [2, gdprModule.requestDataPortability(email)];
                }
                throw new Error('GDPR Compliance module not found');
            });
        });
    };
    Tracker.prototype.getPrivacySettings = function () {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            return gdprModule.getPrivacySettings();
        }
        return null;
    };
    Tracker.prototype.setPrivacySettings = function (settings) {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            gdprModule.setPrivacySettings(settings);
        }
        else if (this.config.debug) {
            console.warn('GDPR Compliance module not found');
        }
    };
    Tracker.prototype.isGDPRCompliant = function () {
        var gdprModule = this.getModule('GDPRCompliance');
        if (gdprModule) {
            return gdprModule.isCompliant();
        }
        return !this.config.enableGDPR;
    };
    Tracker.prototype.exportUserData = function (visitorId) {
        return __awaiter(this, void 0, void 0, function () {
            var gdprModule;
            return __generator(this, function (_a) {
                gdprModule = this.getModule('GDPRCompliance');
                if (gdprModule) {
                    return [2, gdprModule.exportUserData(visitorId || this.session.visitorId)];
                }
                throw new Error('GDPR Compliance module not found');
            });
        });
    };
    Tracker.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var events, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this._eventQueue.length === 0)
                            return [2];
                        events = __spreadArray([], __read(this._eventQueue), false);
                        this._eventQueue = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4, this._sendEvents(events)];
                    case 2:
                        _b.sent();
                        this.emit('events:sent', events);
                        return [3, 4];
                    case 3:
                        error_2 = _b.sent();
                        (_a = this._eventQueue).unshift.apply(_a, __spreadArray([], __read(events), false));
                        this.emit('events:failed', error_2);
                        if (this.config.debug) {
                            console.error('Failed to send events', error_2);
                        }
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    Tracker.prototype.destroy = function () {
        if (this._destroyed)
            return;
        if (this._flushTimer) {
            clearInterval(this._flushTimer);
        }
        this.flush().catch(function () {
        });
        this._sessionManager.destroy();
        this._modules.forEach(function (module) {
            if (module.destroy) {
                module.destroy();
            }
        });
        this._modules.clear();
        this.removeAllListeners();
        this._destroyed = true;
        this.isInitialized = false;
    };
    Tracker.prototype._createEmptySession = function () {
        return {
            sessionId: '',
            visitorId: '',
            startTime: 0,
            lastActivity: 0,
            pageViews: 0,
            platform: '',
            userAgent: '',
            landingPage: '',
        };
    };
    Tracker.prototype._queueEvent = function (event) {
        this._eventQueue.push(event);
        if (this._eventQueue.length >= this.config.batchSize) {
            this.flush().catch(function () {
            });
        }
    };
    Tracker.prototype._startFlushTimer = function () {
        var _this = this;
        if (this._flushTimer) {
            clearInterval(this._flushTimer);
        }
        this._flushTimer = window.setInterval(function () {
            if (_this._eventQueue.length > 0) {
                _this.flush().catch(function () {
                });
            }
        }, this.config.flushInterval);
    };
    Tracker.prototype._sendEvents = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.config.debug) {
                            console.log('Sending events', events);
                        }
                        return [4, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Tracker.prototype.configurePerformance = function (config) {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.configure(config);
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.getPerformanceMetrics = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            return perfModule.getMetrics();
        }
        return {
            loadTime: 0,
            domReady: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            totalBlockingTime: 0,
            timeToInteractive: 0,
            memoryUsage: {
                used: 0,
                total: 0,
                limit: 0,
            },
            cpuUsage: 0,
            networkStats: {
                requests: 0,
                bytesTransferred: 0,
                averageLatency: 0,
            },
            scriptPerformance: {
                initTime: 0,
                executionTime: 0,
                moduleLoadTimes: {},
            },
        };
    };
    Tracker.prototype.getPerformanceReport = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            return perfModule.getOptimizationReport();
        }
        return {
            timestamp: Date.now(),
            metrics: this.getPerformanceMetrics(),
            thresholds: {
                memory: { warning: 80, critical: 100 },
                cpu: { warning: 70, critical: 90 },
                network: { latency: 500, bandwidth: 1024 * 1024 },
                coreWebVitals: { lcp: 2500, fid: 100, cls: 0.1 },
            },
            violations: [],
            optimizations: [],
            score: 100,
            grade: 'A',
        };
    };
    Tracker.prototype.startPerformanceMonitoring = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.startMonitoring();
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.stopPerformanceMonitoring = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.stopMonitoring();
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.optimizePerformance = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.optimizeCoreWebVitals();
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.preloadCriticalResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var perfModule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        perfModule = this.getModule('PerformanceOptimizer');
                        if (!perfModule) return [3, 2];
                        return [4, perfModule.preloadCriticalResources()];
                    case 1:
                        _a.sent();
                        return [3, 3];
                    case 2:
                        if (this.config.debug) {
                            console.warn('PerformanceOptimizer module not found');
                        }
                        _a.label = 3;
                    case 3: return [2];
                }
            });
        });
    };
    Tracker.prototype.enableLazyLoading = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.configure({
                lazyLoading: {
                    enabled: true,
                    threshold: 50 * 1024,
                    modules: [],
                    chunkSize: 100 * 1024,
                }
            });
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.enableCodeSplitting = function () {
        var perfModule = this.getModule('PerformanceOptimizer');
        if (perfModule) {
            perfModule.configure({
                codesplitting: {
                    enabled: true,
                    splitPoints: [],
                    dynamicImports: true,
                    preloadCritical: true,
                }
            });
        }
        else if (this.config.debug) {
            console.warn('PerformanceOptimizer module not found');
        }
    };
    Tracker.prototype.measureCoreWebVitals = function () {
        return __awaiter(this, void 0, void 0, function () {
            var perfModule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        perfModule = this.getModule('PerformanceOptimizer');
                        if (!perfModule) return [3, 2];
                        return [4, perfModule.measureCoreWebVitals()];
                    case 1: return [2, _a.sent()];
                    case 2: return [2, {
                            lcp: 0,
                            fid: 0,
                            cls: 0,
                            fcp: 0,
                            ttfb: 0,
                            tbt: 0,
                            tti: 0,
                        }];
                }
            });
        });
    };
    return Tracker;
}(EventEmitter));

var GDPRCompliance = (function (_super) {
    __extends(GDPRCompliance, _super);
    function GDPRCompliance(config, storage) {
        if (config === void 0) { config = {}; }
        var _a, _b, _c, _d, _e, _f;
        var _this = _super.call(this) || this;
        _this.name = 'GDPRCompliance';
        _this._consent = null;
        _this._bannerElement = null;
        _this._initialized = false;
        _this._defaultTexts = {
            bannerTitle: 'We value your privacy',
            bannerDescription: 'We use cookies and similar technologies to enhance your experience, analyze usage, and assist with marketing. You can manage your preferences at any time.',
            acceptAll: 'Accept All',
            rejectAll: 'Reject All',
            customize: 'Customize',
            savePreferences: 'Save Preferences',
            necessary: 'Necessary',
            analytics: 'Analytics',
            marketing: 'Marketing',
            privacyPolicy: 'Privacy Policy',
            cookiePolicy: 'Cookie Policy',
        };
        _this._config = __assign({ enabled: true, consentBanner: __assign({ enabled: true, position: 'bottom', theme: 'light', texts: _this._defaultTexts, showOnEveryPage: false, respectDoNotTrack: true }, config.consentBanner), cookieCategories: _this._getDefaultCookieCategories(), dataRetention: __assign({ defaultDays: 730, automaticDeletion: true }, config.dataRetention), userRights: __assign({ enableDataAccess: true, enableDataDeletion: true, enableDataPortability: true, enableOptOut: true }, config.userRights), privacyByDesign: __assign({ dataMinimization: true, purposeLimitation: true, storageMinimization: true, autoAnonymization: true }, config.privacyByDesign), legalBasis: __assign({ type: 'consent', description: 'User consent for data processing' }, config.legalBasis) }, config);
        _this._cookieCategories = _this._config.cookieCategories || _this._getDefaultCookieCategories();
        _this._privacySettings = {
            dataMinimization: ((_a = _this._config.privacyByDesign) === null || _a === void 0 ? void 0 : _a.dataMinimization) || true,
            anonymizeIPs: true,
            respectDoNotTrack: ((_b = _this._config.consentBanner) === null || _b === void 0 ? void 0 : _b.respectDoNotTrack) || true,
            cookielessTracking: false,
            storageMinimization: ((_c = _this._config.privacyByDesign) === null || _c === void 0 ? void 0 : _c.storageMinimization) || true,
            automaticDeletion: ((_d = _this._config.dataRetention) === null || _d === void 0 ? void 0 : _d.automaticDeletion) || true,
            purposeLimitation: ((_e = _this._config.privacyByDesign) === null || _e === void 0 ? void 0 : _e.purposeLimitation) || true,
            dataRetentionDays: ((_f = _this._config.dataRetention) === null || _f === void 0 ? void 0 : _f.defaultDays) || 730,
            consentRequired: true,
        };
        _this._storage = storage || (isBrowser() ? localStorage : {
            getItem: function () { return null; },
            setItem: function () { },
            removeItem: function () { },
            clear: function () { },
        });
        return _this;
    }
    GDPRCompliance.prototype.init = function () {
        if (!this._config.enabled || this._initialized) {
            return;
        }
        this._loadStoredConsent();
        if (this._privacySettings.respectDoNotTrack && this._hasDoNotTrack()) {
            this._handleDoNotTrack();
            this._initialized = true;
            this.emit('gdpr:initialized', this._config);
            return;
        }
        if (this._shouldShowBanner()) {
            this.showConsentBanner();
        }
        this._initialized = true;
        this.emit('gdpr:initialized', this._config);
    };
    GDPRCompliance.prototype.showConsentBanner = function () {
        var _a;
        if (!isBrowser() || !((_a = this._config.consentBanner) === null || _a === void 0 ? void 0 : _a.enabled)) {
            this.emit('banner:shown');
            return;
        }
        this._createBannerElement();
        this.emit('banner:shown');
    };
    GDPRCompliance.prototype.hideConsentBanner = function () {
        if (this._bannerElement) {
            this._bannerElement.remove();
            this._bannerElement = null;
            this.emit('banner:hidden');
        }
    };
    GDPRCompliance.prototype.getConsent = function () {
        return this._consent;
    };
    GDPRCompliance.prototype.setConsent = function (consent) {
        var _this = this;
        var newConsent = __assign({ id: generateId$1(), hasConsent: true, timestamp: now$1(), version: '1.0', method: 'banner', categories: {}, legalBasis: {}, purposes: {
                analytics: false,
                marketing: false,
                functional: true,
                advertising: false,
                personalization: false,
            } }, consent);
        Object.keys(newConsent.categories).forEach(function (categoryId) {
            var category = _this._cookieCategories.find(function (c) { return c.id === categoryId; });
            if (category && newConsent.categories[categoryId]) {
                switch (categoryId) {
                    case 'analytics':
                        newConsent.purposes.analytics = true;
                        break;
                    case 'marketing':
                        newConsent.purposes.marketing = true;
                        break;
                    case 'advertising':
                        newConsent.purposes.advertising = true;
                        break;
                    case 'personalization':
                        newConsent.purposes.personalization = true;
                        break;
                }
            }
        });
        this._consent = newConsent;
        this._storeConsent();
        this.hideConsentBanner();
        this.emit('consent:updated', newConsent);
    };
    GDPRCompliance.prototype.withdrawConsent = function (category) {
        var _this = this;
        if (!this._consent)
            return;
        if (category) {
            this._consent.categories[category] = false;
            switch (category) {
                case 'analytics':
                    this._consent.purposes.analytics = false;
                    break;
                case 'marketing':
                    this._consent.purposes.marketing = false;
                    break;
                case 'advertising':
                    this._consent.purposes.advertising = false;
                    break;
                case 'personalization':
                    this._consent.purposes.personalization = false;
                    break;
            }
        }
        else {
            this._consent.hasConsent = false;
            this._consent.withdrawalDate = now$1();
            Object.keys(this._consent.categories).forEach(function (cat) {
                _this._consent.categories[cat] = false;
            });
            this._consent.purposes = {
                analytics: false,
                marketing: false,
                functional: true,
                advertising: false,
                personalization: false,
            };
        }
        this._storeConsent();
        this.emit('consent:withdrawn', { category: category, consent: this._consent });
    };
    GDPRCompliance.prototype.renewConsent = function () {
        if (this._consent) {
            this._consent.renewalRequired = true;
            this._storeConsent();
        }
        this.showConsentBanner();
        this.emit('consent:renewal_required');
    };
    GDPRCompliance.prototype.getCookieCategories = function () {
        return this._cookieCategories;
    };
    GDPRCompliance.prototype.setCookieCategory = function (categoryId, enabled) {
        var category = this._cookieCategories.find(function (c) { return c.id === categoryId; });
        if (category && !category.required) {
            category.enabled = enabled;
            if (this._consent) {
                this._consent.categories[categoryId] = enabled;
                this._storeConsent();
            }
            this.emit('cookie:category_changed', { categoryId: categoryId, enabled: enabled });
        }
    };
    GDPRCompliance.prototype.clearCookies = function (category) {
        if (!isBrowser())
            return;
        var categoriesToClear = category
            ? this._cookieCategories.filter(function (c) { return c.id === category; })
            : this._cookieCategories.filter(function (c) { return !c.enabled && !c.required; });
        categoriesToClear.forEach(function (cat) {
            cat.cookies.forEach(function (cookie) {
                document.cookie = "".concat(cookie.name, "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=").concat(cookie.domain || window.location.hostname);
            });
        });
        this.emit('cookies:cleared', { category: category });
    };
    GDPRCompliance.prototype.requestDataAccess = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this._config.userRights) === null || _a === void 0 ? void 0 : _a.enableDataAccess)) {
                    throw new Error('Data access requests are not enabled');
                }
                request = __assign(__assign({ id: generateId$1(), type: 'access', timestamp: now$1(), visitorId: this._getVisitorId() }, (email && { email: email })), { status: 'pending', expiresAt: now$1() + (30 * 24 * 60 * 60 * 1000) });
                this.emit('data:access_requested', request);
                return [2, request];
            });
        });
    };
    GDPRCompliance.prototype.requestDataDeletion = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this._config.userRights) === null || _a === void 0 ? void 0 : _a.enableDataDeletion)) {
                    throw new Error('Data deletion requests are not enabled');
                }
                request = __assign(__assign({ id: generateId$1(), type: 'deletion', timestamp: now$1(), visitorId: this._getVisitorId() }, (email && { email: email })), { status: 'pending', expiresAt: now$1() + (30 * 24 * 60 * 60 * 1000) });
                this.emit('data:deletion_requested', request);
                return [2, request];
            });
        });
    };
    GDPRCompliance.prototype.requestDataPortability = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            var _a;
            return __generator(this, function (_b) {
                if (!((_a = this._config.userRights) === null || _a === void 0 ? void 0 : _a.enableDataPortability)) {
                    throw new Error('Data portability requests are not enabled');
                }
                request = __assign(__assign({ id: generateId$1(), type: 'portability', timestamp: now$1(), visitorId: this._getVisitorId() }, (email && { email: email })), { status: 'pending', expiresAt: now$1() + (30 * 24 * 60 * 60 * 1000) });
                this.emit('data:portability_requested', request);
                return [2, request];
            });
        });
    };
    GDPRCompliance.prototype.getPrivacySettings = function () {
        return __assign({}, this._privacySettings);
    };
    GDPRCompliance.prototype.setPrivacySettings = function (settings) {
        this._privacySettings = __assign(__assign({}, this._privacySettings), settings);
        this.emit('privacy:settings_updated', this._privacySettings);
    };
    GDPRCompliance.prototype.anonymizeData = function (data) {
        if (!this._privacySettings.dataMinimization) {
            return data;
        }
        var anonymized = __assign({}, data);
        if (this._privacySettings.anonymizeIPs && anonymized.ip) {
            anonymized.ip = this._anonymizeIP(anonymized.ip);
        }
        var piiFields = ['email', 'phone', 'name', 'address', 'ssn'];
        piiFields.forEach(function (field) {
            if (anonymized[field]) {
                delete anonymized[field];
            }
        });
        return anonymized;
    };
    GDPRCompliance.prototype.isCompliant = function () {
        if (!this._config.enabled)
            return true;
        if (this._privacySettings.consentRequired && !this._hasValidConsent()) {
            return false;
        }
        if (!this._isDataRetentionCompliant()) {
            return false;
        }
        return true;
    };
    GDPRCompliance.prototype.getComplianceReport = function () {
        var issues = [];
        var recommendations = [];
        var consentStatus = 'missing';
        if (this._consent) {
            if (this._consent.withdrawalDate) {
                consentStatus = 'withdrawn';
            }
            else if (this._isConsentExpired()) {
                consentStatus = 'expired';
                issues.push('Consent has expired and needs renewal');
            }
            else {
                consentStatus = 'valid';
            }
        }
        else {
            issues.push('No consent record found');
        }
        var dataRetentionCompliant = this._isDataRetentionCompliant();
        if (!dataRetentionCompliant) {
            issues.push('Data retention period exceeded');
            recommendations.push('Implement automatic data deletion');
        }
        var cookieCompliant = this._isCookieCompliant();
        if (!cookieCompliant) {
            issues.push('Non-essential cookies active without consent');
            recommendations.push('Review cookie categorization and consent status');
        }
        return {
            timestamp: now$1(),
            consentStatus: consentStatus,
            dataRetentionCompliance: dataRetentionCompliant,
            cookieCompliance: cookieCompliant,
            privacySettingsCompliance: true,
            issues: issues,
            recommendations: recommendations,
        };
    };
    GDPRCompliance.prototype.exportUserData = function (visitorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, {
                        visitorId: visitorId,
                        exportDate: now$1(),
                        sessions: [],
                        events: [],
                        pageViews: [],
                        consent: this._consent ? [this._consent] : [],
                        format: 'json',
                    }];
            });
        });
    };
    GDPRCompliance.prototype.deleteUserData = function (visitorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this._storage.removeItem("gdpr_consent_".concat(visitorId));
                    this._storage.removeItem("visitor_session_".concat(visitorId));
                    if (this._consent) {
                        this._consent = null;
                    }
                    this.emit('data:deleted', { visitorId: visitorId });
                    return [2, true];
                }
                catch (error) {
                    this.emit('data:deletion_failed', { visitorId: visitorId, error: error });
                    return [2, false];
                }
                return [2];
            });
        });
    };
    GDPRCompliance.prototype.destroy = function () {
        this.hideConsentBanner();
        this._initialized = false;
        this.emit('gdpr:destroyed');
    };
    GDPRCompliance.prototype._getDefaultCookieCategories = function () {
        return [
            {
                id: 'necessary',
                name: 'Necessary',
                description: 'These cookies are essential for the website to function properly.',
                required: true,
                enabled: true,
                purpose: 'Essential website functionality',
                legalBasis: {
                    type: 'legitimate_interests',
                    description: 'Necessary for website operation',
                    legitimateInterests: 'Providing requested services',
                },
                retentionPeriod: 365,
                cookies: [
                    {
                        name: 'session_id',
                        purpose: 'Session management',
                        provider: 'First party',
                        expiry: 'Session',
                        type: 'essential',
                    },
                ],
            },
            {
                id: 'analytics',
                name: 'Analytics',
                description: 'These cookies help us understand how visitors interact with our website.',
                required: false,
                enabled: false,
                purpose: 'Website analytics and improvement',
                legalBasis: {
                    type: 'consent',
                    description: 'User consent for analytics',
                },
                retentionPeriod: 730,
                cookies: [
                    {
                        name: 'tracking_id',
                        purpose: 'Visitor tracking',
                        provider: 'First party',
                        expiry: '2 years',
                        type: 'analytics',
                    },
                ],
            },
            {
                id: 'marketing',
                name: 'Marketing',
                description: 'These cookies are used to show relevant advertising and marketing content.',
                required: false,
                enabled: false,
                purpose: 'Personalized advertising',
                legalBasis: {
                    type: 'consent',
                    description: 'User consent for marketing',
                },
                retentionPeriod: 365,
                cookies: [
                    {
                        name: 'marketing_id',
                        purpose: 'Marketing campaigns',
                        provider: 'Third party',
                        expiry: '1 year',
                        type: 'marketing',
                    },
                ],
            },
        ];
    };
    GDPRCompliance.prototype._loadStoredConsent = function () {
        try {
            var stored = this._storage.getItem('gdpr_consent');
            if (stored) {
                this._consent = JSON.parse(stored);
            }
        }
        catch (_a) {
        }
    };
    GDPRCompliance.prototype._storeConsent = function () {
        if (this._consent) {
            this._storage.setItem('gdpr_consent', JSON.stringify(this._consent));
        }
    };
    GDPRCompliance.prototype._shouldShowBanner = function () {
        var _a, _b;
        if (!((_a = this._config.consentBanner) === null || _a === void 0 ? void 0 : _a.enabled))
            return false;
        if (this._hasValidConsent() && !((_b = this._consent) === null || _b === void 0 ? void 0 : _b.renewalRequired))
            return false;
        if (this._hasDoNotTrack() && this._privacySettings.respectDoNotTrack)
            return false;
        return true;
    };
    GDPRCompliance.prototype._hasValidConsent = function () {
        return this._consent !== null &&
            this._consent.hasConsent &&
            !this._consent.withdrawalDate &&
            !this._isConsentExpired();
    };
    GDPRCompliance.prototype._isConsentExpired = function () {
        if (!this._consent)
            return true;
        var expiryTime = this._consent.timestamp + (365 * 24 * 60 * 60 * 1000);
        return now$1() > expiryTime;
    };
    GDPRCompliance.prototype._hasDoNotTrack = function () {
        if (!isBrowser())
            return false;
        return navigator.doNotTrack === '1' ||
            window.doNotTrack === '1' ||
            navigator.msDoNotTrack === '1';
    };
    GDPRCompliance.prototype._handleDoNotTrack = function () {
        this.setConsent({
            hasConsent: false,
            method: 'implied',
            categories: {},
            purposes: {
                analytics: false,
                marketing: false,
                functional: true,
                advertising: false,
                personalization: false,
            },
        });
        this.emit('consent:do_not_track');
    };
    GDPRCompliance.prototype._createBannerElement = function () {
        if (!isBrowser() || this._bannerElement)
            return;
        var banner = document.createElement('div');
        banner.className = 'gdpr-banner';
        banner.innerHTML = this._getBannerHTML();
        this._applyBannerStyles(banner);
        this._addBannerEventListeners(banner);
        document.body.appendChild(banner);
        this._bannerElement = banner;
    };
    GDPRCompliance.prototype._getBannerHTML = function () {
        var _a;
        var texts = ((_a = this._config.consentBanner) === null || _a === void 0 ? void 0 : _a.texts) || this._defaultTexts;
        return "\n      <div class=\"gdpr-banner-content\">\n        <div class=\"gdpr-banner-text\">\n          <h3>".concat(texts.bannerTitle, "</h3>\n          <p>").concat(texts.bannerDescription, "</p>\n        </div>\n        <div class=\"gdpr-banner-actions\">\n          <button type=\"button\" class=\"gdpr-btn gdpr-btn-customize\">").concat(texts.customize, "</button>\n          <button type=\"button\" class=\"gdpr-btn gdpr-btn-reject\">").concat(texts.rejectAll, "</button>\n          <button type=\"button\" class=\"gdpr-btn gdpr-btn-accept\">").concat(texts.acceptAll, "</button>\n        </div>\n      </div>\n    ");
    };
    GDPRCompliance.prototype._applyBannerStyles = function (banner) {
        var _a, _b, _c;
        var position = ((_a = this._config.consentBanner) === null || _a === void 0 ? void 0 : _a.position) || 'bottom';
        var theme = ((_b = this._config.consentBanner) === null || _b === void 0 ? void 0 : _b.theme) || 'light';
        var baseStyles = {
            position: 'fixed',
            left: '0',
            right: '0',
            zIndex: '10000',
            backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#2d3748',
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4',
        };
        if (position === 'top') {
            baseStyles.top = '0';
        }
        else {
            baseStyles.bottom = '0';
        }
        Object.assign(banner.style, baseStyles, (_c = this._config.consentBanner) === null || _c === void 0 ? void 0 : _c.customStyles);
        var content = banner.querySelector('.gdpr-banner-content');
        if (content) {
            Object.assign(content.style, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1200px',
                margin: '0 auto',
                gap: '16px',
            });
        }
        var buttons = banner.querySelectorAll('.gdpr-btn');
        buttons.forEach(function (btn) {
            var button = btn;
            Object.assign(button.style, {
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginLeft: '8px',
            });
            if (button.classList.contains('gdpr-btn-accept')) {
                Object.assign(button.style, {
                    backgroundColor: '#4299e1',
                    color: '#ffffff',
                });
            }
            else if (button.classList.contains('gdpr-btn-reject')) {
                Object.assign(button.style, {
                    backgroundColor: 'transparent',
                    color: theme === 'dark' ? '#ffffff' : '#4a5568',
                    border: '1px solid currentColor',
                });
            }
            else {
                Object.assign(button.style, {
                    backgroundColor: 'transparent',
                    color: theme === 'dark' ? '#ffffff' : '#4a5568',
                    textDecoration: 'underline',
                });
            }
        });
    };
    GDPRCompliance.prototype._addBannerEventListeners = function (banner) {
        var _this = this;
        var acceptBtn = banner.querySelector('.gdpr-btn-accept');
        var rejectBtn = banner.querySelector('.gdpr-btn-reject');
        var customizeBtn = banner.querySelector('.gdpr-btn-customize');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                _this.setConsent({
                    hasConsent: true,
                    method: 'banner',
                    categories: Object.fromEntries(_this._cookieCategories.map(function (cat) { return [cat.id, !cat.required ? true : cat.enabled]; })),
                });
            });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                _this.setConsent({
                    hasConsent: false,
                    method: 'banner',
                    categories: Object.fromEntries(_this._cookieCategories.map(function (cat) { return [cat.id, cat.required]; })),
                });
            });
        }
        if (customizeBtn) {
            customizeBtn.addEventListener('click', function () {
                _this._showCustomizeModal();
            });
        }
    };
    GDPRCompliance.prototype._showCustomizeModal = function () {
        this.emit('banner:customize_requested', this._cookieCategories);
    };
    GDPRCompliance.prototype._isDataRetentionCompliant = function () {
        if (!this._consent)
            return true;
        var retentionDays = this._privacySettings.dataRetentionDays;
        var consentAge = now$1() - this._consent.timestamp;
        var maxAge = retentionDays * 24 * 60 * 60 * 1000;
        return consentAge <= maxAge;
    };
    GDPRCompliance.prototype._isCookieCompliant = function () {
        var _this = this;
        if (!this._consent)
            return false;
        return this._cookieCategories.every(function (category) {
            if (category.required)
                return true;
            var consentForCategory = _this._consent.categories[category.id];
            if (consentForCategory !== undefined) {
                return category.enabled === consentForCategory;
            }
            return !category.enabled;
        });
    };
    GDPRCompliance.prototype._anonymizeIP = function (ip) {
        if (ip.includes(':')) {
            var parts = ip.split(':');
            return parts.slice(0, 4).join(':') + '::';
        }
        else {
            var parts = ip.split('.');
            return parts.slice(0, 3).join('.') + '.0';
        }
    };
    GDPRCompliance.prototype._getVisitorId = function () {
        return 'visitor_' + generateId$1();
    };
    return GDPRCompliance;
}(EventEmitter));

var globalTracker = null;
function init(config) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!globalTracker) {
                        globalTracker = new Tracker();
                    }
                    return [4, globalTracker.init(config)];
                case 1:
                    _a.sent();
                    return [2, globalTracker];
            }
        });
    });
}
function getTracker() {
    return globalTracker;
}
function track(event, data) {
    if (globalTracker) {
        globalTracker.track(event, data);
    }
}
function pageView(data) {
    if (globalTracker) {
        globalTracker.pageView(data);
    }
}
function identify(visitorId, traits) {
    if (globalTracker) {
        globalTracker.identify(visitorId, traits);
    }
}
function setConsent(consent) {
    if (globalTracker) {
        globalTracker.setConsent(consent);
    }
}
function createTracker(config) {
    var tracker = new Tracker();
    if (config && config.apiUrl && config.projectId) {
        tracker.init(config).catch(function (error) {
            if (config.debug) {
                console.error('Failed to initialize tracker:', error);
            }
        });
    }
    return tracker;
}
if (isBrowser()) {
    var globalWindow = window;
    if (globalWindow.optimizelyConfig) {
        init(globalWindow.optimizelyConfig);
    }
    globalWindow.Optimizely = {
        init: init,
        getTracker: getTracker,
        track: track,
        pageView: pageView,
        identify: identify,
        setConsent: setConsent,
        createTracker: createTracker,
        Tracker: Tracker,
    };
}
var index = {
    init: init,
    getTracker: getTracker,
    track: track,
    pageView: pageView,
    identify: identify,
    setConsent: setConsent,
    createTracker: createTracker,
    Tracker: Tracker,
};

export { BehavioralTracker, EventEmitter, GDPRCompliance, SessionManager, Storage$1 as Storage, TechnologyDetector, Tracker, UniversalPolyfills, WebSocketManager, addEventListener, anonymizeIP, anonymizeIPv4, anonymizeIPv6, areCookiesEnabled, calculateRetentionExpiry, clearAllCookies, createTracker, debounce, deepMerge, index as default, detectBrowser, detectPlatform, domReady, formatGDPRDate, generateId$1 as generateId, generateSessionId, generateVisitorId, getCurrentTitle, getCurrentUrl, getDoNotTrackStatus, getLanguage, getPlatform, getReferrer, getScrollDepth, getTimezoneOffset, getTracker, getUserAgent, hashSensitiveData, identify, init, isBot, isBrowser, isConsentRequired, isDataExpired, isElementVisible, isProduction, isValidEmail, now$1 as now, pageView, removePII, safeJsonParse, safeJsonStringify, setConsent, shouldAnonymizeIP, shouldMinimizeData, simpleHash, throttle, track };

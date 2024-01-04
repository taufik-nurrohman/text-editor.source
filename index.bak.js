/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2024 Taufik Nurrohman <https://github.com/taufik-nurrohman>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
(function (g, f) {
    typeof exports === 'object' && typeof module !== 'undefined' ? f(exports) : typeof define === 'function' && define.amd ? define(['exports'], f) : (g = typeof globalThis !== 'undefined' ? globalThis : g || self, f((g.TextEditor = g.TextEditor || {}, g.TextEditor.Source = {})));
})(this, (function (exports) {
    'use strict';
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    var isArray = function isArray(x) {
        return Array.isArray(x);
    };
    var isDefined = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isInstance = function isInstance(x, of) {
        return x && isSet(of) && x instanceof of ;
    };
    var isNull = function isNull(x) {
        return null === x;
    };
    var isSet = function isSet(x) {
        return isDefined(x) && !isNull(x);
    };
    var isString = function isString(x) {
        return 'string' === typeof x;
    };
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectValues = function toObjectValues(x) {
        return Object.values(x);
    };
    var W = window;
    var debounce = function debounce(then, time) {
        var timer;
        return function () {
            var _arguments = arguments,
                _this = this;
            timer && clearTimeout(timer);
            timer = setTimeout(function () {
                return then.apply(_this, _arguments);
            }, time);
        };
    };
    var isPattern = function isPattern(pattern) {
        return isInstance(pattern, RegExp);
    };
    var toPattern = function toPattern(pattern, opt) {
        if (isPattern(pattern)) {
            return pattern;
        }
        // No need to escape `/` in the pattern string
        pattern = pattern.replace(/\//g, '\\/');
        return new RegExp(pattern, isSet(opt) ? opt : 'g');
    };
    var pairs = {
        '`': '`',
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '<': '>'
    };

    function promisify(type, lot) {
        return new Promise(function (resolve, reject) {
            var r = W[type].apply(W, lot);
            return r ? resolve(r) : reject(r);
        });
    }
    var defaults = {
        source: {
            pairs: pairs,
            type: null
        }
    };
    ['alert', 'confirm', 'prompt'].forEach(function (type) {
        defaults.source[type] = function () {
            for (var _len = arguments.length, lot = new Array(_len), _key = 0; _key < _len; _key++) {
                lot[_key] = arguments[_key];
            }
            return promisify(type, lot);
        };
    });
    var that = {};
    that.toggle = function (open, close, wrap, tidy) {
        if (tidy === void 0) {
            tidy = false;
        }
        if (!close && "" !== close) {
            close = open;
        }
        var t = this,
            _t$$ = t.$(),
            after = _t$$.after,
            before = _t$$.before,
            value = _t$$.value,
            closeCount = toCount(close),
            openCount = toCount(open);
        if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
            return t.peel(open, close, wrap);
        }
        if (false !== tidy) {
            if (isString(tidy)) {
                tidy = [tidy, tidy];
            } else if (!isArray(tidy)) {
                tidy = ["", ""];
            }
            if (!isSet(tidy[1])) {
                tidy[1] = tidy[0];
            }
            t.trim(tidy[0], tidy[1]);
        }
        return t.wrap(open, close, wrap);
    };
    var CTRL_PREFIX = 'Control-';
    var SHIFT_PREFIX = 'Shift-';

    function canKeyDown(map, of) {
        var charAfter,
            charBefore,
            charIndent = of.state.source.tab || of.state.tab || '\t',
            charPairs = of.state.source.pairs || {},
            charPairsValues = toObjectValues(charPairs),
            key = map.key,
            queue = map.queue,
            keyValue = map + "";
        // Do nothing
        if (queue.Alt || queue.Control) {
            return true;
        }
        if (' ' === keyValue) {
            var _of$$ = of.$(),
                _after = _of$$.after,
                _before = _of$$.before,
                _value = _of$$.value;
            charAfter = charPairs[charBefore = _before.slice(-1)];
            if (!_value && charAfter && charBefore && charAfter === _after[0]) {
                of.wrap(' ', ' ');
                return false;
            }
            return true;
        }
        if ('Enter' === keyValue || SHIFT_PREFIX + 'Enter' === keyValue) {
            var _of$$2 = of.$(),
                _after2 = _of$$2.after,
                _before2 = _of$$2.before,
                _value2 = _of$$2.value,
                lineBefore = _before2.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            if (!_value2) {
                if (_after2 && _before2 && (charAfter = charPairs[charBefore = _before2.slice(-1)]) && charAfter === _after2[0]) {
                    of.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                    return false;
                }
                if (lineMatchIndent) {
                    of.insert('\n' + lineMatchIndent, -1).record();
                    return false;
                }
            }
            return true;
        }
        if ('Backspace' === keyValue) {
            var _of$$3 = of.$(),
                _after3 = _of$$3.after,
                _before3 = _of$$3.before,
                _value3 = _of$$3.value;
            _after3.split('\n')[0];
            var _lineBefore = _before3.split('\n').pop(),
                _lineMatch = _lineBefore.match(/^(\s+)/),
                _lineMatchIndent = _lineMatch && _lineMatch[1] || "";
            charAfter = charPairs[charBefore = _before3.slice(-1)];
            // Do nothing on escape
            if ('\\' === charBefore) {
                return true;
            }
            if (_value3) {
                if (_after3 && _before3 && charAfter && charAfter === _after3[0] && !_before3.endsWith('\\' + charBefore)) {
                    of.record().peel(charBefore, charAfter).record();
                    return false;
                }
                return true;
            }
            charAfter = charPairs[charBefore = _before3.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (_after3.startsWith(' ' + charAfter) && _before3.endsWith(charBefore + ' ') || _after3.startsWith('\n' + _lineMatchIndent + charAfter) && _before3.endsWith(charBefore + '\n' + _lineMatchIndent)) {
                    // Collapse bracket(s)
                    of.trim("", "").record();
                    return false;
                }
            }
            // Outdent
            if (_lineBefore.endsWith(charIndent)) {
                of.pull(charIndent).record();
                return false;
            }
            if (_after3 && _before3 && !_before3.endsWith('\\' + charBefore)) {
                if (charAfter === _after3[0] && charBefore === _before3.slice(-1)) {
                    // Peel pair
                    of.peel(charBefore, charAfter).record();
                    return false;
                }
            }
            return true;
        }
        var _of$$4 = of.$(),
            after = _of$$4.after,
            before = _of$$4.before,
            start = _of$$4.start,
            value = _of$$4.value;
        // Do nothing on escape
        if ('\\' === (charBefore = before.slice(-1))) {
            return true;
        }
        charAfter = hasValue(after[0], charPairsValues) ? after[0] : charPairs[charBefore];
        // `|}`
        if (!value && after && before && charAfter && key === charAfter) {
            // Move to the next character
            // `}|`
            of.select(start + 1).record();
            return false;
        }
        for (charBefore in charPairs) {
            charAfter = charPairs[charBefore];
            // `{|`
            if (key === charBefore && charAfter) {
                // Wrap pair or selection
                // `{|}` `{|aaa|}`
                of.wrap(charBefore, charAfter).record();
                return false;
            }
            // `|}`
            if (key === charAfter) {
                if (value) {
                    // Wrap selection
                    // `{|aaa|}`
                    of.record().wrap(charBefore, charAfter).record();
                    return false;
                }
                break;
            }
        }
        return true;
    }

    function canKeyDownDent(map, of) {
        var charIndent = of.state.source.tab || of.state.tab || '\t';
        map.key;
        map.queue;
        var keyValue = map + "";
        // Indent with `⎈]`
        if (CTRL_PREFIX + ']' === keyValue) {
            of.push(charIndent).record();
            return false;
        }
        // Outdent with `⎈[`
        if (CTRL_PREFIX + '[' === keyValue) {
            of.pull(charIndent).record();
            return false;
        }
        return true;
    }

    function canKeyDownEnter(map, of) {
        map.key;
        var queue = map.queue;
        if (queue.Control && queue.Enter) {
            var _of$$5 = of.$(),
                after = _of$$5.after,
                before = _of$$5.before,
                end = _of$$5.end,
                start = _of$$5.start,
                value = _of$$5.value,
                lineAfter = after.split('\n').shift(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            if (before || after) {
                if (queue.Shift) {
                    // Insert line above with `⎈⇧↵`
                    return of.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').insert(value).record(), false;
                }
                // Insert line below with `⎈↵`
                return of.select(end + toCount(lineAfter)).wrap('\n' + lineMatchIndent, "").insert(value).record(), false;
            }
        }
        return true;
    }

    function canKeyDownHistory(map, of) {
        var keyValue = map + "";
        // Redo with `⎈y`
        if (CTRL_PREFIX + 'y' === keyValue) {
            return of.redo(), false;
        }
        // Undo with `⎈z`
        if (CTRL_PREFIX + 'z' === keyValue) {
            return of.undo(), false;
        }
        return true;
    }

    function canKeyDownMove(map, of) {
        map.key;
        var queue = map.queue,
            keyValue = map + "";
        if (!queue.Control) {
            return true;
        }
        var _of$$6 = of.$(),
            after = _of$$6.after,
            before = _of$$6.before,
            end = _of$$6.end,
            start = _of$$6.start,
            value = _of$$6.value,
            charPair,
            charPairValue,
            charPairs = of.state.source.pairs || {},
            boundaries = [],
            m;
        if (value) {
            for (charPair in charPairs) {
                if (!(charPairValue = charPairs[charPair])) {
                    continue;
                }
                boundaries.push('(?:\\' + charPair + '(?:\\\\.|[^\\' + charPair + (charPairValue !== charPair ? '\\' + charPairValue : "") + '])*\\' + charPairValue + ')');
            }
            boundaries.push('\\w+'); // Word(s)
            boundaries.push('\\s+'); // White-space(s)
            boundaries.push('[\\s\\S]'); // Last try!
            if (CTRL_PREFIX + 'ArrowLeft' === keyValue) {
                if (m = before.match(toPattern('(' + boundaries.join('|') + ')$', ""))) {
                    of.insert("").select(start - toCount(m[0])).insert(value);
                    return of.record(), false;
                }
                return of.select(), false;
            }
            if (CTRL_PREFIX + 'ArrowRight' === keyValue) {
                if (m = after.match(toPattern('^(' + boundaries.join('|') + ')', ""))) {
                    of.insert("").select(end + toCount(m[0]) - toCount(value)).insert(value);
                    return of.record(), false;
                }
                return of.select(), false;
            }
        }
        var lineAfter = after.split('\n').shift(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/);
        lineMatch && lineMatch[1] || "";
        // Force to select the current line if there is no selection
        end += toCount(lineAfter);
        start -= toCount(lineBefore);
        value = lineBefore + value + lineAfter;
        if (CTRL_PREFIX + 'ArrowUp' === keyValue) {
            if (!hasValue('\n', before)) {
                return of.select(), false;
            }
            of.insert("");
            of.replace(/^([^\n]*?)(\n|$)/, '$2', 1);
            of.replace(/(^|\n)([^\n]*?)$/, "", -1);
            var $ = of.$();
            before = $.before;
            start = $.start;
            lineBefore = before.split('\n').pop();
            of.select(start = start - toCount(lineBefore)).wrap(value, '\n');
            of.select(start, start + toCount(value));
            return of.record(), false;
        }
        if (CTRL_PREFIX + 'ArrowDown' === keyValue) {
            if (!hasValue('\n', after)) {
                return of.select(), false;
            }
            of.insert("");
            of.replace(/^([^\n]*?)(\n|$)/, "", 1);
            of.replace(/(^|\n)([^\n]*?)$/, '$1', -1);
            var _$ = of.$();
            after = _$.after;
            end = _$.end;
            lineAfter = after.split('\n').shift();
            of.select(end = end + toCount(lineAfter)).wrap('\n', value);
            end += 1;
            of.select(end, end + toCount(value));
            return of.record(), false;
        }
        return true;
    }

    function canKeyDownTab(map, of) {
        var charIndent = of.state.source.tab || of.state.tab || '\t',
            keyValue = map + "";
        // Indent with `⇥`
        if ('Tab' === keyValue) {
            return of.push(charIndent).record(), false;
        }
        // Outdent with `⇧+⇥`
        if (SHIFT_PREFIX + 'Tab' === keyValue) {
            return of.pull(charIndent).record(), false;
        }
        return true;
    }
    var bounce = debounce(function (of) {
        return of.record();
    }, 100);

    function canKeyUp(map, of) {
        return bounce(of), true;
    }
    var state = defaults;
    exports.canKeyDown = canKeyDown;
    exports.canKeyDownDent = canKeyDownDent;
    exports.canKeyDownEnter = canKeyDownEnter;
    exports.canKeyDownHistory = canKeyDownHistory;
    exports.canKeyDownMove = canKeyDownMove;
    exports.canKeyDownTab = canKeyDownTab;
    exports.canKeyUp = canKeyUp;
    exports.state = state;
    exports.that = that;
    Object.defineProperty(exports, '__esModule', {
        value: true
    });
}));
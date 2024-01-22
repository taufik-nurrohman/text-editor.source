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
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = f() : typeof define === 'function' && define.amd ? define(f) : (g = typeof globalThis !== 'undefined' ? globalThis : g || self, (g.TextEditor = g.TextEditor || {}, g.TextEditor.Source = f()));
})(this, (function () {
    'use strict';
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    var isArray = function isArray(x) {
        return Array.isArray(x);
    };
    var isDefined$1 = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isFunction = function isFunction(x) {
        return 'function' === typeof x;
    };
    var isInstance$1 = function isInstance(x, of) {
        return x && isSet$1(of) && x instanceof of ;
    };
    var isInteger = function isInteger(x) {
        return isNumber(x) && 0 === x % 1;
    };
    var isNull$1 = function isNull(x) {
        return null === x;
    };
    var isNumber = function isNumber(x) {
        return 'number' === typeof x;
    };
    var isObject = function isObject(x, isPlain) {
        if (isPlain === void 0) {
            isPlain = true;
        }
        if ('object' !== typeof x) {
            return false;
        }
        return isPlain ? isInstance$1(x, Object) : true;
    };
    var isSet$1 = function isSet(x) {
        return isDefined$1(x) && !isNull$1(x);
    };
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectValues = function toObjectValues(x) {
        return Object.values(x);
    };
    var fromStates = function fromStates() {
        for (var _len = arguments.length, lot = new Array(_len), _key = 0; _key < _len; _key++) {
            lot[_key] = arguments[_key];
        }
        var out = lot.shift();
        for (var i = 0, j = toCount(lot); i < j; ++i) {
            for (var k in lot[i]) {
                // Assign value
                if (!isSet$1(out[k])) {
                    out[k] = lot[i][k];
                    continue;
                }
                // Merge array
                if (isArray(out[k]) && isArray(lot[i][k])) {
                    out[k] = [ /* Clone! */ ].concat(out[k]);
                    for (var ii = 0, jj = toCount(lot[i][k]); ii < jj; ++ii) {
                        if (!hasValue(lot[i][k][ii], out[k])) {
                            out[k].push(lot[i][k][ii]);
                        }
                    }
                    // Merge object recursive
                } else if (isObject(out[k]) && isObject(lot[i][k])) {
                    out[k] = fromStates({
                        /* Clone! */ }, out[k], lot[i][k]);
                    // Replace value
                } else {
                    out[k] = lot[i][k];
                }
            }
        }
        return out;
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
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
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
    var isPattern = function isPattern(pattern) {
        return isInstance(pattern, RegExp);
    };
    var toPattern = function toPattern(pattern, opt) {
        if (isPattern(pattern)) {
            return pattern;
        }
        return new RegExp(pattern, isSet(opt) ? opt : 'g');
    };
    var ALT_PREFIX = 'Alt-';
    var CTRL_PREFIX = 'Control-';
    var SHIFT_PREFIX = 'Shift-';
    var bounce = debounce(function ($) {
        return $.record();
    }, 10);

    function onKeyDown(e) {
        var _$$state$source, _$$state$source2;
        var $ = this,
            key = $.k(false).pop(),
            // Capture the last key
            keys = $.k();
        bounce($);
        if (e.defaultPrevented || $.keys[keys]) {
            return;
        }
        var charAfter,
            charBefore,
            charIndent = ((_$$state$source = $.state.source) == null ? void 0 : _$$state$source.tab) || $.state.tab || '\t',
            charPairs = ((_$$state$source2 = $.state.source) == null ? void 0 : _$$state$source2.pairs) || {},
            charPairsValues = toObjectValues(charPairs);
        if (isInteger(charIndent)) {
            charIndent = ' '.repeat(charIndent);
        }
        var _$$$ = $.$(),
            after = _$$$.after,
            before = _$$$.before,
            end = _$$$.end,
            start = _$$$.start,
            value = _$$$.value,
            lineAfter = after.split('\n').shift(),
            lineBefore = before.split('\n').pop(),
            lineMatch = /^(\s+)/.exec(lineBefore),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        if (CTRL_PREFIX + SHIFT_PREFIX + 'Enter' === keys) {
            if (before || after) {
                // Insert line above with `⎈⇧↵`
                offEventDefault(e);
                return $.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').insert(value).record(), false;
            }
            return;
        }
        if (CTRL_PREFIX + 'Enter' === keys) {
            if (before || after) {
                // Insert line below with `⎈↵`
                offEventDefault(e);
                return $.select(end + toCount(lineAfter)).wrap('\n' + lineMatchIndent, "").insert(value).record(), false;
            }
        }
        // Do nothing
        if (ALT_PREFIX === keys + '-' || CTRL_PREFIX === keys + '-') {
            offEventDefault(e);
            return;
        }
        if (' ' === keys) {
            charAfter = charPairs[charBefore = before.slice(-1)];
            if (!value && charAfter && charBefore && charAfter === after[0]) {
                offEventDefault(e);
                return $.wrap(' ', ' ');
            }
            return;
        }
        if ('Backspace' === keys || 'Delete' === keys) {
            charAfter = charPairs[charBefore = before.slice(-1)];
            // Do nothing on escape
            if ('\\' === charBefore) {
                return;
            }
            if (value) {
                if (after && before && charAfter && charAfter === after[0] && !before.endsWith('\\' + charBefore)) {
                    offEventDefault(e);
                    return $.record().peel(charBefore, charAfter).record();
                }
                return;
            }
            charAfter = charPairs[charBefore = before.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') || after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
                    // Collapse bracket(s)
                    offEventDefault(e);
                    return $.trim("", "").record();
                }
            }
            // Outdent
            if ('Delete' !== keys && lineBefore.endsWith(charIndent)) {
                offEventDefault(e);
                return $.pull(charIndent).record();
            }
            if (after && before && !before.endsWith('\\' + charBefore)) {
                if (charAfter === after[0] && charBefore === before.slice(-1)) {
                    // Peel pair
                    offEventDefault(e);
                    return $.peel(charBefore, charAfter).record();
                }
            }
            return;
        }
        if ('Enter' === keys || SHIFT_PREFIX + 'Enter' === keys) {
            if (!value) {
                if (after && before && (charAfter = charPairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
                    offEventDefault(e);
                    return $.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                }
                if (lineMatchIndent) {
                    offEventDefault(e);
                    return $.insert('\n' + lineMatchIndent, -1).record();
                }
            }
            return;
        }
        // Do nothing on escape
        if ('\\' === (charBefore = before.slice(-1))) {
            return;
        }
        charAfter = hasValue(after[0], charPairsValues) ? after[0] : charPairs[charBefore];
        // `|}`
        if (!value && after && before && charAfter && key === charAfter) {
            // Move to the next character
            // `}|`
            offEventDefault(e);
            return $.select(start + 1).record();
        }
        for (charBefore in charPairs) {
            charAfter = charPairs[charBefore];
            // `{|`
            if (key === charBefore && charAfter) {
                // Wrap pair or selection
                // `{|}` `{|aaa|}`
                offEventDefault(e);
                return $.wrap(charBefore, charAfter).record();
            }
            // `|}`
            if (key === charAfter) {
                if (value) {
                    // Wrap selection
                    // `{|aaa|}`
                    offEventDefault(e);
                    return $.record().wrap(charBefore, charAfter).record();
                }
                break;
            }
        }
        var charPair,
            charPairValue,
            m,
            tokens = [];
        if (value) {
            for (charPair in charPairs) {
                if (!(charPairValue = charPairs[charPair])) {
                    continue;
                }
                tokens.push('(?:\\' + charPair + '(?:\\\\.|[^\\' + charPair + (charPairValue !== charPair ? '\\' + charPairValue : "") + '])*\\' + charPairValue + ')');
            }
            tokens.push('\\w+'); // Word(s)
            tokens.push('\\s+'); // White-space(s)
            tokens.push('[\\s\\S]'); // Last try!
            if (CTRL_PREFIX + 'ArrowLeft' === keys) {
                offEventDefault(e);
                if (m = toPattern('(' + tokens.join('|') + ')$', "").exec(before)) {
                    return $.insert("").select(start - toCount(m[0])).insert(value).record();
                }
                return $.select();
            }
            if (CTRL_PREFIX + 'ArrowRight' === keys) {
                offEventDefault(e);
                if (m = after.match(toPattern('^(' + tokens.join('|') + ')', ""))) {
                    return $.insert("").select(end + toCount(m[0]) - toCount(value)).insert(value).record();
                }
                return $.select();
            }
        }
        // Force to select the current line if there is no selection
        end += toCount(lineAfter);
        start -= toCount(lineBefore);
        value = lineBefore + value + lineAfter;
        if (CTRL_PREFIX + 'ArrowUp' === keys) {
            offEventDefault(e);
            if (!hasValue('\n', before)) {
                return $.select();
            }
            $.insert("");
            $.replace(/^([^\n]*?)(\n|$)/, '$2', 1);
            $.replace(/(^|\n)([^\n]*?)$/, "", -1);
            var s = $.$();
            before = s.before;
            start = s.start;
            lineBefore = before.split('\n').pop();
            $.select(start = start - toCount(lineBefore)).wrap(value, '\n');
            $.select(start, start + toCount(value));
            return $.record();
        }
        if (CTRL_PREFIX + 'ArrowDown' === keys) {
            offEventDefault(e);
            if (!hasValue('\n', after)) {
                return $.select();
            }
            $.insert("");
            $.replace(/^([^\n]*?)(\n|$)/, "", 1);
            $.replace(/(^|\n)([^\n]*?)$/, '$1', -1);
            var _s = $.$();
            after = _s.after;
            end = _s.end;
            lineAfter = after.split('\n').shift();
            $.select(end = end + toCount(lineAfter)).wrap('\n', value);
            end += 1;
            $.select(end, end + toCount(value));
            return $.record();
        }
        return;
    }

    function attach() {
        var $ = this;
        $.state = fromStates({
            source: {
                pairs: {
                    '`': '`',
                    '(': ')',
                    '{': '}',
                    '[': ']',
                    '"': '"',
                    "'": "'",
                    '<': '>'
                }
            }
        }, $.state);
        $.alert = function (hint, then) {
            W.alert && W.alert(hint);
            return isFunction(then) && then.call($, true);
        };
        $.confirm = function (hint, then) {
            return isFunction(then) && then.call($, W.confirm && W.confirm(hint));
        };
        $.insertBlock = function (value, mode) {
            var _$$$2 = $.$(),
                after = _$$$2.after,
                before = _$$$2.before,
                end = _$$$2.end,
                start = _$$$2.start,
                afterCount = toCount(after.split('\n').shift()),
                beforeCount = toCount(before.split('\n').pop());
            if (-1 === mode) {
                return $.select(start - beforeCount).insert('\n', 1).insert(value, mode, false);
            }
            if (1 === mode) {
                return $.select(end + afterCount).insert('\n', -1).insert(value, mode, false);
            }
            return $.select(start - beforeCount, end + afterCount).insert(value, mode, true);
        };
        $.peelBlock = function (open, close, wrap) {
            var _$$$3 = $.$(),
                after = _$$$3.after,
                before = _$$$3.before,
                end = _$$$3.end,
                start = _$$$3.start;
            return $.select(start - toCount(before.split('\n').pop()) + (wrap ? 0 : toCount(open)), end + toCount(after.split('\n').shift()) - (wrap ? 0 : toCount(close || open))).peel(open, close, wrap);
        };
        $.prompt = function (hint, value, then) {
            return isFunction(then) && then.call($, W.prompt ? W.prompt(hint, value) : false);
        };
        $.toggle = function (open, close, wrap) {
            var _$$$4 = $.$(),
                after = _$$$4.after,
                before = _$$$4.before,
                value = _$$$4.value,
                closeCount = toCount(close),
                openCount = toCount(open);
            if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
                return $.peel(open, close, wrap);
            }
            return $.wrap(open, close, wrap);
        };
        $.toggleBlock = function (open, close, wrap) {};
        $.wrapBlock = function (open, close, wrap) {
            var _$$$5 = $.$(),
                after = _$$$5.after,
                before = _$$$5.before,
                end = _$$$5.end,
                start = _$$$5.start;
            return $.select(start - toCount(before.split('\n').pop()), end + toCount(after.split('\n').shift())).wrap(open, close, wrap);
        };
        return $.on('key.down', onKeyDown).record();
    }

    function detach() {
        return this.off('key.down', onKeyDown);
    }
    var index_js = {
        attach: attach,
        detach: detach
    };
    return index_js;
}));
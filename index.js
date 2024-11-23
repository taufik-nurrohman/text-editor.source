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
    var isDefined = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isFunction = function isFunction(x) {
        return 'function' === typeof x;
    };
    var isInstance = function isInstance(x, of, exact) {
        if (!x || 'object' !== typeof x) {
            return false;
        }
        if (exact) {
            return isSet(of) && isSet(x.constructor) && of === x.constructor;
        }
        return isSet(of) && x instanceof of ;
    };
    var isInteger = function isInteger(x) {
        return isNumber(x) && 0 === x % 1;
    };
    var isNull = function isNull(x) {
        return null === x;
    };
    var isNumber = function isNumber(x) {
        return 'number' === typeof x;
    };
    var isObject = function isObject(x, isPlain) {
        if (isPlain === void 0) {
            isPlain = true;
        }
        if (!x || 'object' !== typeof x) {
            return false;
        }
        return isPlain ? isInstance(x, Object, 1) : true;
    };
    var isSet = function isSet(x) {
        return isDefined(x) && !isNull(x);
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
                if (!isSet(out[k])) {
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
    var KEY_ARROW_DOWN = 'ArrowDown';
    var KEY_ARROW_LEFT = 'ArrowLeft';
    var KEY_ARROW_RIGHT = 'ArrowRight';
    var KEY_ARROW_UP = 'ArrowUp';
    var KEY_DELETE_LEFT = 'Backspace';
    var KEY_DELETE_RIGHT = 'Delete';
    var KEY_ENTER = 'Enter';
    var bounce = debounce(function ($) {
        return $.record();
    }, 10);
    var name = 'TextEditor.Source';

    function onKeyDown(e) {
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
            charIndent = $.state.tab || '\t',
            charPairs = $.state.pairs || {},
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
            lineMatch = /^\s+/.exec(lineBefore),
            lineMatchIndent = lineMatch && lineMatch[0] || "";
        if (CTRL_PREFIX + SHIFT_PREFIX + KEY_ENTER === keys) {
            if (before || after) {
                // Insert line above with `⎈⇧↵`
                offEventDefault(e);
                return $.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').insert(value).record(), false;
            }
            return;
        }
        if (CTRL_PREFIX + KEY_ENTER === keys) {
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
        if (KEY_DELETE_LEFT === keys || KEY_DELETE_RIGHT === keys) {
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
            if (KEY_DELETE_RIGHT !== keys && lineBefore.endsWith(charIndent)) {
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
        if (KEY_ENTER === keys || SHIFT_PREFIX + KEY_ENTER === keys) {
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
            if (CTRL_PREFIX + KEY_ARROW_LEFT === keys) {
                offEventDefault(e);
                if (m = toPattern('(' + tokens.join('|') + ')$', "").exec(before)) {
                    return $.insert("").select(start - toCount(m[0])).insert(value).record();
                }
                return $.select();
            }
            if (CTRL_PREFIX + KEY_ARROW_RIGHT === keys) {
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
        if (CTRL_PREFIX + KEY_ARROW_UP === keys) {
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
        if (CTRL_PREFIX + KEY_ARROW_DOWN === keys) {
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
        var $$ = $.constructor._;
        $.state = fromStates({
            pairs: {
                '`': '`',
                '(': ')',
                '{': '}',
                '[': ']',
                '"': '"',
                "'": "'",
                '<': '>'
            }
        }, $.state);
        !isFunction($$.alert) && ($$.alert = function (hint, then) {
            W.alert && W.alert(hint);
            return isFunction(then) && then.call(this, true);
        });
        !isFunction($$.confirm) && ($$.confirm = function (hint, then) {
            return isFunction(then) && then.call(this, W.confirm && W.confirm(hint));
        });
        !isFunction($$.insertLine) && ($$.insertLine = function (value, mode) {
            var $ = this,
                _$$$2 = $.$(),
                after = _$$$2.after,
                before = _$$$2.before,
                end = _$$$2.end,
                start = _$$$2.start,
                lineAfter = after.split('\n').shift(),
                lineAfterCount = toCount(lineAfter),
                lineBefore = before.split('\n').pop(),
                lineBeforeCount = toCount(lineBefore),
                lineMatch = /^\s+/.exec(lineBefore),
                lineMatchIndent = lineMatch && lineMatch[0] || "";
            if (-1 === mode) {
                return $.select(start - lineBeforeCount).insert('\n', 1).push(lineMatchIndent).insert(value, 1, false);
            }
            if (1 === mode) {
                return $.select(end + lineAfterCount).insert('\n', -1).push(lineMatchIndent).insert(value, 1, false);
            }
            return $.select(start - lineBeforeCount, end + lineAfterCount).insert(value, mode, true).wrap(lineMatchIndent, "");
        });
        !isFunction($$.peelLine) && ($$.peelLine = function (open, close, wrap, withSpaces) {
            if (withSpaces === void 0) {
                withSpaces = false;
            }
            return this.selectLine(withSpaces).peel(open, close, wrap);
        });
        !isFunction($$.prompt) && ($$.prompt = function (hint, value, then) {
            return isFunction(then) && then.call(this, W.prompt ? W.prompt(hint, value) : false);
        });
        !isFunction($$.selectLine) && ($$.selectLine = function (withSpaces) {
            if (withSpaces === void 0) {
                withSpaces = true;
            }
            var $ = this,
                m,
                _$$$3 = $.$(),
                after = _$$$3.after,
                before = _$$$3.before,
                end = _$$$3.end,
                start = _$$$3.start,
                lineAfter = after.split('\n').shift(),
                lineAfterCount = toCount(lineAfter),
                lineBefore = before.split('\n').pop(),
                lineBeforeCount = toCount(lineBefore);
            $.select(start - lineBeforeCount, end + lineAfterCount);
            if (!withSpaces) {
                var _$$$4 = $.$(),
                    _end = _$$$4.end,
                    _start = _$$$4.start,
                    value = _$$$4.value;
                if (m = /^(\s+)?[\s\S]*?(\s+)?$/.exec(value)) {
                    return $.select(_start + toCount(m[1] || ""), _end - toCount(m[2] || ""));
                }
            }
            return $;
        });
        !isFunction($$.toggle) && ($$.toggle = function (open, close, wrap) {
            var $ = this,
                _$$$5 = $.$(),
                after = _$$$5.after,
                before = _$$$5.before,
                value = _$$$5.value,
                closeCount = toCount(close),
                openCount = toCount(open);
            if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
                return $.peel(open, close, wrap);
            }
            return $.wrap(open, close, wrap);
        });
        !isFunction($$.toggleLine) && ($$.toggleLine = function (open, close, wrap, withSpaces) {
            if (withSpaces === void 0) {
                withSpaces = false;
            }
            var $ = this.selectLine(withSpaces),
                _$$$6 = $.$();
            _$$$6.after;
            _$$$6.before;
            var value = _$$$6.value,
                closeCount = toCount(close),
                openCount = toCount(open);
            if (!wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) {
                var _$$$7 = $.$(),
                    end = _$$$7.end,
                    start = _$$$7.start;
                $.select(start + openCount, end - closeCount);
            }
            return $.toggle(open, close, wrap);
        });
        !isFunction($$.wrapLine) && ($$.wrapLine = function (open, close, wrap, withSpaces) {
            if (withSpaces === void 0) {
                withSpaces = false;
            }
            return this.selectLine(withSpaces).wrap(open, close, wrap);
        });
        return $.on('key.down', onKeyDown).record();
    }

    function detach() {
        return this.off('key.down', onKeyDown);
    }
    var index_js = {
        attach: attach,
        detach: detach,
        name: name
    };
    return index_js;
}));
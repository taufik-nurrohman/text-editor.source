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
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    var isArray = function isArray(x) {
        return Array.isArray(x);
    };
    var isDefined$1 = function isDefined(x) {
        return 'undefined' !== typeof x;
    };
    var isInstance$1 = function isInstance(x, of) {
        return x && isSet$1(of) && x instanceof of ;
    };
    var isNull$1 = function isNull(x) {
        return null === x;
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
    var isString = function isString(x) {
        return 'string' === typeof x;
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
    var offEvent = function offEvent(name, node, then) {
        node.removeEventListener(name, then);
    };
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
    };
    var onEvent = function onEvent(name, node, then, options) {
        if (options === void 0) {
            options = false;
        }
        node.addEventListener(name, then, options);
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
    var id = 'TextEditor_' + Date.now();

    function onKeyDown(e) {
        var _editor$state$source, _editor$state$source2;
        var self = this,
            editor = self[id],
            key = editor.k(false).pop(),
            // Capture the last key
            keys = editor.k();
        if (!editor || e.defaultPrevented) {
            return;
        }
        bounce(editor);
        if (editor.keys[keys]) {
            return;
        }
        var charAfter,
            charBefore,
            charIndent = ((_editor$state$source = editor.state.source) == null ? void 0 : _editor$state$source.tab) || editor.state.tab || '\t',
            charPairs = ((_editor$state$source2 = editor.state.source) == null ? void 0 : _editor$state$source2.pairs) || {},
            charPairsValues = toObjectValues(charPairs);
        var _editor$$ = editor.$(),
            after = _editor$$.after,
            before = _editor$$.before,
            end = _editor$$.end,
            start = _editor$$.start,
            value = _editor$$.value,
            lineAfter = after.split('\n').shift(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        if (CTRL_PREFIX + SHIFT_PREFIX + 'Enter' === keys) {
            if (before || after) {
                // Insert line above with `⎈⇧↵`
                offEventDefault(e);
                return editor.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').insert(value).record(), false;
            }
            return;
        }
        if (CTRL_PREFIX + 'Enter' === keys) {
            if (before || after) {
                // Insert line below with `⎈↵`
                offEventDefault(e);
                return editor.select(end + toCount(lineAfter)).wrap('\n' + lineMatchIndent, "").insert(value).record(), false;
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
                return editor.wrap(' ', ' ');
            }
            return;
        }
        if ('Backspace' === keys) {
            charAfter = charPairs[charBefore = before.slice(-1)];
            // Do nothing on escape
            if ('\\' === charBefore) {
                return;
            }
            if (value) {
                if (after && before && charAfter && charAfter === after[0] && !before.endsWith('\\' + charBefore)) {
                    offEventDefault(e);
                    return editor.record().peel(charBefore, charAfter).record();
                }
                return;
            }
            charAfter = charPairs[charBefore = before.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') || after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
                    // Collapse bracket(s)
                    offEventDefault(e);
                    return editor.trim("", "").record();
                }
            }
            // Outdent
            if (lineBefore.endsWith(charIndent)) {
                offEventDefault(e);
                return editor.pull(charIndent).record();
            }
            if (after && before && !before.endsWith('\\' + charBefore)) {
                if (charAfter === after[0] && charBefore === before.slice(-1)) {
                    // Peel pair
                    offEventDefault(e);
                    return editor.peel(charBefore, charAfter).record();
                }
            }
            return;
        }
        if ('Enter' === keys || SHIFT_PREFIX + 'Enter' === keys) {
            if (!value) {
                if (after && before && (charAfter = charPairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
                    offEventDefault(e);
                    return editor.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                }
                if (lineMatchIndent) {
                    offEventDefault(e);
                    return editor.insert('\n' + lineMatchIndent, -1).record();
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
            return editor.select(start + 1).record();
        }
        for (charBefore in charPairs) {
            charAfter = charPairs[charBefore];
            // `{|`
            if (key === charBefore && charAfter) {
                // Wrap pair or selection
                // `{|}` `{|aaa|}`
                offEventDefault(e);
                return editor.wrap(charBefore, charAfter).record();
            }
            // `|}`
            if (key === charAfter) {
                if (value) {
                    // Wrap selection
                    // `{|aaa|}`
                    offEventDefault(e);
                    return editor.record().wrap(charBefore, charAfter).record();
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
                if (m = before.match(toPattern('(' + tokens.join('|') + ')$', ""))) {
                    return editor.insert("").select(start - toCount(m[0])).insert(value).record();
                }
                return editor.select();
            }
            if (CTRL_PREFIX + 'ArrowRight' === keys) {
                offEventDefault(e);
                if (m = after.match(toPattern('^(' + tokens.join('|') + ')', ""))) {
                    return editor.insert("").select(end + toCount(m[0]) - toCount(value)).insert(value).record();
                }
                return editor.select();
            }
        }
        // Force to select the current line if there is no selection
        end += toCount(lineAfter);
        start -= toCount(lineBefore);
        value = lineBefore + value + lineAfter;
        if (CTRL_PREFIX + 'ArrowUp' === keys) {
            offEventDefault(e);
            if (!hasValue('\n', before)) {
                return editor.select();
            }
            editor.insert("");
            editor.replace(/^([^\n]*?)(\n|$)/, '$2', 1);
            editor.replace(/(^|\n)([^\n]*?)$/, "", -1);
            var $ = editor.$();
            before = $.before;
            start = $.start;
            lineBefore = before.split('\n').pop();
            editor.select(start = start - toCount(lineBefore)).wrap(value, '\n');
            editor.select(start, start + toCount(value));
            return editor.record();
        }
        if (CTRL_PREFIX + 'ArrowDown' === keys) {
            offEventDefault(e);
            if (!hasValue('\n', after)) {
                return editor.select();
            }
            editor.insert("");
            editor.replace(/^([^\n]*?)(\n|$)/, "", 1);
            editor.replace(/(^|\n)([^\n]*?)$/, '$1', -1);
            var _$ = editor.$();
            after = _$.after;
            end = _$.end;
            lineAfter = after.split('\n').shift();
            editor.select(end = end + toCount(lineAfter)).wrap('\n', value);
            end += 1;
            editor.select(end, end + toCount(value));
            return editor.record();
        }
        return;
    }

    function attach(self) {
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
                },
                type: null
            }
        }, $.state);
        $.toggle = function (open, close, wrap, tidy) {
            if (tidy === void 0) {
                tidy = false;
            }
            if (!close && "" !== close) {
                close = open;
            }
            var _$$$ = $.$(),
                after = _$$$.after,
                before = _$$$.before,
                value = _$$$.value,
                closeCount = toCount(close),
                openCount = toCount(open);
            if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
                return $.peel(open, close, wrap);
            }
            if (false !== tidy) {
                if (isString(tidy)) {
                    tidy = [tidy, tidy];
                } else if (!isArray(tidy)) {
                    tidy = ["", ""];
                }
                if (!isSet$1(tidy[1])) {
                    tidy[1] = tidy[0];
                }
                $.trim(tidy[0], tidy[1]);
            }
            return $.wrap(open, close, wrap);
        };
        onEvent('keydown', self, onKeyDown);
        self[id] = $;
        return $.record();
    }

    function detach(self) {
        var $ = this;
        delete self[id];
        offEvent('keydown', self, onKeyDown);
        return $;
    }
    var index_js = {
        attach: attach,
        detach: detach
    };
    return index_js;
}));
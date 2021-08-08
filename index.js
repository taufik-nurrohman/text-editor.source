/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2021 Taufik Nurrohman <https://github.com/taufik-nurrohman>
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
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.TE = global.TE || {}, global.TE.Source = {})));
})(this, function(exports) {
    'use strict';
    var debounce = function debounce(then, time) {
        var timer;
        return function() {
            var _arguments = arguments,
                _this = this;
            timer && clearTimeout(timer);
            timer = setTimeout(function() {
                return then.apply(_this, _arguments);
            }, time);
        };
    };
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectValues = function toObjectValues(x) {
        return Object.values(x);
    };
    var hasValue = function hasValue(x, data) {
        return -1 !== data.indexOf(x);
    };
    const pairs = {
        '`': '`',
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '<': '>'
    };
    const defaults = {
        source: {
            pairs
        }
    };
    const pairsValue = toObjectValues(pairs);
    const that = {};
    that.toggle = function(open, close, wrap) {
        if (!close && "" !== close) {
            close = open;
        }
        let t = this,
            {
                after,
                before,
                value
            } = t.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
            return t.peel(open, close, wrap);
        }
        return t.wrap(open, close, wrap);
    };

    function canKeyDown(key, {
        a,
        c,
        s
    }, that) {
        let charAfter,
            charBefore,
            charIndent = defaults.tab || that.state.tab || '\t',
            charPairs = that.state.source?.pairs || pairs; // Do nothing
        if (a || c) {
            return true;
        }
        if (' ' === key && !s) {
            let {
                after,
                before,
                value
            } = that.$();
            charAfter = charPairs[charBefore = before.slice(-1)];
            if (!value && charAfter && charBefore && charAfter === after[0]) {
                that.wrap(' ', ' ');
                return false;
            }
            return true;
        }
        if ('Enter' === key && !s) {
            let {
                after,
                before,
                value
            } = that.$(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            if (!value) {
                if (after && before && (charAfter = charPairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
                    that.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                    return false;
                }
                if (lineMatchIndent) {
                    that.insert('\n' + lineMatchIndent, -1).record();
                    return false;
                }
            }
            return true;
        }
        if ('Backspace' === key && !s) {
            let {
                after,
                before,
                value
            } = that.$();
            after.split('\n')[0];
            let lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            charAfter = charPairs[charBefore = before.slice(-1)]; // Do nothing on escape
            if ('\\' === charBefore) {
                return true;
            }
            if (value) {
                if (after && before && charAfter && charAfter === after[0] && !before.endsWith('\\' + charBefore)) {
                    that.record().peel(charBefore, charAfter).record();
                    return false;
                }
                return true;
            }
            charAfter = charPairs[charBefore = before.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') || after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
                    // Collapse bracket(s)
                    that.trim("", "").record();
                    return false;
                }
            } // Outdent
            if (lineBefore.endsWith(charIndent)) {
                that.pull(charIndent).record();
                return false;
            }
            if (after && before && !before.endsWith('\\' + charBefore)) {
                if (charAfter === after[0] && charBefore === before.slice(-1)) {
                    // Peel pair
                    that.peel(charBefore, charAfter).record();
                    return false;
                }
            }
            return true;
        }
        let {
            after,
            before,
            start,
            value
        } = that.$(); // Do nothing on escape
        if ('\\' === (charBefore = before.slice(-1))) {
            return true;
        }
        charAfter = pairsValue.includes(after[0]) ? after[0] : charPairs[charBefore]; // `|}`
        if (!value && after && before && charAfter && key === charAfter) {
            // Move to the next character
            // `}|`
            that.select(start + 1).record();
            return false;
        }
        for (charBefore in charPairs) {
            charAfter = charPairs[charBefore]; // `{|`
            if (charBefore === key) {
                // Wrap pair or selection
                // `{|}` `{|aaa|}`
                that.wrap(charBefore, charAfter).record();
                return false;
            } // `|}`
            if (charAfter === key) {
                if (value) {
                    // Wrap selection
                    // `{|aaa|}`
                    that.record().wrap(charBefore, charAfter).record();
                    return false;
                }
                break;
            }
        }
        return true;
    }

    function canKeyDownDent(key, {
        a,
        c,
        s
    }, that) {
        let charIndent = that.state.tab || '\t';
        if (!a && c) {
            // Indent with `⌘+]`
            if (']' === key) {
                that.push(charIndent).record();
                return false;
            } // Outdent with `⌘+[`
            if ('[' === key) {
                that.pull(charIndent).record();
                return false;
            }
        }
        return true;
    }

    function canKeyDownEnter(key, {
        a,
        c,
        s
    }, that) {
        if (c && 'Enter' === key) {
            let {
                after,
                before,
                end,
                start,
                value
            } = that.$(),
                lineAfter = after.split('\n').shift(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            if (before || after) {
                if (s) {
                    // Insert line over with `⌘+⇧+↵`
                    return that.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').record(), false;
                } // Insert line below with `⌘+↵`
                return that.select(end + toCount(lineAfter)).insert('\n' + lineMatchIndent, -1).record(), false;
            }
        }
        return true;
    }

    function canKeyDownHistory(key, {
        a,
        c,
        s
    }, that) {
        if (!a && c) {
            // Redo with `⌘+y`
            if ('y' === key) {
                that.redo();
                return false;
            } // Undo with `⌘+z`
            if ('z' === key) {
                that.undo();
                return false;
            }
        }
        return true;
    }

    function canKeyDownMove(key, {
        a,
        c,
        s
    }, that) {
        if (c) {
            let {
                after,
                before,
                end,
                start,
                value
            } = that.$(),
                lineAfter = after.split('\n').shift(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/);
            lineMatch && lineMatch[1] || ""; // Force to select the current line if there is no selection
            end += toCount(lineAfter);
            start -= toCount(lineBefore);
            value = lineBefore + value + lineAfter;
            if ('ArrowUp' === key) {
                if (!hasValue('\n', before)) {
                    return that.select(), false;
                }
                that.insert("");
                that.replace(/^([^\n]*?)(\n|$)/, '$2', 1);
                that.replace(/(^|\n)([^\n]*?)$/, "", -1);
                let $ = that.$();
                before = $.before;
                start = $.start;
                lineBefore = before.split('\n').pop();
                that.select(start = start - toCount(lineBefore)).wrap(value, '\n');
                that.select(start, start + toCount(value));
                return that.record(), false;
            }
            if ('ArrowDown' === key) {
                if (!hasValue('\n', after)) {
                    return that.select(), false;
                }
                that.insert("");
                that.replace(/^([^\n]*?)(\n|$)/, "", 1);
                that.replace(/(^|\n)([^\n]*?)$/, '$1', -1);
                let $ = that.$();
                after = $.after;
                end = $.end;
                lineAfter = after.split('\n').shift();
                that.select(end = end + toCount(lineAfter)).wrap('\n', value);
                end += 1;
                that.select(end, end + toCount(value));
                return that.record(), false;
            }
        }
        return true;
    }

    function canKeyDownTab(key, {
        a,
        c,
        s
    }, that) {
        let charIndent = that.state.tab || '\t'; // Indent/outdent with `⇥` or `⇧+⇥`
        if ('Tab' === key && !a && !c) {
            that[s ? 'pull' : 'push'](charIndent).record();
            return false;
        }
        return true;
    }
    let bounce = debounce(that => that.record(), 100);

    function canKeyUp(key, {
        a,
        c,
        s
    }, that) {
        return bounce(that), true;
    }
    const state = defaults;
    exports.canKeyDown = canKeyDown;
    exports.canKeyDownDent = canKeyDownDent;
    exports.canKeyDownEnter = canKeyDownEnter;
    exports.canKeyDownHistory = canKeyDownHistory;
    exports.canKeyDownMove = canKeyDownMove;
    exports.canKeyDownTab = canKeyDownTab;
    exports.canKeyUp = canKeyUp;
    exports.state = state;
    exports.that = that;
});
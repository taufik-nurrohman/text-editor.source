/*!
 *
 * The MIT License (MIT)
 *
 * Copyright © 2021 Taufik Nurrohman
 *
 * <https://github.com/taufik-nurrohman/text-editor.source>
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
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.TE = global.TE || {}, global.TE.Source = factory()));
})(this, function() {
    'use strict';
    var toCount = function toCount(x) {
        return x.length;
    };
    var toObjectValues = function toObjectValues(x) {
        return Object.values(x);
    };
    let pairs = {
        '`': '`',
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '<': '>'
    };
    let pairsValue = toObjectValues(pairs);
    let that = {};
    that.toggle = function(open, close, wrap) {
        if (!close && "" !== close) {
            close = open;
        }
        let {
            after,
            before,
            value
        } = this.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount) || close === after.slice(0, closeCount) && open === before.slice(-openCount)) {
            return this.peel(open, close, wrap);
        }
        return this.wrap(open, close, wrap);
    };

    function canKeyDown(key, {
        a,
        c,
        s
    }, that) {
        let charAfter,
            charBefore,
            charIndent = that.state.tab || '\t'; // Do nothing
        if (a || c) {
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
                if (after && before && (charAfter = pairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
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
            charAfter = pairs[charBefore = before.slice(-1)]; // Do nothing on escape
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
            charAfter = pairs[charBefore = before.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
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
        charAfter = pairsValue.includes(after[0]) ? after[0] : pairs[charBefore]; // `|}`
        if (!value && after && before && charAfter && key === charAfter) {
            // Move to the next character
            // `}|`
            that.select(start + 1).record();
            return false;
        }
        for (charBefore in pairs) {
            charAfter = pairs[charBefore]; // `{|`
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
    let throttle;

    function canKeyUp(key, {
        a,
        c,
        s
    }, that) {
        throttle && clearTimeout(throttle);
        throttle = setTimeout(() => that.record(), 100);
        return true;
    }
    var _virtual_entry = {
        canKeyDown,
        canKeyDownDent,
        canKeyDownHistory,
        canKeyDownTab,
        canKeyUp,
        that
    };
    return _virtual_entry;
});
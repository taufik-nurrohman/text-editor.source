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
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.TE = global.TE || {}, global.TE.Source = {})));
})(this, function(exports) {
    'use strict';
    var offEventDefault = function offEventDefault(e) {
        return e && e.preventDefault();
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

    function onKeyDown(e, $) {
        let charAfter,
            charBefore,
            charIndent = $.state.tab || '\t',
            key = e.key,
            keyIsAlt = e.altKey,
            keyIsCtrl = e.ctrlKey,
            keyIsShift = e.shiftKey; // Do nothing
        if (keyIsAlt || keyIsCtrl) {
            return;
        }
        if ('Enter' === key && !keyIsShift) {
            let {
                after,
                before,
                value
            } = $.$(),
                lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            if (!value) {
                if (after && before && (charAfter = pairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
                    $.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                    offEventDefault(e);
                    return;
                }
                if (lineMatchIndent) {
                    $.insert('\n' + lineMatchIndent, -1).record();
                    offEventDefault(e);
                    return;
                }
            }
        }
        if ('Backspace' === key && !keyIsShift) {
            let {
                after,
                before,
                value
            } = $.$();
            after.split('\n')[0];
            let lineBefore = before.split('\n').pop(),
                lineMatch = lineBefore.match(/^(\s+)/),
                lineMatchIndent = lineMatch && lineMatch[1] || "";
            charAfter = pairs[charBefore = before.slice(-1)]; // Do nothing on escape
            if ('\\' === charBefore) {
                return;
            }
            if (value) {
                if (after && before && charAfter && charAfter === after[0] && !before.endsWith('\\' + charBefore)) {
                    $.record().peel(charBefore, charAfter).record();
                    offEventDefault(e);
                    return;
                }
            }
            charAfter = pairs[charBefore = before.trim().slice(-1)];
            if (charAfter && charBefore) {
                if (after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
                    // Collapse bracket(s)
                    $.trim("", "").record();
                    offEventDefault(e);
                    return;
                }
            } // Outdent
            if (lineBefore.endsWith(charIndent)) {
                $.pull(charIndent).record();
                offEventDefault(e);
                return;
            }
            if (after && before && !before.endsWith('\\' + charBefore)) {
                if (charAfter === after[0]) {
                    // Peel pair
                    $.peel(charBefore, charAfter).record();
                    offEventDefault(e);
                    return;
                }
            }
        }
        let {
            after,
            before,
            start,
            value
        } = $.$();
        charAfter = pairs[charBefore = before.slice(-1)]; // Do nothing on escape
        if ('\\' === charBefore) {
            return;
        } // `|}`
        if (after && before && charAfter && key === charAfter && key === after[0]) {
            if (value) {
                // Wrap selection
                // `{|aaa|}`
                $.record().wrap(charBefore, charAfter).record();
                offEventDefault(e);
                return;
            } // Move to the next character
            // `}|`
            $.select(start + 1).record();
            offEventDefault(e);
            return;
        }
        for (charBefore in pairs) {
            charAfter = pairs[charBefore]; // `{|`
            if (charBefore === key) {
                // Wrap pair or selection
                // `{|}` `{|aaa|}`
                $.wrap(charBefore, charAfter).record();
                offEventDefault(e);
                return;
            } // `|}`
            if (charAfter === key) {
                if (value) {
                    // Wrap selection
                    // `{|aaa|}`
                    $.record().wrap(charBefore, charAfter).record();
                    offEventDefault(e);
                    return;
                }
                return;
            }
        } // Do normal `Enter` key here
    }

    function onKeyDownDent(e, $) {
        let charIndent = $.state.tab || '\t',
            key = e.key,
            keyIsAlt = e.altKey,
            keyIsCtrl = e.ctrlKey;
        e.shiftKey;
        if (!keyIsAlt && keyIsCtrl) {
            // Indent with `⌘+]`
            if (']' === key) {
                $.push(charIndent).record();
                offEventDefault(e);
                return;
            } // Outdent with `⌘+[`
            if ('[' === key) {
                $.pull(charIndent).record();
                offEventDefault(e);
                return;
            }
        }
    }

    function onKeyDownHistory(e, $) {
        let key = e.key,
            keyIsAlt = e.altKey,
            keyIsCtrl = e.ctrlKey;
        if (!keyIsAlt && keyIsCtrl) {
            // Redo with `⌘+y`
            if ('y' === key) {
                $.redo();
                offEventDefault(e);
                return;
            } // Undo with `⌘+z`
            if ('z' === key) {
                $.undo();
                offEventDefault(e);
                return;
            }
        }
    }

    function onKeyDownTab(e, $) {
        let charIndent = $.state.tab || '\t',
            key = e.key,
            keyIsAlt = e.altKey,
            keyIsCtrl = e.ctrlKey,
            keyIsShift = e.shiftKey; // Indent/outdent with `⇥` or `⇧+⇥`
        if ('Tab' === key && !keyIsAlt && !keyIsCtrl) {
            $[keyIsShift ? 'pull' : 'push'](charIndent).record();
            offEventDefault(e);
            return;
        }
    }
    let throttle;

    function onKeyUp(e, $) {
        throttle && clearTimeout(throttle);
        throttle = setTimeout(() => $.record(), 100);
    }
    exports.onKeyDown = onKeyDown;
    exports.onKeyDownDent = onKeyDownDent;
    exports.onKeyDownHistory = onKeyDownHistory;
    exports.onKeyDownTab = onKeyDownTab;
    exports.onKeyUp = onKeyUp;
});
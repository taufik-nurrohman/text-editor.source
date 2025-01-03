import {W} from '@taufik-nurrohman/document';
import {debounce} from '@taufik-nurrohman/tick';
import {fromStates} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isFunction, isInteger, isSet, isString} from '@taufik-nurrohman/is';
import {offEventDefault} from '@taufik-nurrohman/event';
import {toCount, toObjectValues} from '@taufik-nurrohman/to';
import {toPattern} from '@taufik-nurrohman/pattern';

const ALT_PREFIX = 'Alt-';
const CTRL_PREFIX = 'Control-';
const SHIFT_PREFIX = 'Shift-';

const KEY_ARROW_DOWN = 'ArrowDown';
const KEY_ARROW_LEFT = 'ArrowLeft';
const KEY_ARROW_RIGHT = 'ArrowRight';
const KEY_ARROW_UP = 'ArrowUp';
const KEY_DELETE_LEFT = 'Backspace';
const KEY_DELETE_RIGHT = 'Delete';
const KEY_ENTER = 'Enter';

const bounce = debounce($ => $.record(), 10);
const name = 'TextEditor.Source';

function onKeyDown(e) {
    let $ = this,
        key = $.k(false).pop(), // Capture the last key
        keys = $.k();
    bounce($);
    if (e.defaultPrevented || $.keys[keys]) {
        return;
    }
    let charAfter,
        charBefore,
        charIndent = $.state.tab || '\t',
        charPairs = $.state.pairs || {},
        charPairsValues = toObjectValues(charPairs);
    if (isInteger(charIndent)) {
        charIndent = ' '.repeat(charIndent);
    }
    let {after, before, end, start, value} = $.$(),
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
            if (
                after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') ||
                after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)
            ) {
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
    let charPair,
        charPairValue, m,
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
        let s = $.$();
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
        let s = $.$();
        after = s.after;
        end = s.end;
        lineAfter = after.split('\n').shift();
        $.select(end = end + toCount(lineAfter)).wrap('\n', value);
        end += 1;
        $.select(end, end + toCount(value));
        return $.record();
    }
    return;
}

// Partial mobile support
function onPutDown(e) {
    onKeyDown.call(this, e);
}

function attach() {
    const $ = this;
    const $$ = $.constructor._;
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
        let $ = this,
            {after, before, end, start} = $.$(),
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
    !isFunction($$.peelLine) && ($$.peelLine = function (open, close, wrap, withSpaces = false) {
        return this.selectLine(withSpaces).peel(open, close, wrap);
    });
    !isFunction($$.prompt) && ($$.prompt = function (hint, value, then) {
        return isFunction(then) && then.call(this, W.prompt ? W.prompt(hint, value) : false);
    });
    !isFunction($$.selectLine) && ($$.selectLine = function (withSpaces = true) {
        let $ = this, m,
            {after, before, end, start} = $.$(),
            lineAfter = after.split('\n').shift(),
            lineAfterCount = toCount(lineAfter),
            lineBefore = before.split('\n').pop(),
            lineBeforeCount = toCount(lineBefore);
        $.select(start - lineBeforeCount, end + lineAfterCount);
        if (!withSpaces) {
            let {end, start, value} = $.$();
            if (m = /^(\s+)?[\s\S]*?(\s+)?$/.exec(value)) {
                return $.select(start + toCount(m[1] || ""), end - toCount(m[2] || ""));
            }
        }
        return $;
    });
    !isFunction($$.toggle) && ($$.toggle = function (open, close, wrap) {
        let $ = this,
            {after, before, value} = $.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (
            (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) ||
            (close === after.slice(0, closeCount) && open === before.slice(-openCount))
        ) {
            return $.peel(open, close, wrap);
        }
        return $.wrap(open, close, wrap);
    });
    !isFunction($$.toggleLine) && ($$.toggleLine = function (open, close, wrap, withSpaces = false) {
        let $ = this.selectLine(withSpaces),
            {after, before, value} = $.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (!wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) {
            let {end, start} = $.$();
            $.select(start + openCount, end - closeCount);
        }
        return $.toggle(open, close, wrap);
    });
    !isFunction($$.wrapLine) && ($$.wrapLine = function (open, close, wrap, withSpaces = false) {
        return this.selectLine(withSpaces).wrap(open, close, wrap);
    });
    return $.on('key.down', onKeyDown).on('put.down', onPutDown).record();
}

function detach() {
    return this.off('key.down', onKeyDown).off('put.down', onPutDown);
}

export default {attach, detach, name};
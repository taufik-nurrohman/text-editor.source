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

const bounce = debounce($ => $.record(), 10);

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
        charIndent = $.state.source?.tab || $.state.tab || '\t',
        charPairs = $.state.source?.pairs || {},
        charPairsValues = toObjectValues(charPairs);
    if (isInteger(charIndent)) {
        charIndent = ' '.repeat(charIndent);
    }
    let {after, before, end, start, value} = $.$(),
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
        let s = $.$();
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

function attach() {
    let $ = this;
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
    $.alert = (hint, then) => {
        W.alert && W.alert(hint);
        return isFunction(then) && then.call($, true);
    };
    $.confirm = (hint, then) => {
        return isFunction(then) && then.call($, W.confirm && W.confirm(hint));
    };
    $.prompt = (hint, value, then) => {
        return isFunction(then) && then.call($, W.prompt ? W.prompt(hint, value) : false);
    };
    $.toggle = (open, close, wrap) => {
        let {after, before, value} = $.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (
            (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) ||
            (close === after.slice(0, closeCount) && open === before.slice(-openCount))
        ) {
            return $.peel(open, close, wrap);
        }
        return $.wrap(open, close, wrap);
    };
    return $.on('key.down', onKeyDown).record();
}

function detach() {
    return this.off('key.down', onKeyDown);
}

export default {attach, detach};
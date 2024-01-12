import {debounce} from '@taufik-nurrohman/tick';
import {fromStates} from '@taufik-nurrohman/from';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isSet, isString} from '@taufik-nurrohman/is';
import {onEvent, offEvent, offEventDefault} from '@taufik-nurrohman/event';
import {toCount, toObjectValues} from '@taufik-nurrohman/to';
import {toPattern} from '@taufik-nurrohman/pattern';

const ALT_PREFIX = 'Alt-';
const CTRL_PREFIX = 'Control-';
const SHIFT_PREFIX = 'Shift-';

const bounce = debounce($ => $.record(), 10);
const id = 'TextEditor_' + Date.now();

function onKeyDown(e) {
    let self = this,
        editor = self[id],
        key = editor.k(false).pop(), // Capture the last key
        keys = editor.k();
    if (!editor || e.defaultPrevented) {
        return;
    }
    bounce(editor);
    if (editor.keys[keys]) {
        return;
    }
    let charAfter,
        charBefore,
        charIndent = editor.state.source?.tab || editor.state.tab || '\t',
        charPairs = editor.state.source?.pairs || {},
        charPairsValues = toObjectValues(charPairs);
    let {after, before, end, start, value} = editor.$(),
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
            if (
                after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') ||
                after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)
            ) {
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
        let $ = editor.$();
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
        let $ = editor.$();
        after = $.after;
        end = $.end;
        lineAfter = after.split('\n').shift();
        editor.select(end = end + toCount(lineAfter)).wrap('\n', value);
        end += 1;
        editor.select(end, end + toCount(value));
        return editor.record();
    }
    return;
}

function attach(self) {
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
            },
            type: null
        }
    }, $.state);
    $.toggle = function (open, close, wrap, tidy = false) {
        if (!close && "" !== close) {
            close = open;
        }
        let {after, before, value} = $.$(),
            closeCount = toCount(close),
            openCount = toCount(open);
        if (
            (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) ||
            (close === after.slice(0, closeCount) && open === before.slice(-openCount))
        ) {
            return $.peel(open, close, wrap);
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
            $.trim(tidy[0], tidy[1]);
        }
        return $.wrap(open, close, wrap);
    };
    onEvent('keydown', self, onKeyDown);
    self[id] = $;
    return $.record();
}

function detach(self) {
    let $ = this;
    delete self[id];
    offEvent('keydown', self, onKeyDown);
    return $;
}

export default {attach, detach};
import {W} from '@taufik-nurrohman/document';
import {debounce} from '@taufik-nurrohman/tick';
import {esc, escChar, toPattern} from '@taufik-nurrohman/pattern';
import {hasValue} from '@taufik-nurrohman/has';
import {isArray, isSet, isString} from '@taufik-nurrohman/is';
import {toCount, toObjectValues} from '@taufik-nurrohman/to';

const pairs = {
    '`': '`',
    '(': ')',
    '{': '}',
    '[': ']',
    '"': '"',
    "'": "'",
    '<': '>'
};

function promisify(type, lot) {
    return new Promise((resolve, reject) => {
        let r = W[type].apply(W, lot);
        return r ? resolve(r) : reject(r);
    });
}

const defaults = {
    source: {
        pairs,
        type: null
    }
};

['alert', 'confirm', 'prompt'].forEach(type => {
    defaults.source[type] = (...lot) => promisify(type, lot);
});

export const that = {};

that.toggle = function (open, close, wrap, tidy = false) {
    if (!close && "" !== close) {
        close = open;
    }
    let t = this,
        {after, before, value} = t.$(),
        closeCount = toCount(close),
        openCount = toCount(open);
    if (
        (wrap && close === value.slice(-closeCount) && open === value.slice(0, openCount)) ||
        (close === after.slice(0, closeCount) && open === before.slice(-openCount))
    ) {
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

const ALT_PREFIX = 'Alt-';
const CTRL_PREFIX = 'Control-';
const SHIFT_PREFIX = 'Shift-';

export function canKeyDown(map, that) {
    let charAfter,
        charBefore,
        charIndent = that.state.source.tab || that.state.tab || '\t',
        charPairs = that.state.source.pairs || {},
        charPairsValues = toObjectValues(charPairs),
        {key, queue} = map,
        keyValue = map + "";
    // Do nothing
    if (queue.Alt || queue.Control) {
        return true;
    }
    if (' ' === keyValue) {
        let {after, before, value} = that.$();
        charAfter = charPairs[charBefore = before.slice(-1)];
        if (!value && charAfter && charBefore && charAfter === after[0]) {
            that.wrap(' ', ' ');
            return false;
        }
        return true;
    }
    if ('Enter' === keyValue) {
        let {after, before, value} = that.$(),
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
    if ('Backspace' === keyValue) {
        let {after, before, value} = that.$(),
            lineAfter = after.split('\n')[0],
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        charAfter = charPairs[charBefore = before.slice(-1)];
        // Do nothing on escape
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
            if (
                after.startsWith(' ' + charAfter) && before.endsWith(charBefore + ' ') ||
                after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)
            ) {
                // Collapse bracket(s)
                that.trim("", "").record();
                return false;
            }
        }
        // Outdent
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
    let {after, before, start, value} = that.$();
    // Do nothing on escape
    if ('\\' === (charBefore = before.slice(-1))) {
        return true;
    }
    charAfter = hasValue(after[0], charPairsValues) ? after[0] : charPairs[charBefore];
    // `|}`
    if (!value && after && before && charAfter && key === charAfter) {
        // Move to the next character
        // `}|`
        that.select(start + 1).record();
        return false;
    }
    for (charBefore in charPairs) {
        charAfter = charPairs[charBefore];
        // `{|`
        if (key === charBefore && charAfter) {
            // Wrap pair or selection
            // `{|}` `{|aaa|}`
            that.wrap(charBefore, charAfter).record();
            return false;
        }
        // `|}`
        if (key === charAfter) {
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

export function canKeyDownDent(map, that) {
    let charIndent = that.state.source.tab || that.state.tab || '\t',
        {key, queue} = map,
        keyValue = map + "";
    // Indent with `⎈]`
    if (CTRL_PREFIX + ']' === keyValue) {
        that.push(charIndent).record();
        return false;
    }
    // Outdent with `⎈[`
    if (CTRL_PREFIX + '[' === keyValue) {
        that.pull(charIndent).record();
        return false;
    }
    return true;
}

export function canKeyDownEnter(map, that) {
    let {key, queue} = map;
    if (queue.Control && queue.Enter) {
        let {after, before, end, start, value} = that.$(),
            lineAfter = after.split('\n').shift(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        if (before || after) {
            if (queue.Shift) {
                // Insert line over with `⎈⇧↵`
                return that.select(start - toCount(lineBefore)).wrap(lineMatchIndent, '\n').insert(value).record(), false;
            }
            // Insert line below with `⎈↵`
            return that.select(end + toCount(lineAfter)).wrap('\n' + lineMatchIndent, "").insert(value).record(), false;
        }
    }
    return true;
}

export function canKeyDownHistory(map, that) {
    let keyValue = map + "";
    // Redo with `⎈y`
    if (CTRL_PREFIX + 'y' === keyValue) {
        return that.redo(), false;
    }
    // Undo with `⎈z`
    if (CTRL_PREFIX + 'z' === keyValue) {
        return that.undo(), false;
    }
    return true;
}

export function canKeyDownMove(map, that) {
    let {key, queue} = map,
        keyValue = map + "";
    if (!queue.Control) {
        return true;
    }
    let {after, before, end, start, value} = that.$(),
        charPair, charPairValue,
        charPairs = that.state.source.pairs || {},
        boundaries = [], m;
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
                that.insert("").select(start - toCount(m[0])).insert(value);
                return that.record(), false;
            }
            return that.select(), false;
        }
        if (CTRL_PREFIX + 'ArrowRight' === keyValue) {
            if (m = after.match(toPattern('^(' + boundaries.join('|') + ')', ""))) {
                that.insert("").select(end + toCount(m[0]) - toCount(value)).insert(value);
                return that.record(), false;
            }
            return that.select(), false;
        }
    }
    let lineAfter = after.split('\n').shift(),
        lineBefore = before.split('\n').pop(),
        lineMatch = lineBefore.match(/^(\s+)/),
        lineMatchIndent = lineMatch && lineMatch[1] || "";
    // Force to select the current line if there is no selection
    end += toCount(lineAfter);
    start -= toCount(lineBefore);
    value = lineBefore + value + lineAfter;
    if (CTRL_PREFIX + 'ArrowUp' === keyValue) {
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
    if (CTRL_PREFIX + 'ArrowDown' === keyValue) {
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
    return true;
}

export function canKeyDownTab(map, that) {
    let charIndent = that.state.source.tab || that.state.tab || '\t',
        keyValue = map + "";
    // Indent with `⇥`
    if ('Tab' === keyValue) {
        return that.push(charIndent).record(), false;
    }
    // Outdent with `⇧+⇥`
    if (SHIFT_PREFIX + 'Tab' === keyValue) {
        return that.pull(charIndent).record(), false;
    }
    return true;
}

let bounce = debounce(that => that.record(), 100);

export function canKeyUp(map, that) {
    return bounce(that), true;
}

export const state = defaults;
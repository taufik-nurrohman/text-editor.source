import {esc, escChar, toPattern} from '@taufik-nurrohman/pattern';
import {toCount, toObjectValues} from '@taufik-nurrohman/to';
import {debounce} from '@taufik-nurrohman/tick';

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
    source: {pairs}
};

const pairsValue = toObjectValues(pairs);

const that = {};

that.toggle = function(open, close, wrap) {
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
    return t.wrap(open, close, wrap);
};

function canKeyDown(key, {a, c, s}, that) {
    let charAfter,
        charBefore,
        charIndent = defaults.tab || that.state.tab || '\t',
        charPairs = that.state.source?.pairs || pairs;
    // Do nothing
    if (a || c) {
        return true;
    }
    if (' ' === key && !s) {
        let {after, before, value} = that.$();
        charAfter = charPairs[charBefore = before.slice(-1)];
        if (!value && charAfter && charBefore) {
            that.wrap(' ', ' ');
            return false;
        }
        return true;
    }
    if ('Enter' === key && !s) {
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
    if ('Backspace' === key && !s) {
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
    charAfter = pairsValue.includes(after[0]) ? after[0] : charPairs[charBefore];
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
        if (charBefore === key) {
            // Wrap pair or selection
            // `{|}` `{|aaa|}`
            that.wrap(charBefore, charAfter).record();
            return false;
        }
        // `|}`
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

function canKeyDownDent(key, {a, c, s}, that) {
    let charIndent = that.state.tab || '\t';
    if (!a && c) {
        // Indent with `⌘+]`
        if (']' === key) {
            that.push(charIndent).record();
            return false;
        }
        // Outdent with `⌘+[`
        if ('[' === key) {
            that.pull(charIndent).record();
            return false;
        }
    }
    return true;
}

function canKeyDownHistory(key, {a, c, s}, that) {
    if (!a && c) {
        // Redo with `⌘+y`
        if ('y' === key) {
            that.redo();
            return false;
        }
        // Undo with `⌘+z`
        if ('z' === key) {
            that.undo();
            return false;
        }
    }
    return true;
}

function canKeyDownTab(key, {a, c, s}, that) {
    let charIndent = that.state.tab || '\t';
    // Indent/outdent with `⇥` or `⇧+⇥`
    if ('Tab' === key && !a && !c) {
        that[s ? 'pull' : 'push'](charIndent).record();
        return false;
    }
    return true;
}

let bounce = debounce(that => that.record(), 100);

function canKeyUp(key, {a, c, s}, that) {
    return bounce(that), true;
}

export default {
    canKeyDown,
    canKeyDownDent,
    canKeyDownHistory,
    canKeyDownTab,
    canKeyUp,
    state: defaults,
    that
};

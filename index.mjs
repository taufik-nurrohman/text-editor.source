import {offEventDefault} from '@taufik-nurrohman/event';
import {esc, escChar, toPattern} from '@taufik-nurrohman/pattern';
import {toObjectValues} from '@taufik-nurrohman/to';

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

export function onKeyDown(e, $) {
    let charAfter,
        charBefore,
        charIndent = $.state.tab || '\t',
        key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey,
        keyIsShift = e.shiftKey;
    // Do nothing
    if (keyIsAlt || keyIsCtrl) {
        return true;
    }
    if ('Enter' === key && !keyIsShift) {
        let {after, before, value} = $.$(),
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        if (!value) {
            if (after && before && (charAfter = pairs[charBefore = before.slice(-1)]) && charAfter === after[0]) {
                $.wrap('\n' + lineMatchIndent + (charBefore !== charAfter ? charIndent : ""), '\n' + lineMatchIndent).record();
                offEventDefault(e);
                return false;
            }
            if (lineMatchIndent) {
                $.insert('\n' + lineMatchIndent, -1).record();
                offEventDefault(e);
                return false;
            }
        }
    }
    if ('Backspace' === key && !keyIsShift) {
        let {after, before, value} = $.$(),
            lineAfter = after.split('\n')[0],
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        charAfter = pairs[charBefore = before.slice(-1)];
        // Do nothing on escape
        if ('\\' === charBefore) {
            return true;
        }
        if (value) {
            if (after && before && charAfter && charAfter === after[0] && !before.endsWith('\\' + charBefore)) {
                $.record().peel(charBefore, charAfter).record();
                offEventDefault(e);
                return false;
            }
            return true;
        }
        charAfter = pairs[charBefore = before.trim().slice(-1)];
        if (charAfter && charBefore) {
            if (after.startsWith('\n' + lineMatchIndent + charAfter) && before.endsWith(charBefore + '\n' + lineMatchIndent)) {
                // Collapse bracket(s)
                $.trim("", "").record();
                offEventDefault(e);
                return false;
            }
        }
        // Outdent
        if (lineBefore.endsWith(charIndent)) {
            $.pull(charIndent).record();
            offEventDefault(e);
            return false;
        }
        if (after && before && !before.endsWith('\\' + charBefore)) {
            if (charAfter === after[0]) {
                // Peel pair
                $.peel(charBefore, charAfter).record();
                offEventDefault(e);
                return false;
            }
        }
    }
    let {after, before, start, value} = $.$();
    // Do nothing on escape
    if ('\\' === (charBefore = before.slice(-1))) {
        return true;
    }
    charAfter = pairsValue.includes(after[0]) ? after[0] : pairs[charBefore];
    // `|}`
    if (!value && after && before && charAfter && key === charAfter) {
        // Move to the next character
        // `}|`
        $.select(start + 1).record();
        offEventDefault(e);
        return false;
    }
    for (charBefore in pairs) {
        charAfter = pairs[charBefore];
        // `{|`
        if (charBefore === key) {
            // Wrap pair or selection
            // `{|}` `{|aaa|}`
            $.wrap(charBefore, charAfter).record();
            offEventDefault(e);
            return false;
        }
        // `|}`
        if (charAfter === key) {
            if (value) {
                // Wrap selection
                // `{|aaa|}`
                $.record().wrap(charBefore, charAfter).record();
                offEventDefault(e);
                return false;
            }
            break;
        }
    }
    return true;
}

export function onKeyDownDent(e, $) {
    let charIndent = $.state.tab || '\t',
        key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey,
        keyIsShift = e.shiftKey;
    if (!keyIsAlt && keyIsCtrl) {
        // Indent with `⌘+]`
        if (']' === key) {
            $.push(charIndent).record();
            offEventDefault(e);
            return;
        }
        // Outdent with `⌘+[`
        if ('[' === key) {
            $.pull(charIndent).record();
            offEventDefault(e);
            return;
        }
    }
    return true;
}

export function onKeyDownHistory(e, $) {
    let key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey;
    if (!keyIsAlt && keyIsCtrl) {
        // Redo with `⌘+y`
        if ('y' === key) {
            $.redo();
            offEventDefault(e);
            return;
        }
        // Undo with `⌘+z`
        if ('z' === key) {
            $.undo();
            offEventDefault(e);
            return;
        }
    }
    return true;
}

export function onKeyDownTab(e, $) {
    let charIndent = $.state.tab || '\t',
        key = e.key,
        keyIsAlt = e.altKey,
        keyIsCtrl = e.ctrlKey,
        keyIsShift = e.shiftKey;
    // Indent/outdent with `⇥` or `⇧+⇥`
    if ('Tab' === key && !keyIsAlt && !keyIsCtrl) {
        $[keyIsShift ? 'pull' : 'push'](charIndent).record();
        offEventDefault(e);
        return;
    }
    return true;
}

let throttle;

export function onKeyUp(e, $) {
    throttle && clearTimeout(throttle);
    throttle = setTimeout(() => $.record(), 100);
    return true;
}

import {offEventDefault} from '@taufik-nurrohman/event';
import {esc, escChar, toPattern} from '@taufik-nurrohman/pattern';
import {toObjectKeys} from '@taufik-nurrohman/to';

let pairs = {
    '`': '`',
    '(': ')',
    '{': '}',
    '[': ']',
    '"': '"',
    "'": "'",
    '<': '>'
};

let pairsKey = toObjectKeys(pairs);

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
        return;
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
        let {after, before, value} = $.$(),
            lineAfter = after.split('\n')[0],
            lineBefore = before.split('\n').pop(),
            lineMatch = lineBefore.match(/^(\s+)/),
            lineMatchIndent = lineMatch && lineMatch[1] || "";
        charAfter = pairs[charBefore = before.slice(-1)];
        // Do nothing on escape
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
        }
        // Outdent
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
    let {after, before, start, value} = $.$(),
        charBeforeList = escChar(pairsKey.join("")),
        charBeforeMatch = before.match(toPattern('([' + charBeforeList + '])[^' + charBeforeList + ']+$', ""));
    charBefore = charBeforeMatch && charBeforeMatch[1] || before.slice(-1);
    // Do nothing on escape
    if ('\\' === charBefore) {
        return;
    }
    charAfter = pairs[charBefore];
    // `|}`
    if (after && before && charAfter && key === charAfter && key === after[0]) {
        if (value) {
            // Wrap selection
            // `{|aaa|}`
            $.record().wrap(charBefore, charAfter).record();
            offEventDefault(e);
            return;
        }
        // Move to the next character
        // `}|`
        $.select(start + 1).record();
        offEventDefault(e);
        return;
    }
    for (charBefore in pairs) {
        charAfter = pairs[charBefore];
        // `{|`
        if (charBefore === key) {
            // Wrap pair or selection
            // `{|}` `{|aaa|}`
            $.wrap(charBefore, charAfter).record();
            offEventDefault(e);
            return;
        }
        // `|}`
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
    }
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
}

let throttle;

export function onKeyUp(e, $) {
    throttle && clearTimeout(throttle);
    throttle = setTimeout(() => $.record(), 100);
}

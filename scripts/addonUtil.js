export const prevEXPLevel = new Object();

export function Capitalize(text) {
    const textBinary = text.toLowerCase().split(':');
    let array = textBinary[textBinary.length -1].split('');
    array[0] = array[0].toUpperCase();

    for (let i = 1; i < array.length; i++) {
        if (!(array[i].toLowerCase() != array[i].toUpperCase())) {
            array[i] = ' ';
        } else if (array[i - 1] == ' ') {
            array[i] = array[i].toUpperCase();
        }
    }
    return array.join('');
}
export function Romanize(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}
export function ColourfyText(text) {
    const formattingCodes = ['2', '3', '4', '6', 'a', 'b', 'c', 'd', 'e', 'n', 'g', 'q', 's'];
    const textArray = text.split('');
    let array = [];
    for (let i = 0; i < textArray.length; i++) {
        array.push('§', formattingCodes[GetRandomIntRange(formattingCodes.length)], textArray[i]);
    }

    array = ['§', 'r', '§', 'k', '<', '§', 'r', ' ', ...array, ' ', '§', 'r', '§', 'k', '>', '§', 'r',];
    return array.join('');
}

export function CreateList(array, lambda) {
    lambda = lambda ?? ((x) => x);
    let list = ["NONE"];
    array.forEach((element) => {
        list.push(lambda(element));
    });
    return list;
}

export function BlacklistArray(array, blacklist, lambda) {
    lambda = lambda ?? ((x) => x);
    let list = [];
    array.forEach((element) => {
        if (!blacklist.includes(lambda(element)))
            list.push(element);
    });
    return list;
}
export function WhitelistLambda(array, whitelist, lambda) {
    whitelist = whitelist ?? ((x) => x);
    lambda = lambda ?? ((x) => x);
    let list = [];
    array.forEach((element) => {
        if (whitelist(lambda(element)))
            list.push(element);
    });
    return list;
}

export function GetRandomIntRange(range) {
    return Math.floor(Math.random() * range);
}

export function GetDirectionBits({north, east, south, west}) {
    let bits = 0;
    if (south) bits |= 1;
    if (west) bits |= 2;
    if (north) bits |= 4;
    if (east) bits |= 8;
    return bits;
}

export function ParsePlayer(cmdExe, playerParam, xyz = {x:0,y:0,z:0}) {
    let result = [];
    let c = 20;
    let l = 2147483647;
    let lm = 0;
    let r = 3000;
    let rm = 0;
    let m = [];
    let mExclude = [];
    let tag = [];
    let tagExclude = [];
    switch (playerParam.at(0)) {
        case '@':
            let keyParams = playerParam.split('[');
            if (keyParams.length <= 1) {
                result = cmdExe.getPlayers({closest: c, location: xyz});
            } else {
                const args = keyParams.at(-1).split(',');
                args.forEach((a) => {
                    let value = a.split('=').at(-1).split(']').at(0);
                    if (a.includes("c")) {
                        c = parseInt(value);
                    } else if (a.includes("lm")) {
                        lm = parseInt(value);
                    } else if (a.includes("l")) {
                        l = parseInt(value);
                    } else if (a.includes("rm")) {
                        rm = parseInt(value);
                    } else if (a.includes("r")) {
                        r = parseInt(value);
                    } else if (a.includes("tag")) {
                        if (value[0] == '!') {
                            tagExclude[tagExclude.length] = value.split('!').at(-1);
                        } else {
                            tag[tag.length] = value;
                        }
                    } else if (a.includes("m")) {
                        if (value[0] == '!') {
                            mExclude[mExclude.length] = value.split('!').at(-1);
                        } else {
                            m[m.length] = value; // parseGameMode
                        }
                    }
                });
                if (tag.length == 0 && tagExclude.length == 0 && m.length == 0 && mExclude.length == 0) {
                    result = cmdExe.getPlayers({closest: c, location: xyz, maxDistance: r, minDistance: rm, minLevel: lm, maxLevel: l});
                } else if (tag.length > 0) {
                    result = cmdExe.getPlayers({closest: c, location: xyz, maxDistance: r, minDistance: rm, minLevel: lm, maxLevel: l, tags: tag});
                } else if (tagExclude.length > 0) {
                    result = cmdExe.getPlayers({closest: c, location: xyz, maxDistance: r, minDistance: rm, minLevel: lm, maxLevel: l, excludeTags: tagExclude});
                } // parseGameMode
            }
            break;
        default:
            result = cmdExe.getPlayers({name: playerParam});
            break;
    }
    if (playerParam == "@p" || playerParam == "@n" || playerParam == "@r") {
        return [result[0]];
    }
    return result;
}
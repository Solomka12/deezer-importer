export function getSplitArr(arr, gridCount = 2000) {
    return new Array(Math.ceil(arr.length / gridCount))
    .fill(null)
    .map((item, i) => arr.slice(gridCount * i, gridCount * i + gridCount));
}

export function getDuplicates(arr) {
    return arr.reduce((acc, el, i, arr) => {
        if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el);
        return acc;
    }, []);
}

/*export function getDuplicates(arr) {
    const obj = arr.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1}), {});

    return Object.keys(obj).filter(key => obj[key] > 1);
}*/
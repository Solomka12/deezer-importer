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

export function downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, '\t'));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function secondsToMMSS(secs = 0) {
    secs = Math.round(secs || 0);
    const minutes = Math.floor(secs / 60);
    const divisor_for_minutes = secs % (60 * 60);
    const seconds = Math.ceil(divisor_for_minutes % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/*export function getDuplicates(arr) {
    const obj = arr.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1}), {});

    return Object.keys(obj).filter(key => obj[key] > 1);
}*/
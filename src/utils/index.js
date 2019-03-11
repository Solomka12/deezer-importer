export function getSplitArr(arr, gridCount = 2000) {
    return new Array(Math.ceil(arr.length / gridCount))
    .fill(null)
    .map((item, i) => arr.slice(gridCount * i, gridCount * i + gridCount));
}
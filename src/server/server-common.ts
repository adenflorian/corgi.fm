export function addIfNew(arr: any[], newElement: any) {
	if (arr.some(x => x === newElement)) {
		return arr
	} else {
		return [...arr, newElement]
	}
}

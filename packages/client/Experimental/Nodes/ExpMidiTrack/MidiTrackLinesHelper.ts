const emptyString = ''

export function getMeasureLines(columnWidth: number, panPixelsX: number, visibleWidth: number, height: number) {
	const startBeat = panPixelsX / columnWidth
	const endBeat = startBeat + (visibleWidth / columnWidth)
	const firstLineBeat = getNextLowerDivisibleBy4(startBeat)
	const lastLineBeat = getNextHigherDivisibleBy4(endBeat)
	const count = lastLineBeat - firstLineBeat
	return new Array(count / 4)
		.fill(0)
		.map((_, i) => ((firstLineBeat + (i * 4)) * columnWidth) - panPixelsX)
		.reduce((result, x) => result + `M ${x} 0 L ${x} ${height}`, '')
}

export function getBeatLines(columnWidth: number, panPixelsX: number, visibleWidth: number, height: number) {
	const distance = columnWidth
	if (distance < 16) return emptyString
	const startBeat = panPixelsX / columnWidth
	const endBeat = startBeat + (visibleWidth / columnWidth)
	const firstLineBeat = Math.floor(startBeat)
	const lastLineBeat = Math.ceil(endBeat)
	const count = lastLineBeat - firstLineBeat
	return new Array(count)
		.fill(0)
		.map((_, i) => firstLineBeat + i)
		.filter(x => (distance < 32 ? (x % 2 === 0) : true) && (x % 4 !== 0))
		.map(x => (x * columnWidth) - panPixelsX)
		.reduce((result, x) => result + `M ${x} 0 L ${x} ${height}`, '')
}

export function getSmallerLines(columnWidth: number, panPixelsX: number, visibleWidth: number, height: number) {
	const startBeat = panPixelsX / columnWidth
	const endBeat = startBeat + (visibleWidth / columnWidth)
	const firstLineBeat = Math.floor(startBeat) % 2 === 0 ? Math.floor(startBeat) : Math.floor(startBeat - 1)
	const lastLineBeat = Math.ceil(endBeat)
	const tempCount = (lastLineBeat - firstLineBeat)
	const division = tempCount < 10
		? 4
		: tempCount < 20
			? 2
			: tempCount > 50
				? 0.5
				: 1
	const count = Math.ceil(tempCount * division)
	return new Array(count)
		.fill(0)
		.map((_, i) => firstLineBeat + (i / division))
		.filter(x => x % 1 !== 0)
		.map(x => (x * columnWidth) - panPixelsX)
		.reduce((result, x) => result + `M ${x} 0 L ${x} ${height}`, '')
}

function getNextLowerDivisibleBy4(val: number) {
	let x = Math.floor(val)
	if (x % 4 === 0) return x
	x--
	if (x % 4 === 0) return x
	x--
	if (x % 4 === 0) return x
	x--
	return x
}

function getNextHigherDivisibleBy4(val: number) {
	let x = Math.ceil(val)
	if (x % 4 === 0) return x
	x++
	if (x % 4 === 0) return x
	x++
	if (x % 4 === 0) return x
	x++
	return x
}
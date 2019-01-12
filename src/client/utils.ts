export type IHashable = string | number | boolean | symbol | object

export function hashbow(input: IHashable, saturation = 50, lightness = 50) {
	const greyValues = [null, undefined, [], {}, '']

	if (greyValues.indexOf(input) !== -1) {
		return hslToHex(0, 0, lightness)
	}

	const num = convertToNumber(input)

	const squared = Math.abs(num * num)

	return hslToHex(squared % 360, saturation, lightness)
}

function convertToNumber(input: IHashable): number {
	switch (input.constructor) {
		case Function:
		case RegExp:
			return getNumberFromString(input.toString())
		case Object:
		case Array:
			return getNumberFromString(JSON.stringify(input))
		case Number:
			return input as number
		case Boolean:
			return input ? 120 : 0
		case String:
		default:
			return getNumberFromString(input.toString())
	}
}

const getNumberFromString = (str: string) => str.split('').map(toCharCode).reduce(sum, 0)

const sum = (a: number, b: number): number => a + b

const toCharCode = (char: string): number => char.charCodeAt(0)

function hslToHex(hue: number, saturation: number, luminosity: number) {
	// resolve degrees to 0 - 359 range
	hue = cycle(hue)

	// enforce constraints
	saturation = Math.max(Math.min(saturation, 100), 0)
	luminosity = Math.max(Math.min(luminosity, 100), 0)

	// convert to 0 to 1 range used by hsl-to-rgb-for-reals
	saturation /= 100
	luminosity /= 100

	// let hsl-to-rgb-for-reals do the hard work
	const rgb = hslToRgb(hue, saturation, luminosity)

	// convert each value in the returned RGB array
	// to a 2 character hex value, join the array into
	// a string, prefixed with a hash
	return '#' + rgb
		.map(n => {
			return (256 + n).toString(16).substr(-2)
		})
		.join('')
}

function cycle(val: number) {
	// for safety:
	val = Math.min(val, 1e7)
	val = Math.max(val, -1e7)
	// cycle value:
	while (val < 0) {val += 360}
	while (val > 359) {val -= 360}
	return val
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
	// based on algorithm from http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
	if (hue === undefined) {
		return [0, 0, 0]
	}

	const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation
	let huePrime = hue / 60
	const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1))

	huePrime = Math.floor(huePrime)
	let red = 0
	let green = 0
	let blue = 0

	if (huePrime === 0) {
		red = chroma
		green = secondComponent
		blue = 0
	} else if (huePrime === 1) {
		red = secondComponent
		green = chroma
		blue = 0
	} else if (huePrime === 2) {
		red = 0
		green = chroma
		blue = secondComponent
	} else if (huePrime === 3) {
		red = 0
		green = secondComponent
		blue = chroma
	} else if (huePrime === 4) {
		red = secondComponent
		green = 0
		blue = chroma
	} else if (huePrime === 5) {
		red = chroma
		green = 0
		blue = secondComponent
	}

	const lightnessAdjustment = lightness - (chroma / 2)
	red += lightnessAdjustment
	green += lightnessAdjustment
	blue += lightnessAdjustment

	return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)]
}

/** @param buttons The buttons property from a mouse event */
export function isLeftMouseButtonDown(buttons: number): boolean {
	// buttons is not implemented in safari :(
	if (buttons === undefined) return false

	return buttons % 2 === 1
}

/** @param buttons The buttons property from a mouse event */
export function isRightMouseButtonDown(buttons: number): boolean {
	// buttons is not implemented in safari :(
	if (buttons === undefined) return false
	if (buttons === 2) return true
	if (buttons === 3) return true

	return false
}

export const valueToPercentageOfMinMax = (value: number, min: number, max: number) => {
	return ((value - min) * 100) / (max - min)
}

export function getMainBoardsRectY() {
	return getMainBoardsRect().y
}

export function getMainBoardsRectX() {
	return getMainBoardsRect().x
}

function getMainBoardsRect() {
	const mainBoardsElement = document.getElementById('mainBoards')

	if (mainBoardsElement) {
		return (mainBoardsElement.getBoundingClientRect() as DOMRect)
	} else {
		return {x: 0, y: 0}
	}
}

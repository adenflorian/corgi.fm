/* eslint-disable import/newline-after-import */
import * as ColorAll from 'color'
import {List} from 'immutable'
import {removeOctave} from './common-utils'
import {IMidiNote} from './MidiNote'
// TODO
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ColorDefault = require('color')

export const colorFunc: typeof ColorAll = ColorDefault || ColorAll

export function getColorHslByString(str: string): string {
	return colorFunc(hashbow(str)).hsl().string()
}

export function getColorHslByHex(hex: string): string {
	return colorFunc(hex).hsl().string()
}

export function saturateColor(color: string, amount = 3): string {
	return colorFunc(color).saturate(amount).hsl().string()
}

export function getColorStringForMidiNote(note: IMidiNote): string {
	return `hsl(${removeOctave(note) * 23}, 90%, 60%)`
}

export function mixColors(colors: List<string>): string {
	// console.log('colors.count(): ', colors.count())
	if (colors.count() === 0) return 'black'
	if (colors.count() === 1) return colors.first()
	return `hsl(${colorFunc(colors.reduce(mix2Colors)).hue()}, 90%, 50%)`
}

export function mix2Colors(colorA: string, colorB: string): string {
	return colorFunc(colorA).mix(colorFunc(colorB)).toString()
}

export function hashbow(input: IHashable, saturation = 90, lightness = 50) {
	const greyValues = [null, undefined, [], {}, '']

	if (greyValues.includes(input)) {
		return hslToHex(0, 0, lightness)
	}

	const num = convertToNumber(input)

	const squared = Math.abs(num * num)

	return hslToHex(squared % 360, saturation, lightness)
}

// Keep in sync with colors.less
export enum CssColor {
	frenchGray = '#BDBDC6',
	panelGray = '#252525',
	panelGrayDark = '#1A1A1A',
	panelGrayLight = 'hsl(0, 0%, 25%)',
	panelGrayTransparent = 'rgba(40, 40, 50, 0.5)',
	disabledGray = 'hsla(0, 0%, 48%, 1)',
	gray2 = '#31313d',
	gray3 = '#424258',
	knobGray = '#33333b',
	keyWhite = '#EBEBF6',
	defaultGray = 'rgb(226, 226, 226)',
	subtleGrayWhiteBg = 'hsl(240, 0%, 65%)',
	subtleGrayBlackBg = 'hsl(240, 0%, 57%)',
	orange = 'hsl(19, 90%, 50%)',
	brightOrange = 'hsl(19, 100%, 50%)',
	red = 'hsl(344, 90%, 50%)',
	brightRed = 'hsl(344, 100%, 50%)',
	green = 'hsl(92, 90%, 50%)',
	brightGreen = 'hsl(92, 100%, 50%)',
	purple = 'hsl(289, 90%, 50%)',
	brightPurple = 'hsl(289, 100%, 50%)',
	blue = 'hsl(202, 90%, 50%)',
	brightBlue = 'hsl(202, 100%, 50%)',
	yellow = 'hsl(65, 90%, 60%)',
	brightYellow = 'hsl(65, 100%, 60%)',
	darkTextShadow = 'rgb(20, 20, 22)',
	appBackground = 'hsl(0, 0%, 7%)',
	overlayGray = 'hsla(0, 0, 4%, 0.8)',
}

type IHashable = string | number | boolean | symbol | object

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

/* eslint-disable no-param-reassign */
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

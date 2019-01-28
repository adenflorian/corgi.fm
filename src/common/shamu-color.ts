// tslint:disable-next-line:no-var-requires
const ColorDefault = require('color')
import * as ColorAll from 'color'
import {List} from 'immutable'
import {removeOctave} from '../client/music/music-functions'
import {hashbow} from '../client/utils'
import {IMidiNote} from './MidiNote'

export const colorFunc: typeof ColorAll = ColorDefault || ColorAll

export function getColorHslByString(str: string): string {
	return colorFunc(hashbow(str)).desaturate(0.2).hsl().string()
}

export function getColorHslByHex(hex: string): string {
	return colorFunc(hex).desaturate(0.4).hsl().string()
}

export function saturateColor(color: string, amount = 3): string {
	return colorFunc(color).saturate(amount).hsl().string()
}

export function getColorStringForMidiNote(note: IMidiNote): string {
	return `hsl(${removeOctave(note) * 23}, 60%, 60%)`
}

export function mixColors(colors: List<string>): string {
	if (colors.count() === 0) return 'black'
	if (colors.count() === 1) return colors.first()
	return `hsl(${colorFunc(colors.reduce(mix2Colors)).hue()}, 40%, 50%)`
}

export function mix2Colors(colorA: string, colorB: string): string {
	return colorFunc(colorA).mix(colorFunc(colorB)).toString()
}

// Keep in sync with colors.less
export enum CssColor {
	frenchGray = '#BDBDC6',
	panelGray = '#282832',
	panelGrayLight = '#41414d',
	panelGrayTransparent = 'rgba(40, 40, 50, 0.5)',
	gray2 = '#31313d',
	gray3 = '#424258',
	knobGray = '#33333b',
	keyWhite = '#EBEBF6',
	defaultGray = '#CDCBE1',
	subtleGrayWhiteBg = '#a0a0ab',
	subtleGrayBlackBg = '#8C8C99',
	orange = 'rgb(191, 111, 64)',
	brightOrange = 'rgb(226, 123, 75)',
	red = 'rgb(191, 64, 64)',
	brightRed = 'rgb(226, 75, 83)',
	green = '#40bf42',
	darkGreen = '#2f6330',
	brightGreen = '#4fe751',
	purple = 'rgb(168, 64, 191)',
	brightPurple = 'rgb(199, 79, 226)',
	blue = 'rgb(64, 87, 191)',
	brightBlue = 'rgb(79, 106, 226)',
	yellow = '#ccd65c',
	brightYellow = '#ddeb47',
	darkTextShadow = 'rgb(20, 20, 22)',
	appBackground = '#121621',
	overlayGray = 'rgba(20, 20, 24, 0.6)',
}

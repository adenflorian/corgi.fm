// tslint:disable-next-line:no-var-requires
const ColorDefault = require('color')
import * as ColorAll from 'color'
import {hashbow} from '../client/utils'

export const colorFunc: typeof ColorAll = ColorDefault || ColorAll

export function getColorHslByString(str: string): string {
	return colorFunc(hashbow(str)).desaturate(0.2).hsl().string()
}

export function getColorHslByHex(hex: string): string {
	return colorFunc(hex).desaturate(0.4).hsl().string()
}

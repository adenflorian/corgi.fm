import packageJson from './package.json'
import {isLocalDevClient, isTestClient} from './is-prod-client'

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

export function getCurrentClientVersion() {
	return packageJson.version
}

export function getUrl() {
	if (isLocalDevClient()) {
		return `http://${window.location.hostname}:3000`
	} else {
		return ``
	}
}

export function getCdnUrl() {
	if (isLocalDevClient()) {
		return `https://cdn.test.corgi.fm/dev/`
	} else if (isTestClient()) {
		return `https://cdn.test.corgi.fm/test/`
	} else {
		return `https://cdn.test.corgi.fm/prod/`
	}
}

const length = 65535
const halfLength = Math.floor(length / 2) // 32767

/** b is value when input is 0 */
function createExpWaveShaperCurve(b: number) {
	return new Float32Array(length).map((_, i) => {
		if (i < halfLength) {
			return b
		} else {
			const x = (i - halfLength) / halfLength
			return b ** (-x + 1)
		}
	})
}

function createExpCurveFunctions(b: number): CurveFunctions {
	return {
		curve: (x: number) => b ** (-x + 1),
		unCurve: (x: number) => (-Math.log(x) / Math.log(b)) + 1,
		waveShaperCurve: createExpWaveShaperCurve(b),
	}
}

export interface CurveFunctions {
	readonly curve: (x: number) => number
	readonly unCurve: (x: number) => number
	readonly waveShaperCurve: Float32Array | null
}

export const filterFreqCurveFunctions = createExpCurveFunctions(0.001)

export const lfoFreqCurveFunctions = createExpCurveFunctions(0.0001)

export const defaultBipolarCurveFunctions: CurveFunctions = {
	curve: (x: number) => x,
	unCurve: (x: number) => x,
	waveShaperCurve: new Float32Array([-1, 1]),
}

export const defaultUnipolarCurveFunctions: CurveFunctions = {
	curve: (x: number) => x,
	unCurve: (x: number) => x,
	waveShaperCurve: new Float32Array([0, 0, 1]),
}

// export function filterFreqCurveFunction(x: number): number {
// 	return a ** (x - 1)
// }

// export function filterFreqCurveReverseFunction(x: number): number {
// 	return Math.log(a * x) / Math.log(a)
// }

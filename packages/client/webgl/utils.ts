import {hslToRgb} from './color'

export async function loadShaderFromServer(name: string) {
	const response = await fetch('./shaders/' + name, {
		method: 'get',
	})

	if (response.ok) {
		return response.text()
	} else {
		throw new Error('response not ok bro: ' + JSON.stringify(response))
	}
}

export function getColorForTime(currentTimeSeconds: number, lengthSeconds: number) {
	const result = hslToRgb(sineNormalized(currentTimeSeconds / lengthSeconds), 1, 0.5)
	return [result[0], result[1], result[2], 1.0] as const
}

export function sineNormalized(x: number) {
	return (Math.sin(x) * 0.5) + 0.5
}

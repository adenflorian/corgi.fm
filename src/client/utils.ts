export function hashbow(input, saturation = 50, lightness = 50) {

	let inputAsString
	let sum

	const greyValues = [null, undefined, [], {}, '']

	if (greyValues.indexOf(input) !== -1) {
		return hslToHex(0, 0, lightness)
	}

	switch (input.constructor) {
		case Function:
		case RegExp:
			inputAsString = input.toString()
			break
		case Object:
		case Array:
			inputAsString = JSON.stringify(input)
			break
		case Number:
			sum = input
			break
		case Boolean:
			return hslToHex(input ? 120 : 0, saturation, lightness)
		case String:
		default:
			inputAsString = input
	}

	if (sum === undefined) {
		sum = 0
		inputAsString.split('').forEach(letter => {
			sum += letter.charCodeAt(0)
		})
	}

	sum = Math.abs(sum * sum)

	return hslToHex(sum % 360, saturation, lightness)
}

function hslToHex(hue, saturation, luminosity) {
	// resolve degrees to 0 - 359 range
	hue = cycle(hue)

	// enforce constraints
	saturation = min(max(saturation, 100), 0)
	luminosity = min(max(luminosity, 100), 0)

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

function max(val, n) {
	return (val > n) ? n : val
}

function min(val, n) {
	return (val < n) ? n : val
}

function cycle(val) {
	// for safety:
	val = max(val, 1e7)
	val = min(val, -1e7)
	// cycle value:
	while (val < 0) {val += 360}
	while (val > 359) {val -= 360}
	return val
}

function hslToRgb(hue, saturation, lightness) {
	// based on algorithm from http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
	if (hue === undefined) {
		return [0, 0, 0]
	}

	const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation
	let huePrime = hue / 60
	const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1))

	huePrime = Math.floor(huePrime)
	let red
	let green
	let blue

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

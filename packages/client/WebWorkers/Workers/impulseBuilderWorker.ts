import {ImpulseBuildRequest, ImpulseBuilderResponse} from '@corgifm/common/common-types';

onmessage = function (event) {
	console.log('Worker: building impulse...');

	const result = _buildImpulse(event.data)

	// @ts-ignore
	postMessage(result);
}

// See https://github.com/web-audio-components/simple-reverb/blob/master/index.js
function _buildImpulse({id, sampleRate, time, decay, reverse}: ImpulseBuildRequest): ImpulseBuilderResponse {
	const length = sampleRate * time
	const left = new Float32Array(length)
	const right = new Float32Array(length)
	let n: number

	for (let i = 0; i < length; i++) {
		n = reverse ? length - 1 : i
		left[i] = ((Math.random() * 2) - 1) * Math.pow(1 - (n / length), decay)
		right[i] = ((Math.random() * 2) - 1) * Math.pow(1 - (n / length), decay)
	}

	return {id, left, right}
}

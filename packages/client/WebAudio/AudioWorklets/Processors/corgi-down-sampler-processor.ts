/* eslint-disable no-restricted-syntax */
import {corgiDownSamplerName} from '../audio-worklets'

class CorgiDownSamplerProcessor extends AudioWorkletProcessor {
	private _currentHeldSample = 0
	private _counter = 0

	public static get parameterDescriptors() {
		return [{name: 'drive', defaultValue: 0.25}]
	}

	public constructor() {super()}

	public process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
		const input = inputs[0]
		const output = outputs[0]

		for (const [channel, inputChannel] of input.entries()) {
			const outputChannel = output[channel]

			for (const [i, sample] of inputChannel.entries()) {
				this._counter++
				// TODO Optimize?
				const drive = parameters.drive.length === 1
					? parameters.drive[0]
					: parameters.drive[i]
				const resolution = driveToResolution(drive)
				if (this._counter >= resolution) {
					this._counter = 0
					this._currentHeldSample = sample
				}
				outputChannel[i] = this._currentHeldSample
			}
		}

		return true
	}
}

registerProcessor(corgiDownSamplerName, CorgiDownSamplerProcessor)

const maxResolution = 200

// Drive is from 0 to 1
function driveToResolution(drive: number) {
	// Make from 1 to maxResolution
	const rawResolution = ((maxResolution - 1) * drive) + 1

	// Round
	return Math.round(rawResolution)
}

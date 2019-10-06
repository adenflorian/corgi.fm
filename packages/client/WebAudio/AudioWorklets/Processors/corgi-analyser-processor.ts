import {corgiAnalyserName} from '../audio-worklets'

class CorgiAnalyserProcessor extends AudioWorkletProcessor {

	// Custom AudioParams can be defined with this static getter.
	// static get parameterDescriptors() {
	// 	return [{name: 'gain', defaultValue: 1}]
	// }

	private _readyForNextMessage = true

	constructor() {
		super()
		
		this.port.onmessage = (event) => {
			this._readyForNextMessage = true
		}

		// this.port.postMessage('Hi from audio worklet!!')
	}

	public process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
		const input = inputs[0]
		const output = outputs[0]

		// let sum = 0
		// let count = 0

		// const gain = parameters.gain
		for (const [channel, inputChannel] of input.entries()) {
			const outputChannel = output[channel]
			// if (gain.length === 1) {
			// 	for (const [i, element] of inputChannel.entries()) {outputChannel[i] = element * gain[0]}
			// } else {
			// 	for (const [i, element] of inputChannel.entries()) {outputChannel[i] = element * gain[i]}
			// }
			for (const [i, element] of inputChannel.entries()) {

				if (this._readyForNextMessage) {
					this._readyForNextMessage = false
					this.port.postMessage(element)
				}
				// if (this._readyForNextMessage) {
				// 	sum += element
				// 	count++
				// }
				outputChannel[i] = element
			}
		}

		// if (this._readyForNextMessage) {
		// 	this._readyForNextMessage = false
		// 	this.port.postMessage(sum / count)
		// }

		return true
	}
}

registerProcessor(corgiAnalyserName, CorgiAnalyserProcessor)

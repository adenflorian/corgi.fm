import {corgiAnalyserName} from '../audio-worklets'

class CorgiAnalyserProcessor extends AudioWorkletProcessor {
	private _readyForNextMessage = true
	// private nan = false

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

		for (const [channel, inputChannel] of input.entries()) {
			const outputChannel = output[channel]

			for (const [i, element] of inputChannel.entries()) {
				// if (!this.nan && isNaN(element)) {
				// 	this.nan = true
				// 	console.warn('[CorgiAnalyserProcessor] nan detected:', {element})
				// }

				if (this._readyForNextMessage) {
					this._readyForNextMessage = false
					this.port.postMessage(element)
				}

				outputChannel[i] = element
			}
		}

		return true
	}
}

registerProcessor(corgiAnalyserName, CorgiAnalyserProcessor)

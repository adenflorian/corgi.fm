interface AudioWorkletProcessor {
	readonly port: MessagePort
	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): void
}

declare let AudioWorkletProcessor: {
	prototype: AudioWorkletProcessor
	new(options?: AudioWorkletNodeOptions): AudioWorkletProcessor
}

declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void

interface AudioParamMap {
	forEach(callbackfn: (value: AudioParam, key: string, parent: AudioParamMap) => void, thisArg?: any): void
	get(name: string): AudioParam | undefined
}

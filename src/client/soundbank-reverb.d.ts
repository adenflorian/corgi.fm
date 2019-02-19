declare module 'soundbank-reverb' {
	interface ReverbNode extends AudioNode {
		time: number
		cutoff: AudioParam
		decay: number
		reverse: boolean
		wet: AudioParam
		dry: AudioParam
		filterType: BiquadFilterType
	}

	export = soundbank_reverb

	function soundbank_reverb(ctx: AudioContext): ReverbNode

	namespace soundbank_reverb {
		const prototype: {
		};
	}
}

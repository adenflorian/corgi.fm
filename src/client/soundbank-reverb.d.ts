declare module 'soundbank-reverb' {
	export interface ReverbNode extends AudioNode {
		time: number
		cutoff: AudioParam
		decay: number
		reverse: boolean
		wet: GainNode
		dry: GainNode
		filterType: BiquadFilterType
	}
	const Reverb: (ctx: AudioContext) => ReverbNode
	export default Reverb
}

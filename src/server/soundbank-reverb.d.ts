declare module 'soundbank-reverb' {
	export interface ReverbNode extends AudioNode {
		time: number
		cutoff: AudioParam
	}
	const Reverb: (ctx: AudioContext) => ReverbNode
	export default Reverb
}

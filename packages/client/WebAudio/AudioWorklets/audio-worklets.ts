import {logger} from '@corgifm/common/logger'
import {simpleGlobalClientState} from '../../SimpleGlobalClientState'
import {LabAudioNode, KelpieAudioNode, KelpieAudioNodeArgs, LabGain, KelpieAudioParam, LabAudioParam, LabAudioNodeArgs} from '../../Experimental/Nodes/PugAudioNode/Lab'

export const corgiAnalyserName = 'corgi-analyser-processor'
export const corgiDownSamplerName = 'corgi-down-sampler-processor'

const audioWorkletNames = [
	// corgiAnalyserName,
	corgiDownSamplerName,
] as const

type AudioWorkletNames = typeof audioWorkletNames[number]

let x = 0

export async function loadAudioWorkletsAsync(audioContext: AudioContext) {
	if (simpleGlobalClientState.onAudioWorkletLoaded.current) {
		logger.warn('AudioWorklet already loaded!')
	}
	try {
		await Promise.all(audioWorkletNames.map(async name => {
			logger.log('loading:', name)
			await _loadAudioWorkletAsync(audioContext)(name)
		}))
		logger.log('all audio worklets loaded!')
		simpleGlobalClientState.onAudioWorkletLoaded.invokeNextFrame(true)
	} catch (error) {
		logger.error('error loading audio worklet ☹️:', {error})
	}
}

function _loadAudioWorkletAsync(audioContext: AudioContext) {
	return async (workletName: AudioWorkletNames) => {
		await audioContext.audioWorklet.addModule(`WebAudio/AudioWorklets/Processors/${workletName}.js`)
		x++
		logger.log(workletName + ' audio worklet loaded! ' + x)
	}
}

// export function createCorgiAnalyserWorkletNode(audioContext: AudioContext) {
// 	return _createAudioWorkletNode(corgiAnalyserName, audioContext)
// }

export function createCorgiDownSamplerWorkletNode(audioContext: AudioContext) {
	return _createAudioWorkletNode(corgiDownSamplerName, audioContext)
}

function _createAudioWorkletNode(moduleName: AudioWorkletNames, audioContext: AudioContext): AudioWorkletNode | null {
	if (simpleGlobalClientState.onAudioWorkletLoaded.current) {
		return new AudioWorkletNode(audioContext, moduleName)
	} else {
		return null
	}
}

export class LabDistortionNode extends LabAudioNode<KelpieDistortionNode> {
	public readonly drive: LabAudioParam<KelpieDistortionNode>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.drive = new LabAudioParam(this, (kelpieDistortion) => kelpieDistortion.drive)
		this.voices.push(new KelpieDistortionNode({audioContext: this._audioContext, labNode: this}))
	}

	public _makeVoice(): KelpieDistortionNode {
		const newThing = new KelpieDistortionNode({audioContext: this._audioContext, labNode: this})
		return newThing
	}
}

export class KelpieDistortionNode extends KelpieAudioNode {
	public readonly name = 'DistortionNode'
	private readonly _distortion: AudioNode
	private readonly _distortionWorklet: AudioWorkletNode | null
	private readonly _gain: GainNode
	public readonly drive: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._distortionWorklet = createCorgiDownSamplerWorkletNode(this._audioContext)
		this._gain = this._audioContext.createGain()
		this._distortion = this._distortionWorklet || this._gain


		let driveAudioParam: AudioParam | undefined

		if (this._distortionWorklet) {
			driveAudioParam = this._distortionWorklet.parameters.get('drive')

			if (!driveAudioParam) {
				logger.error('drive audio worklet node param not found', {_distortionWorklet: this._distortionWorklet})
			}
		}

		if (!driveAudioParam) {
			driveAudioParam = this._gain.gain
		}

		this.drive = new KelpieAudioParam(this._audioContext, driveAudioParam, 'drive', this)
	}

	public get input(): AudioNode {return this._distortion}
	public get output(): AudioNode {return this._distortion}
	protected _dispose(): void {}
}

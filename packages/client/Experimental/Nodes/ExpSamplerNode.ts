import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabAudioBufferSourceNode} from './PugAudioNode/Lab'
import {samplePathBegin, sharpToFlatNotes} from '@corgifm/common/common-samples-stuff'

export class SamplerExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	private readonly _bufferSource: LabAudioBufferSourceNode
	private readonly _outputChain: ToggleGainChain
	// TODO Add loop, loopStart, loopEnd params

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sampler', color: CssColor.green})

		const sampleRate = 44100
		const lengthSeconds = 1
		const sampleCount = sampleRate * lengthSeconds

		const buffer = this._audioContext.createBuffer(1, sampleCount, sampleRate)

		const sineArray = new Float32Array(sampleCount)

		for (let i = 0; i < sampleCount; i++) {
			const time = i / sampleRate
			sineArray[i] = Math.sin(2 * Math.PI * time)
		}

		buffer.copyToChannel(sineArray, 0)

		this._bufferSource = new LabAudioBufferSourceNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'SamplerExpNode'})
		// this._singletonContext.samplesManager.loadSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
		// 	.then(() => {
		// 		this._bufferSource.buffer = this._singletonContext.samplesManager.getSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
		// 	})
		this._bufferSource.buffer = buffer
		this._bufferSource.loop = true
		this._bufferSource.loopEnd = lengthSeconds
		this._bufferSource.playbackRate.onMakeVoice = rate => rate.setValueAtTime(0, 0)
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._bufferSource.connect(this._outputChain.input)

		const playbackRateParam = new ExpAudioParam('playbackRate', this._bufferSource.playbackRate, 440, 880, 'unipolar', {valueString: percentageValueString})
		const detuneParam = new ExpAudioParam('detune', this._bufferSource.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})

		const playbackRatePort = new ExpNodeAudioParamInputPort(playbackRateParam, this, corgiNodeArgs, 'center')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)

		this._ports = arrayToESIdKeyMap([playbackRatePort, detunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([playbackRateParam, detuneParam])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._bufferSource.dispose()
		})
	}
}

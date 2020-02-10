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

		this._bufferSource = new LabAudioBufferSourceNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'SamplerExpNode'})
		this._singletonContext.samplesManager.loadSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
			.then(() => {
				this._bufferSource.buffer = this._singletonContext.samplesManager.getSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
			})
		this._bufferSource.loop = true
		this._bufferSource.loopEnd = 3
		this._bufferSource.playbackRate.onMakeVoice = rate => rate.setValueAtTime(0, 0)
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._bufferSource.connect(this._outputChain.input)

		const playbackRateParam = new ExpAudioParam('playbackRate', this._bufferSource.playbackRate, 1, 16, 'unipolar', {valueString: percentageValueString})
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

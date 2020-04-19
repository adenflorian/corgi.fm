import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomNumberParams, ExpCustomNumberParam, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabAudioBufferSourceNode} from './PugAudioNode/Lab'
import {samplePathBegin, sharpToFlatNotes} from '@corgifm/common/common-samples-stuff'
import {getExpSamplerNodeView} from './ExpSamplerNodeView'
import {CorgiObjectChangedEvent, ReadonlyCorgiObjectChangedEvent} from '../CorgiEvents'

const loopOptions = ['loop', `loopn't`] as const
type LoopOption = typeof loopOptions[number]

export class SamplerExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _bufferSource: LabAudioBufferSourceNode
	private readonly _outputChain: ToggleGainChain
	public readonly loopStart: ExpCustomNumberParam
	public readonly loopEnd: ExpCustomNumberParam
	private readonly _loop: ExpCustomEnumParam<LoopOption>
	private readonly _bufferData = new CorgiObjectChangedEvent<Float32Array>(new Float32Array())
	public get bufferData() {return this._bufferData as ReadonlyCorgiObjectChangedEvent<Float32Array>}

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sampler', color: CssColor.green})

		this._bufferSource = new LabAudioBufferSourceNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'SamplerExpNode'})
		this.singletonContext.samplesManager.loadSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
			.then(() => {
				const buffer = this.singletonContext.samplesManager.getSample(`${samplePathBegin.static}/samplers/basic-piano/${sharpToFlatNotes['C']}${4}-49-96.mp3`)
				this._bufferSource.buffer = buffer
				this._bufferData.invokeNextFrame(buffer.getChannelData(0))
			})
		this._bufferSource.loop = true
		this._bufferSource.loopEnd = 4
		this._bufferSource.playbackRate.onMakeVoice = rate => rate.setValueAtTime(0, 0)
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._bufferSource.connect(this._outputChain.input)

		const playbackRateParam = new ExpAudioParam('playbackRate', this._bufferSource.playbackRate, 1, 10, 'unipolar', {valueString: percentageValueString})
		const detuneParam = new ExpAudioParam('detune', this._bufferSource.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})

		const playbackRatePort = new ExpNodeAudioParamInputPort(playbackRateParam, this, corgiNodeArgs, 'center')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)

		this._ports = arrayToESIdKeyMap([playbackRatePort, detunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([playbackRateParam, detuneParam])

		this.loopStart = new ExpCustomNumberParam('loopStart', 0, 0, 60, {curve: 3})
		this.loopEnd = new ExpCustomNumberParam('loopEnd', 60, 0, 60, {curve: 3})
		this._customNumberParams = arrayToESIdKeyMap([this.loopStart, this.loopEnd])

		this._loop = new ExpCustomEnumParam<LoopOption>('loop', `loop`, loopOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._loop] as ExpCustomEnumParam<string>[])

		this.loopStart.onChange.subscribe(this._onLoopStartChange)
		this.loopEnd.onChange.subscribe(this._onLoopEndChange)
		this._loop.onChange.subscribe(this._onLoopChange)
	}

	public render = () => this.getDebugView(getExpSamplerNodeView())

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._bufferSource.dispose()
		})
	}

	private readonly _onLoopStartChange = (loopStart: number) => {
		this._bufferSource.loopStart = loopStart
	}

	private readonly _onLoopEndChange = (loopEnd: number) => {
		this._bufferSource.loopEnd = loopEnd
	}

	private readonly _onLoopChange = (loop: LoopOption) => {
		this._bufferSource.loop = loop === 'loop' ? true : false
	}
}

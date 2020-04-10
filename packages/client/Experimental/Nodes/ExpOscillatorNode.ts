import {CssColor} from '@corgifm/common/shamu-color'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {
	filterValueToString, detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams,
	ExpCustomEnumParam, ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabOscillator} from './PugAudioNode/Lab'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

export class OscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _oscillatorHound: OscillatorExpHound

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscillator', color: CssColor.green})

		this._oscillatorHound = new OscillatorExpHound(corgiNodeArgs)

		this._customEnumParams = arrayToESIdKeyMap([this._oscillatorHound.type] as ExpCustomEnumParam<string>[])

		const frequencyPort = new ExpNodeAudioParamInputPort(this._oscillatorHound.frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.detuneParam, this, corgiNodeArgs, 'center')
		const unisonDetunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.unisonDetuneParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._oscillatorHound.outputChain.output)

		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, unisonDetunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([this._oscillatorHound.frequencyParam, this._oscillatorHound.detuneParam, this._oscillatorHound.unisonDetuneParam])

		this._customNumberParams = arrayToESIdKeyMap([this._oscillatorHound.unisonCount])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._oscillatorHound.outputChain.enable()
	protected _disable = () => this._oscillatorHound.outputChain.disable()

	protected _dispose() {
		this._oscillatorHound.dispose()
	}
}

export class OscillatorExpHound {
	public readonly oscillator: LabOscillator
	public readonly outputChain: ToggleGainChain
	public readonly type: ExpCustomEnumParam<OscillatorType>
	public readonly unisonCount: ExpCustomNumberParam
	public readonly frequencyParam: ExpAudioParam
	public readonly detuneParam: ExpAudioParam
	public readonly unisonDetuneParam: ExpAudioParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		this.type = new ExpCustomEnumParam<OscillatorType>('waveType', 'sawtooth', oscillatorTypes)
		this.type.onChange.subscribe(this.onTypeChange)

		this.oscillator = new LabOscillator({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'OscillatorExpNode'})
		this.oscillator.type = this.type.value
		this.outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this.oscillator.connect(this.outputChain.input)

		this.frequencyParam = new ExpAudioParam('frequency', this.oscillator.frequency, 440, maxPitchFrequency, 'unipolar', {valueString: filterValueToString, curveFunctions: oscillatorFreqCurveFunctions})
		this.detuneParam = new ExpAudioParam('fine', this.oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		this.unisonDetuneParam = new ExpAudioParam('detune', this.oscillator.unisonDetune, 0, 1, 'unipolar', {valueString: percentageValueString})

		this.unisonCount = new ExpCustomNumberParam('unison', 1, 1, 16, 1, val => Math.round(val).toString()) // 0.0005

		this.unisonCount.onChange.subscribe(this._onUnisonCountChange)
	}

	public dispose() {
		this.outputChain.dispose(() => {
			this.oscillator.dispose()
		})
	}

	private readonly _onUnisonCountChange = (value: number) => {
		const roundedCount = Math.round(value)
		if (this.oscillator.unisonCount === roundedCount) return
		this.oscillator.unisonCount = roundedCount
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this.oscillator.type = type
	}
}

import {CssColor} from '@corgifm/common/shamu-color'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {
	filterValueToString, detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam, ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
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
	private readonly _oscillator: LabOscillator
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>
	private readonly _unisonCount: ExpCustomNumberParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscillator', color: CssColor.green})

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sawtooth', oscillatorTypes)
		this._type.onChange.subscribe(this.onTypeChange)
		this._customEnumParams = arrayToESIdKeyMap([this._type] as ExpCustomEnumParam<string>[])

		this._oscillator = new LabOscillator({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'OscillatorExpNode'})
		this._oscillator.type = this._type.value
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._oscillator.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._oscillator.frequency, 440, maxPitchFrequency, 'unipolar', {valueString: filterValueToString, curveFunctions: oscillatorFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('fine', this._oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		const unisonDetuneParam = new ExpAudioParam('detune', this._oscillator.unisonDetune, 0, 1, 'unipolar', {valueString: percentageValueString})

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const unisonDetunePort = new ExpNodeAudioParamInputPort(unisonDetuneParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)

		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, unisonDetunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam, unisonDetuneParam])

		this._unisonCount = new ExpCustomNumberParam('unison', 1, 1, 16, 1, val => Math.round(val).toString()) // 0.0005
		this._customNumberParams = arrayToESIdKeyMap([this._unisonCount])
		
		this._unisonCount.onChange.subscribe(this._onUnisonCountChange)
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.dispose()
		})
	}

	private readonly _onUnisonCountChange = (value: number) => {
		const roundedCount = Math.round(value)
		if (this._oscillator.unisonCount === roundedCount) return
		this._oscillator.unisonCount = roundedCount
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._oscillator.type = type
	}
}

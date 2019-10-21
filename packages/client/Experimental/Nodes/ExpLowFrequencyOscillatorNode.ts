/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {lfoFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	lfoRateValueToString, detuneValueToString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

export class LowFrequencyOscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _oscillator: OscillatorNode
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sine', oscillatorTypes)
		this._type.onChange.subscribe(this.onTypeChange)
		this._customEnumParams = arrayToESIdKeyMap([this._type] as ExpCustomEnumParam<string>[])

		this._oscillator = corgiNodeArgs.audioContext.createOscillator()
		this._oscillator.type = this._type.value
		this._oscillator.start()

		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._oscillator.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._oscillator.frequency, 1, 32, 'unipolar', {valueString: lfoRateValueToString, curveFunctions: lfoFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam])

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs.audioContext, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs.audioContext, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output, 'bipolar')
		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, outputPort])
	}

	public getColor = () => CssColor.purple
	public getName = () => 'Low Frequency Oscillator'
	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.stop()
			this._oscillator.disconnect()
		})
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._oscillator.type = type
	}
}

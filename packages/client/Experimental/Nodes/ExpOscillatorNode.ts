import {CssColor} from '@corgifm/common/shamu-color'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {
	filterValueToString, detuneValueToString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabOscillator} from './PugAudioNode/Lab'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

export class OscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _oscillator: LabOscillator
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscillator', color: CssColor.green})

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sawtooth', oscillatorTypes)
		this._type.onChange.subscribe(this.onTypeChange)
		this._customEnumParams = arrayToESIdKeyMap([this._type] as ExpCustomEnumParam<string>[])

		this._oscillator = new LabOscillator({...corgiNodeArgs, voiceMode: 'mono', creatorName: 'OscillatorExpNode'})
		this._oscillator.type = this._type.value
		this._oscillator.start()
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		this._oscillator.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._oscillator.frequency, 440, maxPitchFrequency, 'unipolar', {valueString: filterValueToString, curveFunctions: oscillatorFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)

		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.dispose()
		})
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._oscillator.type = type
	}
}

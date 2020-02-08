import {CssColor} from '@corgifm/common/shamu-color'
import {lfoFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	lfoRateValueToString, detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabOscillator, LabGain, LabWaveShaperNode} from './PugAudioNode/Lab'
import {ParamInputCentering, paramInputCenteringOptions} from '@corgifm/common/common-types'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

/**
 * unipolar offset	lfo > ws(uni) > gain
 * unipolar center	lfo > gain > ws(uni)
 * bipolar offset	lfo > ws(uni) > gain > ws(bi)
 * bipolar center	lfo > gain
 */

export class LowFrequencyOscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _oscillator: LabOscillator
	private readonly _gain: LabGain
	// private readonly _waveShaper: LabWaveShaperNode
	// private readonly _waveShaper2: LabWaveShaperNode
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>
	// private readonly _centering: ExpCustomEnumParam<ParamInputCentering>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Low Frequency Oscillator', color: CssColor.purple})

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sine', oscillatorTypes)
		this._type.onChange.subscribe(this.onTypeChange)
		// this._centering = new ExpCustomEnumParam<ParamInputCentering>('centering', 'center', paramInputCenteringOptions)
		// this._centering.onChange.subscribe(this.onCenteringChange)
		this._customEnumParams = arrayToESIdKeyMap([this._type] as ExpCustomEnumParam<string>[])

		this._oscillator = new LabOscillator({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		this._oscillator.type = this._type.value

		// this._waveShaper = new LabWaveShaperNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		// this._waveShaper.curve = new Float32Array([0, 1])

		this._gain = new LabGain({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		this._gain.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)

		// this._waveShaper2 = new LabWaveShaperNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		// this._waveShaper2.curve = new Float32Array([-3, 1])

		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)

		this._oscillator
			// .connect(this._waveShaper)
			.connect(this._gain)
			// .connect(this._waveShaper2)
			.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._oscillator.frequency, 1, 32, 'unipolar', {valueString: lfoRateValueToString, curveFunctions: lfoFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		const gainParam = new ExpAudioParam('gain', this._gain.gain, 1, 1, 'unipolar', {valueString: percentageValueString})
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam, gainParam])

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)
		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, gainPort, outputPort])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.dispose()
			this._gain.dispose()
		})
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._oscillator.type = type
	}

	// private readonly onCenteringChange = (centering: ParamInputCentering) => {
	// 	this._oscillator.centering = centering
	// }
}

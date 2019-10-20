/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {
	filterValueToString, detuneValueToString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

export class OscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _oscillator: OscillatorNode
	// private readonly _merger: ChannelMergerNode
	private readonly _outputChain: ToggleGainChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._oscillator = corgiNodeArgs.audioContext.createOscillator()
		this._oscillator.type = 'sawtooth'
		// this._oscillator.type = pickRandomArrayElement(['sawtooth', 'sine', 'triangle', 'square'])
		this._oscillator.start()
		// this._merger = corgiNodeArgs.audioContext.createChannelMerger(2)
		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		// this._oscillator.connect(this._merger, 0, 0)
		// this._oscillator.connect(this._merger, 0, 1)
		// this._merger.connect(this._outputChain.input)
		this._oscillator.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._oscillator.frequency, 440, maxPitchFrequency, 'unipolar', {valueString: filterValueToString, curveFunctions: oscillatorFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs.audioContext, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs.audioContext, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output, 'bipolar')

		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, outputPort])
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam])
	}

	public getColor = () => CssColor.green
	public getName = () => 'Oscillator'
	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.stop()
			this._oscillator.disconnect()
			// this._merger.disconnect()
		})
	}
}

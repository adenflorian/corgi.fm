/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {lfoFreqCurveFunctions} from '@corgifm/common/common-utils'
import {
	lfoRateValueToString, detuneValueToString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

export class LowFrequencyOscillatorExpNode extends CorgiNode {
	private readonly _oscillator: OscillatorNode
	private readonly _outputChain: ToggleGainChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const oscillator = corgiNodeArgs.audioContext.createOscillator()
		oscillator.type = 'sine'
		// oscillator.type = pickRandomArrayElement(['sawtooth', 'sine', 'triangle', 'square'])
		oscillator.start()
		const outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		oscillator.connect(outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', oscillator.frequency, 1, 32, 'unipolar', {valueString: lfoRateValueToString, curveFunctions: lfoFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', oscillator.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, () => this, corgiNodeArgs.audioContext, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, () => this, corgiNodeArgs.audioContext, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, outputChain.output, 'bipolar')

		super(corgiNodeArgs, {
			ports: [frequencyPort, detunePort, outputPort],
			audioParams: [frequencyParam, detuneParam],
		})

		// Make sure to add these to the dispose method!
		this._oscillator = oscillator
		this._outputChain = outputChain
	}

	public getColor(): string {
		return CssColor.green
	}

	public getName() {return 'Low Frequency Oscillator'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._outputChain.enable()
	}

	protected _disable() {
		this._outputChain.disable()
	}

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._oscillator.stop()
			this._oscillator.disconnect()
		})
	}
}

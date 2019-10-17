/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {oscillatorFreqCurveFunctions} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {
	filterValueToString, detuneValueToString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

export class OscillatorExpNode extends CorgiNode {
	private readonly _oscillator: OscillatorNode
	// private readonly _merger: ChannelMergerNode
	private readonly _outputChain: ToggleGainChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const oscillator = corgiNodeArgs.audioContext.createOscillator()
		oscillator.type = 'sawtooth'
		// oscillator.type = pickRandomArrayElement(['sawtooth', 'sine', 'triangle', 'square'])
		oscillator.start()
		// const merger = corgiNodeArgs.audioContext.createChannelMerger(2)
		const outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)
		// oscillator.connect(merger, 0, 0)
		// oscillator.connect(merger, 0, 1)
		// merger.connect(outputChain.input)
		oscillator.connect(outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', oscillator.frequency, 440, maxPitchFrequency, 'unipolar', {valueString: filterValueToString, curveFunctions: oscillatorFreqCurveFunctions})
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
		// this._merger = merger
		this._outputChain = outputChain
	}

	public getColor(): string {
		return CssColor.green
	}

	public getName() {return 'Oscillator'}

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
			// this._merger.disconnect()
		})
	}
}

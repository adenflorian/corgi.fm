/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {filterFreqCurveFunctions} from '@corgifm/common/common-utils'
import {percentageValueString, filterValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class FilterNode extends CorgiNode {
	private readonly _filter: BiquadFilterNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const filter = corgiNodeArgs.audioContext.createBiquadFilter()
		filter.type = 'lowpass'

		const dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, filter)

		const frequencyParam = new ExpAudioParam('frequency', filter.frequency, 425, 20000, 'unipolar', {valueString: filterValueToString, curveFunctions: filterFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', filter.detune, 0, 100, 'bipolar', {valueString: filterValueToString})
		const qParam = new ExpAudioParam('q', filter.Q, 1, 18, 'unipolar')
		const gainParam = new ExpAudioParam('gain', filter.gain, 0, 1, 'bipolar', {valueString: percentageValueString})

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, () => this, corgiNodeArgs.audioContext, 'center')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, () => this, corgiNodeArgs.audioContext, 'center')
		const qPort = new ExpNodeAudioParamInputPort(qParam, () => this, corgiNodeArgs.audioContext, 'offset')
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, () => this, corgiNodeArgs.audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain, 'bipolar')

		super(corgiNodeArgs, {
			ports: [inputPort, frequencyPort, detunePort, qPort, gainPort, outputPort],
			audioParams: [frequencyParam, detuneParam, qParam, gainParam],
		})

		// Make sure to add these to the dispose method!
		this._filter = filter
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Filter'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._filter.disconnect()
		this._dryWetChain.dispose()
	}
}

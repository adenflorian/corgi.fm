/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {filterFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {percentageValueString, filterValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class FilterNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _filter: BiquadFilterNode
	private readonly _dryWetChain: DryWetChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._filter = corgiNodeArgs.audioContext.createBiquadFilter()
		this._filter.type = 'lowpass'

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._filter)

		const frequencyParam = new ExpAudioParam('frequency', this._filter.frequency, 425, 20000, 'unipolar', {valueString: filterValueToString, curveFunctions: filterFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._filter.detune, 0, 100, 'bipolar', {valueString: filterValueToString})
		const qParam = new ExpAudioParam('q', this._filter.Q, 1, 18, 'unipolar')
		const gainParam = new ExpAudioParam('gain', this._filter.gain, 0, 1, 'bipolar', {valueString: percentageValueString})

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs.audioContext, 'center')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs.audioContext, 'center')
		const qPort = new ExpNodeAudioParamInputPort(qParam, this, corgiNodeArgs.audioContext, 'offset')
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs.audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain, 'bipolar')

		this._ports = arrayToESIdKeyMap([inputPort, frequencyPort, detunePort, qPort, gainPort, outputPort])
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam, qParam, gainParam])
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

/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {gainDecibelValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class ExpGainNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gain: GainNode
	private readonly _dryWetChain: DryWetChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._gain = corgiNodeArgs.audioContext.createGain()
		this._gain.gain.value = 0

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._gain)

		const gainParam = new ExpAudioParam('gain', this._gain.gain, 1, 1, 'unipolar', {valueString: gainDecibelValueToString})
		this._audioParams = arrayToESIdKeyMap([gainParam])

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs.audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain, 'bipolar')
		this._ports = arrayToESIdKeyMap([inputPort, gainPort, outputPort])

	}

	public getColor = () => CssColor.orange
	public getName = () => 'Gain'
	public render = () => this.getDebugView()

	protected _enable = () =>	this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._gain.disconnect()
		this._dryWetChain.dispose()
	}
}

/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {panValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class ExpPanNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _pan: StereoPannerNode
	private readonly _dryWetChain: DryWetChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._pan = corgiNodeArgs.audioContext.createStereoPanner()

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._pan)

		const panParam = new ExpAudioParam('pan', this._pan.pan, 0, 1, 'bipolar', {valueString: panValueToString})
		this._audioParams = arrayToESIdKeyMap([panParam])

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const panPort = new ExpNodeAudioParamInputPort(panParam, this, corgiNodeArgs.audioContext, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain, 'bipolar')
		this._ports = arrayToESIdKeyMap([inputPort, panPort, outputPort])
	}

	public getColor = () => CssColor.orange
	public getName = () => 'Pan'
	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._pan.disconnect()
		this._dryWetChain.dispose()
	}
}

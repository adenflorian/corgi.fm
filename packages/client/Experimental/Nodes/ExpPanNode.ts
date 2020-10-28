import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {panValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'
import {LabStereoPannerNode} from './PugAudioNode/Lab'

export class ExpPanNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _pan: LabStereoPannerNode
	private readonly _dryWetChain: DryWetChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Pan', color: CssColor.orange})

		this._pan = new LabStereoPannerNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'ExpPanNode'})

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._pan, 'autoPoly')

		const panParam = new ExpAudioParam('pan', this._pan.pan, 0, 1, 'bipolar', {valueString: panValueToString})
		this._audioParams = arrayToESIdKeyMap([panParam])

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const panPort = new ExpNodeAudioParamInputPort(panParam, this, corgiNodeArgs, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)
		this._ports = arrayToESIdKeyMap([inputPort, panPort, outputPort])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._pan.disconnect()
		this._dryWetChain.dispose()
	}
}

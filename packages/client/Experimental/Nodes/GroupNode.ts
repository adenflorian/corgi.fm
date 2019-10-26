/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class GroupNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gainInput: GainNode
	private readonly _gainOutput: GainNode
	private readonly _dryWetChain: DryWetChain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._gainInput = corgiNodeArgs.audioContext.createGain()
		this._gainOutput = corgiNodeArgs.audioContext.createGain()

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._gainInput, this._gainOutput)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain, 'bipolar')
		this._ports = arrayToESIdKeyMap([inputPort, outputPort])
	}

	public registerChildInputNode() {
		return this._gainInput
	}

	public registerChildOutputNode() {
		return this._gainOutput
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group'
	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._gainInput.disconnect()
		this._gainOutput.disconnect()
		this._dryWetChain.dispose()
	}
}

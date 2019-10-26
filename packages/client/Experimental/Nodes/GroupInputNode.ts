/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'

export class GroupInputNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gainOutput: GainNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		if (this._parentGroupNode === undefined) {
			logger.error('[GroupInputNode] expected a parent node!', {this: this, parent: this._parentGroupNode})
		}

		this._gainOutput = this._parentGroupNode
			? this._parentGroupNode.registerChildInputNode()
			: corgiNodeArgs.audioContext.createGain()

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._gainOutput, 'bipolar')
		this._ports = arrayToESIdKeyMap([outputPort])
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group Input'
	public render = () => this.getDebugView()

	protected _enable = () => this._gainOutput.gain.value = 1
	protected _disable = () => this._gainOutput.gain.value = 0

	protected _dispose() {
		this._gainOutput.disconnect()
	}
}

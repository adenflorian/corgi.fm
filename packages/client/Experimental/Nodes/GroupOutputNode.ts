/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'

export class GroupOutputNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gainInput: GainNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		if (this._parentGroupNode === undefined) {
			logger.error('[GroupOutputNode] expected a parent node!', {this: this, parent: this._parentGroupNode})
		}

		this._gainInput = this._parentGroupNode
			? this._parentGroupNode.registerChildOutputNode()
			: corgiNodeArgs.audioContext.createGain()

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._gainInput)
		this._ports = arrayToESIdKeyMap([inputPort])
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group Output'
	public render = () => this.getDebugView()

	protected _enable = () => this._gainInput.gain.value = 1
	protected _disable = () => this._gainInput.gain.value = 0

	protected _dispose() {
		this._gainInput.disconnect()
	}
}

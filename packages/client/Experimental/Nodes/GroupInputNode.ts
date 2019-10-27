/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioOutputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'

export class GroupInputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		if (this._parentGroupNode === undefined) {
			logger.error('[GroupInputNode] expected a parent node!', {this: this, parent: this._parentGroupNode})
			return
		}

		this._parentGroupNode.registerChildInputNode().forEach(([input, source]) => {
			this._ports.set(input.id, new ExpNodeAudioOutputPort(input.id, input.name, this, source))
		})
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group Input'
	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}
}

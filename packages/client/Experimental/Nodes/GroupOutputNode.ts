/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioInputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'

export class GroupOutputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Group Output', color: CssColor.blue})

		if (this._parentGroupNode === undefined) {
			logger.error('[GroupOutputNode] expected a parent node!', {this: this, parent: this._parentGroupNode})
			return
		}

		this._parentGroupNode.registerChildOutputNode().forEach(output => {
			this._ports.set(output.id, new ExpNodeAudioInputPort(output.id, output.name, this, output.source))
		})
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}
}

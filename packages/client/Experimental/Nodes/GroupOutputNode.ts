import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioInputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'
import {GroupNode} from './GroupNode'

export class GroupOutputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()
	private readonly _parentGroupNode?: GroupNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Group Output', color: CssColor.blue})

		if (this._parentNode === undefined) {
			logger.error('[GroupOutputNode] expected a parent node!', {this: this, parent: this._parentNode})
			return
		}

		if (!(this._parentNode instanceof GroupNode)) {
			logger.error('[GroupOutputNode] expected parent to be a GroupNode!', {this: this, parent: this._parentNode})
			return
		}

		this._parentGroupNode = this._parentNode

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

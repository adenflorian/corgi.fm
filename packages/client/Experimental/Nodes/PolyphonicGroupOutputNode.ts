/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioInputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'
import {PolyphonicGroupNode} from './PolyphonicGroupNode'

export class PolyphonicGroupOutputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()
	private readonly _parentPolyGroupNode?: PolyphonicGroupNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Polyphonic Group Output', color: CssColor.blue})

		if (this._parentNode === undefined) {
			logger.error('[PolyphonicGroupOutputNode] expected a parent node!', {this: this, parent: this._parentNode})
			return
		}

		if (!(this._parentNode instanceof PolyphonicGroupNode)) {
			logger.error('[PolyphonicGroupOutputNode] expected parent to be a PolyphonicGroupNode!', {this: this, parent: this._parentNode})
			return
		}

		this._parentPolyGroupNode = this._parentNode

		this._parentPolyGroupNode.registerChildOutputNode().forEach(output => {
			this._ports.set(output.id, new ExpNodeAudioInputPort(output.id, output.name, this, output.source))
		})
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}
}

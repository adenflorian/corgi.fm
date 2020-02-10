import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioInputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'
import {GroupNode} from './GroupNode'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'

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

		const {audioOutputs, midiOutputs} = this._parentGroupNode.registerChildOutputNode()

		audioOutputs.forEach(output => {
			this._ports.set(output.id, new ExpNodeAudioInputPort(output.id, output.name, this, output.source))
		})

		midiOutputs.forEach(output => {
			this._ports.set(output.id, new ExpMidiInputPort(output.id, output.name, this, this._onMidiMessage(output.id)))
		})
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}

	private readonly _onMidiMessage = (id: Id) => (midiAction: MidiAction) => {
		this._parentGroupNode!.onMidiMessageFromChildInputNode(id, midiAction)
	}
}

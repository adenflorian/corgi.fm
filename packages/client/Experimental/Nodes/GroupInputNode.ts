import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioOutputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'
import {GroupNode} from './GroupNode'
import {LabAudioNode} from './PugAudioNode/Lab'
import {ExpMidiOutputPort} from '../ExpMidiPorts'

export class GroupInputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()
	private readonly _parentGroupNode?: GroupNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Group Input', color: CssColor.blue})

		if (this._parentNode === undefined) {
			logger.error('[GroupInputNode] expected a parent node!', {this: this, parent: this._parentNode})
			return
		}

		if (!(this._parentNode instanceof GroupNode)) {
			logger.error('[GroupInputNode] expected parent to be a GroupNode!', {this: this, parent: this._parentNode})
			return
		}

		this._parentGroupNode = this._parentNode

		const {audioInputs, audioParamInputs, midiInputs} = this._parentNode.registerChildInputNode()

		audioParamInputs.forEach(([input, source]) => {
			this._ports.set(input.id, new ExpNodeAudioOutputPort(input.id, input.name, this, source))
		})

		audioInputs.forEach(input => {
			this._ports.set(input.id, new ExpNodeAudioOutputPort(input.id, input.name, this, input.destination as LabAudioNode))
		})

		midiInputs.forEach(input => {
			const newOut = new ExpMidiOutputPort(input.id, input.name, this)
			this._parentGroupNode!.registerMidiOutput(input.id, newOut)
			this._ports.set(input.id, newOut)
		})
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}
}

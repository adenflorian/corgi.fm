import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomStringParam, ExpCustomStringParams} from '../ExpParams'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'

export class MidiMatchNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customStringParams: ExpCustomStringParams
	private readonly _pattern: ExpCustomStringParam
	private readonly _midiOutputPort: ExpMidiOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Match', color: CssColor.yellow})
		
		const midiInputPort = new ExpMidiInputPort('message', 'message', this, this._onMidiMessage)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._midiOutputPort])

		this._pattern = new ExpCustomStringParam('pattern', '')
		this._customStringParams = arrayToESIdKeyMap([this._pattern] as ExpCustomStringParam[])

		this._pattern.value.subscribe(this._onChange)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {
		this._pattern.value.unsubscribe(this._onChange)
	}

	private readonly _onChange = (newText: string) => {
	}

	private _onMidiMessage = (midiAction: MidiAction) => {
		if (this._enabled && midiAction.type === 'MESSAGE') {
			const gate = midiAction.message.toLowerCase().trim() === this._pattern.value.current.toLowerCase().trim()
			this._midiOutputPort.sendMidiAction(midiActions.gate(midiAction.time, gate))
		} else {
			this._midiOutputPort.sendMidiAction(midiAction)
		}
	}
}

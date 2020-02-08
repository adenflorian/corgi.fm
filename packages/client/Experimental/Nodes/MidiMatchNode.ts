import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomStringParam, ExpCustomStringParams} from '../ExpParams'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort, ExpPorts, ExpNodeAudioInputPort} from '../ExpPorts'
import {LabGain} from './PugAudioNode/Lab'

const gateOptions = ['on', 'off', 'idle'] as const
type GateMode = typeof gateOptions[number]

export class MidiMatchNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customStringParams: ExpCustomStringParams
	private readonly _gateMode: ExpCustomStringParam
	private readonly _midiOutputPort: ExpMidiOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Match', color: CssColor.yellow})
		
		const midiInputPort = new ExpMidiInputPort('gate', 'gate', this, this._onMidiMessage)
		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._midiOutputPort])

		this._gateMode = new ExpCustomStringParam('pattern', '')
		this._customStringParams = arrayToESIdKeyMap([this._gateMode] as ExpCustomStringParam[])

		this._gateMode.value.subscribe(this._onChange)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {
		this._gateMode.value.unsubscribe(this._onChange)
	}

	private readonly _onChange = (newText: string) => {
	}

	private _onMidiMessage = (midiAction: MidiAction) => {
		if (!this._enabled) return
	}
}

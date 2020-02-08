import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomEnumParam, ExpCustomEnumParams} from '../ExpParams'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort, ExpPorts, ExpNodeAudioInputPort} from '../ExpPorts'
import {LabGain} from './PugAudioNode/Lab'

const gateOptions = ['on', 'off', 'idle'] as const
type GateMode = typeof gateOptions[number]

export class MidiPulseNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _gateMode: ExpCustomEnumParam<GateMode>
	private readonly _midiOutputPort: ExpMidiOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Pulse', color: CssColor.yellow})
		
		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._gateMode = new ExpCustomEnumParam<GateMode>('mode', 'idle', gateOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._gateMode] as ExpCustomEnumParam<string>[])

		this._gateMode.onChange.subscribe(this._onChange)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {
		this._gateMode.onChange.unsubscribe(this._onChange)
	}

	private readonly _onChange = (mode: GateMode) => {
		if (mode !== 'idle') this._gateMode.onChange.invokeNextFrame('idle')

		if (!this._enabled) return

		if (mode === 'on') {
			this._midiOutputPort.sendMidiAction(midiActions.gate(this._audioContext.currentTime, true))
		} else if (mode === 'off') {
			this._midiOutputPort.sendMidiAction(midiActions.gate(this._audioContext.currentTime, false))
		}
	}
}

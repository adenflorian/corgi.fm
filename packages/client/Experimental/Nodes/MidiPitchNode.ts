/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {floorValueString} from '../../client-constants'
import {ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
import {ExpMidiOutputPort, ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'

export class MidiPitchNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _pitch: ExpCustomNumberParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Pitch', color: CssColor.yellow})

		const midiInputPort = new ExpMidiInputPort('input', 'input', this, this._onMidiMessage)
		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._midiOutputPort])

		this._pitch = new ExpCustomNumberParam('pitch', 0, -128, 128, 1, floorValueString)
		this._customNumberParams = arrayToESIdKeyMap([this._pitch])
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {}

	private readonly _onMidiMessage = (midiAction: MidiAction) => {
		if (midiAction.type === 'MIDI_NOTE') {
			this._onMidiNoteAction(midiAction)
		} else {
			this._midiOutputPort.sendMidiAction(midiAction)
		}
	}

	private _onMidiNoteAction(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		if (midiAction.gate === true) {
			this._onMidiNoteOn(midiAction)
		} else {
			this._midiOutputPort.sendMidiAction(midiAction)
		}
	}

	private _onMidiNoteOn(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		this._midiOutputPort.sendMidiAction({
			...midiAction,
			note: this._enabled
				? midiAction.note + Math.floor(this._pitch.value)
				: midiAction.note,
		})
	}
}

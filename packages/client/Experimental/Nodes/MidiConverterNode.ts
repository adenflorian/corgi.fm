import {OrderedSet} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, ExpCustomNumberParams, ExpCustomEnumParam, ExpCustomEnumParams} from '../ExpParams'
import {ExpMidiOutputPort, ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort, ExpPorts} from '../ExpPorts'
import {midiNoteToFrequency} from '../../WebAudio'
import {LabWaveShaperNode, LabConstantSourceNode} from './PugAudioNode/Lab'

const legatoOptions = ['legato', `legaton't`] as const
type Legato = typeof legatoOptions[number]

export class MidiConverterNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _constantSourceNode: LabConstantSourceNode
	private readonly _waveShaper: LabWaveShaperNode
	private readonly _portamento: ExpCustomNumberParam
	private readonly _legato: ExpCustomEnumParam<Legato>
	private _lastMidiActionTime: number
	private _currentNotes: OrderedSet<number>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Converter', color: CssColor.yellow})

		this._constantSourceNode = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: 'mono', creatorName: 'MidiConverterNode'})
		this._constantSourceNode.offset.setValueAtTime(0, 0)
		this._constantSourceNode.start()

		this._waveShaper = new LabWaveShaperNode({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'MidiConverterNode'})
		this._waveShaper.curve = new Float32Array([-3, 1])

		this._constantSourceNode.connect(this._waveShaper)

		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		const pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, this._waveShaper)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._midiOutputPort, pitchOutputPort])

		this._portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, 3, adsrValueToString)
		this._customNumberParams = arrayToESIdKeyMap([this._portamento])

		this._legato = new ExpCustomEnumParam<Legato>('legato', `legaton't`, legatoOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._legato] as ExpCustomEnumParam<string>[])

		this._lastMidiActionTime = 0
		this._currentNotes = OrderedSet()
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {
		this._midiOutputPort.sendMidiAction(midiActions.gate(this._lastMidiActionTime, false))
	}

	protected _dispose() {
		this._constantSourceNode.dispose()
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled) return

		this._lastMidiActionTime = midiAction.time

		if (midiAction.type === 'MIDI_NOTE') {
			this._onMidiNoteAction(midiAction)
		}
	}

	private _onMidiNoteAction(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		if (midiAction.gate === true) {
			this._onMidiNoteOn(midiAction)
		} else {
			this._onMidiNoteOff(midiAction)
		}
	}

	private _onMidiNoteOn(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		const fresh = this._currentNotes.size === 0
		this._currentNotes = this._currentNotes.add(midiAction.note)
		this._updatePitch(midiAction.note, midiAction.time)
		if (fresh || this._legato.value === `legaton't`) {
			this._midiOutputPort.sendMidiAction(midiAction)
		}
	}

	private _onMidiNoteOff(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		// Remove note from currently playing notes
		this._currentNotes = this._currentNotes.delete(midiAction.note)

		// Get last currently playing note
		const noteToPlay = this._currentNotes.last(null)

		if (noteToPlay === null) {
			this._sendGateOff(midiAction)
		} else {
			this._updatePitch(noteToPlay, midiAction.time)
			// Retrigger/!Legato?
			// this._midiOutputPort.sendMidiAction({...midiAction, gate: true})
		}
	}

	private _updatePitch(note: number, time: number) {
		const frequency = midiNoteToFrequency(note)
		const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
		this._constantSourceNode.offset.setTargetAtTime(normalized, time, this._portamento.value)
	}

	private _sendGateOff(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		this._midiOutputPort.sendMidiAction(midiAction)
	}
}

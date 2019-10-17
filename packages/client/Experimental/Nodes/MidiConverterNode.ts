/* eslint-disable no-empty-function */
import {OrderedSet} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {oscillatorFreqCurveFunctions} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, buildCustomNumberParamDesc} from '../ExpParams'
import {ExpMidiOutputPort, ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort} from '../ExpPorts'
import {midiNoteToFrequency} from '../../WebAudio'

export class MidiConverterNode extends CorgiNode {
	private readonly _midiInputPort: ExpMidiInputPort
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _constantSourceNode: ConstantSourceNode
	private _lastMidiActionTime: number
	private _currentNotes: OrderedSet<number>

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const constantSourceNode = corgiNodeArgs.audioContext.createConstantSource()
		constantSourceNode.offset.setValueAtTime(0, 0)
		constantSourceNode.start()

		const midiInputPort = new ExpMidiInputPort('input', 'input', () => this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		const midiOutputPort = new ExpMidiOutputPort('gate', 'gate', () => this)
		const pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', () => this, constantSourceNode, 'unipolar')

		super(corgiNodeArgs, {
			ports: [midiInputPort, midiOutputPort, pitchOutputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
				// TODO Store in private class field
				buildCustomNumberParamDesc('portamento', 0, 0, 8, 3, adsrValueToString),
			]),
		})

		this._midiInputPort = midiInputPort
		this._midiOutputPort = midiOutputPort
		this._lastMidiActionTime = 0
		this._currentNotes = OrderedSet()

		// Make sure to add these to the dispose method!
		this._constantSourceNode = constantSourceNode
	}

	public getColor(): string {return CssColor.green}
	public getName() {return 'Midi Converter'}

	private get _portamento() {return this._customNumberParams.get('portamento')!.value}

	public render() {return this.getDebugView()}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled) return

		this._lastMidiActionTime = midiAction.time

		if (midiAction.type === 'MIDI_NOTE') {
			if (midiAction.gate === true) {
				this._currentNotes = this._currentNotes.add(midiAction.note)
				const frequency = midiNoteToFrequency(midiAction.note)
				const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
				this._constantSourceNode.offset.setTargetAtTime(normalized, midiAction.time, this._portamento)
				this._midiOutputPort.sendMidiAction(midiAction)
			} else {
				this._currentNotes = this._currentNotes.delete(midiAction.note)
				if (this._currentNotes.size === 0) {
					this._midiOutputPort.sendMidiAction(midiAction)
				} else {
					const noteToPlay = this._currentNotes.last(null)
					if (noteToPlay !== null) {
						const frequency = midiNoteToFrequency(noteToPlay)
						const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
						this._constantSourceNode.offset.setTargetAtTime(normalized, midiAction.time, this._portamento)
					}
				}
			}
		}
	}

	protected _enable() {
	}

	protected _disable() {
		this._midiOutputPort.sendMidiAction(midiActions.gate(this._lastMidiActionTime, false))
	}

	protected _dispose() {
		this._constantSourceNode.stop()
		this._constantSourceNode.disconnect()
	}
}

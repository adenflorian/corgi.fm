/* eslint-disable no-empty-function */
import {OrderedSet} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
import {ExpMidiOutputPort, ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort, ExpPorts} from '../ExpPorts'
import {midiNoteToFrequency} from '../../WebAudio'

export class MidiConverterNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _constantSourceNode: ConstantSourceNode
	private readonly _portamento: ExpCustomNumberParam
	private _lastMidiActionTime: number
	private _currentNotes: OrderedSet<number>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._constantSourceNode = corgiNodeArgs.audioContext.createConstantSource()
		this._constantSourceNode.offset.setValueAtTime(0, 0)
		this._constantSourceNode.start()

		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		const pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, this._constantSourceNode, 'unipolar')
		this._ports = arrayToESIdKeyMap([midiInputPort, this._midiOutputPort, pitchOutputPort])

		this._portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, 3, adsrValueToString)
		this._customNumberParams = arrayToESIdKeyMap([this._portamento])

		this._lastMidiActionTime = 0
		this._currentNotes = OrderedSet()
	}

	public getColor = () => CssColor.green
	public getName = () => 'Midi Converter'
	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {
		this._midiOutputPort.sendMidiAction(midiActions.gate(this._lastMidiActionTime, false))
	}

	protected _dispose() {
		this._constantSourceNode.stop()
		this._constantSourceNode.disconnect()
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled) return

		this._lastMidiActionTime = midiAction.time

		if (midiAction.type === 'MIDI_NOTE') {
			if (midiAction.gate === true) {
				this._currentNotes = this._currentNotes.add(midiAction.note)
				const frequency = midiNoteToFrequency(midiAction.note)
				const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
				this._constantSourceNode.offset.setTargetAtTime(normalized, midiAction.time, this._portamento.value)
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
						this._constantSourceNode.offset.setTargetAtTime(normalized, midiAction.time, this._portamento.value)
					}
				}
			}
		}
	}
}

import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts, ExpNodeAudioOutputPort} from '../ExpPorts'
import {midiNoteToFrequency} from '../../WebAudio'
import {ExpPolyphonicOutputPort, PolyOutNode, PolyVoices, PolyVoice} from '../ExpPolyphonicPorts'
import {PolyAlgorithm, RoundRobin, VoiceIndex} from './NodeHelpers/PolyAlgorithms'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {LabAudioNode, LabConstantSourceNode, LabGain, LabWaveShaperNode} from './PugAudioNode/Lab'

const maxVoiceCount = 32

export class AutomaticPolyphonicMidiConverterNode extends CorgiNode implements PolyOutNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _portamento: ExpCustomNumberParam
	private readonly _voiceCount: ExpCustomNumberParam
	private readonly _algorithm: PolyAlgorithm
	// private readonly _polyOutPort: ExpPolyphonicOutputPort
	private readonly _pitchOutputPort: ExpNodeAudioOutputPort
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _pitchSource: LabConstantSourceNode
	private readonly _waveShaper: LabWaveShaperNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Automatic Polyphonic Midi Converter', color: CssColor.yellow})

		this._portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, 3, adsrValueToString)
		this._voiceCount = new ExpCustomNumberParam('voiceCount', 4, 1, maxVoiceCount, 1, val => Math.round(val).toString())
		this._customNumberParams = arrayToESIdKeyMap([this._portamento, this._voiceCount])

		this._waveShaper = new LabWaveShaperNode({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'AutomaticPolyphonicMidiConverterNode._waveShaper'})
		this._waveShaper.curve = new Float32Array([-3, 1])
		
		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		// this._polyOutPort = new ExpPolyphonicOutputPort('poly', 'poly', this)
		this._pitchSource = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: Math.round(this._voiceCount.value), creatorName: 'AutomaticPolyphonicMidiConverterNode._pitchSource'})
		this._pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, this._waveShaper)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([midiInputPort/*, this._polyOutPort*/, this._pitchOutputPort, this._midiOutputPort])

		this._pitchSource.connect(this._waveShaper)
		
		this._algorithm = new RoundRobin(this._voiceCount.onChange)
		this._voiceCount.onChange.subscribe(this._onVoiceCountChange)

		this._midiOutputPort.sendMidiAction(midiActions.voiceCountChange(this._audioContext.currentTime, this._pitchSource.voiceCount))
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}

	protected _dispose() {
		this._voiceCount.onChange.unsubscribe(this._onVoiceCountChange)
	}

	private readonly _onVoiceCountChange = (newVoiceCount: number) => {
		const roundedNewVoiceCount = Math.round(newVoiceCount)
		if (this._pitchSource.voiceCount === roundedNewVoiceCount) return
		console.log(`AutomaticPolyphonicMidiConverterNode._onVoiceCountChange ${roundedNewVoiceCount}`)
		this._pitchSource.setVoiceCount(roundedNewVoiceCount)
		this._midiOutputPort.sendMidiAction(midiActions.voiceCountChange(this._audioContext.currentTime, roundedNewVoiceCount))
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled && midiAction.type !== 'VOICE_COUNT_CHANGE') return

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
		const voiceIndex = this._algorithm.getVoiceForNoteOn(midiAction.note)

		this._updatePitch(midiAction.note, midiAction.time, voiceIndex)
		this._midiOutputPort.sendMidiAction({...midiAction, voice: voiceIndex as number})
	}

	private _onMidiNoteOff(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		const voiceIndex = this._algorithm.getVoiceForNoteOff(midiAction.note)

		if (voiceIndex === undefined) return

		this._midiOutputPort.sendMidiAction({...midiAction, voice: voiceIndex as number})
	}

	private _updatePitch(note: number, time: number, voiceIndex: VoiceIndex) {
		const frequency = midiNoteToFrequency(note)
		const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
		this._pitchSource.offset.setTargetAtTime(normalized, time, this._portamento.value, voiceIndex as number)
		this._pitchSource.setActiveVoice(voiceIndex as number, time)
		// console.log('update pitch:', {note, voiceIndex, frequency, normalized})
	}
}

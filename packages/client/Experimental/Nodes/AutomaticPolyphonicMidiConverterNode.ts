import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction} from '@corgifm/common/common-types'
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
import {LabAudioNode} from './PugAudioNode/Lab'

const maxVoiceCount = 32

export class AutomaticPolyphonicMidiConverterNode extends CorgiNode implements PolyOutNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _portamento: ExpCustomNumberParam
	private readonly _voiceCount: ExpCustomNumberParam
	private readonly _algorithm: PolyAlgorithm
	private readonly _voices: PolyVoices = []
	// private readonly _polyOutPort: ExpPolyphonicOutputPort
	private readonly _pitchOutputPort: ExpNodeAudioOutputPort
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _pitchSources: CorgiObjectChangedEvent<Immutable.Map<Id, LabAudioNode>>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Automatic Polyphonic Midi Converter', color: CssColor.yellow})

		this._portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, 3, adsrValueToString)
		this._voiceCount = new ExpCustomNumberParam('voiceCount', 4, 1, maxVoiceCount, 1, val => Math.round(val).toString())
		this._customNumberParams = arrayToESIdKeyMap([this._portamento, this._voiceCount])
		
		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		// this._polyOutPort = new ExpPolyphonicOutputPort('poly', 'poly', this)
		this._pitchSources = new CorgiObjectChangedEvent<Immutable.Map<Id, LabAudioNode>>(this._getPitchSources())
		this._pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, this._pitchSources)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([midiInputPort/*, this._polyOutPort*/, this._pitchOutputPort, this._midiOutputPort])
		
		this._algorithm = new RoundRobin(this._voiceCount.onChange)
		this._voiceCount.onChange.subscribe(this._onVoiceCountChange)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}

	protected _dispose() {
		this._voiceCount.onChange.unsubscribe(this._onVoiceCountChange)
	}

	private readonly _getPitchSources = () => {
		return this._voices.reduce((map, voice) => {
			return map.set(voice.index.toString(), voice.pitchOut)
		}, Immutable.Map<Id, LabAudioNode>())
	}

	private readonly _onVoiceCountChange = (newVoiceCount: number) => {
		const roundedNewVoiceCount = Math.round(newVoiceCount)
		let currentVoiceCount = 0
		this._voices.forEach(sourceVoice => {
			if (sourceVoice) {
				currentVoiceCount++
			}
		})
		// console.log({currentVoiceCount, roundedNewVoiceCount})

		if (roundedNewVoiceCount === currentVoiceCount) return

		if (roundedNewVoiceCount < currentVoiceCount) {
			this.destroyVoices(roundedNewVoiceCount)
		} else {
			this.createVoices(roundedNewVoiceCount - currentVoiceCount, currentVoiceCount)
		}

		this._pitchSources.invokeImmediately(this._getPitchSources())
	}

	private destroyVoices(newVoiceCount: number) {
		const destroyedVoiceIndexes = [] as number[]
		this._voices.forEach((sourceVoice, i) => {
			if (i < newVoiceCount) return
			sourceVoice.dispose()
			delete this._voices[i]
			destroyedVoiceIndexes.push(i)
		})
		console.log('onVoicesDestroyed:', destroyedVoiceIndexes)
	}

	private createVoices(numberToAdd: number, currentVoiceCount: number) {
		const createdVoiceIndexes = [] as number[]
		for (let i = 0; i < numberToAdd; i++) {
			const newVoiceIndex = currentVoiceCount + i
			this._voices[newVoiceIndex] = new PolyVoice(newVoiceIndex, this._audioContext)
			createdVoiceIndexes.push(newVoiceIndex)
		}
		console.log('onVoicesCreated:', createdVoiceIndexes)
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled) return

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
		this._voices[voiceIndex as number].sendMidiAction(midiAction)
	}

	private _onMidiNoteOff(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		const voiceIndex = this._algorithm.getVoiceForNoteOff(midiAction.note)

		if (voiceIndex === undefined) return

		this._voices[voiceIndex as number].sendMidiAction(midiAction)
	}

	private _updatePitch(note: number, time: number, voiceIndex: VoiceIndex) {
		const frequency = midiNoteToFrequency(note)
		const normalized = oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
		this._voices[voiceIndex as number].pitchSource.setTargetAtTime(normalized, time, this._portamento.value)
		// console.log('update pitch:', {note, voiceIndex, frequency, normalized})
	}
}

/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction} from '@corgifm/common/common-types'
import {oscillatorFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {maxPitchFrequency} from '@corgifm/common/common-constants'
import {adsrValueToString} from '../../client-constants'
import {ExpCustomNumberParam, ExpCustomNumberParams} from '../ExpParams'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'
import {midiNoteToFrequency} from '../../WebAudio'
import {ExpPolyphonicOutputPort, PolyOutNode, PolyVoices} from '../ExpPolyphonicPorts'
import {PolyAlgorithm, RoundRobin, VoiceIndex} from './NodeHelpers/PolyAlgorithms'

const maxVoiceCount = 32

export class AutomaticPolyphonicMidiConverterNode extends CorgiNode implements PolyOutNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _portamento: ExpCustomNumberParam
	private readonly _voiceCount: ExpCustomNumberParam
	private readonly _algorithm: PolyAlgorithm
	private readonly _voices: PolyVoices = []
	private readonly _polyOutPort: ExpPolyphonicOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Automatic Polyphonic Midi Converter', color: CssColor.yellow})

		this._portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, 3, adsrValueToString)
		this._voiceCount = new ExpCustomNumberParam('voiceCount', 4, 1, maxVoiceCount, 1, val => Math.round(val).toString())
		this._voiceCount.onChange.subscribe(this._onVoiceCountChange)
		this._customNumberParams = arrayToESIdKeyMap([this._portamento, this._voiceCount])

		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		this._polyOutPort = new ExpPolyphonicOutputPort('poly', 'poly', this, this._voiceCount.onChange)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._polyOutPort])

		this._algorithm = new RoundRobin(this._voiceCount.onChange)
		this._onVoiceCountChange(this._voiceCount.value)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}

	protected _dispose() {
		this._voiceCount.onChange.unsubscribe(this._onVoiceCountChange)
	}

	public onVoicesCreated = (createdVoiceIndexes: readonly number[]) => {
		// for (let i = 0; i < createdVoiceIndexes.length; i++) {
		// 	const newIndex = createdVoiceIndexes[i]
		// 	const newVoice = this._voices[newIndex]
		// 	const newPitchSource = this._createPitchSource()
		// 	this._pitchSources[newIndex] = newPitchSource
		// 	const newPitchWaveShaper = this._createPitchWaveShaper()
		// 	this._waveShapers[newIndex] = newPitchWaveShaper
		// 	newPitchSource.connect(newPitchWaveShaper).connect(newVoice.pitchInput)

		// 	this._midiReceivers[newIndex] = newVoice.gateInput
		// }
		console.log('onVoicesCreated:', createdVoiceIndexes)
	}

	public onVoicesDestroyed(destroyedVoiceIndexes: readonly number[]) {
		// for (let i = 0; i < destroyedVoiceIndexes.length; i++) {
		// 	const indexOfDeath = destroyedVoiceIndexes[i]
		// 	this._pitchSources[indexOfDeath].stop()
		// 	this._pitchSources[indexOfDeath].disconnect()
		// 	delete this._pitchSources[indexOfDeath]
		// 	this._waveShapers[indexOfDeath].disconnect()
		// 	delete this._waveShapers[indexOfDeath]
		// 	// this._midiReceivers[indexOfDeath]
		// }
		console.log('onVoicesDestroyed:', destroyedVoiceIndexes)
	}

	public getVoices(): PolyVoices {
		return this._voices
	}

	private readonly _onVoiceCountChange = (newVoiceCount: number) => {
		// const realVoiceCount = Math.round(newVoiceCount)

		// for (let i = 0; i < maxVoiceCount; i++) {
		// 	if (i < realVoiceCount) {
		// 		this._midiOutputPorts[i].enable()
		// 		this._pitchOutputPorts[i].enable()
		// 	} else {
		// 		this._midiOutputPorts[i].disable()
		// 		this._pitchOutputPorts[i].disable()
		// 	}
		// }
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
	}
}

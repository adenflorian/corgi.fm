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
import {PolyAlgorithm, RoundRobin, VoiceIndex} from './NodeHelpers/PolyAlgorithms'
import {LabConstantSourceNode, LabWaveShaperNode} from './PugAudioNode/Lab'

const maxVoiceCount = 32

export class AutomaticPolyphonicMidiConverterNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _pitchOutputPort: ExpNodeAudioOutputPort
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _autoPolyHound: AutomaticPolyphonicMidiConverterHound

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Automatic Polyphonic Midi Converter', color: CssColor.yellow})

		this._autoPolyHound = new AutomaticPolyphonicMidiConverterHound(
			this._audioContext,
			this._onHoundMidiActionOut,
		)

		this._customNumberParams = arrayToESIdKeyMap([this._autoPolyHound.portamento, this._autoPolyHound.voiceCount])

		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		this._pitchOutputPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, this._autoPolyHound.pitchOutputWaveShaper)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([midiInputPort, this._pitchOutputPort, this._midiOutputPort])

		this._autoPolyHound.init()
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}

	protected _dispose() {
		this._autoPolyHound.dispose()
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled && midiAction.type !== 'VOICE_COUNT_CHANGE') return
		this.debugInfo.invokeNextFrame(JSON.stringify(midiAction))

		if (midiAction.type === 'MIDI_NOTE') {
			this._autoPolyHound.onMidiMessage(midiAction)
		}
	}

	private readonly _onHoundMidiActionOut = (action: MidiAction) => {
		this._midiOutputPort.sendMidiAction(action)
	}
}

export class AutomaticPolyphonicMidiConverterHound {
	public readonly portamento: ExpCustomNumberParam
	public readonly voiceCount: ExpCustomNumberParam
	private readonly _algorithm: PolyAlgorithm
	public readonly pitchSource: LabConstantSourceNode
	public readonly pitchOutputWaveShaper: LabWaveShaperNode

	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _midiOut: (action: MidiAction) => void,
		public readonly normalizePitch = true,
	) {

		this.portamento = new ExpCustomNumberParam('portamento', 0, 0, 8, {curve: 3, valueString: adsrValueToString})
		this.voiceCount = new ExpCustomNumberParam('voiceCount', 10, 1, maxVoiceCount, {curve: 1, valueString: val => Math.round(val).toString()})

		this.pitchOutputWaveShaper = new LabWaveShaperNode({
			audioContext: this._audioContext, voiceMode: 'autoPoly',
			creatorName: 'AutomaticPolyphonicMidiConverterNode._waveShaper'})
		this.pitchOutputWaveShaper.curve = new Float32Array([-3, 1])

		this.pitchSource = new LabConstantSourceNode({
			audioContext: this._audioContext, voiceMode: Math.round(this.voiceCount.value),
			creatorName: 'AutomaticPolyphonicMidiConverterNode._pitchSource'})
		this.pitchSource.offset.onMakeVoice = offset => offset.setValueAtTime(0, 0)

		this.pitchSource.connect(this.pitchOutputWaveShaper)

		this._algorithm = new RoundRobin(this.voiceCount.onChange)
		this.voiceCount.onChange.subscribe(this._onVoiceCountChange)
	}

	public init() {
		this._midiOut(midiActions.voiceCountChange(this._audioContext.currentTime, this.pitchSource.voiceCount.current))
	}

	private readonly _onVoiceCountChange = (newVoiceCount: number) => {
		const roundedNewVoiceCount = Math.round(newVoiceCount)
		if (this.pitchSource.voiceCount.current === roundedNewVoiceCount) return
		this.pitchSource.setVoiceCount(roundedNewVoiceCount)
		this._midiOut(midiActions.voiceCountChange(this._audioContext.currentTime, roundedNewVoiceCount))
	}

	public onMidiMessage(midiAction: MidiAction) {
		if (midiAction.type === 'MIDI_NOTE') {
			this._onMidiNoteAction(midiAction)
		}
	}

	private _onMidiNoteAction(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		if (midiAction.gate === true) {
			if (midiAction.offNote !== undefined) this._onMidiNoteOff({...midiAction, note: midiAction.offNote, velocity: 0, gate: false})
			this._onMidiNoteOn(midiAction)
		} else {
			this._onMidiNoteOff(midiAction)
		}
	}

	private _onMidiNoteOn(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		const voiceIndex = this._algorithm.getVoiceForNoteOn(midiAction.note)

		this._updatePitch(midiAction.note, midiAction.time, voiceIndex)
		this._midiOut({...midiAction, voice: voiceIndex as number})
	}

	private _onMidiNoteOff(midiAction: Extract<MidiAction, {type: 'MIDI_NOTE'}>) {
		const voiceIndex = this._algorithm.getVoiceForNoteOff(midiAction.note)
		// this.debugInfo.invokeNextFrame(this.debugInfo.current + '\n' + JSON.stringify({voiceIndex}))

		if (voiceIndex === undefined) return

		this._midiOut({...midiAction, voice: voiceIndex as number})
	}

	private _updatePitch(note: number, time: number, voiceIndex: VoiceIndex) {
		const frequency = midiNoteToFrequency(note)
		const normalized = this.normalizePitch
			? oscillatorFreqCurveFunctions.unCurve(frequency / maxPitchFrequency)
			: frequency
		this.pitchSource.offset.setTargetAtTime(normalized, time, this.portamento.value, voiceIndex as number)
		this.pitchSource.setActiveVoice(voiceIndex as number, time)
		// console.log('update pitch:', {note, voiceIndex, frequency, normalized})
	}

	public dispose() {
		this.voiceCount.onChange.unsubscribe(this._onVoiceCountChange)
	}
}

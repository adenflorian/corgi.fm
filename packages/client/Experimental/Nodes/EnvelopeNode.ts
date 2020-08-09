import {CssColor} from '@corgifm/common/shamu-color'
import {clamp, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {MidiAction} from '@corgifm/common/common-types'
import {logger} from '../../client-logger'
import {
	adsrValueToString, gainDecibelValueToString,
} from '../../client-constants'
import {ExpNodeAudioOutputPort, ExpPorts} from '../ExpPorts'
import {
	ExpCustomNumberParam, ExpCustomNumberParams,
} from '../ExpParams'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {LabWaveShaperNode, LabConstantSourceNode, LabGain} from './PugAudioNode/Lab'
import {VoiceIndex} from './NodeHelpers/PolyAlgorithms'
import {getEnvelopeControlsComponent} from './EnvelopeControls'
import {expAttackMax, expHoldMax, expDecayMax, expReleaseMax, expSustainMax, expAttackCurve, expHoldCurve, expDecayCurve, expSustainCurve, expReleaseCurve} from '@corgifm/common/common-constants'

const longTime = 999999999
const minDistance = 0.00001
const lowestGain = 0.00001

export class EnvelopeNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _outputGain: LabGain
	private readonly _envelopeHound: EnvelopeHound
	public readonly attack: ExpCustomNumberParam
	public readonly hold: ExpCustomNumberParam
	public readonly decay: ExpCustomNumberParam
	public readonly sustain: ExpCustomNumberParam
	public readonly release: ExpCustomNumberParam

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		super(corgiNodeArgs, {name: 'Envelope', color: CssColor.purple})

		this._envelopeHound = new EnvelopeHound(corgiNodeArgs)

		this.attack = this._envelopeHound.attack
		this.hold = this._envelopeHound.hold
		this.decay = this._envelopeHound.decay
		this.sustain = this._envelopeHound.sustain
		this.release = this._envelopeHound.release

		this._outputGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'EnvelopeNode'})

		this._envelopeHound.waveShaperOutput.connect(this._outputGain)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputGain)
		const midiInputPort = new ExpMidiInputPort('input', 'input', this, this.receiveMidiAction)
		this._ports = arrayToESIdKeyMap([outputPort, midiInputPort])

		this._customNumberParams = arrayToESIdKeyMap([
			this._envelopeHound.attack, this._envelopeHound.hold, this._envelopeHound.decay, this._envelopeHound.sustain, this._envelopeHound.release,
		])
	}

	public render = () => this.getDebugView(getEnvelopeControlsComponent())

	protected _enable = () => {
		this._outputGain.gain.onMakeVoice = gain => gain.setValueAtTime(1, this._audioContext.currentTime)
	}
	protected _disable = () => {
		this._outputGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, this._audioContext.currentTime)
	}

	protected _dispose() {
		this._outputGain.dispose()
		this._envelopeHound.dispose()
	}

	private readonly receiveMidiAction = (midiAction: MidiAction) => {
		this._envelopeHound.receiveMidiAction(midiAction)
	}
}

export class EnvelopeHound {
	private readonly _constantSource: LabConstantSourceNode
	public readonly waveShaperOutput: LabWaveShaperNode
	private _lastGateTime = -1
	private _lastGate?: boolean
	public readonly attack: ExpCustomNumberParam
	public readonly hold: ExpCustomNumberParam
	public readonly decay: ExpCustomNumberParam
	public readonly sustain: ExpCustomNumberParam
	public readonly release: ExpCustomNumberParam
	private readonly _audioContext: AudioContext

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		this._audioContext = corgiNodeArgs.audioContext

		this._constantSource = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: 1, creatorName: 'EnvelopeNode'})
		this.waveShaperOutput = new LabWaveShaperNode({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'EnvelopeNode'})
		this.waveShaperOutput.curve = new Float32Array([-3, 1])

		this._constantSource.connect(this.waveShaperOutput)

		this._constantSource.offset.onMakeVoice = offset => {
			offset.setValueAtTime(0, 0)
			offset.linearRampToValueAtTime(0, longTime)
		}

		this.attack = new ExpCustomNumberParam('attack', 0.0004, 0, expAttackMax, {curve: expAttackCurve, valueString: adsrValueToString}) // 0.0005
		this.hold = new ExpCustomNumberParam('hold', 0, 0, expHoldMax, {curve: expHoldCurve, valueString: adsrValueToString}) // 0
		this.decay = new ExpCustomNumberParam('decay', 1, 0, expDecayMax, {curve: expDecayCurve, valueString: adsrValueToString}) // 1
		this.sustain = new ExpCustomNumberParam('sustain', 0, 0, expSustainMax, {curve: expSustainCurve, valueString: gainDecibelValueToString}) // 1
		this.release = new ExpCustomNumberParam('release', 0.015, 0, expReleaseMax, {curve: expReleaseCurve, valueString: adsrValueToString}) // 0.015
	}

	public dispose() {
		this._constantSource.dispose()
	}

	public receiveMidiAction(midiAction: MidiAction) {
		if (midiAction.type === 'VOICE_COUNT_CHANGE') {
			// console.log('receiveMidiAction VOICE_COUNT_CHANGE', this, midiAction.newCount)
			this._constantSource.setVoiceCount(midiAction.newCount)
		} else if (midiAction.type === 'MIDI_GATE' || midiAction.type === 'MIDI_NOTE') {
			this.handleGateEvent(midiAction.gate, midiAction.time, midiAction.voice)
		}
	}

	public handleGateEvent(gate: boolean, startTime: number, voiceIndex: number | 'all') {
		// this.debugInfo.invokeNextFrame(JSON.stringify({gate, startTime, voiceIndex}))
		if (startTime < this._lastGateTime) {
			// logger.error('receiveMidiAction startTime < this._lastGateTime:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
			startTime = this._lastGateTime + 0.0001
		}
		if (startTime === this._lastGateTime) {
			// logger.warn('receiveMidiAction startTime === this._lastGateTime:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
			// startTime += 0.001
			startTime += 0.0001
		}
		// This should be ok, it's like a retrigger
		// if (gate === this._lastGate) {
		// 	logger.error('receiveMidiAction gate === this._lastGate:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		// }
		// logger.log({startTime, currentTime: this._audioContext.currentTime/*, diff: startTime - this._audioContext.currentTime */})
		if (startTime < this._audioContext.currentTime) {
			// logger.warn('[receiveMidiAction] startTime < this._audioContext.currentTime:', {startTime, currentTime: this._audioContext.currentTime})
			startTime = this._audioContext.currentTime + 0.001
		}
		if (startTime === this._audioContext.currentTime) {
			// logger.warn('[receiveMidiAction] startTime === this._audioContext.currentTime:', {startTime, currentTime: this._audioContext.currentTime})
			startTime = this._audioContext.currentTime + 0.001
		}
		this._lastGateTime = startTime
		this._lastGate = gate
		// console.log({startTime, gate})
		const offset = this._constantSource.offset
		if (gate) {
			const attackEnd = startTime + Math.max(this.attack.value, minDistance)
			const holdEnd = attackEnd + Math.max(this.hold.value, minDistance)
			const decayEnd = holdEnd + Math.max(this.decay.value, minDistance)
			const farOut = decayEnd + longTime
			const actualSustain = clamp(this.sustain.value, lowestGain, 1)
			// console.log(`${voiceIndex}`)
			offset.cancelAndHoldAtTime(startTime, voiceIndex)
			offset.linearRampToValueAtTime(1, attackEnd, voiceIndex)
			// offset.linearRampToValueAtTime(1, holdEnd, voiceIndex)
			offset.exponentialRampToValueAtTime(actualSustain, decayEnd, voiceIndex)
			offset.linearRampToValueAtTime(actualSustain, farOut, voiceIndex)
			this._constantSource.setActiveVoice(voiceIndex, startTime)
		} else {
			const releaseEnd = startTime + Math.max(this.release.value, minDistance)
			const farOut = releaseEnd + longTime
			offset.cancelAndHoldAtTime(startTime, voiceIndex)
			offset.exponentialRampToValueAtTime(lowestGain, releaseEnd, voiceIndex)
			offset.linearRampToValueAtTime(lowestGain, farOut, voiceIndex)
		}
		// farOut is to provide an event to be canceled so an anchor point can
		// be created whenever cancelAndHoldAtTime is called.
	}
}

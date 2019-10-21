/* eslint-disable no-empty-function */
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

const longTime = 999999999
const minDistance = 0.00001

export class EnvelopeNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _constantSource: ConstantSourceNode
	private readonly _outputGain: GainNode
	private _lastGateTime = -1
	private _lastGate?: boolean
	private readonly _attack: ExpCustomNumberParam
	private readonly _hold: ExpCustomNumberParam
	private readonly _decay: ExpCustomNumberParam
	private readonly _sustain: ExpCustomNumberParam
	private readonly _release: ExpCustomNumberParam

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		super(corgiNodeArgs)

		this._constantSource = corgiNodeArgs.audioContext.createConstantSource()
		this._outputGain = corgiNodeArgs.audioContext.createGain()

		this._constantSource.offset.value = 0
		this._constantSource.connect(this._outputGain)
		this._constantSource.start()
		this._constantSource.offset.linearRampToValueAtTime(0, longTime)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputGain, 'unipolar')
		const midiInputPort = new ExpMidiInputPort('input', 'input', this, midiAction => this.receiveMidiAction.bind(this)(midiAction))
		this._ports = arrayToESIdKeyMap([outputPort, midiInputPort])

		this._attack = new ExpCustomNumberParam('attack', 0.0004, 0, 32, 3, adsrValueToString) // 0.0005
		this._hold = new ExpCustomNumberParam('hold', 0, 0, 32, 3, adsrValueToString) // 0
		this._decay = new ExpCustomNumberParam('decay', 1, 0, 32, 3, adsrValueToString) // 1
		this._sustain = new ExpCustomNumberParam('sustain', 1, 0, 1, 1, gainDecibelValueToString) // 1
		this._release = new ExpCustomNumberParam('release', 0.015, 0, 32, 3, adsrValueToString) // 0.015
		this._customNumberParams = arrayToESIdKeyMap([
			this._attack, this._hold, this._decay, this._sustain, this._release,
		])
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Envelope'
	public render = () => this.getDebugView()

	protected _enable = () => this._outputGain.gain.value = 1
	protected _disable = () => this._outputGain.gain.value = 0

	protected _dispose() {
		this._constantSource.stop()
		this._constantSource.disconnect()
		this._outputGain.disconnect()
	}

	public receiveMidiAction(midiAction: MidiAction) {
		if (midiAction.gate !== undefined) {
			this.handleGateEvent(midiAction.gate, midiAction.time)
		}
	}

	public handleGateEvent(gate: boolean, startTime: number) {
		if (startTime < this._lastGateTime) {
			logger.error('receiveMidiAction startTime < this._lastGateTime:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		}
		// This should be ok, it's like a retrigger
		// if (gate === this._lastGate) {
		// 	logger.error('receiveMidiAction gate === this._lastGate:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		// }
		this._lastGateTime = startTime
		this._lastGate = gate
		// logger.log({startTime, currentTime: this._audioContext.currentTime/*, diff: startTime - this._audioContext.currentTime */})
		if (startTime < this._audioContext.currentTime) {
			logger.warn('[receiveMidiAction] startTime < this._audioContext.currentTime:', {startTime, currentTime: this._audioContext.currentTime})
		}
		const offset = this._constantSource.offset
		if (gate) {
			const attackEnd = startTime + this._attack.value + minDistance
			const holdEnd = attackEnd + this._hold.value + minDistance
			const decayEnd = holdEnd + this._decay.value + minDistance
			const farOut = decayEnd + longTime + minDistance
			const actualSustain = clamp(this._sustain.value, 0.0001, 1)
			offset.cancelAndHoldAtTime(startTime)
			offset.linearRampToValueAtTime(1, attackEnd)
			offset.linearRampToValueAtTime(1, holdEnd)
			offset.exponentialRampToValueAtTime(actualSustain, decayEnd)
			offset.linearRampToValueAtTime(actualSustain, farOut)
		} else {
			const releaseEnd = startTime + this._release.value + minDistance
			const farOut = releaseEnd + longTime + minDistance
			offset.cancelAndHoldAtTime(startTime)
			offset.exponentialRampToValueAtTime(0.0001, releaseEnd)
			offset.linearRampToValueAtTime(0.0001, farOut)
		}
		// farOut is to provide an event to be canceled so an anchor point can
		// be created whenever cancelAndHoldAtTime is called.
	}
}
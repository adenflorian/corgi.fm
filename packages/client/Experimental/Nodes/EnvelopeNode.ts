/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {clamp} from '@corgifm/common/common-utils'
import {logger} from '../../client-logger'
import {
	adsrValueToString, gainDecibelValueToString,
} from '../../client-constants'
import {ExpNodeAudioOutputPort} from '../ExpPorts'
import {
	ExpCustomNumberParam, buildCustomNumberParamDesc,
} from '../ExpParams'
import {ExpGateInputPort} from '../ExpGatePorts'
import {CorgiNode} from '../CorgiNode'

const longTime = 999999999
const minDistance = 0.00001

export class EnvelopeNode extends CorgiNode {
	private readonly _constantSource: ConstantSourceNode
	private readonly _outputGain: GainNode
	// private _intervalId: NodeJS.Timeout
	private _lastGateTime: number
	private _lastGate?: boolean

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const constantSource = audioContext.createConstantSource()
		const outputGain = audioContext.createGain()

		constantSource.offset.value = 0
		constantSource.connect(outputGain)
		constantSource.start()
		constantSource.offset.linearRampToValueAtTime(0, longTime)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, outputGain, 'unipolar')

		const gateInputPort = new ExpGateInputPort('input', 'input', () => this, (gate, time) => this.receiveGateSignal.bind(this)(gate, time))

		super(id, audioContext, preMasterLimiter, {
			ports: [outputPort, gateInputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
				// TODO Store reference in private class field
				// buildCustomNumberParamDesc('attack', 0.0005, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('hold', 0, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('decay', 1, 0, 32, 3, adsrValueToString),
				// buildCustomNumberParamDesc('sustain', 1, 0, 1, 1, gainDecibelValueToString),
				// buildCustomNumberParamDesc('release', 0.015, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('attack', 0.25, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('hold', 0, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('decay', 0, 0, 32, 3, adsrValueToString),
				buildCustomNumberParamDesc('sustain', 1, 0, 1, 1, gainDecibelValueToString),
				buildCustomNumberParamDesc('release', 32, 0, 32, 3, adsrValueToString),
			]),
		})

		this._lastGateTime = -1

		// Make sure to add these to the dispose method!
		this._constantSource = constantSource
		this._outputGain = outputGain

		// this._intervalId = setInterval(() => {
		// 	this.receiveGateSignal(true, this.audioContext.currentTime + 0.5)
		// 	this.receiveGateSignal(false, this.audioContext.currentTime + 1.5)
		// }, 1000)
	}

	public getColor(): string {
		return CssColor.blue
	}

	public getName() {return 'Envelope'}

	public receiveGateSignal(gate: boolean, startTime: number) {
		if (startTime < this._lastGateTime) {
			logger.error('receiveGateSignal startTime < this._lastGateTime:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		}
		// This should be ok, it's like a retrigger
		// if (gate === this._lastGate) {
		// 	logger.error('receiveGateSignal gate === this._lastGate:', {gate, startTime, last: this._lastGateTime, lastGate: this._lastGate})
		// }
		this._lastGateTime = startTime
		this._lastGate = gate
		// logger.log({startTime, currentTime: this._audioContext.currentTime/*, diff: startTime - this._audioContext.currentTime */})
		if (startTime < this._audioContext.currentTime) {
			logger.warn('[receiveGateSignal] startTime < this._audioContext.currentTime:', {startTime, currentTime: this._audioContext.currentTime})
		}
		const offset = this._constantSource.offset
		if (gate) {
			const attackEnd = startTime + this._attackSeconds + minDistance
			const holdEnd = attackEnd + this._holdSeconds + minDistance
			const decayEnd = holdEnd + this._decaySeconds + minDistance
			const farOut = decayEnd + longTime + minDistance
			const actualSustain = clamp(this._sustain, 0.0001, 1)
			offset.cancelAndHoldAtTime(startTime)
			offset.linearRampToValueAtTime(1, attackEnd)
			offset.linearRampToValueAtTime(1, holdEnd)
			offset.exponentialRampToValueAtTime(actualSustain, decayEnd)
			offset.linearRampToValueAtTime(actualSustain, farOut)
		} else {
			const releaseEnd = startTime + this._releaseSeconds + minDistance
			const farOut = releaseEnd + longTime + minDistance
			offset.cancelAndHoldAtTime(startTime)
			offset.exponentialRampToValueAtTime(0.0001, releaseEnd)
			offset.linearRampToValueAtTime(0.0001, farOut)
		}
		// farOut is to provide an event to be canceled so an anchor point can
		// be created whenever cancelAndHoldAtTime is called.
	}

	private get _attackSeconds() {return this._customNumberParams.get('attack')!.value}
	private get _holdSeconds() {return this._customNumberParams.get('hold')!.value}
	private get _decaySeconds() {return this._customNumberParams.get('decay')!.value}
	private get _sustain() {return this._customNumberParams.get('sustain')!.value}
	private get _releaseSeconds() {return this._customNumberParams.get('release')!.value}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._outputGain.gain.value = 1
	}

	protected _disable() {
		this._outputGain.gain.value = 0
	}

	protected _dispose() {
		this._constantSource.stop()
		this._constantSource.disconnect()
		this._outputGain.disconnect()
		// clearInterval(this._intervalId)
	}
}

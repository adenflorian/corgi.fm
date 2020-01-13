import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {LabAudioNode} from './PugAudioNode/Lab'

export class ExpPolyTestNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private _oscillators: Immutable.Map<Id, OscillatorNode>
	// private readonly _oscillatorsEvent: CorgiObjectChangedEvent<Immutable.Map<Id, LabAudioNode>>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'ExpPolyTestNode', color: CssColor.red})

		this._oscillators = Immutable.Map<Id, OscillatorNode>()
			.set('0', this._audioContext.createOscillator())
			.set('1', this._audioContext.createOscillator())
			.set('2', this._audioContext.createOscillator())

		let nextFrequency = 880

		this._oscillators.forEach(osc => {
			osc.type = 'sawtooth'
			osc.frequency.setValueAtTime(nextFrequency, 0)
			osc.start()
			nextFrequency *= 0.5
		})

		// this._oscillatorsEvent = new CorgiObjectChangedEvent<Immutable.Map<Id, LabAudioNode>>(this._oscillators)

		// const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._oscillatorsEvent)

		this._ports = arrayToESIdKeyMap([])

		setTimeout(() => {
			const newOsc = this._audioContext.createOscillator()
			newOsc.type = 'sawtooth'
			newOsc.frequency.setValueAtTime(nextFrequency, 0)
			newOsc.start()
			nextFrequency *= 0.5
			this._oscillators = this._oscillators.set('3', newOsc)
			// this._oscillatorsEvent.invokeImmediately(this._oscillators)
		}, 5000)
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
		this._oscillators.forEach(osc => {
			osc.stop()
			osc.disconnect()
		})
	}
}

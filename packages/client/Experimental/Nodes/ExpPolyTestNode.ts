/* eslint-disable no-empty-function */
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'

export class ExpPolyTestNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _oscillators: Immutable.Map<Id, OscillatorNode>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscillator', color: CssColor.green})

		this._oscillators = Immutable.Map<Id, OscillatorNode>()
			.set('0', corgiNodeArgs.audioContext.createOscillator())
			.set('1', corgiNodeArgs.audioContext.createOscillator())
			.set('2', corgiNodeArgs.audioContext.createOscillator())

		let nextFrequency = 440

		this._oscillators.forEach(osc => {
			osc.type = 'sawtooth'
			osc.frequency.setValueAtTime(nextFrequency, 0)
			osc.start()
			nextFrequency *= 0.5
		})

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._oscillators)

		this._ports = arrayToESIdKeyMap([outputPort])
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

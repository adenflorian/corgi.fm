import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {LabAudioNode, LabOscillator} from './PugAudioNode/Lab'

export class ExpPolyTestNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private _oscillator: LabOscillator

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'ExpPolyTestNode', color: CssColor.red})

		this._oscillator = new LabOscillator({audioContext: this._audioContext, voiceMode: 3, creatorName: 'ExpPolyTestNode'})

		let nextFrequency = 880

		this._oscillator.start()
		this._oscillator.type = 'sawtooth'
		this._oscillator.frequency.setValueAtTime(220, 0, 0)
		this._oscillator.frequency.setValueAtTime(230, 0, 1)

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._oscillator)

		this._ports = arrayToESIdKeyMap([outputPort])

		setTimeout(() => {
			// const newOsc = this._audioContext.createOscillator()
			// newOsc.type = 'sawtooth'
			// newOsc.frequency.setValueAtTime(nextFrequency, 0)
			// newOsc.start()
			// nextFrequency *= 0.5
			// this._oscillators = this._oscillators.set('3', newOsc)
			// this._oscillatorsEvent.invokeImmediately(this._oscillators)
			this._oscillator.frequency.setValueAtTime(400, 0, 2)
		}, 5000)
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
		this._oscillator.dispose()
	}
}

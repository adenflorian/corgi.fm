/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {gainDecibelValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class ExpGainNode extends CorgiNode {
	private readonly _gain: GainNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const gain = corgiNodeArgs.audioContext.createGain()
		gain.gain.value = 0

		const dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, gain)

		const gainParam = new ExpAudioParam('gain', gain.gain, 1, 1, 'unipolar', {valueString: gainDecibelValueToString})

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, () => this, corgiNodeArgs.audioContext, 'offset')

		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain, 'bipolar')

		super(corgiNodeArgs, {
			ports: [inputPort, gainPort, outputPort],
			audioParams: [gainParam],
			// new ExpAudioParam('gain', gain.gain, 1, 0, 10, 3.33, gainDecibelValueToString),
		})

		// Make sure to add these to the dispose method!
		this._gain = gain
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Gain'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._gain.disconnect()
		this._dryWetChain.dispose()
	}
}

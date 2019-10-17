/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {panValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class ExpPanNode extends CorgiNode {
	private readonly _pan: StereoPannerNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const pan = corgiNodeArgs.audioContext.createStereoPanner()

		const dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, pan)

		const panParam = new ExpAudioParam('pan', pan.pan, 0, 1, 'bipolar', {valueString: panValueToString})

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const panPort = new ExpNodeAudioParamInputPort(panParam, () => this, corgiNodeArgs.audioContext, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain, 'bipolar')

		super(corgiNodeArgs, {
			ports: [inputPort, panPort, outputPort],
			audioParams: [panParam],
		})

		// Make sure to add these to the dispose method!
		this._pan = pan
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.purple
	}

	public getName() {return 'Pan'}

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
		this._pan.disconnect()
		this._dryWetChain.dispose()
	}
}

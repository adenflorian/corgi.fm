/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode} from '../CorgiNode'

export class ConstantExpNode extends CorgiNode {
	private readonly _constantSourceNode: ConstantSourceNode
	private readonly _outputGain: GainNode

	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		const constantSourceNode = audioContext.createConstantSource()
		constantSourceNode.start()
		const outputGain = audioContext.createGain()
		constantSourceNode.connect(outputGain)

		const offsetParam = new ExpAudioParam('offset', constantSourceNode.offset, 0, 1, 'bipolar')

		const offsetPort = new ExpNodeAudioParamInputPort(offsetParam, () => this, audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, outputGain, 'bipolar')

		super(id, audioContext, preMasterLimiter, {
			ports: [offsetPort, outputPort],
			audioParams: [offsetParam],
		})

		// Make sure to add these to the dispose method!
		this._constantSourceNode = constantSourceNode
		this._outputGain = outputGain
	}

	public getColor(): string {
		return CssColor.green
	}

	public getName() {return 'Constant'}

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
		this._constantSourceNode.stop()
		this._constantSourceNode.disconnect()
		this._outputGain.disconnect()
	}
}

/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'

export class ConstantExpNode extends CorgiNode {
	protected readonly _audioParams: ExpAudioParams
	protected readonly _ports: ExpPorts
	private readonly _constantSourceNode: ConstantSourceNode
	private readonly _outputGain: GainNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._constantSourceNode = corgiNodeArgs.audioContext.createConstantSource()
		this._constantSourceNode.start()
		this._outputGain = corgiNodeArgs.audioContext.createGain()
		this._constantSourceNode.connect(this._outputGain)

		const offsetParam = new ExpAudioParam('offset', this._constantSourceNode.offset, 0, 1, 'bipolar')
		this._audioParams = arrayToESIdKeyMap([offsetParam])

		const offsetPort = new ExpNodeAudioParamInputPort(offsetParam, this, corgiNodeArgs.audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputGain, 'bipolar')
		this._ports = arrayToESIdKeyMap([offsetPort, outputPort])
	}

	public getName() {return 'Constant'}
	public getColor() {return CssColor.green}

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

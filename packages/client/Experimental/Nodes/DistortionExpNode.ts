import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {percentageValueString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {createCorgiDownSamplerWorkletNode} from '../../WebAudio/AudioWorklets/audio-worklets'
import {logger} from '../../client-logger'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class DistortionExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	private readonly _downSamplerWorkletNode: AudioNode
	private readonly _dryWetChain: DryWetChain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {
			name: 'Downsample',
			color: CssColor.orange,
			requiresAudioWorklet: true,
		})

		const downSamplerWorkletNode = createCorgiDownSamplerWorkletNode(corgiNodeArgs.audioContext)
		const dummyGainNode = corgiNodeArgs.audioContext.createGain()
		this._downSamplerWorkletNode = downSamplerWorkletNode || dummyGainNode

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._downSamplerWorkletNode)

		const driveAudioParam = getDriveAudioParam(downSamplerWorkletNode, dummyGainNode)

		const driveParam = new ExpAudioParam('drive', driveAudioParam, 0.25, 1, 'unipolar', {valueString: percentageValueString})
		this._audioParams = arrayToESIdKeyMap([driveParam])

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const drivePort = new ExpNodeAudioParamInputPort(driveParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)
		this._ports = arrayToESIdKeyMap([inputPort, drivePort, outputPort])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._downSamplerWorkletNode.disconnect()
		this._dryWetChain.dispose()
	}
}

function getDriveAudioParam(downSamplerWorkletNode: AudioWorkletNode | null, dummyGainNode: GainNode) {
	let driveAudioParam: AudioParam | undefined

	if (downSamplerWorkletNode) {
		driveAudioParam = downSamplerWorkletNode.parameters.get('drive')

		if (!driveAudioParam) {
			logger.error('drive audio worklet node param not found', {downSamplerWorkletNode})
		}
	}

	if (!driveAudioParam) {
		driveAudioParam = dummyGainNode.gain
	}

	return driveAudioParam
}

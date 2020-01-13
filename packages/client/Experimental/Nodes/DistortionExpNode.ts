import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {percentageValueString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {LabDistortionNode} from '../../WebAudio/AudioWorklets/audio-worklets'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class DistortionExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	private readonly _distortion: LabDistortionNode
	private readonly _dryWetChain: DryWetChain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {
			name: 'Downsample',
			color: CssColor.orange,
			requiresAudioWorklet: true,
		})

		this._distortion = new LabDistortionNode({audioContext: this._audioContext, voiceMode: 'mono', creatorName: 'DistortionExpNode'})

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._distortion)

		const driveParam = new ExpAudioParam('drive', this._distortion.drive, 0.25, 1, 'unipolar', {valueString: percentageValueString})
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
		this._distortion.disconnect()
		this._dryWetChain.dispose()
	}
}

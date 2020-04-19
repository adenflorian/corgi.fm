import {CssColor} from '@corgifm/common/shamu-color'
import {filterFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {percentageValueString, filterValueToString, adsrValueToString} from '../../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam, ExpCustomNumberParam, ExpCustomNumberParams} from '../../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {DryWetChain} from '../NodeHelpers/DryWetChain'
import {LabConvolutionReverbNode} from '../PugAudioNode/LabConvolutionReverb'
import {KelpieConvolutionReverb} from '../PugAudioNode/KelpieConvolutionReverb'

export class ExpConvolutionReverbNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _dryWetChain: DryWetChain
	private readonly _convolutionReverbHound: ConvolutionReverbHound

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Convolution Reverb', color: CssColor.orange})

		this._convolutionReverbHound = new ConvolutionReverbHound(corgiNodeArgs)

		this._customEnumParams = arrayToESIdKeyMap([/*this._convolutionReverbHound.filterType*/] as ExpCustomEnumParam<string>[])

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._convolutionReverbHound.reverb, 'mono')

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		// const cutoffPort = new ExpNodeAudioParamInputPort(this._convolutionReverbHound.cutoffParam, this, corgiNodeArgs, 'center')
		// const dryPort = new ExpNodeAudioParamInputPort(this._convolutionReverbHound.dryParam, this, corgiNodeArgs, 'center')
		// const wetPort = new ExpNodeAudioParamInputPort(this._convolutionReverbHound.wetParam, this, corgiNodeArgs, 'center')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)

		this._ports = arrayToESIdKeyMap([inputPort, /*cutoffPort, dryPort, wetPort, */outputPort])

		this._audioParams = arrayToESIdKeyMap([
			// this._convolutionReverbHound.cutoffParam,
			// this._convolutionReverbHound.dryParam,
			// this._convolutionReverbHound.wetParam,
		])

		this._customNumberParams = arrayToESIdKeyMap([
			this._convolutionReverbHound.time,
			this._convolutionReverbHound.decay,
		])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._convolutionReverbHound.dispose()
		this._dryWetChain.dispose()
	}
}

export class ConvolutionReverbHound {
	public readonly reverb: LabConvolutionReverbNode
	public readonly time: ExpCustomNumberParam
	public readonly decay: ExpCustomNumberParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		this.reverb = new LabConvolutionReverbNode({...corgiNodeArgs, voiceMode: 'mono', creatorName: 'ConvolutionReverbHound'})

		this.time = new ExpCustomNumberParam('time', 4, KelpieConvolutionReverb.minTime, KelpieConvolutionReverb.maxTime, {curve: 3, valueString: adsrValueToString})
		this.decay = new ExpCustomNumberParam('decay', 2, KelpieConvolutionReverb.minDecay, KelpieConvolutionReverb.maxDecay)

		this.time.onChange.subscribe(this.onTimeChange)
		this.decay.onChange.subscribe(this.onDecayChange)
	}

	public dispose() {
		this.reverb.disconnect()
	}

	private readonly onTimeChange = (time: number) => {
		this.reverb.time = time
	}

	private readonly onDecayChange = (decay: number) => {
		this.reverb.decay = decay
	}
}

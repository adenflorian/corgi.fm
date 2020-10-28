import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'
import {LabWaveShaperNode} from './PugAudioNode/Lab'

const modes = {
	toBipolar: new Float32Array([-3, 1]),
	toUnipolar: new Float32Array([0, 1]),
}

const waveShaperModes = Object.keys(modes) as unknown as (keyof typeof modes)[]
type WaveShaperMode = typeof waveShaperModes[number]

export class ExpWaveShaperNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _mode: ExpCustomEnumParam<WaveShaperMode>
	private readonly _waveShaper: LabWaveShaperNode
	private readonly _dryWetChain: DryWetChain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Wave Shaper', color: CssColor.orange})

		this._mode = new ExpCustomEnumParam<WaveShaperMode>('mode', 'toBipolar', waveShaperModes)
		this._customEnumParams = arrayToESIdKeyMap([this._mode] as ExpCustomEnumParam<string>[])

		this._waveShaper = new LabWaveShaperNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'ExpWaveShaperNode'})

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._waveShaper, 'autoPoly')

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)
		this._ports = arrayToESIdKeyMap([inputPort, outputPort])

		this._mode.onChange.subscribe(this._onWaveShaperModeChange)
	}

	private readonly _onWaveShaperModeChange = (mode: WaveShaperMode) => {
		this._waveShaper.curve = modes[mode]
	}

	public render = () => this.getDebugView()

	protected _enable = () =>	this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._waveShaper.disconnect()
		this._dryWetChain.dispose()
		this._mode.onChange.unsubscribe(this._onWaveShaperModeChange)
	}
}

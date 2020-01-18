import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {gainDecibelValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'
import {LabGain} from './PugAudioNode/Lab'

const autoPolyOptions = ['mono', 'autoPoly'] as const
type AutoPoly = typeof autoPolyOptions[number]

export class ExpGainNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _autoPoly: ExpCustomEnumParam<AutoPoly>
	private readonly _gain: LabGain
	private readonly _dryWetChain: DryWetChain
	protected readonly _audioParams: ExpAudioParams

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Gain', color: CssColor.orange})

		this._autoPoly = new ExpCustomEnumParam<AutoPoly>('autoPoly', 'mono', autoPolyOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._autoPoly] as ExpCustomEnumParam<string>[])

		this._gain = new LabGain({...corgiNodeArgs, voiceMode: 'mono', creatorName: 'ExpGainNode'})
		this._gain.gain.value = 0

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._gain, 'mono')

		const gainParam = new ExpAudioParam('gain', this._gain.gain, 1, 1, 'unipolar', {valueString: gainDecibelValueToString})
		this._audioParams = arrayToESIdKeyMap([gainParam]) as ReadonlyMap<Id, ExpAudioParam>

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)
		this._ports = arrayToESIdKeyMap([inputPort, gainPort, outputPort])

		this._autoPoly.onChange.subscribe(this._onAutoPolyChange)
	}

	private readonly _onAutoPolyChange = (autoPoly: AutoPoly) => {
		this._gain.setVoiceCount(autoPoly)
		this._dryWetChain.setAutoPoly(autoPoly)
	}

	public render = () => this.getDebugView()

	protected _enable = () =>	this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._gain.disconnect()
		this._dryWetChain.dispose()
		this._autoPoly.onChange.unsubscribe(this._onAutoPolyChange)
	}
}

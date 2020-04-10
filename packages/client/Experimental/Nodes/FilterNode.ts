import {CssColor} from '@corgifm/common/shamu-color'
import {filterFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {percentageValueString, filterValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'
import {LabBiquadFilterNode} from './PugAudioNode/Lab'

const filterTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf',
	'highshelf', 'peaking', 'notch', 'allpass'] as const
type FilterType = typeof filterTypes[number]

export class FilterNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _dryWetChain: DryWetChain
	private readonly _filterHound: FilterHound

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Filter', color: CssColor.orange})

		this._filterHound = new FilterHound(corgiNodeArgs)

		this._customEnumParams = arrayToESIdKeyMap([this._filterHound.type] as ExpCustomEnumParam<string>[])

		this._dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, this._filterHound.filter, 'autoPoly')

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._dryWetChain.inputGain)
		const frequencyPort = new ExpNodeAudioParamInputPort(this._filterHound.frequencyParam, this, corgiNodeArgs, 'center')
		const detunePort = new ExpNodeAudioParamInputPort(this._filterHound.detuneParam, this, corgiNodeArgs, 'center')
		const qPort = new ExpNodeAudioParamInputPort(this._filterHound.qParam, this, corgiNodeArgs, 'offset')
		const gainPort = new ExpNodeAudioParamInputPort(this._filterHound.gainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._dryWetChain.outputGain)

		this._ports = arrayToESIdKeyMap([inputPort, frequencyPort, detunePort, qPort, gainPort, outputPort])
		this._audioParams = arrayToESIdKeyMap([
			this._filterHound.frequencyParam, this._filterHound.detuneParam,
			this._filterHound.qParam, this._filterHound.gainParam])
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._dryWetChain.wetOnly()
	protected _disable = () => this._dryWetChain.dryOnly()

	protected _dispose() {
		this._filterHound.dispose()
		this._dryWetChain.dispose()
	}
}

export class FilterHound {
	public readonly filter: LabBiquadFilterNode
	public readonly type: ExpCustomEnumParam<FilterType>
	public readonly frequencyParam: ExpAudioParam
	public readonly detuneParam: ExpAudioParam
	public readonly qParam: ExpAudioParam
	public readonly gainParam: ExpAudioParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		this.type = new ExpCustomEnumParam<FilterType>('type', 'lowpass', filterTypes)
		this.type.onChange.subscribe(this.onTypeChange)

		this.filter = new LabBiquadFilterNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'FilterNode'})
		this.filter.type = 'lowpass'

		this.frequencyParam = new ExpAudioParam('frequency', this.filter.frequency, 632, 20000, 'unipolar',
			{valueString: filterValueToString, curveFunctions: filterFreqCurveFunctions})
		this.detuneParam = new ExpAudioParam('detune', this.filter.detune, 0, 100, 'bipolar', {valueString: filterValueToString})
		this.qParam = new ExpAudioParam('q', this.filter.Q, 1, 18, 'unipolar')
		this.gainParam = new ExpAudioParam('gain', this.filter.gain, 0, 1, 'bipolar', {valueString: percentageValueString})
	}

	public dispose() {
		this.filter.disconnect()
	}

	private readonly onTypeChange = (type: FilterType) => {
		this.filter.type = type
	}
}

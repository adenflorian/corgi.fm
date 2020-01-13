import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpPortState} from '@corgifm/common/redux'
import {percentageValueString} from '../../client-constants'
import {logger} from '../../client-logger'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts, ExpPort,
	ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {LabConstantSourceNode, LabGain, LabTarget, LabAudioNode, LabAudioParam} from './PugAudioNode/Lab'

export class GroupNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, LabGain>()
	private readonly _inputConstantSources = new Map<Id, LabConstantSourceNode>()
	private readonly _outputGains = new Map<Id, LabGain>()

	public constructor(private readonly _corgiNodeArgs: CorgiNodeArgs) {
		super(_corgiNodeArgs, {name: 'Group', color: CssColor.blue})

		this._audioContext = _corgiNodeArgs.audioContext

		const portStates = _corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap(ports.map(x => x[0]))
		this._audioParams = arrayToESIdKeyMap(ports.map(x => x[1]).filter(x => x !== undefined) as ExpAudioParam[])
	}

	public registerChildInputNode(): [ExpNodeAudioInputPort, LabAudioNode][] {
		return (
			[...this._ports]
				.map(x => x[1])
				.filter(x => x.type === 'audio' && x.side === 'in') as ExpNodeAudioInputPort[]
		)
			.map(x => [x, x.destination instanceof LabAudioParam ? this._inputConstantSources.get(x.id)! : x.destination])
	}

	public registerChildOutputNode(): ExpNodeAudioOutputPort[] {
		return [...this._ports].map(x => x[1]).filter(x => x.type === 'audio' && x.side === 'out') as ExpNodeAudioOutputPort[]
	}

	public render = () => this.getDebugView()

	protected _enable = () => {
		this._inputGains.forEach(x => x.gain.setValueAtTime(1, 0))
		this._outputGains.forEach(x => x.gain.setValueAtTime(1, 0))
	}

	protected _disable = () => {
		this._inputGains.forEach(x => x.gain.setValueAtTime(0, 0))
		this._outputGains.forEach(x => x.gain.setValueAtTime(0, 0))
	}

	protected _dispose() {
		this._inputGains.forEach(x => x.disconnect())
		this._inputConstantSources.forEach(x => {
			x.dispose()
		})
		this._outputGains.forEach(x => x.disconnect())
	}

	private readonly _createPort = ({type, inputOrOutput, id, isAudioParamInput}: ExpPortState): [ExpPort, ExpAudioParam | undefined] => {
		if (type === 'audio') {
			if (inputOrOutput === 'input') {
				if (isAudioParamInput) {
					const newConstantSource = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: 'autoPoly'})
					newConstantSource.start()
					this._inputConstantSources.set(id, newConstantSource)
					const audioParam = new ExpAudioParam(id, newConstantSource.offset, 0, 1, 'bipolar', {valueString: percentageValueString})
					return [new ExpNodeAudioParamInputPort(audioParam, this, this._corgiNodeArgs, 'center'), audioParam]
				} else {
					const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly'})
					this._inputGains.set(id, newGain)
					return [new ExpNodeAudioInputPort(id, id as string, this, newGain), undefined]
				}
			} else if (inputOrOutput === 'output') {
				const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly'})
				this._outputGains.set(id, newGain)
				return [new ExpNodeAudioOutputPort(id, id as string, this, newGain), undefined]
			}
		}

		throw new Error('port type not yet supported')
	}
}

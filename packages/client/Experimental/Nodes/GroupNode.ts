/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPortState} from '@corgifm/common/redux';

export class GroupNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, GainNode>()
	private readonly _outputGains = new Map<Id, GainNode>()

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)

		this._audioContext = corgiNodeArgs.audioContext

		const portStates = corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap(ports)
	}

	public registerChildInputNode(): ExpNodeAudioInputPort[] {
		return [...this._ports].map(x => x[1]).filter(x => x instanceof ExpNodeAudioInputPort) as ExpNodeAudioInputPort[]
	}

	public registerChildOutputNode(): ExpNodeAudioOutputPort[] {
		return [...this._ports].map(x => x[1]).filter(x => x instanceof ExpNodeAudioOutputPort) as ExpNodeAudioOutputPort[]
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group'
	public render = () => this.getDebugView()

	protected _enable = () => {
		this._inputGains.forEach(x => x.gain.value = 1)
		this._outputGains.forEach(x => x.gain.value = 1)
	}
	protected _disable = () => {
		this._inputGains.forEach(x => x.gain.value = 0)
		this._outputGains.forEach(x => x.gain.value = 0)
	}

	protected _dispose() {
		this._inputGains.forEach(x => x.disconnect())
		this._outputGains.forEach(x => x.disconnect())
	}

	private _createPort = ({type, inputOrOutput, id}: ExpPortState): ExpPort => {
		if (type === 'audio') {
			if (inputOrOutput === 'input') {
				const newGain = this._audioContext.createGain()
				this._inputGains.set(id, newGain)
				return new ExpNodeAudioInputPort(id, id as string, this, newGain)
			} else if (inputOrOutput === 'output') {
				const newGain = this._audioContext.createGain()
				this._outputGains.set(id, newGain)
				return new ExpNodeAudioOutputPort(id, id as string, this, newGain, 'bipolar')
			}
		}

		throw new Error('port type not yet supported')
	}
}

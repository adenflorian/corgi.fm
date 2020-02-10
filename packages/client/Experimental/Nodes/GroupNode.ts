import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap, noop} from '@corgifm/common/common-utils'
import {ExpPortState} from '@corgifm/common/redux'
import {percentageValueString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts, ExpPort,
	ExpNodeAudioParamInputPort,
	isAudioInputPort,
	isAudioParamInputPort,
	isAudioOutputPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {LabConstantSourceNode, LabGain} from './PugAudioNode/Lab'
import {ExpMidiInputPort, ExpMidiOutputPort, isMidiInputPort, MidiReceiver, isMidiOutputPort} from '../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'

export interface RegisterChildInputNodeResult {
	readonly audioParamInputs: readonly [ExpNodeAudioInputPort, LabConstantSourceNode][]
	readonly audioInputs: readonly ExpNodeAudioInputPort[]
	readonly midiInputs: readonly ExpMidiInputPort[]
}

export interface RegisterChildOutputNodeResult {
	readonly audioOutputs: readonly ExpNodeAudioOutputPort[]
	readonly midiOutputs: readonly ExpMidiOutputPort[]
}

export class GroupNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, LabGain>()
	private readonly _inputConstantSources = new Map<Id, LabConstantSourceNode>()
	private readonly _outputGains = new Map<Id, LabGain>()
	private readonly _midiReceivers = new Map<Id, MidiReceiver>()
	private readonly _midiOutputs = new Map<Id, ExpMidiOutputPort>()

	public constructor(private readonly _corgiNodeArgs: CorgiNodeArgs) {
		super(_corgiNodeArgs, {name: 'Group', color: CssColor.blue})

		this._audioContext = _corgiNodeArgs.audioContext

		const portStates = _corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap(ports.map(x => x[0]))
		this._audioParams = arrayToESIdKeyMap(ports.map(x => x[1]).filter(x => x !== undefined) as ExpAudioParam[])
	}

	public registerChildInputNode(): RegisterChildInputNodeResult {
		const ports = [...this._ports].map(x => x[1])
		return {
			audioParamInputs: ports
				.filter(isAudioParamInputPort)
				.map(x => [x, this._inputConstantSources.get(x.id)!]),
			audioInputs: ports
				.filter(isAudioInputPort)
				.filter(x => !isAudioParamInputPort(x)),
			midiInputs: ports
				.filter(isMidiInputPort),
		}
	}

	public registerMidiOutput(id: Id, outputPort: ExpMidiOutputPort) {
		this._midiReceivers.set(id, outputPort.sendMidiAction)
	}

	public registerChildOutputNode(): RegisterChildOutputNodeResult {
		const ports = [...this._ports].map(x => x[1])
		return {
			audioOutputs: ports.filter(isAudioOutputPort),
			midiOutputs: ports.filter(isMidiOutputPort),
		}
	}

	public onMidiMessageFromChildInputNode(id: Id, action: MidiAction) {
		this._midiOutputs.get(id)!.sendMidiAction(action)
	}

	public render = () => this.getDebugView()

	protected _enable = () => {
		this._inputGains.forEach(x => x.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0))
		this._outputGains.forEach(x => x.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0))
	}

	protected _disable = () => {
		this._inputGains.forEach(x => x.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0))
		this._outputGains.forEach(x => x.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0))
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
					const newConstantSource = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'GroupNode'})
					newConstantSource.offset.onMakeVoice = offset => offset.setValueAtTime(0, 0)
					this._inputConstantSources.set(id, newConstantSource)
					const audioParam = new ExpAudioParam(id, newConstantSource.offset, 0, 1, 'bipolar', {valueString: percentageValueString})
					return [new ExpNodeAudioParamInputPort(audioParam, this, this._corgiNodeArgs, 'center'), audioParam]
				} else {
					const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'GroupNode'})
					const newGainValue = this._enabled ? 1 : 0
					newGain.gain.onMakeVoice = gain => gain.setValueAtTime(newGainValue, 0)
					this._inputGains.set(id, newGain)
					return [new ExpNodeAudioInputPort(id, id as string, this, newGain), undefined]
				}
			} else if (inputOrOutput === 'output') {
				const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'GroupNode'})
				const newGainValue = this._enabled ? 1 : 0
				newGain.gain.onMakeVoice = gain => gain.setValueAtTime(newGainValue, 0)
				this._outputGains.set(id, newGain)
				return [new ExpNodeAudioOutputPort(id, id as string, this, newGain), undefined]
			}
		} else if (type === 'midi') {
			if (inputOrOutput === 'input') {
				this._midiReceivers.set(id, noop)
				return [new ExpMidiInputPort(id, id as string, this, this._onMidiMessage(id)), undefined]
			} else if (inputOrOutput === 'output') {
				const newOutput = new ExpMidiOutputPort(id, id as string, this)
				this._midiOutputs.set(id, newOutput)
				return [newOutput, undefined]
			}
		}

		throw new Error('port type not yet supported')
	}

	private readonly _onMidiMessage = (id: Id) => (midiAction: MidiAction) => {
		this._midiReceivers.get(id)!(midiAction)
	}
}

/* eslint-disable no-param-reassign */
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpPortState} from '@corgifm/common/redux'
import {percentageValueString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts, ExpPort,
	ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {
	ExpPolyphonicInputPort, PolyInNode, PolyOutNode,
	PolyVoices, PolyVoice,
} from '../ExpPolyphonicPorts'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {logger} from '../../client-logger'
import {LabGain, LabAudioNode, LabTarget, LabConstantSourceNode, LabAudioParam} from './PugAudioNode/Lab'

export class PolyphonicGroupNode extends CorgiNode implements PolyInNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, LabGain>()
	private readonly _inputConstantSources = new Map<Id, LabConstantSourceNode>()
	private readonly _outputGains = new Map<Id, LabGain>()
	private readonly _outGain: LabGain
	private readonly _pitchInputPort: ExpNodeAudioInputPort
	private readonly _pitchInputGain: LabGain
	private readonly _midiInputPort: ExpMidiInputPort

	public constructor(private readonly _corgiNodeArgs: CorgiNodeArgs) {
		super(_corgiNodeArgs, {name: 'Polyphonic Group', color: CssColor.blue})

		this._audioContext = _corgiNodeArgs.audioContext

		const portStates = _corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		this._outGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'PolyphonicGroupNode'})
		const audioOut = new ExpNodeAudioOutputPort('out', 'out', this, this._outGain)

		this._pitchInputGain = new LabGain({audioContext: this._audioContext, voiceMode: 'mono', creatorName: 'PolyphonicGroupNode'})
		this._pitchInputPort = new ExpNodeAudioInputPort('pitch', 'pitch', this, this._pitchInputGain)
		this._midiInputPort = new ExpMidiInputPort('gate', 'gate', this, this._onMidiAction)

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap([...ports.map(x => x[0]), audioOut, this._pitchInputPort, this._midiInputPort])

		this._audioParams = arrayToESIdKeyMap(ports.map(x => x[1]).filter(x => x !== undefined) as ExpAudioParam[])
	}

	private readonly _onMidiAction = (midiAction: MidiAction) => {

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
		this._inputGains.forEach(x => {
			x.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0)
		})
		this._outputGains.forEach(x => {
			x.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0)
		})
	}

	protected _disable = () => {
		this._inputGains.forEach(x => {
			x.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)
		})
		this._outputGains.forEach(x => {
			x.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)
		})
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
					const newConstantSource = new LabConstantSourceNode({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'PolyphonicGroupNode'})
					this._inputConstantSources.set(id, newConstantSource)
					const audioParam = new ExpAudioParam(id, newConstantSource.offset, 0, 1, 'bipolar', {valueString: percentageValueString})
					return [new ExpNodeAudioParamInputPort(audioParam, this, this._corgiNodeArgs, 'center'), audioParam]
				} else {
					const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'PolyphonicGroupNode'})
					this._inputGains.set(id, newGain)
					return [new ExpNodeAudioInputPort(id, id as string, this, newGain), undefined]
				}
			} else if (inputOrOutput === 'output') {
				const newGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'PolyphonicGroupNode'})
				this._outputGains.set(id, newGain)
				return [new ExpNodeAudioOutputPort(id, id as string, this, newGain), undefined]
			}
		}

		throw new Error('port type not yet supported')
	}
}

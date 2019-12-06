/* eslint-disable no-param-reassign */
/* eslint-disable no-empty-function */
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
import {SourceTargetPairs} from '../ExpConnections'

export class PolyphonicGroupNode extends CorgiNode implements PolyInNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, GainNode>()
	private readonly _inputConstantSources = new Map<Id, ConstantSourceNode>()
	private readonly _outputGains = new Map<Id, GainNode>()
	private readonly _outGain: GainNode
	private readonly _pitchInputPort: ExpNodeAudioInputPort
	private readonly _pitchInputGain: GainNode
	private readonly _midiInputPort: ExpMidiInputPort
	private readonly _inputSourceEvents = new Map<Id, CorgiObjectChangedEvent<Immutable.Map<Id, AudioNode>>>()

	public constructor(private readonly _corgiNodeArgs: CorgiNodeArgs) {
		super(_corgiNodeArgs, {name: 'Polyphonic Group', color: CssColor.blue})

		this._audioContext = _corgiNodeArgs.audioContext

		const portStates = _corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		// const polyInputPort = new ExpPolyphonicInputPort('poly', 'poly', this)
		this._outGain = _corgiNodeArgs.audioContext.createGain()
		const audioOut = new ExpNodeAudioOutputPort('out', 'out', this, this._outGain)

		this._pitchInputGain = this._audioContext.createGain()
		this._pitchInputPort = new ExpNodeAudioInputPort('pitch', 'pitch', this, this._pitchInputGain)
		this._inputSourceEvents.set(this._pitchInputPort.id, new CorgiObjectChangedEvent<Immutable.Map<Id, AudioNode>>(Immutable.Map({[this._pitchInputPort.id as string]: this._pitchInputGain})))
		this._midiInputPort = new ExpMidiInputPort('gate', 'gate', this, this._onMidiAction)

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap([...ports.map(x => x[0])/*, polyInputPort*/, audioOut, this._pitchInputPort, this._midiInputPort])

		this._audioParams = arrayToESIdKeyMap(ports.map(x => x[1]).filter(x => x !== undefined) as ExpAudioParam[])
	}

	private readonly _onMidiAction = (midiAction: MidiAction) => {

	}

	public registerChildInputNode(): [ExpNodeAudioInputPort, CorgiObjectChangedEvent<Immutable.Map<Id, AudioNode>>][] {
		return ([...this._ports]
			.map(x => x[1])
			.filter(x => x.type === 'audio' && x.side === 'in') as ExpNodeAudioInputPort[])
			.map(x => {
				const event = this._inputSourceEvents.get(x.id)
				if (!event) {
					logger.error('[PolyphonicGroupNode] missing input source event', {event, x, events: this._inputSourceEvents})
					throw new Error('bad')
				}
				return [x, event]
			})
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
			x.stop()
			x.disconnect()
		})
		this._outputGains.forEach(x => x.disconnect())
	}

	private readonly _createPort = ({type, inputOrOutput, id, isAudioParamInput}: ExpPortState): [ExpPort, ExpAudioParam | undefined] => {
		if (type === 'audio') {
			if (inputOrOutput === 'input') {
				if (isAudioParamInput) {
					const newConstantSource = this._audioContext.createConstantSource()
					newConstantSource.start()
					this._inputConstantSources.set(id, newConstantSource)
					this._inputSourceEvents.set(id, new CorgiObjectChangedEvent<Immutable.Map<Id, AudioNode>>(Immutable.Map({[id as string]: newConstantSource})))
					const audioParam = new ExpAudioParam(id, newConstantSource.offset, 0, 1, 'bipolar', {valueString: percentageValueString})
					return [new ExpNodeAudioParamInputPort(audioParam, this, this._corgiNodeArgs, 'center'), audioParam]
				} else {
					const newGain = this._audioContext.createGain()
					this._inputGains.set(id, newGain)
					this._inputSourceEvents.set(id, new CorgiObjectChangedEvent<Immutable.Map<Id, AudioNode>>(Immutable.Map({[id as string]: newGain})))
					return [new ExpNodeAudioInputPort(id, id as string, this, this._pairSourcesWithTargets(newGain)), undefined]
				}
			} else if (inputOrOutput === 'output') {
				const newGain = this._audioContext.createGain()
				this._outputGains.set(id, newGain)
				return [new ExpNodeAudioOutputPort(id, id as string, this, newGain), undefined]
			}
		}

		throw new Error('port type not yet supported')
	}

	private readonly _pairSourcesWithTargets = (target: AudioNode | AudioParam) => (sources: Immutable.Map<Id, AudioNode>): SourceTargetPairs => {
		return sources.map((source, id) => ({
			id, source, target,
		}))
	}
}

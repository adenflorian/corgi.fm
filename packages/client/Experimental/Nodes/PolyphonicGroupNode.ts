/* eslint-disable no-param-reassign */
/* eslint-disable no-empty-function */
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

export class PolyphonicGroupNode extends CorgiNode implements PolyInNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _audioContext: AudioContext
	private readonly _inputGains = new Map<Id, GainNode>()
	private readonly _inputConstantSources = new Map<Id, ConstantSourceNode>()
	private readonly _outputGains = new Map<Id, GainNode>()

	public constructor(private readonly _corgiNodeArgs: CorgiNodeArgs) {
		super(_corgiNodeArgs, {name: 'Polyphonic Group', color: CssColor.blue})

		this._audioContext = _corgiNodeArgs.audioContext

		const portStates = _corgiNodeArgs.ports || new Map<Id, ExpPortState>()

		const polyInputPort = new ExpPolyphonicInputPort('poly', 'poly', this)

		const ports = [...portStates].map(x => x[1]).map(this._createPort)

		this._ports = arrayToESIdKeyMap([...ports.map(x => x[0]), polyInputPort])

		this._audioParams = arrayToESIdKeyMap(ports.map(x => x[1]).filter(x => x !== undefined) as ExpAudioParam[])
	}

	public registerChildInputNode(): [ExpNodeAudioInputPort, AudioNode][] {
		return ([...this._ports].map(x => x[1]).filter(x => x.type === 'audio' && x.side === 'in') as ExpNodeAudioInputPort[])
			.map(x => [x, x.destination instanceof AudioParam ? this._inputConstantSources.get(x.id)! : x.destination])
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

	public onVoiceCountChanged(newVoiceCount: number, sourceNode: PolyOutNode) {
		const sourceVoices = sourceNode.getVoices()
		let currentVoiceCount = 0
		sourceVoices.forEach(sourceVoice => {
			if (sourceVoice) {
				currentVoiceCount++
			}
		})
		// console.log({currentVoiceCount, newVoiceCount})

		if (newVoiceCount === currentVoiceCount) return

		if (newVoiceCount < currentVoiceCount) {
			this.destroyVoices(newVoiceCount, sourceVoices, sourceNode)
		} else {
			this.createVoices(newVoiceCount - currentVoiceCount, sourceVoices, sourceNode, currentVoiceCount)
		}
	}

	private destroyVoices(newVoiceCount: number, sourceVoices: PolyVoices, sourceNode: PolyOutNode) {
		const destroyedVoiceIndexes = [] as number[]
		sourceVoices.forEach((sourceVoice, i) => {
			if (i < newVoiceCount) return
			sourceVoice.dispose()
			delete sourceVoices[i]
			destroyedVoiceIndexes.push(i)
		})
		sourceNode.onVoicesDestroyed(destroyedVoiceIndexes)
	}

	private createVoices(numberToAdd: number, sourceVoices: PolyVoices, sourceNode: PolyOutNode, currentVoiceCount: number) {
		const createdVoiceIndexes = [] as number[]
		for (let i = 0; i < numberToAdd; i++) {
			const newVoiceIndex = currentVoiceCount + i
			sourceVoices[newVoiceIndex] = new PolyVoice(newVoiceIndex, this._audioContext)
			createdVoiceIndexes.push(newVoiceIndex)
		}
		sourceNode.onVoicesCreated(createdVoiceIndexes)
	}

	private readonly _createPort = ({type, inputOrOutput, id, isAudioParamInput}: ExpPortState): [ExpPort, ExpAudioParam | undefined] => {
		if (type === 'audio') {
			if (inputOrOutput === 'input') {
				if (isAudioParamInput) {
					const newConstantSource = this._audioContext.createConstantSource()
					newConstantSource.start()
					this._inputConstantSources.set(id, newConstantSource)
					const audioParam = new ExpAudioParam(id, newConstantSource.offset, 0, 1, 'bipolar', {valueString: percentageValueString})
					return [new ExpNodeAudioParamInputPort(audioParam, this, this._corgiNodeArgs, 'center'), audioParam]
				} else {
					const newGain = this._audioContext.createGain()
					this._inputGains.set(id, newGain)
					return [new ExpNodeAudioInputPort(id, id as string, this, newGain), undefined]
				}
			} else if (inputOrOutput === 'output') {
				const newGain = this._audioContext.createGain()
				this._outputGains.set(id, newGain)
				return [new ExpNodeAudioOutputPort(id, id as string, this, newGain), undefined]
			}
		}

		throw new Error('port type not yet supported')
	}
}

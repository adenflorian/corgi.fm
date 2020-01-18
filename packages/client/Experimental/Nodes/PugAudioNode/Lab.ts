import {logger} from '../../../client-logger'

// Lab
export type LabTarget<TTarget extends KelpieAudioNode = KelpieAudioNode> = LabAudioNode<TTarget> | LabAudioParam<TTarget>

type VoiceCount = number | LabTargetMode

export interface LabAudioNodeArgs {
	readonly audioContext: AudioContext
	readonly voiceMode: VoiceCount
	readonly creatorName: string
}

type LabTargetMode = 'mono' | 'autoPoly'

interface LabTargetConnection {
	readonly target: LabTarget
	readonly targetMode: LabTargetMode
	readonly targetVoices: readonly KelpieTarget[]
}

let id = 0

export abstract class LabAudioNode<TNode extends KelpieAudioNode = KelpieAudioNode> {
	public readonly abstract name: string
	public get fullName() {return `${this.creatorName}-${this.name}-${this.id}`}
	public readonly id = id++
	public readonly voices = [] as TNode[]
	public get voiceCount() {return this.voices.length}
	// Keep track of targets in case we change voice count/mode
	public readonly targets = new Map<LabTarget, LabTargetConnection>()
	// Keep track of sources in case we change voice mode
	public readonly sources = new Set<LabAudioNode>()
	private _mode: VoiceCount = 'mono'
	public get mode() {return this._mode}
	protected _audioContext: AudioContext
	private _currentModeImpl: LabModeImpl<TNode> = new LabMono(this)
	public get currentModeImpl() {return this._currentModeImpl}
	private readonly _params = new Set<LabAudioParam>()
	public get params() {return this._params as ReadonlySet<LabAudioParam>}
	public readonly creatorName: string

	public constructor(args: LabAudioNodeArgs) {
		this._audioContext = args.audioContext
		this.creatorName = args.creatorName
		this._mode = args.voiceMode
	}

	// Do not make into a property
	public init() {
		this.setVoiceCount(this._mode, true)
	}

	// Called on the source
	public readonly connect = <TTarget extends LabTarget>(target: TTarget): TTarget => {
		console.log(`connecting ${this.creatorName}.${this.name}(${this.mode}) to ${target.creatorName}.${target.name}(${target.mode})`)
		const [targetMode, targetVoices] = target.onConnect(this)
		this._currentModeImpl.connect(target, targetMode, targetVoices)
		this.targets.set(target, {target, targetMode, targetVoices})
		return target
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, KelpieAudioNode[]] => {
		this.sources.add(source)
		const voices = this._currentModeImpl.onConnect(source)
		return voices
	}

	public readonly onConnectThroughParam = (param: LabAudioParam, source: LabAudioNode): readonly [LabTargetMode, TNode[]] => {
		logger.assert(this.params.has(param), 'missing param!')
		return this._currentModeImpl.onConnect(source)
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] => {
		return this._currentModeImpl.onSourceVoiceCountChange(source)
	}

	public abstract _makeVoice(voiceIndex: number): TNode

	public readonly setVoiceCount = (newVoiceCount: VoiceCount, init = false) => {
		if (!init && newVoiceCount === this.mode) return
		this._mode = newVoiceCount

		if (newVoiceCount === 'mono') {
			this._currentModeImpl = new LabMono(this)
			this._currentModeImpl.setVoiceCount(1)
			this.sources.forEach(source => {
				source.onTargetVoiceModeChange(this, newVoiceCount, this.voices)
			})
			this.params.forEach(param => {
				param.sources.forEach(source => {
					source.onTargetVoiceModeChange(param, newVoiceCount, this.voices)
				})
			})
		} else if (newVoiceCount === 'autoPoly') {
			this._currentModeImpl = new LabAutoPoly(this)
			this._currentModeImpl.setVoiceCount(0)
			this.sources.forEach(source => {
				source.onTargetVoiceModeChange(this, newVoiceCount, this.voices)
			})
			this.params.forEach(param => {
				param.sources.forEach(source => {
					source.onTargetVoiceModeChange(param, newVoiceCount, this.voices)
				})
			})
		} else {
			this._currentModeImpl = new LabStaticPoly(this)
			this._currentModeImpl.setVoiceCount(newVoiceCount)
		}
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) => {
		this._currentModeImpl.onTargetVoiceModeChange(target, targetMode, targetVoices)
	}

	public readonly disconnect = (target?: LabTarget) => {
		if (target) {
			const targetConnection = this.targets.get(target)
			if (!targetConnection) throw new Error('!targetConnection')
			this._currentModeImpl.disconnect(target, targetConnection.targetVoices)
			target.onDisconnect(this)
			this.targets.delete(target)
		} else {
			this.targets.forEach(target2 => {
				this.disconnect(target2.target)
			})
			logger.assert(this.targets.size === 0, 'this.targets.size === 0')
		}
	}

	public readonly onDisconnect = (source: LabAudioNode) => {
		this.sources.delete(source)
		this._currentModeImpl.onDisconnect(source)
	}

	public readonly onDisconnectThroughParam = (param: LabAudioParam, source: LabAudioNode) => {
		logger.assert(this.params.has(param), 'missing param2!')
		this._currentModeImpl.onDisconnect(source)
	}

	public readonly onParamAdd = (param: LabAudioParam) => {
		this._params.add(param)
	}

	public readonly onParamDispose = (param: LabAudioParam) => {
		this._params.delete(param)
	}

	public readonly dispose = () => {
		this.voices.forEach(voice => voice.dispose())
		this.params.forEach(param => param.dispose())
	}
}

abstract class LabModeImpl<TNode extends KelpieAudioNode> {
	public abstract connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]): void
	public abstract onConnect(source: LabAudioNode): readonly [LabTargetMode, TNode[]]
	public abstract onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]]
	public abstract setVoiceCount(voiceCount: number): void
	public abstract onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]): void
	public onTargetVoiceCountChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]): void {
		// Only meant to be overridden by mono
	}
	public abstract disconnect(target: LabTarget, targetVoices: readonly KelpieTarget[]): void
	public abstract onDisconnect(source: LabAudioNode): void
	public abstract dispose(): void
}

class LabAutoPoly<TNode extends KelpieAudioNode = KelpieAudioNode> extends LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {
		super()
	}

	// Called on the source
	public readonly connect = <TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) => {
		const [targetMode, targetVoices] = target.onConnect(this._parent)
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices[0] as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices[i] as KelpieAudioNode)
			})
		}
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, TNode[]] => {
		const sourceVoiceCount = source.voices.length
		this._setVoiceCount(this._getMaxSourceVoiceCount())
		return ['autoPoly', this._parent.voices]
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): [LabTargetMode, TNode[]] => {
		console.log(`${this._parent.creatorName} LabAutoPoly.onSourceVoiceCountChange source: ${source.name}`)

		this._setVoiceCount(this._getMaxSourceVoiceCount())
		return ['autoPoly', this._parent.voices]
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		console.log(`${this._parent.creatorName} LabAutoPoly.setVoiceCount`)
		this._setVoiceCount(this._getMaxSourceVoiceCount())
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) {
			logger.warn(`this:`, this._parent)
			logger.warn(`target:`, target)
			logger.warn(`parentTargets:`, this._parent.targets)
			logger.warn(`thisParams:`, this._parent.params)
			throw new Error('!oldTargetConnection' + JSON.stringify({
				thisName: this._parent.fullName,
				targetName: target.fullName,
			}))
		}
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices[i] as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices[0] as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices[0] as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices[i] as KelpieAudioNode)
			})
		}
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private readonly _getMaxSourceVoiceCount = (): number => {
		let maxSourceVoiceCount = 0
		this._parent.sources.forEach(source => {
			maxSourceVoiceCount = Math.max(maxSourceVoiceCount, source.voiceCount)
		})
		this._parent.params.forEach(param => {
			param.sources.forEach(paramSource => {
				maxSourceVoiceCount = Math.max(maxSourceVoiceCount, paramSource.voiceCount)
			})
		})
		console.log(`${this._parent.creatorName} LabAutoPoly._getMaxSourceVoiceCount: ${maxSourceVoiceCount}`)
		return maxSourceVoiceCount
	}

	private readonly _setVoiceCount = (newVoiceCount: number) => {
		const delta = Math.max(newVoiceCount, 1) - this._parent.voices.length
		console.log(`${this._parent.creatorName} LabAutoPoly._setVoiceCount delta: ${delta}`)

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			return
		}

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			if (targetMode === 'mono') {
				this._parent.voices.forEach((voice) => {
					voice.connect(targetVoices[0] as KelpieAudioNode)
				})
			} else {
				this._parent.voices.forEach((voice, i) => {
					voice.connect(targetVoices[i] as KelpieAudioNode)
				})
			}
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
			this._parent.sources.forEach(source => source.currentModeImpl.onTargetVoiceCountChange(this._parent, 'autoPoly', this._parent.voices))
		})
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			console.log(this._parent.voices)
			this._parent.voices.push(this._parent._makeVoice(this._parent.voices.length))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly disconnect = (target: LabTarget, targetVoices: readonly KelpieTarget[]) => {
		this._parent.voices.forEach((voice, i) => {
			voice.disconnect(targetVoices[i])
		})
	}

	public readonly onDisconnect = (source: LabAudioNode) => {
		console.log(`${this._parent.creatorName} LabAutoPoly.onDisconnect source: ${source.name}`)
		this._setVoiceCount(this._getMaxSourceVoiceCount())
	}

	public readonly dispose = () => {}
}

class LabStaticPoly<TNode extends KelpieAudioNode = KelpieAudioNode> extends LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {
		super()
	}

	// Called on the source
	public readonly connect = <TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) => {
		console.log(`LabStaticPoly.connect start. this._parent.voices.length: ${this._parent.voices.length}. this._parent.voices`, this._parent.voices)
		const [targetMode, targetVoices] = target.onConnect(this._parent)
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices[0] as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices[i] as KelpieAudioNode)
			})
		}
		console.log(`LabStaticPoly.connect end`)
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, TNode[]] => {
		throw new Error('nothing is allowed to connect to static poly')
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] => {
		throw new Error('wrong!')
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices.push(this._parent._makeVoice(this._parent.voices.length))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly disconnect = (target: LabTarget, targetVoices: readonly KelpieTarget[]) => {
		this._parent.voices.forEach((voice, i) => {
			voice.disconnect(targetVoices[i])
		})
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		const delta = Math.max(newVoiceCount, 1) - this._parent.voices.length
		console.log(`${this._parent.creatorName} LabStaticPoly newVoiceCount: ${newVoiceCount}, delta: ${delta}`)

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			return
		}

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			if (targetMode === 'mono') {
				this._parent.voices.forEach((voice) => {
					voice.connect(targetVoices[0] as KelpieAudioNode)
				})
			} else {
				this._parent.voices.forEach((voice, i) => {
					voice.connect(targetVoices[i] as KelpieAudioNode)
				})
			}
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
		})
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices[i] as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices[0] as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices[0] as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices[i] as KelpieAudioNode)
			})
		}
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	public readonly onDisconnect = (source: LabAudioNode) => {}

	public readonly dispose = () => {}
}

class LabMono<TNode extends KelpieAudioNode = KelpieAudioNode> extends LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {
		super()
	}

	public readonly connect = <TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) => {
		const [_, targetVoices] = target.onConnect(this._parent)
		this._connectToTargetVoices(targetVoices)
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly ['mono', TNode[]] => {
		logger.assert(this._parent.voiceCount === 1, 'this._parent.voiceCount === 1, this._parent.voiceCount: ' + this._parent.voiceCount)
		return ['mono', this._parent.voices]
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		const delta = 1 - this._parent.voiceCount
		console.log(`LabMono.setVoiceCount delta: ${delta}`)
		if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else if (delta > 0) {
			logger.assert(delta === 1, 'delta === 1')
			this._addVoices(delta)
		}

		logger.assert(this._parent.voiceCount === 1, 'this._parent.voiceCount === 1')

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			this._connectToTargetVoices(targetVoices)
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
		})
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		oldTargetConnection.targetVoices.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})
		this._connectToTargetVoices(targetVoices)
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	public readonly onTargetVoiceCountChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		if (targetMode !== 'autoPoly') throw new Error('expected autoPoly!')

		oldTargetConnection.targetVoices.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})
		this._connectToTargetVoices(targetVoices)

		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private get _monoVoice() {return this._parent.voices[0]}

	private readonly _connectToTargetVoices = (targetVoices: readonly KelpieTarget[]) => {
		targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
			this._monoVoice.connect(targetVoice)
		})
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices.push(this._parent._makeVoice(this._parent.voiceCount))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] => {
		return ['mono', this._parent.voices]
	}

	public readonly disconnect = (target: LabTarget, targetVoices: readonly KelpieTarget[]) => {
		targetVoices.forEach(targetVoice => {
			this._monoVoice.disconnect(targetVoice)
		})
	}

	public readonly onDisconnect = (source: LabAudioNode) => {}

	public readonly dispose = () => {}
}

export class LabAudioParam<TNode extends KelpieAudioNode = KelpieAudioNode> {
	public get fullName() {return `${this._labAudioNode.fullName}.${this._name}`}
	public get creatorName() {return this._labAudioNode.creatorName}
	public get mode() {return this._labAudioNode.mode}
	// Keep track of sources in case we change voice mode
	public readonly sources = new Set<LabAudioNode>()
	public get name() {return `${this._labAudioNode.name}.${this._name}`}
	private _lastSetValue?: number
	public get lastSetValue() {return this._lastSetValue}

	public constructor(
		private readonly _labAudioNode: LabAudioNode<TNode>,
		// TParent2 is a workaround for some typing issue
		private readonly _getAudioParam: <TNode2 extends TNode>(kelpieNode: TNode2) => KelpieAudioParam,
		private readonly _name: string,
	) {
		this._labAudioNode.onParamAdd(this)
	}

	public set value(value: number) {
		this._lastSetValue = value
		this._labAudioNode.voices.forEach(voice => {
			this._getAudioParam(voice).value = value
		})
	}

	public readonly cancelAndHoldAtTime = (cancelTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
		}
	}

	public readonly cancelScheduledValues = (cancelTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).cancelScheduledValues(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).cancelScheduledValues(cancelTime)
		}
	}

	public readonly exponentialRampToValueAtTime = (value: number, endTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
		}
	}

	public readonly linearRampToValueAtTime = (value: number, endTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).linearRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).linearRampToValueAtTime(value, endTime)
		}
	}

	public readonly setTargetAtTime = (target: number, startTime: number, timeConstant: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
			// console.log(`setTargetAtTime voiceIndex: ${voiceIndex}   target: ${target}   voice: `, voice)
		}
	}

	public readonly setValueAtTime = (value: number, startTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setValueAtTime(value, startTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).setValueAtTime(value, startTime)
		}
	}

	public readonly setValueCurveAtTime = (values: number[] | Float32Array, startTime: number, duration: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this._getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
		}
	}

	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, KelpieAudioParam[]] => {
		this.sources.add(source)
		const [mode, voices] = this._labAudioNode.onConnectThroughParam(this, source)
		return [mode, voices.map(this._getAudioParam)]
	}

	public readonly onDisconnect = (source: LabAudioNode) => {
		this.sources.delete(source)
		this._labAudioNode.onDisconnectThroughParam(this, source)
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, readonly KelpieAudioParam[]] => {
		const [mode, voices] = this._labAudioNode.onSourceVoiceCountChange(source)
		return [mode, voices.map(this._getAudioParam)]
	}

	public readonly dispose = () => {
		this._labAudioNode.onParamDispose(this)
	}
}

export class LabOscillator extends LabAudioNode<KelpieOscillator> {
	public readonly name = 'LabOscillator'
	public readonly frequency: LabAudioParam<KelpieOscillator>
	public readonly detune: LabAudioParam<KelpieOscillator>
	private _type: OscillatorType = 'sawtooth'
	public set type(value: OscillatorType) {
		this.voices.forEach(voice => voice.type = value)
		this._type = value
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.frequency = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.frequency, 'frequency')
		this.detune = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.detune, 'detune')
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieOscillator => {
		const newOsc = new KelpieOscillator({audioContext: this._audioContext, labNode: this, voiceIndex})
		newOsc.type = this._type
		newOsc.frequency.setValueAtTime(0, 0)
		newOsc.start()
		if (this.frequency.lastSetValue !== undefined) newOsc.frequency.value = this.frequency.lastSetValue
		if (this.detune.lastSetValue !== undefined) newOsc.detune.value = this.detune.lastSetValue
		return newOsc
	}
}

export class LabGain extends LabAudioNode<KelpieGain> {
	public readonly name = 'LabGain'
	public readonly gain: LabAudioParam<KelpieGain>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.gain = new LabAudioParam(this, (kelpieGain) => kelpieGain.gain, 'gain')
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieGain => {
		const newGain = new KelpieGain({audioContext: this._audioContext, labNode: this, voiceIndex})
		if (this.gain.lastSetValue !== undefined) newGain.gain.value = this.gain.lastSetValue
		return newGain
	}
}

export class LabBiquadFilterNode extends LabAudioNode<KelpieBiquadFilterNode> {
	public readonly name = 'LabBiquadFilterNode'
	public readonly Q: LabAudioParam<KelpieBiquadFilterNode>
	public readonly detune: LabAudioParam<KelpieBiquadFilterNode>
	public readonly frequency: LabAudioParam<KelpieBiquadFilterNode>
	public readonly gain: LabAudioParam<KelpieBiquadFilterNode>
	private _type: BiquadFilterType = 'lowpass'
	public set type(value: BiquadFilterType) {
		this.voices.forEach(voice => voice.type = value)
		this._type = value
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.Q = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.Q, 'Q')
		this.detune = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.detune, 'detune')
		this.frequency = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.frequency, 'frequency')
		this.gain = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.gain, 'gain')
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieBiquadFilterNode => {
		const newFilter = new KelpieBiquadFilterNode({audioContext: this._audioContext, labNode: this, voiceIndex})
		newFilter.type = this._type
		if (this.Q.lastSetValue !== undefined) newFilter.Q.value = this.Q.lastSetValue
		if (this.detune.lastSetValue !== undefined) newFilter.detune.value = this.detune.lastSetValue
		if (this.frequency.lastSetValue !== undefined) newFilter.frequency.value = this.frequency.lastSetValue
		if (this.gain.lastSetValue !== undefined) newFilter.gain.value = this.gain.lastSetValue
		return newFilter
	}
}

export class LabStereoPannerNode extends LabAudioNode<KelpieStereoPannerNode> {
	public readonly name = 'LabStereoPannerNode'
	public readonly pan: LabAudioParam<KelpieStereoPannerNode>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.pan = new LabAudioParam(this, (kelpieStereoPannerNode) => kelpieStereoPannerNode.pan, 'pan')
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieStereoPannerNode => {
		const newPan = new KelpieStereoPannerNode({audioContext: this._audioContext, labNode: this, voiceIndex})
		if (this.pan.lastSetValue !== undefined) newPan.pan.value = this.pan.lastSetValue
		return newPan
	}
}

export class LabAudioDestinationNode extends LabAudioNode<KelpieAudioDestinationNode> {
	public readonly name = 'LabAudioDestinationNode'
	public constructor(args: LabAudioNodeArgs) {
		super(args)
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieAudioDestinationNode => {
		const newDestination = new KelpieAudioDestinationNode({audioContext: this._audioContext, labNode: this, voiceIndex})
		return newDestination
	}
}

export class LabWaveShaperNode extends LabAudioNode<KelpieWaveShaperNode> {
	public readonly name = 'LabWaveShaperNode'
	private _curve: Float32Array | null = null
	public set curve(curve: Float32Array | null) {
		this.voices.forEach(voice => voice.curve = curve)
		this._curve = curve
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieWaveShaperNode => {
		const newWS = new KelpieWaveShaperNode({audioContext: this._audioContext, labNode: this, voiceIndex})
		newWS.curve = this._curve
		return newWS
	}
}

export class LabConstantSourceNode extends LabAudioNode<KelpieConstantSourceNode> {
	public readonly name = 'LabConstantSourceNode'
	public readonly offset: LabAudioParam<KelpieConstantSourceNode>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.offset = new LabAudioParam(this, (kelpieConstantSource) => kelpieConstantSource.offset, 'offset')
		super.init()
	}

	public readonly _makeVoice = (voiceIndex: number): KelpieConstantSourceNode => {
		const newThing = new KelpieConstantSourceNode({audioContext: this._audioContext, labNode: this, voiceIndex})
		if (this.offset.lastSetValue !== undefined) newThing.offset.value = this.offset.lastSetValue
		newThing.start()
		return newThing
	}
}

// Kelpie
export interface KelpieAudioNodeArgs {
	readonly audioContext: AudioContext
	readonly labNode: LabAudioNode
	readonly voiceIndex?: number
}

type KelpieTarget = KelpieAudioNode | KelpieAudioParam

export abstract class KelpieAudioNode {
	protected _audioContext: AudioContext
	public abstract readonly name: string
	public readonly labNode: LabAudioNode
	public readonly voiceIndex?: number

	public constructor(args: KelpieAudioNodeArgs) {
		this._audioContext = args.audioContext
		this.labNode = args.labNode
		this.voiceIndex = args.voiceIndex
	}

	public connect<TTarget extends KelpieTarget>(target: TTarget): TTarget {
		console.log(`KelpieAudioNode connecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) to ${target.labNode.creatorName}.${target.name}(${target.voiceIndex})`)
		this.output.connect(target.input as AudioNode)
		return target
	}

	public disconnect(target?: KelpieTarget) {
		if (target) {
			try {
				this.output.disconnect(target.input as AudioNode)
			} catch (error) {
				logger.warn(`[KelpieAudioNode.disconnect] error thrown while disconnecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) to ${target.labNode.creatorName}.${target.name}(${target.voiceIndex})`)
			}
		} else {
			try {
				this.output.disconnect()
			} catch (error) {
				logger.warn(`[KelpieAudioNode.disconnect] error thrown while disconnecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) all`)
			}
		}
	}

	public abstract get input(): AudioNode
	public abstract get output(): AudioNode

	public dispose() {
		this._dispose()
		this.disconnect()
	}
	protected abstract _dispose(): void
}

export class KelpieAudioParam {
	public get voiceIndex() {return this._kelpieNode.voiceIndex}
	public get labNode() {return this._kelpieNode.labNode}
	// public abstract readonly name: string
	public set value(value: number) {
		this._audioParam.value = value
	}

	public constructor(
		protected _audioContext: AudioContext,
		private readonly _audioParam: AudioParam,
		public readonly name: string,
		private readonly _kelpieNode: KelpieAudioNode,
	) {}

	public get input(): AudioParam {return this._audioParam}

	public cancelAndHoldAtTime(cancelTime: number) {
		this._audioParam.cancelAndHoldAtTime(cancelTime)
	}

	public cancelScheduledValues(cancelTime: number) {
		this._audioParam.cancelScheduledValues(cancelTime)
	}

	public exponentialRampToValueAtTime(value: number, endTime: number) {
		this._audioParam.exponentialRampToValueAtTime(value, endTime)
	}

	public linearRampToValueAtTime(value: number, endTime: number) {
		this._audioParam.linearRampToValueAtTime(value, endTime)
	}

	public setTargetAtTime(target: number, startTime: number, timeConstant: number) {
		// console.log(`${this._kelpieNode.labNode.creatorName} ${this._kelpieNode.name}.${this.name} KelpieAudioParam.setTargetAtTime(${target})`)
		this._audioParam.setTargetAtTime(target, startTime, timeConstant)
	}

	public setValueAtTime(value: number, startTime: number) {
		this._audioParam.setValueAtTime(value, startTime)
	}

	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number) {
		this._audioParam.setValueCurveAtTime(values, startTime, duration)
	}
}

class KelpieOscillator extends KelpieAudioNode {
	public readonly name = 'Oscillator'
	private readonly _osc: OscillatorNode
	public readonly frequency: KelpieAudioParam
	public readonly detune: KelpieAudioParam
	public set type(value: OscillatorType) {
		this._osc.type = value
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._osc = this._audioContext.createOscillator()
		this.frequency = new KelpieAudioParam(this._audioContext, this._osc.frequency, 'frequency', this)
		this.detune = new KelpieAudioParam(this._audioContext, this._osc.detune, 'detune', this)
	}

	public start(time?: number) {
		this._osc.start(time)
	}

	public get input(): AudioNode {return this._osc}
	public get output(): AudioNode {return this._osc}
	protected _dispose() {
		this._osc.stop()
	}
}

class KelpieGain extends KelpieAudioNode {
	public readonly name = 'GainNode'
	private readonly _gain: GainNode
	public readonly gain: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._gain = this._audioContext.createGain()
		this.gain = new KelpieAudioParam(this._audioContext, this._gain.gain, 'gain', this)
	}

	public get input(): AudioNode {return this._gain}
	public get output(): AudioNode {return this._gain}
	protected _dispose() {}
}

class KelpieBiquadFilterNode extends KelpieAudioNode {
	public readonly name = 'BiquadFilterNode'
	private readonly _biquadFilter: BiquadFilterNode
	public readonly Q: KelpieAudioParam;
	public readonly detune: KelpieAudioParam;
	public readonly frequency: KelpieAudioParam;
	public readonly gain: KelpieAudioParam;
	public set type(value: BiquadFilterType) {
		this._biquadFilter.type = value
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._biquadFilter = this._audioContext.createBiquadFilter()
		this.Q = new KelpieAudioParam(this._audioContext, this._biquadFilter.Q, 'Q', this)
		this.detune = new KelpieAudioParam(this._audioContext, this._biquadFilter.detune, 'detune', this)
		this.frequency = new KelpieAudioParam(this._audioContext, this._biquadFilter.frequency, 'frequency', this)
		this.gain = new KelpieAudioParam(this._audioContext, this._biquadFilter.gain, 'gain', this)
	}

	public get input(): AudioNode {return this._biquadFilter}
	public get output(): AudioNode {return this._biquadFilter}
	protected _dispose() {}
}

class KelpieStereoPannerNode extends KelpieAudioNode {
	public readonly name = 'StereoPannerNode'
	private readonly _stereoPanner: StereoPannerNode
	public readonly pan: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._stereoPanner = this._audioContext.createStereoPanner()
		this.pan = new KelpieAudioParam(this._audioContext, this._stereoPanner.pan, 'pan', this)
	}

	public get input(): AudioNode {return this._stereoPanner}
	public get output(): AudioNode {return this._stereoPanner}
	protected _dispose() {}
}

class KelpieAudioDestinationNode extends KelpieAudioNode {
	public readonly name = 'AudioDestinationNode'
	private readonly _destination: AudioDestinationNode

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._destination = this._audioContext.destination
	}

	public get input(): AudioNode {return this._destination}
	public get output(): AudioNode {throw new Error(`I don't think you meant to do that`)}
	protected _dispose() {}
}

class KelpieWaveShaperNode extends KelpieAudioNode {
	public readonly name = 'WaveShaperNode'
	private readonly _waveShaper: WaveShaperNode
	public set curve(curve: Float32Array | null) {
		this._waveShaper.curve = curve
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._waveShaper = this._audioContext.createWaveShaper()
	}

	public get input(): AudioNode {return this._waveShaper}
	public get output(): AudioNode {return this._waveShaper}
	protected _dispose() {}
}

class KelpieConstantSourceNode extends KelpieAudioNode {
	public readonly name = 'ConstantSourceNode'
	private readonly _constantSource: ConstantSourceNode
	public readonly offset: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._constantSource = this._audioContext.createConstantSource()
		this.offset = new KelpieAudioParam(this._audioContext, this._constantSource.offset, 'offset', this)
	}

	public start(time?: number) {
		this._constantSource.start(time)
	}

	public get input(): AudioNode {return this._constantSource}
	public get output(): AudioNode {return this._constantSource}
	protected _dispose() {}
}

// const audioContext = new AudioContext()

// // 1 voice (autoPoly, inherits voice count from source nodes)
// const myOsc1 = new LabOscillator({audioContext, voiceMode: 'autoPoly', creatorName: 'myOsc1'})

// // 1 voice (staticPoly, downstream autoPoly nodes will match this voice count)
// const myOsc2 = new LabOscillator({audioContext, voiceMode: 1, creatorName: 'myOsc2'})

// // 1 voice (mono)
// const myGain = new LabGain({audioContext, voiceMode: 'mono', creatorName: 'myGain'})

// // 1 autoPoly voice connecting to 1 mono voice
// myOsc1.connect(myGain)

// // Creates more voices, but they aren't connected to anything yet
// myOsc2.setVoiceCount(7)

// // 6 voices will be created in myOsc1, and each of the 7 voices between the 2 nodes will be connected
// myOsc2.connect(myOsc1.frequency)

// // will set the type on all 7 oscillators, and value will be stored and used when new voices are created in the future
// myOsc1.type = 'sawtooth'

// myGain.gain.value = 0

// myGain.gain.linearRampToValueAtTime(0.5, 4)

// // linearRampToValueAtTime will be called on voice 2
// myOsc2.frequency.linearRampToValueAtTime(220, 6, 2)

// // all 7 oscillators are disconnect from myGain
// myOsc1.disconnect(myGain)

// // 4 voices in myOsc1 and myOsc2 are disconnected and deleted
// myOsc2.setVoiceCount(3)

// // all 4 oscillators are disconnected from myOsc1.frequency
// // myOsc1 goes back to 1 oscillator, because there are no sources connected
// myOsc2.disconnect(myOsc1.frequency)

// myGain.disconnect()

// myOsc1.dispose()

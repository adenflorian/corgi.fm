import {logger} from '../../../client-logger'

// Lab
type LabTarget<TTarget extends KelpieAudioNode = KelpieAudioNode> = LabAudioNode<TTarget> | LabAudioParam<TTarget>

type VoiceCount = number | LabTargetMode

interface LabAudioNodeArgs {
	readonly audioContext: AudioContext
	readonly voiceMode: VoiceCount 
}

type LabTargetMode = 'mono' | 'autoPoly'

interface LabTargetConnection {
	readonly target: LabTarget
	readonly targetMode: LabTargetMode
	readonly targetVoices: readonly KelpieTarget[]
}

export abstract class LabAudioNode<TNode extends KelpieAudioNode = KelpieAudioNode> {
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
	private readonly _params = new Set<LabAudioParam>()
	public get params() {return this._params as ReadonlySet<LabAudioParam>}

	public constructor(args: LabAudioNodeArgs) {
		this._audioContext = args.audioContext
		this.setVoiceCount(args.voiceMode)
	}

	// Called on the source
	public connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>): this {
		const [targetMode, targetVoices] = target.onConnect(this)
		this._currentModeImpl.connect(target, targetMode, targetVoices)
		this.targets.set(target, {target, targetMode, targetVoices})
		return this
	}

	// Called on the target
	public onConnect(source: LabAudioNode): readonly [LabTargetMode, KelpieAudioNode[]] {
		const voices = this._currentModeImpl.onConnect(source)
		this.sources.add(source)
		return voices
	}

	public onConnectThroughParam(param: LabAudioParam, source: LabAudioNode): readonly [LabTargetMode, TNode[]] {
		logger.assert(this.params.has(param), 'missing param!')
		return this._currentModeImpl.onConnect(source)
	}

	public onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] {
		return this._currentModeImpl.onSourceVoiceCountChange(source)
	}

	public abstract _makeVoice(): TNode

	public setVoiceCount(newVoiceCount: VoiceCount) {
		if (newVoiceCount === this.mode) return
		this._mode = newVoiceCount
	
		if (newVoiceCount === 'mono') {
			this._currentModeImpl = new LabMono(this)
			this._currentModeImpl.setVoiceCount(1)
			this.sources.forEach(source => {
				source.onTargetVoiceModeChange(this, newVoiceCount, this.voices)
			})
			this.params.forEach(param => {
				param.sources.forEach(source => {
					source.onTargetVoiceModeChange(this, newVoiceCount, this.voices)
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
					source.onTargetVoiceModeChange(this, newVoiceCount, this.voices)
				})
			})
		} else {
			this._currentModeImpl = new LabStaticPoly(this)
			this._currentModeImpl.setVoiceCount(newVoiceCount)
		}
	}

	public onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) {
		this._currentModeImpl.onTargetVoiceModeChange(target, targetMode, targetVoices)
	}

	public disconnect(target?: LabTarget) {
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

	public onDisconnect(source: LabAudioNode) {
		this.sources.delete(source)
		this._currentModeImpl.onDisconnect(source)
	}

	public onDisconnectThroughParam(param: LabAudioParam, source: LabAudioNode) {
		logger.assert(this.params.has(param), 'missing param2!')
		this._currentModeImpl.onDisconnect(source)
	}

	public onParamAdd(param: LabAudioParam) {
		this._params.add(param)
	}

	public onParamDispose(param: LabAudioParam) {
		this._params.delete(param)
	}

	public dispose() {
		this.voices.forEach(voice => voice.dispose())
		this.params.forEach(param => param.dispose())
	}
}

interface LabModeImpl<TNode extends KelpieAudioNode> {
	connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]): void
	onConnect(source: LabAudioNode): readonly [LabTargetMode, TNode[]]
	onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]]
	setVoiceCount(voiceCount: number): void
	onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]): void
	disconnect(target: LabTarget, targetVoices: readonly KelpieTarget[]): void
	onDisconnect(source: LabAudioNode): void
	dispose(): void
}

class LabAutoPoly<TNode extends KelpieAudioNode = KelpieAudioNode> implements LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {}

	// Called on the source
	public connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) {
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
	public onConnect(source: LabAudioNode): readonly [LabTargetMode, TNode[]] {
		const sourceVoiceCount = source.voices.length
		this._ensureMinimumVoiceCount(sourceVoiceCount)
		return ['autoPoly', this._parent.voices]
	}

	public onSourceVoiceCountChange(source: LabAudioNode): [LabTargetMode, TNode[]] {
		this._setVoiceCount(this._getMaxSourceVoiceCount())
		return ['autoPoly', this._parent.voices]
	}

	public setVoiceCount(newVoiceCount: number) {
		this._setVoiceCount(this._getMaxSourceVoiceCount())
	}

	public onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) {
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

	private _getMaxSourceVoiceCount(): number {
		let maxSourceVoiceCount = 0
		this._parent.sources.forEach(source => {
			maxSourceVoiceCount = Math.max(maxSourceVoiceCount, source.voiceCount)
		})
		this._parent.params.forEach(param => {
			param.sources.forEach(paramSource => {
				maxSourceVoiceCount = Math.max(maxSourceVoiceCount, paramSource.voiceCount)
			})
		})
		return maxSourceVoiceCount
	}

	private _setVoiceCount(newVoiceCount: number) {
		const delta = newVoiceCount - this._parent.voices.length

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

	private _ensureMinimumVoiceCount(count: number) {
		const delta = count - this._parent.voices.length

		if (delta > 0) {
			this._addVoices(delta)
		}

		return this._parent.voices
	}

	private _addVoices(numberToAdd: number) {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices.push(this._parent._makeVoice())
		}
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public disconnect(target: LabTarget, targetVoices: readonly KelpieTarget[]) {
		this._parent.voices.forEach((voice, i) => {
			voice.disconnect(targetVoices[i])
		})
	}

	public onDisconnect(source: LabAudioNode) {
		this._setVoiceCount(this._getMaxSourceVoiceCount())
	}

	public dispose() {}
}

class LabStaticPoly<TNode extends KelpieAudioNode = KelpieAudioNode> implements LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {}

	// Called on the source
	public connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) {
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
	public onConnect(source: LabAudioNode): readonly [LabTargetMode, TNode[]] {
		throw new Error('nothing is allowed to connect to static poly')
	}

	public onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] {
		throw new Error('wrong!')
	}

	private _addVoices(numberToAdd: number) {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices.push(this._parent._makeVoice())
		}
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public disconnect(target: LabTarget, targetVoices: readonly KelpieTarget[]) {
		this._parent.voices.forEach((voice, i) => {
			voice.disconnect(targetVoices[i])
		})
	}

	public setVoiceCount(newVoiceCount: number) {
		const delta = newVoiceCount - this._parent.voices.length

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
			return
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

	public onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) {
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

	public onDisconnect(source: LabAudioNode) {}

	public dispose() {}
}

class LabMono<TNode extends KelpieAudioNode = KelpieAudioNode> implements LabModeImpl<TNode> {
	public constructor(private readonly _parent: LabAudioNode<TNode>) {}

	public connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>) {
		const [_, targetVoices] = target.onConnect(this._parent)
		this._connectToTargetVoices(targetVoices)
	}

	// Called on the target
	public onConnect(source: LabAudioNode): readonly ['mono', TNode[]] {
		logger.assert(this._parent.voices.length === 1, 'this._parent.voices.length === 1')
		return ['mono', this._parent.voices]
	}

	public setVoiceCount(newVoiceCount: number) {
		const delta = 1 - this._parent.voiceCount
		if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
			logger.assert(this._parent.voices.length === 1, 'this._parent.voices.length === 1')

			this._parent.targets.forEach(target => {
				const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
				this._connectToTargetVoices(targetVoices)
				this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
			})
		}
	}

	public onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: readonly KelpieTarget[]) {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		oldTargetConnection.targetVoices.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})
		this._connectToTargetVoices(targetVoices)
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private get _monoVoice() {return this._parent.voices[0]}

	private _connectToTargetVoices(targetVoices: readonly KelpieTarget[]) {
		targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
			this._monoVoice.connect(targetVoice)
		})
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly TNode[]] {
		return ['mono', this._parent.voices]
	}

	public disconnect(target: LabTarget, targetVoices: readonly KelpieTarget[]) {
		targetVoices.forEach(targetVoice => {
			this._monoVoice.disconnect(targetVoice)
		})
	}

	public onDisconnect(source: LabAudioNode) {}

	public dispose() {}
}

export class LabAudioParam<TNode extends KelpieAudioNode = KelpieAudioNode> {
	public get mode() {return this._labAudioNode.mode}
	// Keep track of sources in case we change voice mode
	public readonly sources = new Set<LabAudioNode>()

	public constructor(
		private readonly _labAudioNode: LabAudioNode<TNode>,
		// TParent2 is a workaround for some typing issue
		private readonly _getAudioParam: <TNode2 extends TNode>(kelpieNode: TNode2) => KelpieAudioParam,
	) {
		this._labAudioNode.onParamAdd(this)
	}

	public set value(value: number) {
		this._labAudioNode.voices.forEach(voice => {
			this._getAudioParam(voice).value = value
		})
	}

	public cancelAndHoldAtTime(cancelTime: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
		}
	}

	public cancelScheduledValues(cancelTime: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).cancelScheduledValues(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).cancelScheduledValues(cancelTime)
		}
	}

	public exponentialRampToValueAtTime(value: number, endTime: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
		}
	}

	public linearRampToValueAtTime(value: number, endTime: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).linearRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).linearRampToValueAtTime(value, endTime)
		}
	}

	public setTargetAtTime(target: number, startTime: number, timeConstant: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
		}
	}

	public setValueAtTime(value: number, startTime: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setValueAtTime(value, startTime)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).setValueAtTime(value, startTime)
		}
	}

	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this._getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
			})
		} else {
			const voice = this._labAudioNode.voices[voiceIndex]
			this._getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
		}
	}

	public onConnect(source: LabAudioNode): readonly [LabTargetMode, KelpieAudioParam[]] {
		this.sources.add(source)
		const [mode, voices] = this._labAudioNode.onConnectThroughParam(this, source)
		return [mode, voices.map(this._getAudioParam)]
	}

	public onDisconnect(source: LabAudioNode) {
		this.sources.delete(source)
		this._labAudioNode.onDisconnectThroughParam(this, source)
	}

	public onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, readonly KelpieAudioParam[]] {
		const [mode, voices] = this._labAudioNode.onSourceVoiceCountChange(source)
		return [mode, voices.map(this._getAudioParam)]
	}

	public dispose() {
		this._labAudioNode.onParamDispose(this)
	}
}

export class LabOscillator extends LabAudioNode<KelpieOscillator> {
	public readonly frequency: LabAudioParam<KelpieOscillator>
	private _type: OscillatorType = 'sawtooth'
	public set type(value: OscillatorType) {
		this.voices.forEach(voice => voice.type = value)
		this._type = value
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.frequency = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.frequency)
		this.voices.push(new KelpieOscillator({audioContext: this._audioContext}))
	}

	public start(time?: number) {
		this.voices.forEach(voice => voice.start(time))
	}

	public _makeVoice() {
		const newOsc = new KelpieOscillator({audioContext: this._audioContext})
		newOsc.type = this._type
		return newOsc
	}
}

export class LabGain extends LabAudioNode<KelpieGain> {
	public readonly gain: LabAudioParam<KelpieGain>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.gain = new LabAudioParam(this, (kelpieGain) => kelpieGain.gain)
		this.voices.push(new KelpieGain({audioContext: this._audioContext}))
	}

	public _makeVoice() {
		return new KelpieGain({audioContext: this._audioContext})
	}
}

export class LabStereoPannerNode extends LabAudioNode<KelpieStereoPannerNode> {
	public readonly pan: LabAudioParam<KelpieStereoPannerNode>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.pan = new LabAudioParam(this, (kelpieStereoPannerNode) => kelpieStereoPannerNode.pan)
		this.voices.push(new KelpieStereoPannerNode({audioContext: this._audioContext}))
	}

	public _makeVoice() {
		return new KelpieStereoPannerNode({audioContext: this._audioContext})
	}
}

export class LabAudioDestinationNode extends LabAudioNode<KelpieAudioDestinationNode> {
	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.voices.push(new KelpieAudioDestinationNode({audioContext: this._audioContext}))
	}

	public _makeVoice() {
		return new KelpieAudioDestinationNode({audioContext: this._audioContext})
	}
}

export class LabWaveShaperNode extends LabAudioNode<KelpieWaveShaperNode> {
	private _curve: Float32Array | null = null
	public set curve(curve: Float32Array | null) {
		this.voices.forEach(voice => voice.curve = curve)
		this._curve = curve
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.voices.push(new KelpieWaveShaperNode({audioContext: this._audioContext}))
	}

	public _makeVoice() {
		const newWS = new KelpieWaveShaperNode({audioContext: this._audioContext})
		newWS.curve = this._curve
		return newWS
	}
}

export class LabConstantSourceNode extends LabAudioNode<KelpieConstantSourceNode> {
	public readonly offset: LabAudioParam<KelpieConstantSourceNode>

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.offset = new LabAudioParam(this, (kelpieConstantSource) => kelpieConstantSource.offset)
		this.voices.push(new KelpieConstantSourceNode({audioContext: this._audioContext}))
	}

	public start(time?: number) {
		this.voices.forEach(voice => voice.start(time))
	}

	public _makeVoice() {
		const newThing = new KelpieConstantSourceNode({audioContext: this._audioContext})
		return newThing
	}
}

// Kelpie
interface KelpieAudioNodeArgs {
	readonly audioContext: AudioContext
}

type KelpieTarget = KelpieAudioNode | KelpieAudioParam

export abstract class KelpieAudioNode {
	protected _audioContext: AudioContext

	public constructor(args: KelpieAudioNodeArgs) {
		this._audioContext = args.audioContext
	}

	public connect(target: KelpieTarget): this {
		this.output.connect(target.input as AudioNode)
		return this
	}

	public disconnect(target?: KelpieTarget) {
		if (target) {
			this.output.disconnect(target.input as AudioNode)
		} else {
			this.output.disconnect()
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

class KelpieAudioParam {
	public set value(value: number) {
		this._audioParam.value = value
	}

	public constructor(
		protected _audioContext: AudioContext,
		private readonly _audioParam: AudioParam,
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
	private readonly _osc: OscillatorNode
	public readonly frequency: KelpieAudioParam
	public set type(value: OscillatorType) {
		this._osc.type = value
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._osc = this._audioContext.createOscillator()
		this.frequency = new KelpieAudioParam(this._audioContext, this._osc.frequency)
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
	private readonly _gain: GainNode
	public readonly gain: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._gain = this._audioContext.createGain()
		this.gain = new KelpieAudioParam(this._audioContext, this._gain.gain)
	}

	public get input(): AudioNode {return this._gain}
	public get output(): AudioNode {return this._gain}
	protected _dispose() {}
}

class KelpieStereoPannerNode extends KelpieAudioNode {
	private readonly _stereoPanner: StereoPannerNode
	public readonly pan: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._stereoPanner = this._audioContext.createStereoPanner()
		this.pan = new KelpieAudioParam(this._audioContext, this._stereoPanner.pan)
	}

	public get input(): AudioNode {return this._stereoPanner}
	public get output(): AudioNode {return this._stereoPanner}
	protected _dispose() {}
}

class KelpieAudioDestinationNode extends KelpieAudioNode {
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
	private readonly _constantSource: ConstantSourceNode
	public readonly offset: KelpieAudioParam

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._constantSource = this._audioContext.createConstantSource()
		this.offset = new KelpieAudioParam(this._audioContext, this._constantSource.offset)
	}

	public start(time?: number) {
		this._constantSource.start(time)
	}

	public get input(): AudioNode {return this._constantSource}
	public get output(): AudioNode {return this._constantSource}
	protected _dispose() {}
}

const audioContext = new AudioContext()

// 1 voice (autoPoly, inherits voice count from source nodes)
const myOsc1 = new LabOscillator({audioContext, voiceMode: 'autoPoly'})

// 1 voice (staticPoly, downstream autoPoly nodes will match this voice count)
const myOsc2 = new LabOscillator({audioContext, voiceMode: 1})

// 1 voice (mono)
const myGain = new LabGain({audioContext, voiceMode: 'mono'})

// 1 autoPoly voice connecting to 1 mono voice
myOsc1.connect(myGain)

// Creates more voices, but they aren't connected to anything yet
myOsc2.setVoiceCount(7)

// 6 voices will be created in myOsc1, and each of the 7 voices between the 2 nodes will be connected
myOsc2.connect(myOsc1.frequency)

// will set the type on all 7 oscillators, and value will be stored and used when new voices are created in the future
myOsc1.type = 'sawtooth'

myGain.gain.value = 0

myGain.gain.linearRampToValueAtTime(0.5, 4)

// linearRampToValueAtTime will be called on voice 2
myOsc2.frequency.linearRampToValueAtTime(220, 6, 2)

// all 7 oscillators are disconnect from myGain
myOsc1.disconnect(myGain)

// 4 voices in myOsc1 and myOsc2 are disconnected and deleted
myOsc2.setVoiceCount(3)

// all 4 oscillators are disconnected from myOsc1.frequency
// myOsc1 goes back to 1 oscillator, because there are no sources connected
myOsc2.disconnect(myOsc1.frequency)

myGain.disconnect()

myOsc1.dispose()

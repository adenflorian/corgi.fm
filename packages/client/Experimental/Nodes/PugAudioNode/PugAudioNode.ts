import {logger} from '../../../client-logger'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'

export interface PugAudioNodeArgs {
	readonly audioContext: AudioContext
}

export interface PugPolyAudioNodeArgs extends PugAudioNodeArgs {}

export type WebAudioTarget = AudioNode | AudioParam

export type WebAudioTargets = Map<Id, WebAudioTarget>

export type AudioNodes = Map<Id, AudioNode>

export type WebAudioNodes<T extends AudioNode> = T[]

export type WebAudioPairs<T extends AudioNode, U extends AudioNode | AudioParam> = Map<T, U>

export interface PugAudioTarget {
	onNewSourceConnection(source: PugAudioNode): WebAudioTarget
	onDisconnectSource(source: PugAudioNode): void
}

export interface PugPolyAudioTarget {
	onNewSourceConnection<U extends AudioNode>(source: PugPolyAudioNode<U>, sources: WebAudioNodes<U>): WebAudioPairs<U, WebAudioTarget>
	onNewSourceVoiceCount<U extends AudioNode>(source: PugPolyAudioNode<U>, sources: WebAudioNodes<U>): WebAudioPairs<U, WebAudioTarget>
	onDisconnectSource(source: PugPolyAudioNode): void
}

export abstract class PugAudioNode implements PugAudioTarget {
	public readonly pugType = 'node'
	public readonly abstract pugAudioNodeType: string
	protected readonly _audioContext: AudioContext
	protected readonly _sources = new Map<PugAudioNode, PugAudioNode>()
	protected readonly _targets = new Map<PugAudioTarget, WebAudioTarget>()
	protected readonly abstract _webAudioNode: AudioNode

	public constructor(
		args: PugAudioNodeArgs,
	) {
		this._audioContext = args.audioContext
	}

	public connect(target: PugAudioTarget) {
		const alreadyConnected = this._targets.has(target)
		if (alreadyConnected) {
			return this._logWarning('connect', 'alreadyConnected!', {target})
		}
		const targetAudioNodeOrParam = target.onNewSourceConnection(this)
		this._webAudioNode.connect(targetAudioNodeOrParam as AudioNode)
		this._targets.set(target, targetAudioNodeOrParam)
	}

	public onNewSourceConnection(source: PugAudioNode): AudioNode {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected) {
			throw new Error('[PugAudioNode.onNewConnection] alreadyConnected! ' + JSON.stringify({source, target: this}))
		}
		this._sources.set(source, source)
		return this._webAudioNode
	}

	public onDisconnectSource(source: PugAudioNode) {
		this._sources.delete(source)
	}

	public disconnect(target?: PugAudioTarget) {
		if (target) {
			this._disconnectTarget(target)
		} else {
			this._disconnectAll()
		}
	}

	private _disconnectTarget(target: PugAudioTarget) {
		this._withWebAudioTarget(target, webAudioTarget => {
			this._webAudioNode.disconnect(webAudioTarget as AudioNode)
			this._targets.delete(target)
		})
	}

	private _withWebAudioTarget(target: PugAudioTarget, func: (webAudioTarget: WebAudioTarget) => void) {
		const webAudioTarget = this._targets.get(target)
		if (webAudioTarget === undefined) {
			return this._logWarning('_disconnectTarget', 'target not found!', {target})
		} else {
			return func(webAudioTarget)
		}
	}

	private _disconnectAll() {
		this._webAudioNode.disconnect()
		this._targets.forEach((_, pugTarget) => pugTarget.onDisconnectSource(this))
		this._targets.clear()
	}

	private _logWarning(functionName: string, message: string, data: object) {
		logger.warn(`[PugAudioNode.${functionName}] ${message}`, {
			pugAudioNodeType: this.pugAudioNodeType,
			source: this,
			...data,
		})
	}

	public dispose() {this._dispose()}
	protected abstract _dispose(): void
}

export class PugGainNode extends PugAudioNode {
	public readonly pugAudioNodeType = 'gain'
	public readonly gain: PugAudioParam
	protected readonly _webAudioNode: GainNode

	public constructor(args: PugAudioNodeArgs) {
		super(args)
		this._webAudioNode = args.audioContext.createGain()

		this.gain = new PugAudioParam(() => this._webAudioNode.gain, this)
	}

	protected _dispose() {
		this._webAudioNode.disconnect()
	}
}

export class PugAudioParam implements PugAudioTarget {
	public readonly pugType = 'param'
	protected readonly _sources = new Map<PugAudioNode, PugAudioNode>()

	public constructor(
		private readonly _getAudioParam: () => AudioParam,
		private readonly _pugNode: PugAudioNode,
	) {}

	public onNewSourceConnection(source: PugAudioNode): AudioParam {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected) {
			throw new Error('[PugAudioParam.onNewConnection] alreadyConnected! ' + JSON.stringify({source, target: this}))
		}
		this._sources.set(source, source)
		return this._getAudioParam()
	}

	public onDisconnectSource(source: PugAudioNode) {
		this._sources.delete(source)
	}

	public linearRampToValueAtTime(value: number, endTime: number) {
		this._getAudioParam().linearRampToValueAtTime(value, endTime)
	}

	public setTargetAtTime(target: number, startTime: number, timeConstant: number) {
		this._getAudioParam().setTargetAtTime(target, startTime, timeConstant)
	}

	public setValueAtTime(value: number, startTime = 0) {
		this._getAudioParam().setValueAtTime(value, startTime)
	}

	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number) {
		this._getAudioParam().setValueCurveAtTime(values, startTime, duration)
	}

	public cancelScheduledValues(cancelTime: number) {
		this._getAudioParam().cancelScheduledValues(cancelTime)
	}

	public cancelAndHoldAtTime(cancelTime: number) {
		this._getAudioParam().cancelAndHoldAtTime(cancelTime)
	}
}

export interface IncomingPolyConnection {
	sourcePugNode: PugPolyAudioNode
	sourceVoiceCount: CorgiNumberChangedEvent
}

export abstract class PugPolyAudioNode<TSelf extends AudioNode = AudioNode> implements PugPolyAudioTarget {
	public readonly pugType = 'nodePoly'
	public readonly abstract pugAudioNodeType: string
	public readonly abstract params: readonly PugPolyAudioParamSources[]
	public get voiceCount() {return this._webAudioNodes.length}
	protected readonly _audioContext: AudioContext
	protected readonly _sources = new Set<PugPolyAudioNode>()
	protected readonly _targets = new Map<PugPolyAudioTarget, WebAudioPairs<TSelf, WebAudioTarget>>()
	protected readonly _webAudioNodes: WebAudioNodes<TSelf> = []
	public get webAudioNodes() {return this._webAudioNodes as readonly TSelf[]}

	public constructor(
		args: PugPolyAudioNodeArgs,
	) {
		this._audioContext = args.audioContext
		this.setVoiceCount(1)
		logger.assert(this.voiceCount === 1 && this._webAudioNodes[0] !== undefined)
	}

	public setVoiceCount(newVoiceCount: number) {
		// This function is the only way to change the voice count
		// 1. Called by the owner of this pug node
		// 2. Called when new incoming connection
		// 3. Called when a source voice count changes

		const delta = newVoiceCount - this.voiceCount

		logger.assert(this._webAudioNodes.length === this.voiceCount, '[PugPolyAudioNode.setVoiceCount] this._webAudioNodes.length === this.voiceCount:', {
			thisWebAudioNodesLength: this._webAudioNodes.length, thisVoiceCount: this.voiceCount,
		})

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			logger.warn('[PugPolyAudioNode.setVoiceCount] delta is 0, coding error?', {source: this, newVoiceCount, delta, voiceCount: this.voiceCount})
			return
		}

		logger.assert(this._webAudioNodes.length === newVoiceCount, '[PugPolyAudioNode.setVoiceCount] this._webAudioNodes.length === newVoiceCount:', {
			thisWebAudioNodesLength: this._webAudioNodes.length, newVoiceCount,
		})

		this._targets.forEach((pairs, target) => {
			const newPairs = target.onNewSourceVoiceCount(this, this._webAudioNodes)
			for (const [sourceWebAudioNode, targetWebAudioNode] of newPairs) {
				try {
					sourceWebAudioNode.connect(targetWebAudioNode as AudioNode)
				} catch (error) {
					logger.warn('[PugPolyAudioNode.setVoiceCount] error while connecting:', {error, this: this, sourceWebAudioNode, targetWebAudioNode})
				}
			}
			this._targets.set(target, newPairs)
		})
	}

	private _addVoices(numberToAdd: number) {
		const createdVoiceIndexes = [] as number[]
		for (let i = 0; i < numberToAdd; i++) {
			const newLength = this._webAudioNodes.push(this._makeWebAudioNode())
			createdVoiceIndexes.push(newLength - 1)
		}
		logger.log('[PugPolyAudioNode._addVoices] onVoicesCreated:', {createdVoiceIndexes, type: this.pugAudioNodeType})
	}

	private _deleteVoices(numberToDelete: number) {
		const destroyedVoiceIndexes = [] as number[]
		for (let i = 0; i < numberToDelete; i++) {
			const indexToDelete = this._webAudioNodes.length - 1
			const deletedWebAudioNode = this._webAudioNodes.pop()
			if (deletedWebAudioNode === undefined) {
				logger.error('[PugPolyAudioNode._deleteVoices] deletedWebAudioNode is undefined:', {source: this, webAudioNodes: this._webAudioNodes, numberToDelete})
			} else {
				this._disposeWebAudioNode(deletedWebAudioNode)
				destroyedVoiceIndexes.push(indexToDelete)
			}
		}
		logger.log('[PugPolyAudioNode._deleteVoices] onVoicesDestroyed:', {destroyedVoiceIndexes, type: this.pugAudioNodeType})
	}

	public connect<TTarget extends AudioNode>(target: PugPolyAudioNode<TTarget> | PugPolyAudioParam<TTarget>): PugPolyAudioNode<TTarget> {
		switch (target.pugType) {
			case 'nodePoly': return this._connectToNode(target)
			case 'paramPoly': return this._connectToParam(target)
		}
	}

	private _connectToNode<TTarget extends AudioNode>(target: PugPolyAudioNode<TTarget>): PugPolyAudioNode<TTarget> {
		const alreadyConnected = this._targets.has(target)
		if (alreadyConnected) {
			this._logWarning('_connectToNode', 'alreadyConnected!', {target})
			return target
		}
		const pairs = target.onNewSourceConnection(this, this._webAudioNodes)
		for (const [sourceWebAudioNode, targetWebAudioNode] of pairs) {
			sourceWebAudioNode.connect(targetWebAudioNode)
		}
		this._targets.set(target, pairs)
		return target
	}

	private _connectToParam<TTarget extends AudioNode>(target: PugPolyAudioParam<TTarget>): PugPolyAudioNode<TTarget> {
		const alreadyConnected = this._targets.has(target)
		if (alreadyConnected) {
			this._logWarning('_connectToParam', 'alreadyConnected!', {target})
			return target.pugNode
		}
		const pairs = target.onNewSourceConnection(this, this._webAudioNodes)
		return target.pugNode
	}

	public onNewSourceConnection<TSource extends AudioNode>(
		source: PugPolyAudioNode<TSource>, sources: WebAudioNodes<TSource>,
	): Map<TSource, TSelf> {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected) {
			throw new Error('[PugPolyAudioNode.onNewConnection] alreadyConnected! ' + JSON.stringify({source, target: this}))
		}
		this._sources.add(source)
		return this._getTargetsForSources(sources)
	}

	public onNewSourceVoiceCount<TSource extends AudioNode>(
		source: PugPolyAudioNode<TSource>, sources: WebAudioNodes<TSource>,
	): Map<TSource, TSelf> {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected === false) {
			throw new Error('[PugPolyAudioNode.onNewConnection] not connected! ' + JSON.stringify({source, target: this}))
		}
		return this._getTargetsForSources(sources)
	}

	public _getTargetsForSources<TSource extends AudioNode>(
		sources: WebAudioNodes<TSource>,
	): WebAudioPairs<TSource, TSelf> {
		const sourceVoiceCount = sources.length
		this._ensureMinimumVoiceCount(sourceVoiceCount)
		const pairs = new Map<TSource, TSelf>()

		for (let i = 0; i < sourceVoiceCount; i++) {
			pairs.set(sources[i], this._webAudioNodes[i])
		}

		for (const [sourceNode, targetNode] of pairs) {
			if (sourceNode === undefined) {
				logger.error('[PugPolyAudioNode.onNewConnection] sourceNode === undefined', {target: this})
			}
			if (targetNode === undefined) {
				logger.error('[PugPolyAudioNode.onNewConnection] targetNode === undefined', {target: this})
			}
		}

		logger.assert(sources.length === pairs.size)

		return pairs
	}

	private _ensureMinimumVoiceCount(minimumVoiceCount: number) {
		const maxSourceVoiceCount = this._getMaxRequiredVoiceCount()

		logger.assert(maxSourceVoiceCount >= minimumVoiceCount)

		this.setVoiceCount(maxSourceVoiceCount)
	}

	public onDisconnectSource(source: PugPolyAudioNode<TSelf>) {
		if (this._sources.has(source)) {
			this._sources.delete(source)
			this.setVoiceCount(this._getMaxRequiredVoiceCount())
		} else {
			logger.warn('[PugPolyAudioNode.onDisconnectSource] !this._sources.has(source):', {source, sources: this._sources, this: this})
		}
	}

	private _getMaxRequiredVoiceCount() {
		let maxSourceVoiceCount = 0
		this._sources.forEach(source => {
			maxSourceVoiceCount = Math.max(maxSourceVoiceCount, source.voiceCount)
		})
		this.params.forEach(param => {
			param.sources.forEach(paramSource => {
				maxSourceVoiceCount = Math.max(maxSourceVoiceCount, paramSource.voiceCount)
			})
		})
		return maxSourceVoiceCount
	}

	public disconnect(target?: PugPolyAudioTarget) {
		if (target) {
			this._disconnectTarget(target)
		} else {
			this._disconnectAll()
		}
	}

	private _disconnectTarget(target: PugPolyAudioTarget) {
		this._withWebAudioTarget(target, webAudioTargets => {
			for (const [sourceNode, targetNode] of webAudioTargets) {
				sourceNode.disconnect(targetNode as AudioNode)
			}
			target.onDisconnectSource(this)
			this._targets.delete(target)
		})
	}

	private _withWebAudioTarget(target: PugPolyAudioTarget, func: (webAudioTargets: WebAudioPairs<TSelf, WebAudioTarget>) => void) {
		const webAudioTarget = this._targets.get(target)
		if (webAudioTarget === undefined) {
			return this._logWarning('_disconnectTarget', 'target not found!', {target})
		} else {
			return func(webAudioTarget)
		}
	}

	private _disconnectAll() {
		for (const node of this._webAudioNodes) {
			node.disconnect()
		}
		this._targets.forEach((_, pugTarget) => pugTarget.onDisconnectSource(this))
		this._targets.clear()
	}

	private _logWarning(functionName: string, message: string, data: object) {
		logger.warn(`[PugPolyAudioNode.${functionName}] ${message}`, {
			thisType: this.pugAudioNodeType,
			this: this,
			...data,
		})
	}

	public dispose() {
		for (const node of this._webAudioNodes.values()) {
			this._disposeWebAudioNode(node)
		}
	}

	protected abstract _makeWebAudioNode(): TSelf
	protected abstract _disposeWebAudioNode(webAudioNode: TSelf): void
}

export interface PugPolyAudioParamSources {
	sources: ReadonlySet<PugPolyAudioNode>
}

// TODO Param input chain
// TODO Knob value stuff
export class PugPolyAudioParam<TParent extends AudioNode = AudioNode> implements PugPolyAudioTarget, PugPolyAudioParamSources {
	public readonly pugType = 'paramPoly'
	protected readonly _sources = new Set<PugPolyAudioNode>()
	public get sources() {return this._sources as ReadonlySet<PugPolyAudioNode>}

	public constructor(
		public readonly pugNode: PugPolyAudioNode<TParent>,
		private readonly _getAudioParamFromNode: (webAudioNode: TParent) => AudioParam
	) {}

	public onNewSourceConnection<TSource extends AudioNode>(
		source: PugPolyAudioNode<TSource>, sources: WebAudioNodes<TSource>,
	): WebAudioPairs<TSource, AudioParam> {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected) {
			throw new Error('[PugPolyAudioParam.onNewSourceConnection] alreadyConnected! ' + JSON.stringify({source, target: this}))
		}
		this._sources.add(source)
		return this._getTargetsForSources(sources)
	}

	public onNewSourceVoiceCount<TSource extends AudioNode>(
		source: PugPolyAudioNode<TSource>, sources: WebAudioNodes<TSource>,
	): WebAudioPairs<TSource, AudioParam> {
		const alreadyConnected = this._sources.has(source as PugPolyAudioNode)
		if (alreadyConnected === false) {
			throw new Error('[PugPolyAudioParam.onNewSourceVoiceCount] not connected! ' + JSON.stringify({source, target: this}))
		}
		return this._getTargetsForSources(sources)
	}

	private _getTargetsForSources<TSource extends AudioNode>(
		sources: WebAudioNodes<TSource>,
	): WebAudioPairs<TSource, AudioParam> {
		const pairs = this.pugNode._getTargetsForSources(sources)
		const paramPairs = new Map() as WebAudioPairs<TSource, AudioParam>
		for (const [sourceWebAudioNode, targetWebAudioNode] of pairs) {
			paramPairs.set(sourceWebAudioNode, this._getAudioParamFromNode(targetWebAudioNode))
		}
		return paramPairs
	}

	public getMaxRequiredVoiceCount() {
		let maxSourceVoiceCount = 0
		this._sources.forEach(source => {
			maxSourceVoiceCount = Math.max(maxSourceVoiceCount, source.voiceCount)
		})
		return maxSourceVoiceCount
	}

	public onDisconnectSource(source: PugPolyAudioNode) {
		this._sources.delete(source)
	}

	public linearRampToValueAtTime(voice: number | 'all', value: number, endTime: number) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).linearRampToValueAtTime(value, endTime)
		})
	}

	public setTargetAtTime(voice: number | 'all', target: number, startTime: number, timeConstant: number) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).setTargetAtTime(target, startTime, timeConstant)
		})
	}

	public setValueAtTime(voice: number | 'all', value: number, startTime = 0) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).setValueAtTime(value, startTime)
		})
	}

	public setValueCurveAtTime(voice: number | 'all', values: number[] | Float32Array, startTime: number, duration: number) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).setValueCurveAtTime(values, startTime, duration)
		})
	}

	public cancelScheduledValues(voice: number | 'all', cancelTime: number) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).cancelScheduledValues(cancelTime)
		})
	}

	public cancelAndHoldAtTime(voice: number | 'all', cancelTime: number) {
		this._getVoices(voice).forEach(webAudioNode => {
			this._getAudioParamFromNode(webAudioNode).cancelAndHoldAtTime(cancelTime)
		})
	}

	private _getVoices(voice: number | 'all') {
		if (voice === 'all') {
			return this.pugNode.webAudioNodes
		} else {
			const webAudioNode = this.pugNode.webAudioNodes[voice]
			if (!webAudioNode) {
				logger.error('[PugPolyAudioParam._getVoices] missing voice!', {voice, this: this, nodes: this.pugNode.webAudioNodes})
				return [] as const
			}
			return [webAudioNode] as const
		}
	}
}

export class PugPolyGainNode extends PugPolyAudioNode<GainNode> {
	public readonly pugAudioNodeType = 'gain'
	public readonly params: readonly PugPolyAudioParamSources[]
	public readonly gain: PugPolyAudioParam<GainNode>

	public constructor(args: PugPolyAudioNodeArgs) {
		super(args)
		this.gain = new PugPolyAudioParam(this, gain => gain.gain)
		this.params = [this.gain]
	}

	protected _makeWebAudioNode() {
		const gain = this._audioContext.createGain()
		gain.gain.value = Math.random() * 0.1
		return gain
	}

	protected _disposeWebAudioNode(webAudioNode: GainNode) {
		webAudioNode.disconnect()
	}
}

export class PugPolyOscillatorNode extends PugPolyAudioNode<OscillatorNode> {
	public readonly pugAudioNodeType = 'oscillator'
	public readonly params: readonly PugPolyAudioParamSources[]
	public readonly frequency: PugPolyAudioParam<OscillatorNode>
	public readonly detune: PugPolyAudioParam<OscillatorNode>
	private _type: OscillatorNode['type'] = 'sawtooth'

	public constructor(args: PugPolyAudioNodeArgs) {
		super(args)
		this.frequency = new PugPolyAudioParam(this, osc => osc.frequency)
		this.detune = new PugPolyAudioParam(this, osc => osc.detune)
		this.params = [this.frequency, this.detune]
	}

	public set type(type: OscillatorNode['type']) {
		this._type = type
		for (const osc of this.webAudioNodes) {
			osc.type = this._type
		}
	}

	protected _makeWebAudioNode() {
		const osc = this._audioContext.createOscillator()
		osc.type = this._type
		osc.frequency.value = (Math.random() * 440) + 440
		osc.detune.value = 0
		osc.start()
		return osc
	}

	protected _disposeWebAudioNode(osc: OscillatorNode) {
		osc.stop()
		osc.disconnect()
	}
}

export class PugPolyAudioDestinationNode extends PugPolyAudioNode<AudioDestinationNode> {
	public readonly pugAudioNodeType = 'destination'
	public readonly params: readonly PugPolyAudioParamSources[] = []

	public constructor(args: PugPolyAudioNodeArgs) {
		super(args)
	}

	protected _makeWebAudioNode() {
		return this._audioContext.destination
	}

	protected _disposeWebAudioNode(_: AudioDestinationNode) {}
}

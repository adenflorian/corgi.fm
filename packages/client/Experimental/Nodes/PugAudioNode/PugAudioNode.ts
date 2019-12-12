import {logger} from '../../../client-logger'

export interface PugAudioNodeArgs {
	readonly audioContext: AudioContext
}

export type WebAudioTarget = AudioNode | AudioParam

export interface PugAudioTarget {
	onNewSourceConnection(source: PugAudioNode): WebAudioTarget
	onDisconnectSource(source: PugAudioNode): void
}

export abstract class PugAudioNode implements PugAudioTarget {
	public readonly pugType = 'node'
	protected readonly _audioContext: AudioContext
	protected readonly _sources = new Map<PugAudioNode, PugAudioNode>()
	protected readonly _targets = new Map<PugAudioTarget, WebAudioTarget>()

	public constructor(
		args: PugAudioNodeArgs,
		protected readonly _webAudioNode: AudioNode,
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
			return this._logWarning('_disconnectTarget',  'target not found!', {target})
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
		logger.warn(`[PugAudioNode.${functionName}] ${message}`, {source: this, ...data})
	}

	public dispose() {this._dispose()}
	protected abstract _dispose(): void
}

export class PugGainNode extends PugAudioNode {
	protected readonly _webAudioNode: GainNode
	public readonly gain: PugAudioParam

	public constructor(args: PugAudioNodeArgs) {
		const newGainNode = args.audioContext.createGain()
		super(args, newGainNode)
		this._webAudioNode = newGainNode

		this.gain = new PugAudioParam(this._webAudioNode.gain, this)
	}

	protected _dispose() {
		this._webAudioNode.disconnect()
	}
}

export class PugAudioParam implements PugAudioTarget {
	public readonly pugType = 'param'
	protected readonly _sources = new Map<PugAudioNode, PugAudioNode>()

	public constructor(
		private readonly _audioParam: AudioParam,
		private readonly _pugNode: PugAudioNode,
	) {}

	public onNewSourceConnection(source: PugAudioNode): AudioParam {
		const alreadyConnected = this._sources.has(source)
		if (alreadyConnected) {
			throw new Error('[PugAudioParam.onNewConnection] alreadyConnected! ' + JSON.stringify({source, target: this}))
		}
		this._sources.set(source, source)
		return this._audioParam
	}

	public onDisconnectSource(source: PugAudioNode) {
		this._sources.delete(source)
	}

	public linearRampToValueAtTime(value: number, endTime: number) {
		this._audioParam.linearRampToValueAtTime(value, endTime)
	}

	public setTargetAtTime(target: number, startTime: number, timeConstant: number) {
		this._audioParam.setTargetAtTime(target, startTime, timeConstant)
	}

	public setValueAtTime(value: number, startTime = 0) {
		this._audioParam.setValueAtTime(value, startTime)
	}

	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number) {
		this._audioParam.setValueCurveAtTime(values, startTime, duration)
	}

	public cancelScheduledValues(cancelTime: number) {
		this._audioParam.cancelScheduledValues(cancelTime)
	}

	public cancelAndHoldAtTime(cancelTime: number) {
		this._audioParam.cancelAndHoldAtTime(cancelTime)
	}
}

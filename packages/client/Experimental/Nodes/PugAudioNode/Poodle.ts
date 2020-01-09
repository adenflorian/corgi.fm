interface PoodleArgs {
	readonly audioContext: AudioContext
}

abstract class Poodle {
	protected readonly _audioContext: AudioContext
	private readonly _connectedTargets = new Set<Poodle>()

	public constructor(protected readonly _args: PoodleArgs) {
		this._audioContext = this._args.audioContext
	}

	public connect(target: Poodle): this {
		if (this._connectedTargets.has(target) === false) {
			this.output.connect(target.input)
			this._connectedTargets.add(target)
		}
		return this
	}

	public disconnect(target?: Poodle) {
		if (target) {
			if (this._connectedTargets.has(target)) {
				this.output.disconnect(target.input)
				this._connectedTargets.delete(target)
			}
		} else {
			this.output.disconnect()
		}
	}

	public abstract get input(): AudioNode
	public abstract get output(): AudioNode
	public dispose() {
		this.disconnect()
		this._dispose()
	}
	protected abstract _dispose(): void
}

class PoodleGain extends Poodle {
	private readonly _gain: GainNode

	public constructor(args: PoodleArgs) {
		super(args)
		this._gain = this._audioContext.createGain()
	}

	public get input() {return this._gain}
	public get output() {return this._gain}

	protected _dispose() {}
}

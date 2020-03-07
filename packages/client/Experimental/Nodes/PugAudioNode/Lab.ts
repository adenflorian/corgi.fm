import {logger} from '../../../client-logger'
import * as Immutable from 'immutable'
import {clamp} from '@corgifm/common/common-utils'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'

// Lab
export type LabTarget<TTarget extends KelpieAudioNode = KelpieAudioNode> = LabAudioNode<TTarget> | LabAudioParam<TTarget>

type VoiceCount = number | LabTargetMode

export interface LabAudioNodeArgs {
	readonly audioContext: AudioContext
	readonly voiceMode: VoiceCount
	readonly creatorName: string
	readonly autoMono?: boolean
}

type LabTargetMode = 'mono' | 'autoPoly'

interface LabTargetConnection {
	readonly target: LabTarget
	readonly targetMode: LabTargetMode
	readonly targetVoices: Immutable.List<KelpieTarget>
}

let id = 0

export abstract class LabAudioNode<TNode extends KelpieAudioNode = KelpieAudioNode> {
	public readonly abstract name: string
	public get fullName() {return `${this.creatorName}-${this.name}-${this.id}`}
	public readonly id = id++
	public get voices() {return this._voices}
	public set voices(newVoices: Immutable.List<TNode>) {
		this._voices = newVoices
		if (this.voiceCount.current !== this.voices.size) {
			this.voiceCount.invokeNextFrame(this.voices.size)
		}
	}
	private _voices = Immutable.List<TNode>()
	public readonly voiceCount: CorgiNumberChangedEvent
	// Keep track of targets in case we change voice count/mode
	public readonly targets = new Map<LabTarget, LabTargetConnection>()
	// Keep track of sources in case we change voice mode
	public readonly sources = new Set<LabAudioNode>()
	private _mode: VoiceCount = 'mono'
	public get mode() {return this._mode}
	public audioContext: AudioContext
	private _currentModeImpl: LabModeImpl<TNode> = new LabMono(this)
	public get currentModeImpl() {return this._currentModeImpl}
	private readonly _params = new Set<LabAudioParam>()
	public get params() {return this._params as ReadonlySet<LabAudioParam>}
	public readonly creatorName: string
	private _activeVoice = 0 as number | 'all'
	public get activeVoice() {return this._activeVoice}
	public readonly setActiveVoice = (val: number | 'all', time: number) => {
		if (val === this._activeVoice) return
		// console.log(`set activeVoice`, this.fullName, {val})
		this._activeVoice = val
		this._activeVoiceTime = time
		this.targets.forEach(target => {
			target.target.onSourceActiveVoiceChanged(val, time)
		})
	}
	private _activeVoiceTime = 0
	public get activeVoiceTime() {return this._activeVoiceTime}
	public readonly autoMono?: boolean

	public constructor(args: LabAudioNodeArgs) {
		this.audioContext = args.audioContext
		this.creatorName = args.creatorName
		this._mode = args.voiceMode
		this.autoMono = args.autoMono
		this.voiceCount = new CorgiNumberChangedEvent(this.voices.size)
	}

	// Do not make into a property
	public init() {
		this.setVoiceCount(this._mode, true)
	}

	public onSourceActiveVoiceChanged(newActiveVoice: number | 'all', time: number) {
		if (this.mode === 'autoPoly') {
			this.setActiveVoice(newActiveVoice, time)
		}
	}

	// Called on the source
	public readonly connect = <TTarget extends LabTarget>(target: TTarget): TTarget => {
		// console.log(`connecting ${this.creatorName}.${this.name}(${this.mode}) to ${target.creatorName}.${target.name}(${target.mode})`)
		const [targetMode, targetVoices] = target.onConnect(this)
		this._currentModeImpl.connect(target, targetMode, targetVoices)
		this.targets.set(target, {target, targetMode, targetVoices})
		return target
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<KelpieAudioNode>] => {
		this.sources.add(source)
		const voices = this._currentModeImpl.onConnect(source)
		return voices
	}

	public readonly onConnectThroughParam = (param: LabAudioParam, source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		logger.assert(this.params.has(param), 'missing param!')
		return this._currentModeImpl.onConnect(source)
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		return this._currentModeImpl.onSourceVoiceCountChange(source)
	}

	public makeVoice(voiceIndex: number): TNode {
		const voice = this._makeVoice(voiceIndex)

		this.params.forEach(x => {
			const audioParam = x.getAudioParam(voice)
			x.onMakeVoice(audioParam)
		})

		return voice
	}

	protected abstract _makeVoice(voiceIndex: number): TNode

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
					source.onTargetVoiceModeChange(param, newVoiceCount, this.voices.map(param.getAudioParam))
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
					source.onTargetVoiceModeChange(param, newVoiceCount, this.voices.map(param.getAudioParam))
				})
			})
		} else {
			this._currentModeImpl = new LabStaticPoly(this)
			this._currentModeImpl.setVoiceCount(newVoiceCount)
		}
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
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
	public abstract connect<TTarget extends KelpieAudioNode>(target: LabTarget<TTarget>, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>): void
	public abstract onConnect(source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>]
	public abstract onSourceVoiceCountChange(source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>]
	public abstract setVoiceCount(voiceCount: number): void
	public abstract onTargetVoiceModeChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>): void
	public onTargetVoiceCountChange(target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>): void {
		// Only meant to be overridden by mono
	}
	public abstract disconnect(target: LabTarget, targetVoices: Immutable.List<KelpieTarget>): void
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
				voice.connect(targetVoices.get(0)! as KelpieAudioNode)
			})
		} else if (this._parent.voiceCount.current === 1 && this._parent.autoMono) {
			targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
				this._monoVoice.connect(targetVoice)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices.get(i)! as KelpieAudioNode)
			})
		}
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		this._setVoiceCount(this._getMaxSourceVoiceCount(), source)
		return ['autoPoly', this._parent.voices]
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		// console.log(`${this._parent.creatorName} LabAutoPoly.onSourceVoiceCountChange source: ${source.name}`)

		this._setVoiceCount(this._getMaxSourceVoiceCount(), source)
		return ['autoPoly', this._parent.voices]
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		// console.log(`${this._parent.creatorName} LabAutoPoly.setVoiceCount`)
		this._setVoiceCount(this._getMaxSourceVoiceCount())
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
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
		if (this._parent.voiceCount.current === 1 && this._parent.autoMono) {
			if (targetMode === 'mono') {
				oldTargetConnection.targetVoices.forEach(x => {
					this._monoVoice.disconnect(x)
				})
				this._monoVoice.connect(targetVoices.get(0)! as KelpieAudioNode)
			} else {
				this._monoVoice.disconnect(oldTargetConnection.targetVoices.get(0)! as KelpieAudioNode)
				targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
					this._monoVoice.connect(targetVoice)
				})
			}
		} else {
			if (targetMode === 'mono') {
				this._parent.voices.forEach((voice, i) => {
					voice.disconnect(oldTargetConnection.targetVoices.get(i)! as KelpieAudioNode)
				})
				this._parent.voices.forEach((voice) => {
					voice.connect(targetVoices.get(0)! as KelpieAudioNode)
				})
			} else {
				this._parent.voices.forEach((voice, i) => {
					voice.disconnect(oldTargetConnection.targetVoices.get(0)! as KelpieAudioNode)
				})
				this._parent.voices.forEach((voice, i) => {
					voice.connect(targetVoices.get(i)! as KelpieAudioNode)
				})
			}
		}
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private readonly _getMaxSourceVoiceCount = (): number => {
		let maxSourceVoiceCount = 0
		this._parent.sources.forEach(source => {
			maxSourceVoiceCount = Math.max(maxSourceVoiceCount, source.voiceCount.current)
		})
		this._parent.params.forEach(param => {
			param.sources.forEach(paramSource => {
				maxSourceVoiceCount = Math.max(maxSourceVoiceCount, paramSource.voiceCount.current)
			})
		})
		// console.log(`${this._parent.creatorName} LabAutoPoly._getMaxSourceVoiceCount: ${maxSourceVoiceCount}`)
		return maxSourceVoiceCount
	}

	private readonly _setVoiceCount = (newVoiceCount: number, sourceCatalyst?: LabAudioNode) => {
		const delta = Math.max(newVoiceCount, 1) - this._parent.voices.size
		// console.log(`${this._parent.fullName} LabAutoPoly._setVoiceCount delta: ${delta}`, {this: this, newVoiceCount})

		if (delta > 0) {
			if (this._parent.voiceCount.current === 1 && this._parent.autoMono) {
				this._monoVoice.disconnect()
			}
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
			if (this._parent.activeVoice !== 'all') {
				this._parent.setActiveVoice(Math.min(this._parent.activeVoice, this._parent.voiceCount.current - 1), 0)
			}
		} else {
			return
		}

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			if (delta > 0) {
				if (targetMode === 'mono') {
					this._parent.voices.forEach((voice) => {
						voice.connect(targetVoices.get(0)! as KelpieAudioNode)
					})
				} else {
					this._parent.voices.forEach((voice, i) => {
						voice.connect(targetVoices.get(i)! as KelpieAudioNode)
					})
				}
			} else if (this._parent.voiceCount.current === 1 && this._parent.autoMono) {
				targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
					this._monoVoice.connect(targetVoice)
				})
			}
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
			this._parent.sources.forEach(source => {
				// If this source is the one that caused our voice count to change,
				// then we don't want to call them back saying our voice count changed
				if (source === sourceCatalyst) return
				source.currentModeImpl.onTargetVoiceCountChange(this._parent, 'autoPoly', this._parent.voices)
			})
			this._parent.params.forEach(param => {
				param.sources.forEach(paramSource => {
					if (paramSource === sourceCatalyst) return
					paramSource.currentModeImpl.onTargetVoiceCountChange(param, 'autoPoly', this._parent.voices.map(param.getAudioParam))
				})
			})
		})
	}

	private get _monoVoice() {return this._parent.voices.get(0)!}

	public readonly onTargetVoiceCountChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
		if (this._parent.voiceCount.current > 1 || !this._parent.autoMono) return

		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		if (targetMode !== 'autoPoly') throw new Error('expected autoPoly!')

		// Only disconnect old voices that aren't in the new target voices
		const oldTargetVoicesToDisconnect = oldTargetConnection.targetVoices
			.filter(voice => targetVoices.includes(voice) === false)

		oldTargetVoicesToDisconnect.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})

		// Only connect new voices that aren't in the old target voices
		const newTargetVoicesToConnectTo = targetVoices
			.filter(voice => oldTargetConnection.targetVoices.includes(voice) === false)

		newTargetVoicesToConnectTo.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
			this._monoVoice.connect(targetVoice)
		})
		// console.log('%^%^%^%^%^%^%^%^ LabAutoPoly.onTargetVoiceCountChange ', this._parent, {oldTargetVoicesToDisconnect, newTargetVoicesToConnectTo})

		logger.assert(oldTargetVoicesToDisconnect.size > 0 || newTargetVoicesToConnectTo.size > 0, ':(', {
			oldTargetVoicesToDisconnect,
			newTargetVoicesToConnectTo,
			oldTargetVoices: oldTargetConnection.targetVoices,
			targetVoices,
		})

		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			// console.log(this._parent.voices)
			this._parent.voices = this._parent.voices.push(this._parent.makeVoice(this._parent.voices.size))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.last(undefined)
			this._parent.voices = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly disconnect = (target: LabTarget, targetVoices: Immutable.List<KelpieTarget>) => {
		if (this._parent.voiceCount.current === 1 && this._parent.autoMono) {
			targetVoices.forEach(x => {
				this._monoVoice.disconnect(x)
			})
		} else if (target.mode === 'mono') {
			this._parent.voices.forEach(voice => {
				voice.disconnect(targetVoices.get(0)!)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(targetVoices.get(i)!)
			})
		}
	}

	public readonly onDisconnect = (source: LabAudioNode) => {
		// console.log(`${this._parent.creatorName} LabAutoPoly.onDisconnect source: ${source.name}`)
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
		// console.log(`LabStaticPoly.connect start. this._parent.voices.size: ${this._parent.voices.size}. this._parent.voices`, this._parent.voices)
		const [targetMode, targetVoices] = target.onConnect(this._parent)
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices.get(0)! as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices.get(i) as KelpieAudioNode)
			})
		}
		// console.log(`LabStaticPoly.connect end`)
	}

	// Called on the target
	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		throw new Error('nothing is allowed to connect to static poly')
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		throw new Error('wrong!')
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices = this._parent.voices.push(this._parent.makeVoice(this._parent.voices.size))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.last(undefined)
			this._parent.voices = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly disconnect = (target: LabTarget, targetVoices: Immutable.List<KelpieTarget>) => {
		this._parent.voices.forEach((voice, i) => {
			voice.disconnect(targetVoices.get(i)!)
		})
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		const delta = Math.max(newVoiceCount, 1) - this._parent.voices.size
		// console.log(`${this._parent.creatorName} LabStaticPoly newVoiceCount: ${newVoiceCount}, delta: ${delta}`)

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
			if (this._parent.activeVoice !== 'all') {
				this._parent.setActiveVoice(Math.min(this._parent.activeVoice, this._parent.voiceCount.current - 1), 0)
			}
		} else {
			return
		}

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			if (delta > 0) {
				if (targetMode === 'mono') {
					this._parent.voices.forEach((voice) => {
						voice.connect(targetVoices.get(0)! as KelpieAudioNode)
					})
				} else {
					this._parent.voices.forEach((voice, i) => {
						voice.connect(targetVoices.get(i)! as KelpieAudioNode)
					})
				}
			}
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
		})
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		if (targetMode === 'mono') {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices.get(i)! as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice) => {
				voice.connect(targetVoices.get(0)! as KelpieAudioNode)
			})
		} else {
			this._parent.voices.forEach((voice, i) => {
				voice.disconnect(oldTargetConnection.targetVoices.get(0)! as KelpieAudioNode)
			})
			this._parent.voices.forEach((voice, i) => {
				voice.connect(targetVoices.get(i)! as KelpieAudioNode)
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
	public readonly onConnect = (source: LabAudioNode): readonly ['mono', Immutable.List<TNode>] => {
		logger.assert(this._parent.voiceCount.current === 1, 'this._parent.voiceCount.current === 1, this._parent.voiceCount.current: ' + this._parent.voiceCount.current)
		return ['mono', this._parent.voices]
	}

	public readonly setVoiceCount = (newVoiceCount: number) => {
		const delta = 1 - this._parent.voiceCount.current
		// console.log(`LabMono.setVoiceCount delta: ${delta}`)
		if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
			if (this._parent.activeVoice !== 'all') {
				this._parent.setActiveVoice(Math.min(this._parent.activeVoice, this._parent.voiceCount.current - 1), 0)
			}
		} else if (delta > 0) {
			logger.assert(delta === 1, 'delta === 1')
			this._addVoices(delta)
		}

		this._parent.setActiveVoice(0, this._parent.audioContext.currentTime)

		logger.assert(this._parent.voiceCount.current === 1, 'this._parent.voiceCount.current === 1')

		this._parent.targets.forEach(target => {
			const [targetMode, targetVoices] = target.target.onSourceVoiceCountChange(this._parent)
			this._connectToTargetVoices(targetVoices)
			this._parent.targets.set(target.target, {target: target.target, targetVoices, targetMode})
		})
	}

	public readonly onTargetVoiceModeChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		oldTargetConnection.targetVoices.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})
		this._connectToTargetVoices(targetVoices)
		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	public readonly onTargetVoiceCountChange = (target: LabTarget, targetMode: LabTargetMode, targetVoices: Immutable.List<KelpieTarget>) => {
		const oldTargetConnection = this._parent.targets.get(target)
		if (!oldTargetConnection) throw new Error('!oldTargetConnection')
		if (targetMode !== 'autoPoly') throw new Error('expected autoPoly!')

		// Only disconnect old voices that aren't in the new target voices
		const oldTargetVoicesToDisconnect = oldTargetConnection.targetVoices
			.filter(voice => targetVoices.includes(voice) === false)

		oldTargetVoicesToDisconnect.forEach(oldTargetVoice => {
			this._monoVoice.disconnect(oldTargetVoice)
		})

		// Only connect new voices that aren't in the old target voices
		const newTargetVoicesToConnectTo = targetVoices
			.filter(voice => oldTargetConnection.targetVoices.includes(voice) === false)

		this._connectToTargetVoices(newTargetVoicesToConnectTo)
		// console.log('%^%^%^%^%^%^%^%^ LabMono.onTargetVoiceCountChange ', this._parent, {oldTargetVoicesToDisconnect, newTargetVoicesToConnectTo})

		logger.assert(oldTargetVoicesToDisconnect.size > 0 || newTargetVoicesToConnectTo.size > 0, ':(', {
			oldTargetVoicesToDisconnect,
			newTargetVoicesToConnectTo,
			oldTargetVoices: oldTargetConnection.targetVoices,
			targetVoices,
		})

		this._parent.targets.set(target, {target, targetVoices, targetMode})
	}

	private get _monoVoice() {return this._parent.voices.get(0)!}

	private readonly _connectToTargetVoices = (targetVoices: Immutable.List<KelpieTarget>) => {
		targetVoices.forEach((targetVoice: KelpieAudioNode | KelpieAudioParam) => {
			this._monoVoice.connect(targetVoice)
		})
	}

	private readonly _addVoices = (numberToAdd: number) => {
		for (let i = 0; i < numberToAdd; i++) {
			this._parent.voices = this._parent.voices.push(this._parent.makeVoice(this._parent.voiceCount.current))
		}
	}

	private readonly _deleteVoices = (numberToDelete: number) => {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedVoice = this._parent.voices.last(undefined)
			this._parent.voices = this._parent.voices.pop()
			if (deletedVoice === undefined) {
				logger.error('[LabNode._deleteVoices] deletedVoice is undefined:', {source: this, voices: this._parent.voices, numberToDelete})
			} else {
				deletedVoice.disconnect()
			}
		}
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<TNode>] => {
		logger.assert(this._parent.voices.size === 1, ` expected 1, actual: ${this._parent.voices.size}`, this._parent.voices)
		return ['mono', this._parent.voices]
	}

	public readonly disconnect = (target: LabTarget, targetVoices: Immutable.List<KelpieTarget>) => {
		targetVoices.forEach(targetVoice => {
			this._monoVoice.disconnect(targetVoice)
		})
	}

	public readonly onDisconnect = (source: LabAudioNode) => {}

	public readonly dispose = () => {}
}

export type OnMakeVoice = (param: KelpieAudioParam) => void

export class LabAudioParam<TNode extends KelpieAudioNode = KelpieAudioNode> {
	public get fullName() {return `${this._labAudioNode.fullName}.${this._name}`}
	public get creatorName() {return this._labAudioNode.creatorName}
	public get mode() {return this._labAudioNode.mode}
	// Keep track of sources in case we change voice mode
	public readonly sources = new Set<LabAudioNode>()
	public get name() {return `${this._labAudioNode.name}.${this._name}`}

	public constructor(
		private readonly _labAudioNode: LabAudioNode<TNode>,
		// TParent2 is a workaround for some typing issue
		public readonly getAudioParam: <TNode2 extends TNode>(kelpieNode: TNode2) => KelpieAudioParam,
		private readonly _name: string,
		private _onMakeVoice: OnMakeVoice = () => {}
	) {
		this._labAudioNode.onParamAdd(this)
	}

	public set onMakeVoice(handler: OnMakeVoice) {
		this._onMakeVoice = handler
		this._labAudioNode.voices.forEach(voice => {
			this._onMakeVoice(this.getAudioParam(voice))
		})
	}

	public get onMakeVoice() {return this._onMakeVoice}

	public onSourceActiveVoiceChanged(newActiveVoice: number | 'all', time: number) {
		this._labAudioNode.onSourceActiveVoiceChanged(newActiveVoice, time)
	}

	public readonly cancelAndHoldAtTime = (cancelTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).cancelAndHoldAtTime(cancelTime)
		}
	}

	public readonly cancelScheduledValues = (cancelTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).cancelScheduledValues(cancelTime)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).cancelScheduledValues(cancelTime)
		}
	}

	public readonly exponentialRampToValueAtTime = (value: number, endTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).exponentialRampToValueAtTime(value, endTime)
		}
	}

	public readonly linearRampToValueAtTime = (value: number, endTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).linearRampToValueAtTime(value, endTime)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).linearRampToValueAtTime(value, endTime)
		}
	}

	public readonly setTargetAtTime = (target: number, startTime: number, timeConstant: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).setTargetAtTime(target, startTime, timeConstant)
			// console.log(`setTargetAtTime voiceIndex: ${voiceIndex}   target: ${target}   voice: `, voice)
		}
	}

	public readonly setValueAtTime = (value: number, startTime: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).setValueAtTime(value, startTime)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).setValueAtTime(value, startTime)
		}
	}

	public readonly setValueCurveAtTime = (values: number[] | Float32Array, startTime: number, duration: number, voiceIndex: number | 'all' = 'all') => {
		if (voiceIndex === 'all') {
			this._labAudioNode.voices.forEach(voice => {
				this.getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
			})
		} else {
			const voice = this._labAudioNode.voices.get(voiceIndex)
			if (!voice) return logger.warn('LabAudioParam !voice :( . ' + `voiceIndex: ${voiceIndex}  voiceCount: ${this._labAudioNode.voiceCount}  ${this.name}`)
			this.getAudioParam(voice).setValueCurveAtTime(values, startTime, duration)
		}
	}

	public readonly onConnect = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<KelpieAudioParam>] => {
		this.sources.add(source)
		const [mode, voices] = this._labAudioNode.onConnectThroughParam(this, source)
		return [mode, voices.map(this.getAudioParam)]
	}

	public readonly onDisconnect = (source: LabAudioNode) => {
		this.sources.delete(source)
		this._labAudioNode.onDisconnectThroughParam(this, source)
	}

	public readonly onSourceVoiceCountChange = (source: LabAudioNode): readonly [LabTargetMode, Immutable.List<KelpieAudioParam>] => {
		const [mode, voices] = this._labAudioNode.onSourceVoiceCountChange(source)
		return [mode, voices.map(this.getAudioParam)]
	}

	public readonly dispose = () => {
		this._labAudioNode.onParamDispose(this)
	}
}

export class LabOscillator extends LabAudioNode<KelpieOscillator> {
	public readonly name = 'LabOscillator'
	public readonly frequency: LabAudioParam<KelpieOscillator>
	public readonly detune: LabAudioParam<KelpieOscillator>
	public readonly unisonDetune: LabAudioParam<KelpieOscillator>
	private _type: OscillatorType = 'sawtooth'
	public set type(value: OscillatorType) {
		this.voices.forEach(voice => voice.type = value)
		this._type = value
	}

	private _unisonCount: number = 1
	public set unisonCount(value: number) {
		this.voices.forEach(voice => voice.unisonCount = value)
		this._unisonCount = value
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.frequency = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.frequency, 'frequency', f => f.setValueAtTime(0, 0))
		this.detune = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.detune, 'detune')
		this.unisonDetune = new LabAudioParam(this, (kelpieOsc) => kelpieOsc.unisonDetune, 'unisonDetune')
		super.init()
	}

	protected readonly _makeVoice = (voiceIndex: number): KelpieOscillator => {
		const newOsc = new KelpieOscillator({audioContext: this.audioContext, labNode: this, voiceIndex}, 0)
		newOsc.type = this._type
		newOsc.unisonCount = this._unisonCount
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

	protected readonly _makeVoice = (voiceIndex: number): KelpieGain => {
		const newGain = new KelpieGain({audioContext: this.audioContext, labNode: this, voiceIndex})
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
		this.Q = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.Q, 'Q', x => x.setValueAtTime(0, 0))
		this.detune = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.detune, 'detune', x => x.setValueAtTime(0, 0))
		this.frequency = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.frequency, 'frequency', x => x.setValueAtTime(0, 0))
		this.gain = new LabAudioParam(this, (kelpieBiquadFilterNode) => kelpieBiquadFilterNode.gain, 'gain', x => x.setValueAtTime(0, 0))
		super.init()
	}

	protected readonly _makeVoice = (voiceIndex: number): KelpieBiquadFilterNode => {
		const newFilter = new KelpieBiquadFilterNode({audioContext: this.audioContext, labNode: this, voiceIndex})
		newFilter.type = this._type
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

	protected readonly _makeVoice = (voiceIndex: number): KelpieStereoPannerNode => {
		const newPan = new KelpieStereoPannerNode({audioContext: this.audioContext, labNode: this, voiceIndex})
		return newPan
	}
}

export class LabAudioDestinationNode extends LabAudioNode<KelpieAudioDestinationNode> {
	public readonly name = 'LabAudioDestinationNode'
	public constructor(args: LabAudioNodeArgs) {
		super(args)
		super.init()
	}

	protected readonly _makeVoice = (voiceIndex: number): KelpieAudioDestinationNode => {
		const newDestination = new KelpieAudioDestinationNode({audioContext: this.audioContext, labNode: this, voiceIndex})
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

	protected readonly _makeVoice = (voiceIndex: number): KelpieWaveShaperNode => {
		const newWS = new KelpieWaveShaperNode({audioContext: this.audioContext, labNode: this, voiceIndex})
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

	protected readonly _makeVoice = (voiceIndex: number): KelpieConstantSourceNode => {
		const newThing = new KelpieConstantSourceNode({audioContext: this.audioContext, labNode: this, voiceIndex})
		newThing.start()
		return newThing
	}
}

export class LabAudioBufferSourceNode extends LabAudioNode<KelpieAudioBufferSourceNode> {
	public readonly name = 'LabAudioBufferSourceNode'
	public readonly detune: LabAudioParam<KelpieAudioBufferSourceNode>
	public readonly playbackRate: LabAudioParam<KelpieAudioBufferSourceNode>
	private _buffer: AudioBuffer | null = null
	public set buffer(buffer: AudioBuffer | null) {
		this.voices.forEach(voice => voice.buffer = buffer)
		this._buffer = buffer
	}
	private _loop: boolean = false
	public set loop(loop: boolean) {
		this.voices.forEach(voice => voice.loop = loop)
		this._loop = loop
	}
	private _loopStart: number = 0
	public set loopStart(loopStart: number) {
		this.voices.forEach(voice => voice.loopStart = loopStart)
		this._loopStart = loopStart
	}
	private _loopEnd: number = 0
	public set loopEnd(loopEnd: number) {
		this.voices.forEach(voice => voice.loopEnd = loopEnd)
		this._loopEnd = loopEnd
	}

	public constructor(args: LabAudioNodeArgs) {
		super(args)
		this.detune = new LabAudioParam(this, (kelpieAudioBufferSource) => kelpieAudioBufferSource.detune, 'detune')
		this.playbackRate = new LabAudioParam(this, (kelpieAudioBufferSource) => kelpieAudioBufferSource.playbackRate, 'playbackRate')
		super.init()
	}

	public retrigger(time: number, voiceIndex: number | 'all' = 'all') {
		if (voiceIndex === 'all') {
			this.voices.forEach(voice => {
				voice.retrigger(time)
			})
		} else {
			const voice = this.voices.get(voiceIndex)
			if (!voice) return logger.error('LabAudioBufferSourceNode.retrigger !voice :( . ' + `voiceIndex: ${voiceIndex} ${this.name}`)
			voice.retrigger(time)
		}
	}

	protected readonly _makeVoice = (voiceIndex: number): KelpieAudioBufferSourceNode => {
		const newThing = new KelpieAudioBufferSourceNode({audioContext: this.audioContext, labNode: this, voiceIndex})
		newThing.buffer = this._buffer
		newThing.loop = this._loop
		newThing.loopStart = this._loopStart
		newThing.loopEnd = this._loopEnd
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
		// console.log(`KelpieAudioNode connecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) to ${target.labNode.creatorName}.${target.name}(${target.voiceIndex})`)
		this.output.connect(target.input as AudioNode)
		return target
	}

	public disconnect(target?: KelpieTarget) {
		if (target) {
			try {
				this.output.disconnect(target.input as AudioNode)
			} catch (error) {
				logger.warn(`[KelpieAudioNode.disconnect] error thrown while disconnecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) from ${target.labNode.creatorName}.${target.name}(${target.voiceIndex}):`, error)
			}
		} else {
			try {
				this.output.disconnect()
			} catch (error) {
				logger.warn(`[KelpieAudioNode.disconnect] error thrown while disconnecting ${this.labNode.creatorName}.${this.name}(${this.voiceIndex}) from all:`, error)
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
		this._doSafely(() => this._audioParam.cancelAndHoldAtTime(cancelTime))
	}

	public cancelScheduledValues(cancelTime: number) {
		this._doSafely(() => this._audioParam.cancelScheduledValues(cancelTime))
	}

	public exponentialRampToValueAtTime(value: number, endTime: number) {
		this._doSafely(() => this._audioParam.exponentialRampToValueAtTime(value, endTime))
	}

	public linearRampToValueAtTime(value: number, endTime: number) {
		this._doSafely(() => this._audioParam.linearRampToValueAtTime(value, endTime))
	}

	public setTargetAtTime(target: number, startTime: number, timeConstant: number) {
		this._doSafely(() => this._audioParam.setTargetAtTime(target, startTime, timeConstant))
	}

	public setValueAtTime(value: number, startTime: number) {
		this._doSafely(() => this._audioParam.setValueAtTime(value, startTime))
	}

	public setValueCurveAtTime(values: number[] | Float32Array, startTime: number, duration: number) {
		this._doSafely(() => this._audioParam.setValueCurveAtTime(values, startTime, duration))
	}

	private _doSafely(foo: () => void) {
		try {
			foo()
		} catch (error) {
			logger.error('KelpieAudioParam error:', {error, this: this})
		}
	}
}

class KelpieOscillatorOLD extends KelpieAudioNode {
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

const minUnisonCount = 1
const maxUnisonCount = 16

type UnisonMode = 'linear' | 'super' | 'exp' | 'inv' | 'random'

class KelpieOscillator extends KelpieAudioNode {
	public readonly name = 'UberOscillator'
	private readonly _oscillators: OscillatorNode[] = []
	private readonly _oscGains: GainNode[] = []
	public readonly frequency: KelpieAudioParam
	public readonly detune: KelpieAudioParam
	public readonly unisonDetune: KelpieAudioParam
	private readonly _frequencyConstantNode: ConstantSourceNode
	private readonly _detuneConstantNode: ConstantSourceNode
	private readonly _unisonDetuneConstantNode: ConstantSourceNode
	private readonly _outputGain: GainNode
	public get voiceCount() {return this._oscillators.length}

	private _type: OscillatorType = 'sawtooth'
	public set type(value: OscillatorType) {
		this._type = value
		this._oscillators.forEach(osc => osc.type = this._type)
	}

	public set unisonCount(newVoiceCount: number) {
		const delta = clamp(newVoiceCount, minUnisonCount, maxUnisonCount) - this.voiceCount

		if (delta > 0) {
			this._addVoices(delta)
		} else if (delta < 0) {
			this._deleteVoices(Math.abs(delta))
		} else {
			return
		}
	}

	public constructor(
		args: KelpieAudioNodeArgs,
		public readonly startTime: number,
	) {
		super(args)
		this._outputGain = this._audioContext.createGain()
		this._frequencyConstantNode = this._audioContext.createConstantSource()
		this._frequencyConstantNode.offset.setValueAtTime(0, 0)
		this._frequencyConstantNode.start(0)
		this._detuneConstantNode = this._audioContext.createConstantSource()
		this._detuneConstantNode.offset.setValueAtTime(0, 0)
		this._detuneConstantNode.start(0)
		this._unisonDetuneConstantNode = this._audioContext.createConstantSource()
		this._unisonDetuneConstantNode.offset.setValueAtTime(0, 0)
		this._unisonDetuneConstantNode.start(0)
		this.frequency = new KelpieAudioParam(this._audioContext, this._frequencyConstantNode.offset, 'frequency', this)
		this.detune = new KelpieAudioParam(this._audioContext, this._detuneConstantNode.offset, 'detune', this)
		this.unisonDetune = new KelpieAudioParam(this._audioContext, this._unisonDetuneConstantNode.offset, 'unisonDetune', this)
		this._addVoices(1)
	}

	private _addVoices(numberToAdd: number) {
		for (let i = 0; i < numberToAdd; i++) {
			this._addOsc()
		}
		this._updateUnisonDetune()
	}

	private _deleteVoices(numberToDelete: number) {
		for (let i = 0; i < numberToDelete; i++) {
			const deletedOsc = this._oscillators.pop()
			const deletedGain = this._oscGains.pop()
			if (deletedOsc === undefined) {
				logger.error('[MyMegaOscillator._deleteVoices] deletedOsc is undefined:', {source: this, voices: this._oscillators, numberToDelete})
			} else {
				if (deletedGain === undefined) {
					logger.error('[MyMegaOscillator._deleteVoices] deletedGain is undefined:', {source: this, voices: this._oscillators, gains: this._oscGains, numberToDelete})
				} else {
					this._unisonDetuneConstantNode.disconnect(deletedGain)
					deletedGain.disconnect(deletedOsc.detune)
				}
				this._frequencyConstantNode.disconnect(deletedOsc.frequency)
				this._detuneConstantNode.disconnect(deletedOsc.detune)
				deletedOsc.disconnect()
			}
		}
		this._updateUnisonDetune()
	}

	private _updateUnisonDetune() {
		const detunes = this._getDetunes(this.voiceCount, 'linear')
		this._oscGains.forEach((gain, i) => {
			gain.gain.setTargetAtTime(detunes[i], 0, 0.005)
		})
	}

	private _addOsc() {
		const newOsc = this._audioContext.createOscillator()
		newOsc.frequency.setValueAtTime(0, 0)
		newOsc.detune.setValueAtTime(0, 0)
		newOsc.type = this._type
		newOsc.connect(this._outputGain)

		const newGain = this._audioContext.createGain()

		this._frequencyConstantNode.connect(newOsc.frequency)
		this._detuneConstantNode.connect(newOsc.detune)
		this._unisonDetuneConstantNode.connect(newGain)
		newGain.connect(newOsc.detune)

		newOsc.start(this.startTime)

		this._oscillators.push(newOsc)
		this._oscGains.push(newGain)
	}

	/** Like Serum's unison detune (default mode is linear)
	 * @param unisonCount (1 - 17)
	 * @param unisonDetune (0.0 - 1.0)
	 * @returns array with the detune for each voice, where detune is from -100 to 100 cents
	 * @author EliTheCoder */
	private _getDetunes(unisonCount: number, mode: UnisonMode): number[] {
		let detunes: number[] = [];
		if (mode === 'linear' || true) {
			for (let i = 0; i < unisonCount; i++) {
				detunes.push(i);
			}
	
			detunes = detunes.map(a => {
				let multiplier = (200 / (unisonCount - 1));
				if (unisonCount === 1) multiplier = 0;
				return a * multiplier;
			})
	
			let sum = 0;
			detunes.forEach(a => sum += a);
			let avg = sum / detunes.length;
	
			detunes = detunes.map(a => {
				return a - avg;
			})
		}
		return detunes;
	}

	public get input(): AudioNode {return this._outputGain}
	public get output(): AudioNode {return this._outputGain}
	protected _dispose() {
		this._oscillators.forEach(osc => {
			osc.stop()
		})
		this._oscGains.forEach(gain => {
			gain.disconnect()
		})
		this._frequencyConstantNode.disconnect()
		this._detuneConstantNode.disconnect()
		this._frequencyConstantNode.stop()
		this._detuneConstantNode.stop()
		this._unisonDetuneConstantNode.disconnect()
		this._unisonDetuneConstantNode.stop()
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
	protected _dispose() {
		this._constantSource.stop()
	}
}

class KelpieAudioBufferSourceNode extends KelpieAudioNode {
	public readonly name = 'AudioBufferSourceNode'
	private _bufferSource: AudioBufferSourceNode
	private readonly _detuneConstantSource: ConstantSourceNode
	private readonly _playbackRateConstantSource: ConstantSourceNode
	private readonly _outputGain: GainNode
	public readonly detune: KelpieAudioParam
	public readonly playbackRate: KelpieAudioParam
	private _startTime?: number = 0
	private _started = false
	private _bufferSet = false
	private _buffer: AudioBuffer | null = null
	public set buffer(buffer: AudioBuffer | null) {
		this._buffer = buffer
		if (this._bufferSet === false) {
			this._bufferSet = true
			this._bufferSource.buffer = buffer
			return
		}
		const oldBufferSource = this._bufferSource
		this._bufferSource = this._audioContext.createBufferSource()
		this._bufferSource.playbackRate.setValueAtTime(0, 0)
		this._bufferSource.loop = oldBufferSource.loop
		this._bufferSource.loopStart = oldBufferSource.loopStart
		this._bufferSource.loopEnd = oldBufferSource.loopEnd

		this._bufferSource.buffer = buffer

		this._detuneConstantSource.disconnect()
		this._playbackRateConstantSource.disconnect()

		this._bufferSource.connect(this._outputGain)
		this._detuneConstantSource.connect(this._bufferSource.detune)
		this._playbackRateConstantSource.connect(this._bufferSource.playbackRate)

		oldBufferSource.disconnect()
		if (this._started) {
			oldBufferSource.stop()
			this._bufferSource.start(this._startTime)
		}
	}
	public set loop(loop: boolean) {
		this._bufferSource.loop = loop
	}
	public set loopStart(loopStart: number) {
		this._bufferSource.loopStart = loopStart
	}
	public set loopEnd(loopEnd: number) {
		this._bufferSource.loopEnd = loopEnd
	}

	public constructor(args: KelpieAudioNodeArgs) {
		super(args)
		this._outputGain = this._audioContext.createGain()
		this._bufferSource = this._audioContext.createBufferSource()
		this._bufferSource.playbackRate.setValueAtTime(0, 0)
		this._detuneConstantSource = this._audioContext.createConstantSource()
		this._detuneConstantSource.offset.setValueAtTime(0, 0)
		this._detuneConstantSource.start(0)
		this._playbackRateConstantSource = this._audioContext.createConstantSource()
		this._playbackRateConstantSource.offset.setValueAtTime(0, 0)
		this._playbackRateConstantSource.start(0)

		this.detune = new KelpieAudioParam(this._audioContext, this._detuneConstantSource.offset, 'detune', this)
		this.playbackRate = new KelpieAudioParam(this._audioContext, this._playbackRateConstantSource.offset, 'playbackRate', this)

		this._bufferSource.connect(this._outputGain)
		this._detuneConstantSource.connect(this._bufferSource.detune)
		this._playbackRateConstantSource.connect(this._bufferSource.playbackRate)
	}

	public start(time?: number) {
		this._bufferSource.start(time)
		this._startTime = time
		this._started = true
	}

	public retrigger(time: number) {
		const oldBufferSource = this._bufferSource
		oldBufferSource.stop(time)
		oldBufferSource.onended = () => {
			oldBufferSource.disconnect()
			this._detuneConstantSource.disconnect(oldBufferSource.detune)
			this._playbackRateConstantSource.disconnect(oldBufferSource.playbackRate)
		}

		this._bufferSource = this._audioContext.createBufferSource()
		this._bufferSource.playbackRate.setValueAtTime(0, 0)
		this._bufferSource.loop = oldBufferSource.loop
		this._bufferSource.loopStart = oldBufferSource.loopStart
		this._bufferSource.loopEnd = oldBufferSource.loopEnd
		this._bufferSource.buffer = this._buffer
		this._bufferSource.start(time)

		this._bufferSource.connect(this._outputGain)
		this._detuneConstantSource.connect(this._bufferSource.detune)
		this._playbackRateConstantSource.connect(this._bufferSource.playbackRate)
	}

	public get input(): AudioNode {return this._outputGain}
	public get output(): AudioNode {return this._outputGain}
	protected _dispose() {
		if (this._started) this._bufferSource.stop()
		this._detuneConstantSource.stop()
		this._detuneConstantSource.disconnect()
		this._playbackRateConstantSource.stop()
		this._playbackRateConstantSource.disconnect()
	}
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

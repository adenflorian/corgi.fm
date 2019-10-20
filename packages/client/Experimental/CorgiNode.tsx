import React, {ReactElement, useContext} from 'react'
import {List} from 'immutable'
import {clamp, clampPolarized} from '@corgifm/common/common-utils'
import {CssColor} from '@corgifm/common/shamu-color'
import {NodeToNodeAction} from '@corgifm/common/server-constants'
import {logger} from '../client-logger'
import {SingletonContextImpl} from '../SingletonContext'
import {
	ExpPorts, ExpPort, isAudioOutputPort, isAudioParamInputPort,
} from './ExpPorts'
import {
	ExpAudioParams, ExpCustomNumberParams,
} from './ExpParams'
import {CorgiStringChangedEvent} from './CorgiEvents'
import {CorgiNodeView} from './CorgiNodeView'

export const ExpNodeContext = React.createContext<null | ExpNodeContextValue>(null)

export interface ExpNodeContextValue extends ReturnType<CorgiNode['_makeExpNodeContextValue']> {}

export function useNodeContext() {
	const context = useContext(ExpNodeContext)
	if (!context) throw new Error(`missing node context, maybe there's no provider`)
	return context
}

export interface CorgiNodeOptions {
	readonly requiresAudioWorklet?: boolean
}

export interface CorgiNodeArgs {
	readonly id: Id
	readonly ownerId: Id
	readonly audioContext: AudioContext
	readonly preMasterLimiter: GainNode
	readonly singletonContext: SingletonContextImpl
}

export type CorgiNodeConstructor = new (args: CorgiNodeArgs) => CorgiNode

export interface CorgiNodeReact extends Pick<CorgiNode, 'id' | 'onColorChange' | 'requiresAudioWorklet'> {}

export abstract class CorgiNode {
	public readonly reactContext: ExpNodeContextValue
	public readonly onColorChange: CorgiStringChangedEvent
	protected readonly _ports: ExpPorts = new Map()
	protected readonly _audioParams: ExpAudioParams = new Map()
	protected readonly _customNumberParams: ExpCustomNumberParams = new Map()
	protected _enabled = true
	public readonly id: Id
	public readonly ownerId: Id
	protected readonly _audioContext: AudioContext
	protected readonly _preMasterLimiter: GainNode
	protected readonly _singletonContext: SingletonContextImpl
	public readonly requiresAudioWorklet: boolean

	public constructor(
		args: CorgiNodeArgs,
		options: CorgiNodeOptions = {},
	) {
		this.id = args.id
		this.ownerId = args.ownerId
		this._audioContext = args.audioContext
		this._preMasterLimiter = args.preMasterLimiter
		this._singletonContext = args.singletonContext

		this.reactContext = this._makeExpNodeContextValue()
		this.onColorChange = new CorgiStringChangedEvent(this.getColor())

		this.requiresAudioWorklet = options.requiresAudioWorklet !== undefined
			? options.requiresAudioWorklet : false
	}

	public abstract render(): ReactElement<any>
	public abstract getName(): string

	// eslint-disable-next-line no-empty-function
	public onTick(currentTime: number, maxReadAhead: number): void {}

	// eslint-disable-next-line no-empty-function
	public onNodeToNode(action: NodeToNodeAction) {}

	public getColor(): string {return CssColor.blue}

	public setEnabled(enabled: boolean) {
		if (enabled === this._enabled) return
		this._enabled = enabled
		if (enabled) {
			this._enable()
		} else {
			this._disable()
		}
	}

	private _makeExpNodeContextValue() {
		return {
			id: this.id,
			getColor: () => this.getColor(),
			getName: () => this.getName(),
			setPortPosition: (id: Id, position: Point) => {
				const port = this.getPort(id)
				if (!port) return logger.warn('[setPortPosition] 404 port not found: ', {id, position, nodeId: this.id})
				port.setPosition(position)
			},
			getPorts: () => this._ports,
			node: this as CorgiNodeReact,
		}
	}

	public onAudioParamChange(paramId: Id, newValue: number) {
		const audioParam = this._audioParams.get(paramId)

		if (!audioParam) return logger.warn('[onAudioParamChange] 404 audio param not found: ', {paramId, newValue})

		const port = this.getPort(paramId)

		if (!port) return logger.warn('[onAudioParamChange] 404 audio param port not found: ', {paramId, newValue})

		if (!isAudioParamInputPort(port)) return logger.warn('[onAudioParamChange] !isAudioParamInputPort(port): ', {paramId, newValue, port})

		const newClampedValue = clampPolarized(newValue, audioParam.paramSignalRange)

		port.setKnobValue(newClampedValue)

		audioParam.onChange.invokeImmediately(newClampedValue)
	}

	public onCustomNumberParamChange(paramId: Id, newValue: number) {
		const customNumberParam = this._customNumberParams.get(paramId)

		if (!customNumberParam) return logger.warn('[onCustomNumberParamChange] 404 customNumberParam not found: ', {paramId, newValue})

		const newClampedValue = clamp(newValue, customNumberParam.min, customNumberParam.max)

		customNumberParam.value = newClampedValue

		customNumberParam.onChange.invokeImmediately(newClampedValue)
	}

	public getPort(id: Id): ExpPort | undefined {
		return this._ports.get(id)
	}

	protected abstract _enable(): void
	protected abstract _disable(): void

	protected getDebugView(children?: React.ReactNode) {
		return (
			<CorgiNodeView
				audioParams={this._audioParams}
				context={this.reactContext}
				customNumberParams={this._customNumberParams}
				ports={this._ports}
			>
				{children}
			</CorgiNodeView>
		)
	}

	public detectAudioFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return [...this._ports].some(([_, x]) => isAudioOutputPort(x) && x.detectFeedbackLoop(i, nodeIds))
	}

	public dispose() {
		this._dispose()
	}

	protected abstract _dispose(): void
}

/* eslint-disable no-empty-function */
import React, {ReactElement, useContext} from 'react'
import {List} from 'immutable'
import {clamp, clampPolarized} from '@corgifm/common/common-utils'
import {NodeToNodeAction} from '@corgifm/common/server-constants'
import {ExpNodeType, ExpPortStates} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import {SingletonContextImpl} from '../SingletonContext'
import {
	ExpPorts, ExpPort, isAudioOutputPort, isAudioParamInputPort,
} from './ExpPorts'
import {ExpAudioParams, ExpCustomNumberParams, ExpCustomEnumParams} from './ExpParams'
import {CorgiNodeView} from './CorgiNodeView'
import {GroupNode} from './Nodes/GroupNode'

export const ExpNodeContext = React.createContext<null | CorgiNodeReact>(null)

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
	readonly type: ExpNodeType
	readonly audioContext: AudioContext
	readonly preMasterLimiter: GainNode
	readonly singletonContext: SingletonContextImpl
	readonly parentGroupNode?: GroupNode
	readonly ports?: ExpPortStates
}

export type CorgiNodeConstructor = new (args: CorgiNodeArgs) => CorgiNode

export interface CorgiNodeReact extends Pick<CorgiNode,
'id' | 'requiresAudioWorklet' | 'getPorts' | 'getColor' |
'getName' | 'setPortPosition' | 'type'> {}

export abstract class CorgiNode {
	public readonly id: Id
	public readonly ownerId: Id
	public readonly type: ExpNodeType
	public readonly requiresAudioWorklet: boolean
	protected readonly _audioContext: AudioContext
	protected readonly _preMasterLimiter: GainNode
	protected readonly _singletonContext: SingletonContextImpl
	protected readonly _parentGroupNode?: GroupNode
	protected readonly _audioParams: ExpAudioParams = new Map()
	protected readonly _ports: ExpPorts = new Map()
	protected readonly _customNumberParams: ExpCustomNumberParams = new Map()
	protected readonly _customEnumParams: ExpCustomEnumParams = new Map()
	protected _enabled = true

	public constructor(
		args: CorgiNodeArgs,
		options: CorgiNodeOptions = {},
	) {
		this.id = args.id
		this.ownerId = args.ownerId
		this.type = args.type
		this._audioContext = args.audioContext
		this._preMasterLimiter = args.preMasterLimiter
		this._singletonContext = args.singletonContext
		this._parentGroupNode = args.parentGroupNode

		this.requiresAudioWorklet = options.requiresAudioWorklet !== undefined
			? options.requiresAudioWorklet : false
	}

	public getPorts = () => this._ports

	public abstract getName(): string
	public abstract getColor(): string
	public abstract render(): ReactElement<any>

	public onTick(currentTime: number, maxReadAhead: number) {}

	public onNodeToNode(action: NodeToNodeAction) {}

	public setEnabled(enabled: boolean) {
		if (enabled === this._enabled) return
		this._enabled = enabled
		if (enabled) {
			this._enable()
		} else {
			this._disable()
		}
	}

	public setPortPosition(id: Id, position: Point) {
		const port = this.getPort(id)
		if (!port) return logger.warn('[setPortPosition] 404 port not found: ', {id, position, nodeId: this.id})
		port.setPosition(position)
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

	public onCustomEnumParamChange(paramId: Id, newValue: string) {
		const customEnumParam = this._customEnumParams.get(paramId)

		if (!customEnumParam) return logger.warn('[onCustomEnumParamChange] 404 customEnumParam not found: ', {paramId, newValue})

		customEnumParam.value = newValue
		customEnumParam.onChange.invokeImmediately(newValue)
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
				context={this as CorgiNodeReact}
				customNumberParams={this._customNumberParams}
				customEnumParams={this._customEnumParams}
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

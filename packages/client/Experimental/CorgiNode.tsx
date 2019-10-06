import React, {ReactElement, useContext} from 'react'
import {List} from 'immutable'
import {clamp} from '@corgifm/common/common-utils'
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../client-logger'
import './ExpNodes.less'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {
	ExpPorts, ExpPort, isAudioOutputPort, isAudioParamInputPort,
} from './ExpPorts'
import {
	ExpAudioParams, ExpCustomNumberParams,
	ExpNumberParamCallback,
} from './ExpParams'

export const ExpNodeContext = React.createContext<null | ExpNodeContextValue>(null)

export interface ExpNodeContextValue extends ReturnType<CorgiNode['_makeExpNodeContextValue']> {}

export function useNodeContext() {
	const context = useContext(ExpNodeContext)

	if (!context) throw new Error(`missing node context, maybe there's no provider`)

	return context
}

export interface CorgiNodeOptions {
	readonly ports?: readonly ExpPort[]
	readonly audioParams?: ExpAudioParams
	readonly customNumberParams?: ExpCustomNumberParams
}

export abstract class CorgiNode {
	public readonly reactContext: ExpNodeContextValue
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private _enabled = true

	public constructor(
		public readonly id: Id,
		protected readonly _audioContext: AudioContext,
		protected readonly _preMasterLimiter: GainNode,
		options: CorgiNodeOptions = {},
	) {
		this.reactContext = this._makeExpNodeContextValue()
		this._ports = (options.ports || []).reduce((result, port) => {return result.set(port.id, port)}, new Map() as ExpPorts)
		this._audioParams = options.audioParams || new Map()
		this._customNumberParams = options.customNumberParams || new Map()
	}

	// public abstract onNumberParamChange(paramChange: NumberParamChange): void
	public abstract render(): ReactElement<any>
	public abstract getName(): string

	// eslint-disable-next-line no-empty-function
	public onTick(currentTime: number, maxReadAhead: number): void {}

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
			registerAudioParam: (paramId: Id, callback: ExpNumberParamCallback) => {
				const param = this._audioParams.get(paramId)
				if (!param) return logger.warn('[registerAudioParam] 404 audio param not found: ', paramId)
				param.reactSubscribers.set(callback, callback)
				callback(param.audioParam.value)
			},
			unregisterAudioParam: (paramId: Id, callback: ExpNumberParamCallback) => {
				const param = this._audioParams.get(paramId)
				if (!param) return logger.warn('[unregisterAudioParam] 404 audio param not found: ', paramId)
				param.reactSubscribers.delete(callback)
			},
			getAudioParamValue: (paramId: Id) => {
				const param = this._audioParams.get(paramId)
				if (!param) return logger.warn('[getAudioParamValue] 404 audio param not found: ', paramId)
				return param.audioParam.value
			},
			registerCustomNumberParam: (paramId: Id, callback: ExpNumberParamCallback) => {
				const param = this._customNumberParams.get(paramId)
				if (!param) return logger.warn('[registerCustomNumberParam] 404 custom number param not found: ', paramId)
				param.reactSubscribers.set(callback, callback)
				callback(param.value)
			},
			unregisterCustomNumberParam: (paramId: Id, callback: ExpNumberParamCallback) => {
				const param = this._customNumberParams.get(paramId)
				if (!param) return logger.warn('[unregisterCustomNumberParam] 404 custom number param not found: ', paramId)
				param.reactSubscribers.delete(callback)
			},
			getCustomNumberParamValue: (paramId: Id) => {
				const param = this._customNumberParams.get(paramId)
				if (!param) return logger.warn('[getCustomNumberParamValue] 404 custom number param not found: ', paramId)
				return param.value
			},
			setPortPosition: (id: Id, position: Point) => {
				const port = this.getPort(id)
				if (!port) return logger.warn('[setPortPosition] 404 port not found: ', {id, position, nodeId: this.id})
				port.setPosition(position)
			},
			getPorts: () => this._ports,
		}
	}

	public onAudioParamChange(paramId: Id, newValue: number) {
		const audioParam = this._audioParams.get(paramId)

		if (!audioParam) return logger.warn('[onAudioParamChange] 404 audio param not found: ', {paramId, newValue})

		const port = this.getPort(paramId)

		if (!port) return logger.warn('[onAudioParamChange] 404 audio param port not found: ', {paramId, newValue})

		if (!isAudioParamInputPort(port)) return logger.warn('[onAudioParamChange] !isAudioParamInputPort(port): ', {paramId, newValue, port})

		const newClampedValue = clamp(newValue, audioParam.min, audioParam.max)

		port.setKnobValue(newClampedValue)

		audioParam.reactSubscribers.forEach(sub => sub(newClampedValue))
	}

	public onCustomNumberParamChange(paramId: Id, newValue: number) {
		const customNumberParam = this._customNumberParams.get(paramId)

		if (!customNumberParam) return logger.warn('[onCustomNumberParamChange] 404 customNumberParam not found: ', {paramId, newValue})

		const newClampedValue = clamp(newValue, customNumberParam.min, customNumberParam.max)

		customNumberParam.value = newClampedValue

		customNumberParam.reactSubscribers.forEach(sub => sub(newClampedValue))
	}

	public getPort(id: Id): ExpPort | undefined {
		return this._ports.get(id)
	}

	protected abstract _enable(): void
	protected abstract _disable(): void

	protected getDebugView() {
		return (
			<ExpNodeContext.Provider value={this.reactContext}>
				<ExpConnectorPlaceholders />
				<SimpleGraphNodeExp>
					<ExpNodeDebugView
						audioParams={this._audioParams}
						customNumberParams={this._customNumberParams}
						ports={this._ports}
					/>
				</SimpleGraphNodeExp>
			</ExpNodeContext.Provider>
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

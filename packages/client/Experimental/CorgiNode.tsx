import React, {ReactElement, useContext} from 'react'
import {List} from 'immutable'
import {clamp, arrayToESMap, clampPolarized} from '@corgifm/common/common-utils'
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
	ExpAudioParam,
} from './ExpParams'
import {CorgiStringChangedEvent} from './CorgiEvents'

export const ExpNodeContext = React.createContext<null | ExpNodeContextValue>(null)

export interface ExpNodeContextValue extends ReturnType<CorgiNode['_makeExpNodeContextValue']> {}

export function useNodeContext() {
	const context = useContext(ExpNodeContext)

	if (!context) throw new Error(`missing node context, maybe there's no provider`)

	return context
}

export interface CorgiNodeOptions {
	readonly ports?: readonly ExpPort[]
	readonly audioParams?: readonly ExpAudioParam[]
	readonly customNumberParams?: ExpCustomNumberParams
}

export abstract class CorgiNode {
	public readonly reactContext: ExpNodeContextValue
	public readonly onColorChange: CorgiStringChangedEvent
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private _enabled = true
	private _portsWithUpdates = [] as ExpPort[]

	public constructor(
		public readonly id: Id,
		protected readonly _audioContext: AudioContext,
		protected readonly _preMasterLimiter: GainNode,
		options: CorgiNodeOptions = {},
	) {
		this.reactContext = this._makeExpNodeContextValue()
		this._ports = arrayToESMap(options.ports, 'id')
		this._audioParams = arrayToESMap(options.audioParams, 'id')
		this._customNumberParams = options.customNumberParams || new Map()
		this.onColorChange = new CorgiStringChangedEvent(this.getColor())
	}

	// public abstract onNumberParamChange(paramChange: NumberParamChange): void
	public abstract render(): ReactElement<any>
	public abstract getName(): string

	// eslint-disable-next-line no-empty-function
	public onTick(currentTime: number, maxReadAhead: number): void {
		if (this._portsWithUpdates.length > 0) {
			this._portsWithUpdates.forEach(port => {
				port.onUpdated()
			})
			this._portsWithUpdates = []
		}
	}

	public portHasUpdate(port: ExpPort) {
		this._portsWithUpdates.push(port)
	}

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
			setPortPosition: (id: Id, position: Point) => {
				const port = this.getPort(id)
				if (!port) return logger.warn('[setPortPosition] 404 port not found: ', {id, position, nodeId: this.id})
				port.setPosition(position)
			},
			getPorts: () => this._ports,
			node: this,
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

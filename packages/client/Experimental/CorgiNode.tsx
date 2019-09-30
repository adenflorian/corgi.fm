import React, {ReactElement, useContext} from 'react'
import {clamp} from '@corgifm/common/common-utils'
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../client-logger'
import './ExpNodes.less'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {
	ExpNodeAudioPort, AudioParamChange,
	ExpNodeAudioInputPorts, ExpNodeAudioInputPort,
	ExpNodeAudioOutputPorts, ExpNodeAudioOutputPort,
	ExpNodeConnection, ExpAudioParams,
	AudioParamCallback, ExpNodeAudioOutputPortArgs,
	ExpNodeAudioInputPortArgs,
} from './ExpTypes'

export const ExpNodeContext = React.createContext<null | ExpNodeContextValue>(null)

export interface ExpNodeContextValue extends ReturnType<CorgiNode['_makeExpNodeContextValue']> {}

export function useNodeContext() {
	const context = useContext(ExpNodeContext)

	if (!context) throw new Error(`missing node context, maybe there's no provider`)

	return context
}

export abstract class CorgiNode {
	public readonly reactContext: ExpNodeContextValue
	protected readonly _audioInputPorts: ExpNodeAudioInputPorts
	protected readonly _audioOutPorts: ExpNodeAudioOutputPorts
	private readonly _audioParams: ExpAudioParams
	private _enabled = true

	public constructor(
		public readonly id: Id,
		protected readonly audioContext: AudioContext,
		protected readonly preMasterLimiter: GainNode,
		audioInputPorts: readonly ExpNodeAudioInputPortArgs[] = [],
		audioOutPorts: readonly ExpNodeAudioOutputPortArgs[] = [],
		audioParams: ExpAudioParams = new Map(),
	) {
		this.reactContext = this._makeExpNodeContextValue()
		this._audioInputPorts = makeAudioInputPorts(audioInputPorts, this)
		this._audioOutPorts = makeAudioOutputPorts(audioOutPorts, this)
		this._audioParams = audioParams
	}

	public abstract onParamChange(paramChange: AudioParamChange): void
	public abstract render(): ReactElement<any>
	public abstract dispose(): void
	public abstract getName(): string

	public getColor(): string {
		return CssColor.blue
	}

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
			registerAudioParam: (paramId: Id, callback: AudioParamCallback) => {
				const param = this._audioParams.get(paramId)

				if (!param) return logger.warn('[registerAudioParam] 404 audio param not found: ', paramId)

				param.reactSubscribers.set(callback, callback)

				callback(param.audioParam.value)
			},
			unregisterAudioParam: (paramId: Id, callback: AudioParamCallback) => {
				const param = this._audioParams.get(paramId)

				if (!param) return logger.warn('[unregisterAudioParam] 404 audio param not found: ', paramId)

				param.reactSubscribers.delete(callback)
			},
			getAudioParamValue: (paramId: Id) => {
				const param = this._audioParams.get(paramId)

				if (!param) return logger.warn('[getAudioParamValue] 404 audio param not found: ', paramId)

				return param.audioParam.value
			},
		}
	}

	public onAudioParamChange(paramId: Id, newValue: number) {
		const audioParam = this._audioParams.get(paramId)

		if (!audioParam) return logger.warn('404 audio param not found: ', {paramId, newValue})

		const newClampedValue = clamp(newValue, audioParam.min, audioParam.max)

		audioParam.audioParam.value = newClampedValue

		audioParam.reactSubscribers.forEach(sub => {
			sub(newClampedValue)
		})
	}

	public onNewAudioOutConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {
		logger.log('onNewAudioOutConnection default')
	}

	public onNewAudioInConnection(port: ExpNodeAudioPort, connection: ExpNodeConnection) {
		logger.log('onNewAudioInConnection default')
	}

	public getAudioInputPort(index: number): ExpNodeAudioInputPort | undefined {
		return this._audioInputPorts[index]
	}

	public getAudioOutputPort(index: number): ExpNodeAudioOutputPort | undefined {
		return this._audioOutPorts[index]
	}

	public getAudioInputPortCount(): number {
		return this._audioInputPorts.length
	}

	public getAudioOutputPortCount(): number {
		return this._audioOutPorts.length
	}

	protected abstract _enable(): void
	protected abstract _disable(): void

	protected getDebugView() {
		return (
			<ExpNodeDebugView
				nodeId={this.id}
				nodeName={this.getName()}
				audioParams={this._audioParams}
				audioInputPorts={this._audioInputPorts}
				audioOutputPorts={this._audioOutPorts}
			/>
		)
	}

	public detectFeedbackLoop(i: number, nodeIds: Id[]): boolean {
		return this._audioOutPorts.some(x => x.detectFeedbackLoop(i, nodeIds))
	}
}

export function makeAudioInputPorts(args: readonly ExpNodeAudioInputPortArgs[], node: CorgiNode): ExpNodeAudioInputPorts {
	return args.map(x => new ExpNodeAudioInputPort(x.id, x.name, node, x.destination))
}

export function makeAudioOutputPorts(args: readonly ExpNodeAudioOutputPortArgs[], node: CorgiNode): ExpNodeAudioOutputPorts {
	return args.map(x => new ExpNodeAudioOutputPort(x.id, x.name, node, x.source))
}

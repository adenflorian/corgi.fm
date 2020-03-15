import React, {ReactElement, useContext, ReactNode} from 'react'
import {List} from 'immutable'
import {clamp, clampPolarized} from '@corgifm/common/common-utils'
import {NodeToNodeAction} from '@corgifm/common/server-constants'
import {ExpNodeType, ExpPortStates, ExpReferenceTargetType} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../client-logger'
import {SingletonContextImpl} from '../SingletonContext'
import {
	ExpPorts, ExpPort, isAudioOutputPort, isAudioParamInputPort,
} from './ExpPorts'
import {
	ExpAudioParams, ExpCustomNumberParams, ExpCustomEnumParams,
	ExpCustomStringParams, ExpButtons, ExpReferenceParams,
} from './ExpParams'
import {CorgiNodeView} from './CorgiNodeView'
import {CorgiStringChangedEvent, CorgiNumberChangedEvent, CorgiObjectChangedEvent} from './CorgiEvents'
import {isMidiOutputPort} from './ExpMidiPorts'
import {isPolyphonicOutputPort} from './ExpPolyphonicPorts'
import {LabCorgiAnalyserSPNode} from './CorgiAnalyserSPN'

export const ExpNodeContext = React.createContext<null | CorgiNodeReact>(null)

export function useNodeContext() {
	const context = useContext(ExpNodeContext)
	if (!context) throw new Error(`missing node context, maybe there's no provider`)
	return context
}

export interface CorgiNodeOptions {
	readonly name: string
	readonly color: string
	readonly requiresAudioWorklet?: boolean
	readonly useBackgroundOscilloscope?: boolean
}

export interface CorgiNodeArgs {
	readonly id: Id
	readonly ownerId: Id
	readonly type: ExpNodeType
	readonly audioContext: AudioContext
	readonly preMasterLimiter: GainNode
	readonly singletonContext: SingletonContextImpl
	readonly parentNode?: CorgiNode
	readonly ports?: ExpPortStates
}

export type CorgiNodeConstructor = new (args: CorgiNodeArgs) => CorgiNode

export interface CorgiNodeReact extends Pick<CorgiNode,
'id' | 'requiresAudioWorklet' | 'getPorts' | 'onColorChange' |
'onNameChange' | 'setPortPosition' | 'type' | 'debugInfo' | 'newSampleEvent'> {}

export abstract class CorgiNode {
	public readonly id: Id
	public readonly ownerId: Id
	public readonly type: ExpNodeType
	public readonly requiresAudioWorklet: boolean
	public readonly singletonContext: SingletonContextImpl
	protected readonly _audioContext: AudioContext
	protected readonly _preMasterLimiter: GainNode
	protected readonly _parentNode?: CorgiNode
	protected readonly _audioParams: ExpAudioParams = new Map()
	protected readonly _ports: ExpPorts = new Map()
	protected readonly _customNumberParams: ExpCustomNumberParams = new Map()
	protected readonly _customEnumParams: ExpCustomEnumParams = new Map()
	protected readonly _customStringParams: ExpCustomStringParams = new Map()
	protected readonly _referenceParams: ExpReferenceParams = new Map()
	protected readonly _buttons: ExpButtons = new Map()
	protected _enabled = true
	public readonly onNameChange: CorgiStringChangedEvent
	public readonly onColorChange: CorgiStringChangedEvent
	public readonly defaultColor: string
	public readonly debugInfo = new CorgiStringChangedEvent('')
	public readonly newSampleEvent?: CorgiNumberChangedEvent
	protected readonly _analyser?: LabCorgiAnalyserSPNode

	public constructor(
		args: CorgiNodeArgs,
		options: CorgiNodeOptions,
	) {
		this.id = args.id
		this.ownerId = args.ownerId
		this.type = args.type
		this._audioContext = args.audioContext
		this._preMasterLimiter = args.preMasterLimiter
		this.singletonContext = args.singletonContext
		this._parentNode = args.parentNode

		this.onNameChange = new CorgiStringChangedEvent(options.name)
		this.defaultColor = options.color
		this.onColorChange = new CorgiStringChangedEvent(this.defaultColor)
		this.requiresAudioWorklet = options.requiresAudioWorklet !== undefined
			? options.requiresAudioWorklet : false
		if (options.useBackgroundOscilloscope) {
			this.newSampleEvent = new CorgiNumberChangedEvent(0)
			this._analyser = new LabCorgiAnalyserSPNode(this._audioContext, (value) => {
				this.newSampleEvent!.invokeImmediately(value)
				this._analyser!.requestUpdate()
			}, true, 'CorgiNode')
			this._analyser.requestUpdate()
		}
	}

	public getPorts = () => this._ports

	public abstract render(): ReactElement<any>

	public onTick(currentTime: number, maxReadAhead: number) {}

	public onNodeToNode(action: NodeToNodeAction) {
		if (action.type === 'NODE_TO_NODE_BUTTON_PRESS') {
			const button = this._buttons.get(action.buttonId)
			if (!button) return logger.error('404 button not found!', {button, this: this, action, buttons: this._buttons})
			button.onPress.invokeImmediately(action.pressId)
		}
		this._onNodeToNode(action)
	}

	protected readonly _onNodeToNode = (action: NodeToNodeAction) => {}

	public setEnabled(enabled: boolean) {
		if (enabled === this._enabled) return
		this._enabled = enabled
		if (enabled) {
			this._enable()
			this.onColorChange.invokeNextFrame(this.defaultColor)
		} else {
			this._disable()
			this.onColorChange.invokeNextFrame(CssColor.disabledGray)
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
		customNumberParam.onChange.invokeImmediately(newClampedValue)
	}

	public onCustomEnumParamChange(paramId: Id, newValue: string) {
		const customEnumParam = this._customEnumParams.get(paramId)

		if (!customEnumParam) return logger.warn('[onCustomEnumParamChange] 404 customEnumParam not found: ', {paramId, newValue})

		customEnumParam.value = newValue
		customEnumParam.onChange.invokeImmediately(newValue)
	}

	public onCustomStringParamChange(paramId: Id, newValue: string) {
		const customStringParam = this._customStringParams.get(paramId)

		if (!customStringParam) return logger.warn('[onCustomStringParamChange] 404 customStringParam not found: ', {paramId, newValue})

		customStringParam.value.invokeImmediately(newValue)
	}

	public onReferenceParamChange(paramId: Id, newTarget: CorgiObjectChangedEvent<IdObject>, targetType: ExpReferenceTargetType) {
		const referenceParam = this._referenceParams.get(paramId)

		if (!referenceParam) return logger.warn('[onReferenceParamChange] 404 referenceParam not found: ', {paramId, nodeId: this.id, newTarget})

		if (referenceParam.targetType !== targetType) return logger.error('[onReferenceParamChange] reference target type mismatch!: ', {paramId, nodeId: this.id, newTarget, targetType, referenceParam})

		referenceParam.newTarget(newTarget)
	}

	public getPort(id: Id): ExpPort | undefined {
		return this._ports.get(id)
	}

	protected abstract _enable(): void
	protected abstract _disable(): void

	protected getDebugView(children?: ReactNode, beforeChildren?: ReactNode) {
		return (
			<CorgiNodeView
				audioParams={this._audioParams}
				context={this as CorgiNodeReact}
				customNumberParams={this._customNumberParams}
				customEnumParams={this._customEnumParams}
				customStringParams={this._customStringParams}
				referenceParams={this._referenceParams}
				buttons={this._buttons}
				ports={this._ports}
				beforeChildren={beforeChildren}
			>
				{children}
			</CorgiNodeView>
		)
	}

	public detectAudioFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return [...this._ports].some(([_, x]) => isAudioOutputPort(x) && x.detectFeedbackLoop(i, nodeIds))
	}

	public detectMidiFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return [...this._ports].some(([_, x]) => isMidiOutputPort(x) && x.detectFeedbackLoop(i, nodeIds))
	}

	public detectPolyphonicFeedbackLoop(i: number, nodeIds: List<Id>): boolean {
		return [...this._ports].some(([_, x]) => isPolyphonicOutputPort(x) && x.detectFeedbackLoop(i, nodeIds))
	}

	public dispose() {
		this._dispose()
		this._referenceParams.forEach(x => x.dispose())
	}

	protected abstract _dispose(): void
}

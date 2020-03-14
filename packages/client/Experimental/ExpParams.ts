import React, {useContext} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {
	clampPolarized, CurveFunctions, defaultBipolarCurveFunctions,
	defaultUnipolarCurveFunctions,
} from '@corgifm/common/common-utils'
import {ButtonSelectOption} from '../ButtonSelect/ButtonSelect'
import {CorgiNumberChangedEvent, CorgiEnumChangedEvent, CorgiStringChangedEvent, CorgiObjectChangedEvent, ReadonlyCorgiNumberChangedEvent, ReadonlyCorgiObjectChangedEvent} from './CorgiEvents'
import {LabAudioParam, KelpieAudioNode} from './Nodes/PugAudioNode/Lab'
import {ExpMidiClip, makeExpMidiClip} from '@corgifm/common/midi-types'
import {CorgiNode} from './CorgiNode'
import {nodeToNodeActions} from '@corgifm/common/server-constants'
import {ExpMidiPatternState, makeExpMidiPatternState} from '@corgifm/common/redux'

export interface ExpParam {
	readonly id: Id
}

export const AudioParamContext = React.createContext<null | ExpAudioParam>(null)

export function useAudioParamContext() {
	const context = useContext(AudioParamContext)

	if (!context) throw new Error(`missing audio param context, maybe there's no provider`)

	return context
}

export interface ExpAudioParamOptions {
	readonly valueString?: (v: number) => string
	readonly curveFunctions?: CurveFunctions
}

export type ExpAudioParams = ReadonlyMap<Id, ExpAudioParam>
export class ExpAudioParam<T extends KelpieAudioNode = KelpieAudioNode> implements ExpParam {
	public readonly onChange: CorgiNumberChangedEvent
	public readonly onModdedLiveValueChange: CorgiNumberChangedEvent
	public readonly valueString?: (v: number) => string
	public readonly curveFunctions: CurveFunctions
	public readonly defaultNormalizedValue: number

	public constructor(
		public readonly id: Id,
		public readonly audioParam: LabAudioParam<T>,
		public readonly defaultValue: number,
		public readonly maxValue: number,
		public readonly paramSignalRange: SignalRange,
		options: ExpAudioParamOptions = {},
	) {
		this.valueString = options.valueString
		this.curveFunctions = options.curveFunctions || (
			paramSignalRange === 'bipolar'
				? defaultBipolarCurveFunctions
				: defaultUnipolarCurveFunctions)

		this.defaultNormalizedValue = clampPolarized(this.curveFunctions.unCurve(defaultValue / maxValue), paramSignalRange)

		this.onChange = new CorgiNumberChangedEvent(this.defaultNormalizedValue)
		this.onModdedLiveValueChange = new CorgiNumberChangedEvent(this.defaultNormalizedValue)
	}
}

export type ExpCustomNumberParams = ReadonlyMap<Id, ExpCustomNumberParam>
export type ExpCustomNumberParamReadonly = ExpCustomNumberParam & {
	onChange: ReadonlyCorgiNumberChangedEvent
}
export class ExpCustomNumberParam {
	public get value() {return this.onChange.current}
	public readonly onChange: CorgiNumberChangedEvent

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: number,
		public readonly min: number,
		public readonly max: number,
		public readonly curve = 1,
		public readonly valueString?: (v: number) => string,
	) {
		this.onChange = new CorgiNumberChangedEvent(this.defaultValue)
	}
}

export interface NumberParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: number
}

export type ExpCustomEnumParams = ReadonlyMap<Id, ExpCustomEnumParam>
export class ExpCustomEnumParam<TEnum extends string = string> {
	public value: TEnum
	public readonly onChange: CorgiEnumChangedEvent<TEnum>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: TEnum,
		public readonly options: readonly TEnum[],
	) {
		this.value = this.defaultValue
		this.onChange = new CorgiEnumChangedEvent(this.defaultValue)
	}

	public buildSelectOptions(): readonly ButtonSelectOption<TEnum>[] {
		return this.options.map((option): ButtonSelectOption<TEnum> => {
			return {
				label: option,
				value: option,
			}
		})
	}
}

export interface EnumParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: string
}

export type ExpCustomStringParams = ReadonlyMap<Id, ExpCustomStringParam>
export class ExpCustomStringParam {
	public readonly value: CorgiStringChangedEvent

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: string,
	) {
		this.value = new CorgiStringChangedEvent(this.defaultValue)
	}
}

export interface StringParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: string
}

export type ExpMidiClipParams = ReadonlyMap<Id, ExpMidiClipParam>
export class ExpMidiClipParam {
	public readonly value: CorgiObjectChangedEvent<ExpMidiClip>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: ExpMidiClip = makeExpMidiClip(),
	) {
		this.value = new CorgiObjectChangedEvent<ExpMidiClip>(this.defaultValue)
	}
}

export interface MidiClipParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: ExpMidiClip
}

export type ExpMidiPatternParams = ReadonlyMap<Id, ExpMidiPatternParam>
export type ExpMidiPatternParamReadonly = ExpMidiPatternParam & {
	value: ReadonlyCorgiObjectChangedEvent<ExpMidiPatternState>
}
export class ExpMidiPatternParam {
	public readonly value: CorgiObjectChangedEvent<ExpMidiPatternState>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: ExpMidiPatternState = makeExpMidiPatternState({}),
	) {
		this.value = new CorgiObjectChangedEvent<ExpMidiPatternState>(this.defaultValue)
	}
}

export interface ExpMidiPatternParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: ExpMidiPatternState
}

export type ExpButtons = ReadonlyMap<Id, ExpButton>
export class ExpButton {
	public readonly onPress = new CorgiStringChangedEvent('not pressed')

	public constructor(
		public readonly id: Id,
		public readonly node: CorgiNode,
	) {}

	public readonly press = () => {
		const action = nodeToNodeActions.buttonPress(this.node.id, this.id)
		this.node.singletonContext.webSocketService.nodeToNode(action)
		this.onPress.invokeImmediately(action.pressId)
	}
}

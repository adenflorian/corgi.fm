import React, {useContext} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {
	clampPolarized, CurveFunctions, defaultBipolarCurveFunctions,
	defaultUnipolarCurveFunctions,
} from '@corgifm/common/common-utils'
import {ButtonSelectOption} from '../ButtonSelect/ButtonSelect'
import {CorgiNumberChangedEvent, CorgiEnumChangedEvent} from './CorgiEvents'
import {PugPolyAudioParam} from './Nodes/PugAudioNode/PugAudioNode'

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
export class ExpAudioParam<T extends AudioNode = AudioNode> implements ExpParam {
	public readonly onChange: CorgiNumberChangedEvent
	public readonly onModdedLiveValueChange: CorgiNumberChangedEvent
	public readonly valueString?: (v: number) => string
	public readonly curveFunctions: CurveFunctions
	public readonly defaultNormalizedValue: number

	public constructor(
		public readonly id: Id,
		public readonly audioParam: PugPolyAudioParam<T>,
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
export class ExpCustomNumberParam {
	public value: number
	public readonly onChange: CorgiNumberChangedEvent

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: number,
		public readonly min: number,
		public readonly max: number,
		public readonly curve = 1,
		public readonly valueString?: (v: number) => string,
	) {
		this.value = this.defaultValue
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
		public readonly valueString?: (v: TEnum) => string,
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

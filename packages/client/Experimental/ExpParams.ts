import React, {useContext} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {
	clampPolarized, CurveFunctions, defaultBipolarCurveFunctions,
	defaultUnipolarCurveFunctions,
} from '@corgifm/common/common-utils'
import {CorgiNumberChangedEvent} from './CorgiEvents'

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

export class ExpAudioParam implements ExpParam {
	public readonly onChange: CorgiNumberChangedEvent
	public readonly onModdedLiveValueChange: CorgiNumberChangedEvent
	public readonly valueString?: (v: number) => string
	public readonly curveFunctions: CurveFunctions
	public readonly defaultNormalizedValue: number

	public constructor(
		public readonly id: Id,
		public readonly audioParam: AudioParam,
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

export interface ExpBooleanParam extends ExpParam {
	value: boolean
}

export interface ExpEnumParam<TEnum extends string> extends ExpParam {
	value: TEnum
}

export type ExpAudioParams = ReadonlyMap<Id, ExpAudioParam>
export type ExpCustomNumberParams = ReadonlyMap<Id, ExpCustomNumberParam>
export type ExpBooleanParams = ReadonlyMap<Id, ExpBooleanParam>
export type ExpEnumParams<TEnum extends string> = ReadonlyMap<Id, ExpEnumParam<TEnum>>

export interface NumberParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: number
}

// export interface ParamDescriptor {
// 	readonly paramId: Id
// 	readonly type: ExpParamType
// }

// export enum ExpParamType {
// 	Frequency = 'Frequency',
// 	Boolean = 'Boolean',
// 	OscillatorType = 'OscillatorType',
// }

// type ParamTypeStrings = 'number' | 'string' | 'boolean'

// // function ifTypeThenDo(type: 'number' ) {

// // }

// function isNumber(val: unknown): val is number {
// 	return typeof val === 'number'
// }

// function isFrequency(val: unknown): val is EPTFrequency {
// 	return typeof val === 'number'
// }

// function isString(val: unknown): val is string {
// 	return typeof val === 'string'
// }

// function isBoolean(val: unknown): val is boolean {
// 	return typeof val === 'boolean'
// }

// const oscillatorTypes = Object.freeze([
// 	'sine', 'square', 'sawtooth', 'triangle', 'custom',
// ])

// type EPTFrequency = number

// type ExpParamTypeGuard<T> = (val: unknown) => val is T

// export const expParamTypeGuards = {
// 	Frequency: isFrequency,
// 	Boolean: isBoolean,
// 	OscillatorType: isOscillatorType,
// } as const

// function isOscillatorType(val: unknown): val is OscillatorType {
// 	if (isString(val)) {
// 		return oscillatorTypes.includes(val)
// 	} else {
// 		return false
// 	}
// }

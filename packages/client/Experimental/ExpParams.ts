import React, {useContext} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {clampPolarized} from '@corgifm/common/common-utils'
import {CurveFunctions, defaultBipolarCurveFunctions, defaultUnipolarCurveFunctions} from '../client-utils'
import {CorgiNumberChangedEvent} from './CorgiEvents'

export interface ExpParam {
	readonly id: Id
}

export interface ExpNumberParam extends ExpParam {
	readonly min: number
	readonly max: number
	readonly defaultValue: number
	readonly reactSubscribers: Map<ExpNumberParamCallback, ExpNumberParamCallback>
	readonly curve: number
	readonly valueString?: (v: number) => string
}

export type ExpNumberParamCallback = (newValue: number) => void

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

export interface ExpCustomNumberParam extends ExpNumberParam {
	value: number
}

export interface ExpBooleanParam extends ExpParam {
	value: boolean
}

export interface ExpEnumParam<TEnum extends string> extends ExpParam {
	value: TEnum
}

export type ExpAudioParams = Map<Id, ExpAudioParam>
export type ExpCustomNumberParams = Map<Id, ExpCustomNumberParam>
export type ExpBooleanParams = Map<Id, ExpBooleanParam>
export type ExpEnumParams<TEnum extends string> = Map<Id, ExpEnumParam<TEnum>>

export function buildCustomNumberParamDesc(
	...args: Parameters<typeof _buildCustomNumberParamDesc>
): [Id, ExpCustomNumberParam] {
	return [args[0], _buildCustomNumberParamDesc(...args)]
}

function _buildCustomNumberParamDesc(
	id: Id,
	defaultValue: number, min: number, max: number,
	curve = 1, valueString?: (v: number) => string,
): ExpCustomNumberParam {
	return {
		id,
		value: defaultValue,
		min,
		max,
		defaultValue,
		reactSubscribers: new Map<ExpNumberParamCallback, ExpNumberParamCallback>(),
		curve,
		valueString,
	}
}

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

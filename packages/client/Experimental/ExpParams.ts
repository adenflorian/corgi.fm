export interface ExpParam {
	readonly id: Id
}

export interface ExpNumberParam extends ExpParam {
	readonly min: number
	readonly max: number
	readonly default: number
	readonly reactSubscribers: Map<ExpNumberParamCallback, ExpNumberParamCallback>
	readonly curve: number
	readonly valueString?: (v: number) => string
}

export type ExpNumberParamCallback = (newValue: number) => void

export interface ExpAudioParam extends ExpNumberParam {
	readonly audioParam: AudioParam
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

export function buildAudioParamDesc(
	...args: Parameters<typeof _buildAudioParamDesc>
): [Id, ExpAudioParam] {
	return [args[0], _buildAudioParamDesc(...args)]
}

function _buildAudioParamDesc(
	id: Id, audioParam: AudioParam,
	defaultValue: number, min: number, max: number,
	curve = 1, valueString?: (v: number) => string,
): ExpAudioParam {
	return {
		id,
		audioParam,
		min,
		max,
		default: defaultValue,
		reactSubscribers: new Map<ExpNumberParamCallback, ExpNumberParamCallback>(),
		curve,
		valueString,
	}
}

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
		default: defaultValue,
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

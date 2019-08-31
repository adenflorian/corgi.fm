import * as uuid from 'uuid'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {
	addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray,
	IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType,
	SERVER_ACTION,
} from '.'

export const addSimpleCompressor = (sampler: SimpleCompressorState) =>
	addMultiThing(sampler, ConnectionNodeType.simpleCompressor, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_SIMPLE_COMPRESSOR_PARAM = 'SET_SIMPLE_COMPRESSOR_PARAM'
export type SetSimpleCompressorParamAction = ReturnType<typeof setSimpleCompressorParam>
export const setSimpleCompressorParam =
	(id: Id, paramName: SimpleCompressorParam, value: any) => ({
		type: SET_SIMPLE_COMPRESSOR_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const)

export type SimpleCompressorAction = SetSimpleCompressorParamAction

export enum SimpleCompressorParam {
	threshold = 'threshold',
	knee = 'knee',
	ratio = 'ratio',
	attack = 'attack',
	release = 'release',
}

export interface ISimpleCompressorsState extends IMultiState {
	things: ISimpleCompressors
}

export interface ISimpleCompressors {
	[key: string]: SimpleCompressorState
}

export class SimpleCompressorState implements IConnectable {
	public static dummy: SimpleCompressorState = {
		id: 'dummy',
		threshold: 0,
		knee: 0,
		ratio: 0,
		attack: 0,
		release: 0,
		type: ConnectionNodeType.simpleCompressor,
	}

	public readonly id = uuid.v4()
	public readonly threshold: number = -24
	public readonly ratio: number = 12
	public readonly attack: number = 0.003
	public readonly release: number = 0.25
	public readonly knee: number = 30
	public readonly type = ConnectionNodeType.simpleCompressor
}

export function deserializeSimpleCompressorState(state: IConnectable): IConnectable {
	const x = state as SimpleCompressorState
	const y: SimpleCompressorState = {
		...(new SimpleCompressorState()),
		...x,
	}
	return y
}

type SimpleCompressorActionTypes = {
	[key in SimpleCompressorAction['type']]: 0
}

const simpleCompressorActionTypes2: SimpleCompressorActionTypes = {
	SET_SIMPLE_COMPRESSOR_PARAM: 0,
}

const simpleCompressorActionTypes = Object.keys(simpleCompressorActionTypes2)

export const simpleCompressorsReducer = makeMultiReducer<SimpleCompressorState, ISimpleCompressorsState>(
	simpleCompressorReducer,
	ConnectionNodeType.simpleCompressor,
	simpleCompressorActionTypes,
)

function simpleCompressorReducer(simpleCompressor: SimpleCompressorState, action: SimpleCompressorAction) {
	switch (action.type) {
		case SET_SIMPLE_COMPRESSOR_PARAM:
			return {
				...simpleCompressor,
				[action.paramName]: action.value,
			}
		default:
			return simpleCompressor
	}
}

export const selectAllSimpleCompressors = (state: IClientRoomState) => state.shamuGraph.nodes.simpleCompressors.things

export const selectAllSimpleCompressorIds = (state: IClientRoomState) => Object.keys(selectAllSimpleCompressors(state))

export const selectAllSimpleCompressorsAsArray =
	createSelectAllOfThingAsArray<ISimpleCompressors, SimpleCompressorState>(selectAllSimpleCompressors)

export const selectSimpleCompressor = (state: IClientRoomState, id: Id) =>
	selectAllSimpleCompressors(state)[id as string] || SimpleCompressorState.dummy

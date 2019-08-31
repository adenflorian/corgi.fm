import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {NodeSpecialState} from './shamu-graph'
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

export class SimpleCompressorState implements IConnectable, NodeSpecialState {
	public static dummy: SimpleCompressorState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		threshold: 0,
		knee: 0,
		ratio: 0,
		attack: 0,
		release: 0,
		color: false,
		type: ConnectionNodeType.simpleCompressor,
		name: 'Dummy Simple Compressor',
	}

	public readonly id = uuid.v4()
	public readonly ownerId: Id
	public readonly threshold: number = -24
	public readonly ratio: number = 12
	public readonly attack: number = 0.003
	public readonly release: number = 0.25
	public readonly knee: number = 30
	public readonly color: false = false
	public readonly type = ConnectionNodeType.simpleCompressor
	public readonly name: string = 'Simple Compressor'

	public constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function deserializeSimpleCompressorState(state: IMultiStateThing): IMultiStateThing {
	const x = state as SimpleCompressorState
	const y: SimpleCompressorState = {
		...(new SimpleCompressorState(x.ownerId)),
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

export const selectSimpleCompressorsByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSimpleCompressorsAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSimpleCompressor = (state: IClientRoomState, id: Id) =>
	selectAllSimpleCompressors(state)[id as string] || SimpleCompressorState.dummy

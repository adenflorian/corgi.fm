import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId, ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray, IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType, SERVER_ACTION} from './index'
import {NodeSpecialState} from './shamu-graph'

export const addSimpleDelay = (sampler: SimpleDelayState) =>
	addMultiThing(sampler, ConnectionNodeType.simpleDelay, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_SIMPLE_DELAY_PARAM = 'SET_SIMPLE_DELAY_PARAM'
export type SetSimpleDelayParamAction = ReturnType<typeof setSimpleDelayParam>
export const setSimpleDelayParam =
	(id: string, paramName: SimpleDelayParam, value: any) => ({
		type: SET_SIMPLE_DELAY_PARAM as typeof SET_SIMPLE_DELAY_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export enum SimpleDelayParam {
	time = 'time',
}

export interface ISimpleDelaysState extends IMultiState {
	things: ISimpleDelays
}

export interface ISimpleDelays {
	[key: string]: SimpleDelayState
}

export class SimpleDelayState implements IConnectable, NodeSpecialState {
	public static defaultWidth = 80
	public static defaultHeight = 88
	public static defaultTime = 0.25

	public static dummy: SimpleDelayState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		time: SimpleDelayState.defaultTime,
		color: false,
		type: ConnectionNodeType.simpleDelay,
		width: SimpleDelayState.defaultWidth,
		height: SimpleDelayState.defaultHeight,
		name: 'Dummy Simple Delay',
		enabled: false,
	}

	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly time: number = SimpleDelayState.defaultTime
	public readonly width: number = SimpleDelayState.defaultWidth
	public readonly height: number = SimpleDelayState.defaultHeight
	public readonly color: false = false
	public readonly type = ConnectionNodeType.simpleDelay
	public readonly name: string = 'Simple Delay'
	public readonly enabled: boolean = true

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function deserializeSimpleDelayState(state: IMultiStateThing): IMultiStateThing {
	const x = state as SimpleDelayState
	const y = {
		...(new SimpleDelayState(x.ownerId)),
		...x,
		width: Math.max(x.width, SimpleDelayState.defaultWidth),
		height: Math.max(x.height, SimpleDelayState.defaultHeight),
	} as SimpleDelayState
	return y
}

const simpleDelayActionTypes = [
	SET_SIMPLE_DELAY_PARAM,
]

export const simpleDelaysReducer = makeMultiReducer<SimpleDelayState, ISimpleDelaysState>(
	simpleDelayReducer,
	ConnectionNodeType.simpleDelay,
	simpleDelayActionTypes,
)

function simpleDelayReducer(simpleDelay: SimpleDelayState, action: AnyAction) {
	switch (action.type) {
		case SET_SIMPLE_DELAY_PARAM:
			return {
				...simpleDelay,
				[action.paramName]: action.value,
			}
		default:
			return simpleDelay
	}
}

export const selectAllSimpleDelays = (state: IClientRoomState) => state.shamuGraph.nodes.simpleDelays.things

export const selectAllSimpleDelayIds = (state: IClientRoomState) => Object.keys(selectAllSimpleDelays(state))

export const selectAllSimpleDelaysAsArray =
	createSelectAllOfThingAsArray<ISimpleDelays, SimpleDelayState>(selectAllSimpleDelays)

export const selectSimpleDelaysByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSimpleDelaysAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSimpleDelay = (state: IClientRoomState, id: string) =>
	selectAllSimpleDelays(state)[id] || SimpleDelayState.dummy

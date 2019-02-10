import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId, ConnectionNodeType, IConnectable} from '../common-types'
import {addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray, IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType, SERVER_ACTION} from './index'
import {NodeSpecialState} from './shamu-graph'

export const addSimpleReverb = (sampler: SimpleReverbState) =>
	addMultiThing(sampler, ConnectionNodeType.simpleReverb, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_SIMPLE_REVERB_PARAM = 'SET_SIMPLE_REVERB_PARAM'
export type SetSimpleReverbParamAction = ReturnType<typeof setSimpleReverbParam>
export const setSimpleReverbParam =
	(id: string, paramName: SimpleReverbParam, value: any) => ({
		type: SET_SIMPLE_REVERB_PARAM as typeof SET_SIMPLE_REVERB_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export enum SimpleReverbParam {
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
	time = 'time',
}

export interface ISimpleReverbsState extends IMultiState {
	things: ISimpleReverbs
}

export interface ISimpleReverbs {
	[key: string]: SimpleReverbState
}

export class SimpleReverbState implements IConnectable, NodeSpecialState {
	public static dummy: SimpleReverbState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		lowPassFilterCutoffFrequency: 0,
		time: 0,
		color: false,
		type: ConnectionNodeType.simpleReverb,
		width: 256,
		height: 80,
	}

	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly lowPassFilterCutoffFrequency: number = 10000
	public readonly time: number = 5
	public readonly width: number = 256
	public readonly height: number = 80
	public readonly color: false = false
	public readonly type = ConnectionNodeType.simpleReverb

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const simpleReverbActionTypes = [
	SET_SIMPLE_REVERB_PARAM,
]

export const simpleReverbsReducer = makeMultiReducer<SimpleReverbState, ISimpleReverbsState>(
	simpleReverbReducer,
	ConnectionNodeType.simpleReverb,
	simpleReverbActionTypes,
)

function simpleReverbReducer(simpleReverb: SimpleReverbState, action: AnyAction) {
	switch (action.type) {
		case SET_SIMPLE_REVERB_PARAM:
			return {
				...simpleReverb,
				[action.paramName]: action.value,
			}
		default:
			return simpleReverb
	}
}

export const selectAllSimpleReverbs = (state: IClientRoomState) => state.shamuGraph.nodes.simpleReverbs.things

export const selectAllSimpleReverbIds = (state: IClientRoomState) => Object.keys(selectAllSimpleReverbs(state))

export const selectAllSimpleReverbsAsArray =
	createSelectAllOfThingAsArray<ISimpleReverbs, SimpleReverbState>(selectAllSimpleReverbs)

export const selectSimpleReverbsByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSimpleReverbsAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSimpleReverb = (state: IClientRoomState, id: string) =>
	selectAllSimpleReverbs(state)[id] || SimpleReverbState.dummy

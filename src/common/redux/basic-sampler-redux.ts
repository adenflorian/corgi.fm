import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {addMultiThing, deleteThings, IMultiState, makeMultiReducer, MultiThingType, updateThings} from './multi-reducer'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const ADD_BASIC_SAMPLER = 'ADD_BASIC_SAMPLER'
export const addBasicSampler = (sampler: IBasicSamplerState) => ({
	...addMultiThing(sampler, MultiThingType.basicSampler),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_BASIC_SAMPLERS = 'DELETE_BASIC_SAMPLERS'
export const deleteBasicSamplers = (samplerIds: string[]) => ({
	...deleteThings(samplerIds, MultiThingType.basicSampler),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UPDATE_BASIC_SAMPLERS = 'UPDATE_BASIC_SAMPLERS'
export const updateBasicSamplers = (samplers: IBasicSamplers) => ({
	...updateThings(samplers, MultiThingType.basicSampler),
	BROADCASTER_ACTION,
})

export const SET_BASIC_SAMPLER_PARAM = 'SET_BASIC_SAMPLER_PARAM'
export const setBasicSamplerParam =
	(id: string, paramName: BasicSamplerParam, value: any) => ({
		type: SET_BASIC_SAMPLER_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export enum BasicSamplerParam {
	pan = 'pan',
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
	attack = 'attack',
	release = 'release',
}

export interface IBasicSamplersState extends IMultiState {
	things: IBasicSamplers
}

export interface IBasicSamplers {
	[key: string]: IBasicSamplerState
}

export interface IBasicSamplerState {
	id: string
	ownerId: ClientId
	pan: number
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
}

export class BasicSamplerState implements IBasicSamplerState {
	public id = uuid.v4()
	public ownerId: string
	public pan: number = Math.random() - 0.5
	public lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000
	public attack: number = 0.01
	public release: number = 1

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const basicSamplerActionTypes = [
	SET_BASIC_SAMPLER_PARAM,
]

export const basicSamplersReducer = makeMultiReducer<IBasicSamplerState, IBasicSamplersState>(
	basicSamplerReducer,
	MultiThingType.basicSampler,
	basicSamplerActionTypes,
)

function basicSamplerReducer(basicSampler: IBasicSamplerState, action: AnyAction) {
	switch (action.type) {
		case SET_BASIC_SAMPLER_PARAM:
			return {
				...basicSampler,
				[action.paramName]: action.value,
			}
		default:
			throw new Error('invalid basicSampler action type')
	}
}

export const selectAllSamplers = (state: IClientRoomState) => state.basicSamplers.things

export const selectAllSamplerIds = (state: IClientRoomState) => Object.keys(selectAllSamplers(state))

export function selectSamplersByOwner(state: IClientRoomState, ownerId: ClientId) {
	const samplers = selectAllSamplers(state)
	return Object.keys(samplers)
		.map(x => samplers[x])
		.filter(x => x.ownerId === ownerId)
}

export const selectSampler = (state: IClientRoomState, id: string) => selectAllSamplers(state)[id]

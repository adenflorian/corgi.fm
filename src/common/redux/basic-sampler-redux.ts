import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId} from '../common-types'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {
	addMultiThing, createSelectAllOfThingAsArray, deleteThings, IMultiState,
	makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export const addBasicSampler = (sampler: BasicSamplerState) =>
	addMultiThing(sampler, MultiThingType.basicSampler, NetworkActionType.SERVER_AND_BROADCASTER)

export const deleteBasicSamplers = (samplerIds: string[]) =>
	deleteThings(samplerIds, MultiThingType.basicSampler, NetworkActionType.SERVER_AND_BROADCASTER)

export const updateBasicSamplers = (samplers: IBasicSamplers) =>
	updateThings(samplers, MultiThingType.basicSampler, NetworkActionType.BROADCASTER)

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
	[key: string]: BasicSamplerState
}

export class BasicSamplerState implements IConnectable {
	public static dummy: BasicSamplerState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		pan: 0,
		lowPassFilterCutoffFrequency: 0,
		attack: 0,
		release: 0,
		color: false,
		type: ConnectionNodeType.sampler,
	}

	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly pan: number = Math.random() - 0.5
	public readonly lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000
	public readonly attack: number = 0.01
	public readonly release: number = 1
	public readonly color: false = false
	public readonly type = ConnectionNodeType.sampler

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const basicSamplerActionTypes = [
	SET_BASIC_SAMPLER_PARAM,
]

export const basicSamplersReducer = makeMultiReducer<BasicSamplerState, IBasicSamplersState>(
	basicSamplerReducer,
	MultiThingType.basicSampler,
	basicSamplerActionTypes,
)

function basicSamplerReducer(basicSampler: BasicSamplerState, action: AnyAction) {
	switch (action.type) {
		case SET_BASIC_SAMPLER_PARAM:
			return {
				...basicSampler,
				[action.paramName]: action.value,
			}
		default:
			return basicSampler
	}
}

export const selectAllSamplers = (state: IClientRoomState) => state.basicSamplers.things

export const selectAllSamplerIds = (state: IClientRoomState) => Object.keys(selectAllSamplers(state))

export const selectAllSamplersAsArray =
	createSelectAllOfThingAsArray<IBasicSamplers, BasicSamplerState>(selectAllSamplers)

export const selectSamplersByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSamplersAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSampler = (state: IClientRoomState, id: string) =>
	selectAllSamplers(state)[id] || BasicSamplerState.dummy

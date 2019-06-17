import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId, ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {
	addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray,
	IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType,
	SERVER_ACTION,
} from './index'
import {NodeSpecialState} from './shamu-graph'

export const addBasicSampler = (sampler: BasicSamplerState) =>
	addMultiThing(sampler, ConnectionNodeType.basicSampler, NetworkActionType.SERVER_AND_BROADCASTER)

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
	decay = 'decay',
	sustain = 'sustain',
	release = 'release',
	detune = 'detune',
	gain = 'gain',
}

export interface IBasicSamplersState extends IMultiState {
	things: IBasicSamplers
}

export interface IBasicSamplers {
	[key: string]: BasicSamplerState
}

export class BasicSamplerState implements IConnectable, NodeSpecialState {
	public static defaultWidth = 256
	public static defaultHeight = 88 * 2

	public static dummy: BasicSamplerState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		pan: 0,
		lowPassFilterCutoffFrequency: 0,
		attack: 0,
		decay: 0,
		sustain: 0,
		release: 0,
		detune: 0,
		gain: 0.5,
		color: false,
		type: ConnectionNodeType.basicSampler,
		width: BasicSamplerState.defaultWidth,
		height: BasicSamplerState.defaultHeight,
		name: 'Dummy Basic Piano Sampler',
	}

	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly pan: number = Math.random() - 0.5
	public readonly lowPassFilterCutoffFrequency: number = Math.min(10000, Math.random() * 10000 + 1000)
	public readonly attack: number = 0.01
	public readonly decay: number = 0.25
	public readonly sustain: number = 0.8
	public readonly release: number = 1
	public readonly detune: number = 0
	public readonly gain: number = 0.5
	public readonly color: false = false
	public readonly type = ConnectionNodeType.basicSampler
	public readonly width: number = BasicSamplerState.defaultWidth
	public readonly height: number = BasicSamplerState.defaultHeight
	public readonly name: string = 'Basic Piano Sampler'

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function deserializeBasicSamplerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as BasicSamplerState
	const y = {
		...(new BasicSamplerState(x.ownerId)),
		...x,
		width: Math.max(x.width, BasicSamplerState.defaultWidth),
		height: Math.max(x.height, BasicSamplerState.defaultHeight),
	} as BasicSamplerState
	return y
}

const basicSamplerActionTypes = [
	SET_BASIC_SAMPLER_PARAM,
]

export const basicSamplersReducer = makeMultiReducer<BasicSamplerState, IBasicSamplersState>(
	basicSamplerReducer,
	ConnectionNodeType.basicSampler,
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

export const selectAllSamplers = (state: IClientRoomState) => state.shamuGraph.nodes.basicSamplers.things

export const selectAllSamplerIds = (state: IClientRoomState) => Object.keys(selectAllSamplers(state))

export const selectAllSamplersAsArray =
	createSelectAllOfThingAsArray<IBasicSamplers, BasicSamplerState>(selectAllSamplers)

export const selectSamplersByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSamplersAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSampler = (state: IClientRoomState, id: string) =>
	selectAllSamplers(state)[id] || BasicSamplerState.dummy

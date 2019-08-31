import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {BuiltInBQFilterType} from '../OscillatorTypes'
import {NodeSpecialState} from './shamu-graph'
import {
	addMultiThing, BROADCASTER_ACTION,
	IClientRoomState, IMultiState, makeMultiReducer,
	NetworkActionType, SERVER_ACTION,
} from '.'

export const addSimpleReverb = (sampler: SimpleReverbState) =>
	addMultiThing(sampler, ConnectionNodeType.simpleReverb, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_SIMPLE_REVERB_PARAM = 'SET_SIMPLE_REVERB_PARAM'
export type SetSimpleReverbParamAction = ReturnType<typeof setSimpleReverbParam>
export const setSimpleReverbParam =
	(id: Id, paramName: SimpleReverbParam, value: any) => ({
		type: SET_SIMPLE_REVERB_PARAM as typeof SET_SIMPLE_REVERB_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export type SimpleReverbAction = SetSimpleReverbParamAction

export enum SimpleReverbParam {
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
	time = 'time',
	dry = 'dry',
	wet = 'wet',
	reverse = 'reverse',
	decay = 'decay',
	filterType = 'filterType',
}

export interface ISimpleReverbsState extends IMultiState {
	things: ISimpleReverbs
}

export interface ISimpleReverbs {
	[key: string]: SimpleReverbState
}

export class SimpleReverbState implements IConnectable, NodeSpecialState {
	public static defaultLpfFreq = 2000
	public static defaultTime = 4
	public static defaultDry = 0.6
	public static defaultWet = 0.4
	public static defaultReverse = false
	public static defaultDecay = 2
	public static defaultFilterType: BuiltInBQFilterType = BuiltInBQFilterType.lowpass

	public static dummy: SimpleReverbState = {
		id: 'dummy',
		lowPassFilterCutoffFrequency: 0,
		time: 0,
		dry: 0,
		wet: 1,
		reverse: false,
		decay: 2,
		filterType: BuiltInBQFilterType.lowpass,
		type: ConnectionNodeType.simpleReverb,
	}

	public readonly id = uuid.v4()
	public readonly lowPassFilterCutoffFrequency: number = SimpleReverbState.defaultLpfFreq
	public readonly time: number = SimpleReverbState.defaultTime
	public readonly dry: number = SimpleReverbState.defaultDry
	public readonly wet: number = SimpleReverbState.defaultWet
	public readonly reverse: boolean = SimpleReverbState.defaultReverse
	public readonly decay: number = SimpleReverbState.defaultDecay
	public readonly filterType: BuiltInBQFilterType = SimpleReverbState.defaultFilterType
	public readonly type = ConnectionNodeType.simpleReverb
}

export function deserializeSimpleReverbState(state: IConnectable): IConnectable {
	const x = state as SimpleReverbState
	const y: SimpleReverbState = {
		...(new SimpleReverbState()),
		...x,
	}
	return y
}

type SimpleReverbActionTypes = {
	[key in SimpleReverbAction['type']]: 0
}

const simpleReverbActionTypes2: SimpleReverbActionTypes = {
	SET_SIMPLE_REVERB_PARAM: 0,
}

const simpleReverbActionTypes = Object.keys(simpleReverbActionTypes2)

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

export const selectSimpleReverb = (state: IClientRoomState, id: Id) =>
	selectAllSimpleReverbs(state)[id as string] || SimpleReverbState.dummy

import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {BuiltInBQFilterType} from '../OscillatorTypes'
import {NodeSpecialState} from './shamu-graph'
import {addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray, IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType, SERVER_ACTION} from '.'

export const addSimpleDelay = (sampler: SimpleDelayState) =>
	addMultiThing(sampler, ConnectionNodeType.simpleDelay, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_SIMPLE_DELAY_PARAM = 'SET_SIMPLE_DELAY_PARAM'
export type SetSimpleDelayParamAction = ReturnType<typeof setSimpleDelayParam>
export const setSimpleDelayParam =
	(id: Id, paramName: SimpleDelayParam, value: any) => ({
		type: SET_SIMPLE_DELAY_PARAM as typeof SET_SIMPLE_DELAY_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export type SimpleDelayAction = SetSimpleDelayParamAction

export enum SimpleDelayParam {
	timeLeft = 'timeLeft',
	timeRight = 'timeRight',
	feedback = 'feedback',
	bpmSync = 'bpmSync',
	mix = 'mix',
	link = 'link',
	filterFreq = 'filterFreq',
	filterQ = 'filterQ',
	filterType = 'filterType',
	pingPong = 'pingPong',
}

export interface ISimpleDelaysState extends IMultiState {
	things: ISimpleDelays
}

export interface ISimpleDelays {
	[key: string]: SimpleDelayState
}

export class SimpleDelayState implements IConnectable, NodeSpecialState {
	public static defaultTimeLeft = 0.25
	public static defaultTimeRight = 0.25
	public static defaultFeedback = 0.42
	public static defaultBpmSync = true
	public static defaultMix = 0.3
	public static defaultLink = true
	public static defaultFilterFreq = 920
	public static defaultFilterQ = 6.6
	public static defaultFilterType = BuiltInBQFilterType.bandpass
	public static defaultPingPong = false

	public static dummy: SimpleDelayState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		timeLeft: SimpleDelayState.defaultTimeLeft,
		timeRight: SimpleDelayState.defaultTimeRight,
		feedback: SimpleDelayState.defaultFeedback,
		bpmSync: SimpleDelayState.defaultBpmSync,
		mix: SimpleDelayState.defaultMix,
		link: SimpleDelayState.defaultLink,
		filterFreq: SimpleDelayState.defaultFilterFreq,
		filterQ: SimpleDelayState.defaultFilterQ,
		filterType: SimpleDelayState.defaultFilterType,
		pingPong: SimpleDelayState.defaultPingPong,
		color: false,
		type: ConnectionNodeType.simpleDelay,
		name: 'Dummy Simple Delay',
	}

	public readonly id = uuid.v4()
	public readonly ownerId: Id
	public readonly timeLeft: number = SimpleDelayState.defaultTimeLeft
	public readonly timeRight: number = SimpleDelayState.defaultTimeRight
	public readonly feedback: number = SimpleDelayState.defaultFeedback
	public readonly bpmSync: boolean = SimpleDelayState.defaultBpmSync
	public readonly mix: number = SimpleDelayState.defaultMix
	public readonly link: boolean = SimpleDelayState.defaultLink
	public readonly filterFreq: number = SimpleDelayState.defaultFilterFreq
	public readonly filterQ: number = SimpleDelayState.defaultFilterQ
	public readonly filterType: BuiltInBQFilterType = SimpleDelayState.defaultFilterType
	public readonly pingPong: boolean = SimpleDelayState.defaultPingPong
	public readonly color: false = false
	public readonly type = ConnectionNodeType.simpleDelay
	public readonly name: string = 'Simple Delay'

	public constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function deserializeSimpleDelayState(state: IMultiStateThing): IMultiStateThing {
	const x = state as SimpleDelayState
	const y: SimpleDelayState = {
		...(new SimpleDelayState(x.ownerId)),
		...x,
	}
	return y
}

type SimpleDelayActionTypes = {
	[key in SimpleDelayAction['type']]: 0
}

const simpleDelayActionTypes2: SimpleDelayActionTypes = {
	SET_SIMPLE_DELAY_PARAM: 0,
}

const simpleDelayActionTypes = Object.keys(simpleDelayActionTypes2)

export const simpleDelaysReducer = makeMultiReducer<SimpleDelayState, ISimpleDelaysState>(
	simpleDelayReducer,
	ConnectionNodeType.simpleDelay,
	simpleDelayActionTypes,
)

function simpleDelayReducer(simpleDelay: SimpleDelayState, action: SimpleDelayAction) {
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

export const selectSimpleDelay = (state: IClientRoomState, id: Id) =>
	selectAllSimpleDelays(state)[id as string] || SimpleDelayState.dummy

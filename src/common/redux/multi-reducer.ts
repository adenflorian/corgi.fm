import {IConnectable} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export interface IMultiState {
	things: IMultiStateThings
}

export interface IMultiStateThings {
	[key: string]: IMultiStateThing
}

export interface IMultiStateThing extends IConnectable {
	id: string
}

export enum MultiThingType {
	virtualKeyboard = 'virtualKeyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	basicInstrument = 'basicInstrument',
	basicSampler = 'basicSampler',
}

export const ADD_MULTI_THING = 'ADD_MULTI_THING'
type AddMultiThingAction = ReturnType<typeof addMultiThing>
export const addMultiThing = (
	thing: IMultiStateThing,
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: ADD_MULTI_THING as typeof ADD_MULTI_THING,
	thing,
	thingType,
	...expandNetActionType(netActionType),
})

function expandNetActionType(netActionType: NetworkActionType) {
	switch (netActionType) {
		case NetworkActionType.SERVER_ACTION: return {SERVER_ACTION}
		case NetworkActionType.BROADCASTER: return {BROADCASTER_ACTION}
		case NetworkActionType.SERVER_AND_BROADCASTER: return {SERVER_ACTION, BROADCASTER_ACTION}
		case NetworkActionType.NO:
		default: return {}
	}
}

export const DELETE_MULTI_THINGS = 'DELETE_MULTI_THINGS'
type DeleteMultiThingsAction = ReturnType<typeof deleteThings>
export const deleteThings = (
	thingIds: string[],
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: DELETE_MULTI_THINGS as typeof DELETE_MULTI_THINGS,
	thingIds,
	thingType,
	...expandNetActionType(netActionType),
})

export const DELETE_ALL_THINGS = 'DELETE_ALL_THINGS'
type DeleteAllThingsAction = ReturnType<typeof deleteAllThings>
export const deleteAllThings = (thingType: MultiThingType) => ({
	type: DELETE_ALL_THINGS as typeof DELETE_ALL_THINGS,
	thingType,
})

export const UPDATE_MULTI_THINGS = 'UPDATE_MULTI_THINGS'
type UpdateMultiThingsAction = ReturnType<typeof updateThings>
export const updateThings = (
	things: IMultiStateThings,
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: UPDATE_MULTI_THINGS as typeof UPDATE_MULTI_THINGS,
	things,
	thingType,
	...expandNetActionType(netActionType),
})

export type MultiThingAction =
	UpdateMultiThingsAction | AddMultiThingAction | DeleteMultiThingsAction | DeleteAllThingsAction
	| {type: '', id: string}

// TODO Use immutable js like connections redux
export function makeMultiReducer<T extends IMultiStateThing, U extends IMultiState>(
	innerReducer: (state: T, action: any) => any,
	thingType: MultiThingType,
	actionTypes: string[],
	globalActionTypes: string[] = [],
) {
	return (state: U = {things: {}} as U, action: MultiThingAction): U => {
		switch (action.type) {
			case ADD_MULTI_THING:
				if (action.thingType !== thingType) return state
				return {
					...state,
					things: {
						...state.things,
						[action.thing.id]: action.thing,
					},
				}
			case DELETE_MULTI_THINGS:
				if (action.thingType !== thingType) return state
				const newState = {...state, things: {...state.things}}
				action.thingIds.forEach(x => delete newState.things[x])
				return newState
			case DELETE_ALL_THINGS:
				if (action.thingType !== thingType) return state
				return {...state, things: {}}
			case UPDATE_MULTI_THINGS:
				if (action.thingType !== thingType) return state
				return {
					...state,
					things: {
						...state.things,
						...action.things,
					},
				}
			default:
				if (actionTypes.includes(action.type)) {
					const thing = state.things[action.id]
					if (thing === undefined) {
						return state
					} else {
						return {
							...state,
							things: {
								...state.things,
								[action.id]: innerReducer(thing as T, action),
							},
						}
					}
				} else if (globalActionTypes.includes(action.type)) {
					const newThings: IMultiStateThings = {}
					Object.keys(state.things).forEach(id => {
						const thing = state.things[id]
						newThings[id] = innerReducer(thing as T, action)
					})
					return {
						...state,
						things: {
							...state.things,
							...newThings,
						},
					}
				} else {
					return state
				}
		}
	}
}

export const createSelectAllOfThingAsArray =
	<T extends IThings, U>(selectAllOfThing: SelectAllOfThing<T>) => (state: IClientRoomState) => {
		const things = selectAllOfThing(state)
		return Object.keys(things)
			.map(x => things[x]) as U[]
	}

export type SelectAllOfThing<T extends IThings> = (clientRoomState: IClientRoomState) => T

export interface IThings {
	[key: string]: any
}

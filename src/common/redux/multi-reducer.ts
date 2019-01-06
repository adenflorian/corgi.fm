import {Action, Reducer} from 'redux'
import {logger} from '../logger'
import {IClientRoomState} from './common-redux-types'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export interface IMultiState {
	things: IMultiStateThings
}

export interface IMultiStateThings {
	[key: string]: IMultiStateThing
}

export interface IMultiStateThing {
	id: string
}

export enum MultiThingType {
	virtualKeyboard,
	gridSequencer,
	infiniteSequencer,
	basicInstrument,
	basicSampler,
}

type ADD_MULTI_THING = 'ADD_MULTI_THING'
export const ADD_MULTI_THING: ADD_MULTI_THING = 'ADD_MULTI_THING'
interface IAddMultiThingAction extends IMultiThingAction {
	type: ADD_MULTI_THING
	thing: IMultiStateThing
}
export const addMultiThing = (
	thing: IMultiStateThing,
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
): IAddMultiThingAction => ({
	type: ADD_MULTI_THING,
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
		default:
			return {}
	}
}

type DELETE_THINGS = 'DELETE_THINGS'
export const DELETE_MULTI_THINGS: DELETE_THINGS = 'DELETE_THINGS'
interface IDeleteMultiThingsAction extends IMultiThingAction {
	type: DELETE_THINGS
	thingIds: string[]
}
export const deleteThings = (
	thingIds: string[],
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
): IDeleteMultiThingsAction => ({
	type: DELETE_MULTI_THINGS,
	thingIds,
	thingType,
	...expandNetActionType(netActionType),
})

type DELETE_ALL_THINGS = 'DELETE_ALL_THINGS'
export const DELETE_ALL_THINGS: DELETE_ALL_THINGS = 'DELETE_ALL_THINGS'
interface IDeleteAllThingsAction extends IMultiThingAction {
	type: DELETE_ALL_THINGS
}
export const deleteAllThings = (thingType: MultiThingType): IDeleteAllThingsAction => ({
	type: DELETE_ALL_THINGS,
	thingType,
})

type UPDATE_THINGS = 'UPDATE_THINGS'
export const UPDATE_MULTI_THINGS: UPDATE_THINGS = 'UPDATE_THINGS'
interface IUpdateMultiThingsAction extends IMultiThingAction {
	type: UPDATE_THINGS
	things: IMultiStateThings
}
export const updateThings = (
	things: IMultiStateThings,
	thingType: MultiThingType,
	netActionType: NetworkActionType = NetworkActionType.NO,
): IUpdateMultiThingsAction => ({
	type: UPDATE_MULTI_THINGS,
	things,
	thingType,
	...expandNetActionType(netActionType),
})

export type MultiThingAction =
	IUpdateMultiThingsAction | IAddMultiThingAction | IDeleteMultiThingsAction | IDeleteAllThingsAction
	| {type: '', id: string}

interface IMultiThingAction {
	thingType: MultiThingType
}

export function makeMultiReducer<T extends IMultiStateThing, U extends IMultiState>(
	innerReducer: (state: T, action: any) => any,
	thingType: MultiThingType,
	actionTypes: string[],
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
						logger.warn('uh oh owo fucky wucky: ' + action.id)
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
				} else {
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

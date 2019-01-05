import {logger} from '../logger'

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
	basicInstrument,
	basicSampler,
}

type ADD_MULTI_THING = 'ADD_MULTI_THING'
export const ADD_MULTI_THING: ADD_MULTI_THING = 'ADD_MULTI_THING'
interface IAddMultiThingAction extends IMultiThingAction {
	type: ADD_MULTI_THING
	thing: IMultiStateThing
}
export const addMultiThing = (thing: IMultiStateThing, thingType: MultiThingType): IAddMultiThingAction => ({
	type: ADD_MULTI_THING,
	thing,
	thingType,
})

type DELETE_THINGS = 'DELETE_THINGS'
export const DELETE_MULTI_THINGS: DELETE_THINGS = 'DELETE_THINGS'
interface IDeleteMultiThingsAction extends IMultiThingAction {
	type: DELETE_THINGS
	thingIds: string[]
}
export const deleteThings = (thingIds: string[], thingType: MultiThingType): IDeleteMultiThingsAction => ({
	type: DELETE_MULTI_THINGS,
	thingIds,
	thingType,
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
export const updateThings = (things: IMultiStateThings, thingType: MultiThingType): IUpdateMultiThingsAction => ({
	type: UPDATE_MULTI_THINGS,
	things,
	thingType,
})

type MultiThingAction =
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
					}
					return {
						...state,
						things: {
							...state.things,
							[action.id]: innerReducer(thing as T, action),
						},
					}
				} else {
					return state
				}
		}
	}
}

import {AnyAction} from '../../../node_modules/redux'

interface IMultiState {
	things: IMultiStateThings
}

export interface IMultiStateThings {
	[key: string]: IMultiStateThing
}

export interface IMultiStateThing {
	id: string
}

const initialState: IMultiState = {
	things: {},
}

// export const addMultiThing = <T>(thingName: string, thing: T) => {
// 	return {
// 		type: `${thingName}_ADD`,
// 		thing,
// 	}
// }

type ADD_MULTI_THING = 'ADD_MULTI_THING'
export const ADD_MULTI_THING: ADD_MULTI_THING = 'ADD_MULTI_THING'
interface IAddMultiThingAction extends IMultiThingAction {
	type: ADD_MULTI_THING
	thing: IMultiStateThing
}
export const addMultiThing = (thing: IMultiStateThing, thingType: string): IAddMultiThingAction => ({
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
export const deleteThings = (thingIds: string[], thingType: string): IDeleteMultiThingsAction => ({
	type: DELETE_MULTI_THINGS,
	thingIds,
	thingType,
})

type UPDATE_THINGS = 'UPDATE_THINGS'
export const UPDATE_MULTI_THINGS: UPDATE_THINGS = 'UPDATE_THINGS'
interface IUpdateMultiThingsAction extends IMultiThingAction {
	type: UPDATE_THINGS
	things: IMultiStateThings
}
export const updateThings = (things: IMultiStateThings, thingType: string): IUpdateMultiThingsAction => ({
	type: UPDATE_MULTI_THINGS,
	things,
	thingType,
})

type MultiThingAction =
	IUpdateMultiThingsAction | IAddMultiThingAction | IDeleteMultiThingsAction | {type: '', id?: string}

interface IMultiThingAction {
	thingType: string
}

export function makeMultiReducer<T extends IMultiStateThing>(
	innerReducer: (state: T, action: any) => any,
	thingType: string,
	actionTypes: string[],
) {
	return (state: IMultiState = initialState, action: MultiThingAction) => {
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
					return {
						...state,
						things: {
							...state.things,
							[action.id]: innerReducer(state.things[action.id] as T, action),
						},
					}
				} else {
					return state
				}
		}
	}
}

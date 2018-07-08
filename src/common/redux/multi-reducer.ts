import {AnyAction} from '../../../node_modules/redux'

interface IMultiState {
	things: IMultiStateThings
}

export interface IMultiStateThings {
	[key: string]: IMultiStateThing
}

interface IMultiStateThing {
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
interface IAddMultiThingAction {
	type: ADD_MULTI_THING
	thing: IMultiStateThing
}
type addMultiThing = (thing: IMultiStateThing) => IAddMultiThingAction
export const addMultiThing: addMultiThing = (thing: IMultiStateThing) => ({
	type: ADD_MULTI_THING,
	thing,
})

type DELETE_THINGS = 'DELETE_THINGS'
export const DELETE_MULTI_THINGS: DELETE_THINGS = 'DELETE_THINGS'
export const deleteThings = (thingIds: string[]) => ({
	type: DELETE_MULTI_THINGS,
	thingIds,
})
interface IDeleteMultiThingsAction {
	type: DELETE_THINGS
	thingIds: string[]
}

type UPDATE_THINGS = 'UPDATE_THINGS'
export const UPDATE_MULTI_THINGS: UPDATE_THINGS = 'UPDATE_THINGS'
export const updateThings = (things: IMultiStateThings) => ({
	type: UPDATE_MULTI_THINGS,
	things,
})
interface IUpdateMultiThingsAction {
	type: UPDATE_THINGS
	things: IMultiStateThings
}

type MultiThingAction =
	IUpdateMultiThingsAction | IAddMultiThingAction | IDeleteMultiThingsAction | {type: '', id?: string}

export function makeMultiReducer<T extends IMultiStateThing>(
	innerReducer: (state: T, action: any) => any,
	prefix: string,
	actionTypes: string[],
) {
	return (state: IMultiState = initialState, action: MultiThingAction) => {
		switch (action.type) {
			case ADD_MULTI_THING:
				return {
					...state,
					things: {
						...state.things,
						[action.thing.id]: action.thing,
					},
				}
			case DELETE_MULTI_THINGS:
				const newState = {...state, things: {...state.things}}
				action.thingIds.forEach(x => delete newState.things[x])
				return newState
			case UPDATE_MULTI_THINGS:
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

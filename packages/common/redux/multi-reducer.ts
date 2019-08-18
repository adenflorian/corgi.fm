import {Map} from 'immutable'
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {assertArrayHasNoUndefinedElements} from '../common-utils'
import {BROADCASTER_ACTION, findNodeInfo, IClientRoomState, NetworkActionType, SERVER_ACTION} from '.'

export interface IMultiState {
	readonly things: IMultiStateThings
}

export interface IMultiStateThings {
	readonly [key: string]: IMultiStateThing
}

export const dummyMultiStateThing: IMultiStateThing = {
	id: '-1',
	ownerId: '-2',
	color: 'black',
	type: ConnectionNodeType.dummy,
	name: 'dummy multi state thing',
	enabled: false,
}

export const ADD_MULTI_THING = 'ADD_MULTI_THING'
type AddMultiThingAction = ReturnType<typeof addMultiThing>
export const addMultiThing = (
	thing: IMultiStateThing,
	thingType: ConnectionNodeType,
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
	thingIds: Id[],
	thingType: ConnectionNodeType,
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: DELETE_MULTI_THINGS as typeof DELETE_MULTI_THINGS,
	thingIds,
	thingType,
	...expandNetActionType(netActionType),
})

export const DELETE_MULTI_THINGS_ANY = 'DELETE_MULTI_THINGS_ANY'
type DeleteMultiThingsAnyAction = ReturnType<typeof deleteThingsAny>
export const deleteThingsAny = (
	thingIds: Id[],
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: DELETE_MULTI_THINGS_ANY as typeof DELETE_MULTI_THINGS_ANY,
	thingIds,
	...expandNetActionType(netActionType),
})

export const DELETE_ALL_THINGS = 'DELETE_ALL_THINGS'
type DeleteAllThingsAction = ReturnType<typeof deleteAllThings>
export const deleteAllThings = (thingType: ConnectionNodeType) => ({
	type: DELETE_ALL_THINGS as typeof DELETE_ALL_THINGS,
	thingType,
})

export const UPDATE_MULTI_THINGS = 'UPDATE_MULTI_THINGS'
type UpdateMultiThingsAction = ReturnType<typeof updateThings>
export const updateThings = (
	things: IMultiStateThings,
	thingType: ConnectionNodeType,
	netActionType: NetworkActionType = NetworkActionType.NO,
) => ({
	type: UPDATE_MULTI_THINGS as typeof UPDATE_MULTI_THINGS,
	things,
	thingType,
	...expandNetActionType(netActionType),
})

export type MultiThingAction =
	UpdateMultiThingsAction | AddMultiThingAction |
	DeleteMultiThingsAction | DeleteAllThingsAction | DeleteMultiThingsAnyAction
	| {type: '', id: Id}

// TODO Use immutable js like connections redux
export function makeMultiReducer<T extends IMultiStateThing, U extends IMultiState>(
	innerReducer: (state: T, action: any) => T,
	thingType: ConnectionNodeType,
	actionTypes: string[],
	globalActionTypes: string[] = [],
) {
	assertArrayHasNoUndefinedElements(globalActionTypes)

	// eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
	return (state: U = {things: {}} as U, action: MultiThingAction): U => {
		switch (action.type) {
			case ADD_MULTI_THING:
				if (action.thingType !== thingType) return state
				return {
					...state,
					things: {
						...state.things,
						[action.thing.id as string]: findNodeInfo(thingType).stateDeserializer(action.thing),
					},
				}
			case DELETE_MULTI_THINGS: {
				if (action.thingType !== thingType) return state
				const newState = {...state, things: {...state.things}}
				action.thingIds.forEach(x => delete newState.things[x as string])
				return newState
			}
			case DELETE_MULTI_THINGS_ANY: {
				const newState = {...state, things: {...state.things}}
				action.thingIds.forEach(x => delete newState.things[x as string])
				return newState
			}
			case DELETE_ALL_THINGS:
				if (action.thingType !== thingType) return state
				return {...state, things: {}}
			case UPDATE_MULTI_THINGS:
				if (action.thingType !== thingType) return state
				const xx = Map(action.things).map(findNodeInfo(thingType).stateDeserializer).toObject()
				// console.log('XXXXXXXX ' + action.thingType + ': ', xx)
				return {
					...state,
					things: {
						...state.things,
						// ...action.things,
						...xx,
					},
				}
			default:
				if (actionTypes.includes(action.type)) {
					const thing = state.things[action.id as string]
					if (thing === undefined) {
						return state
					} else {
						return {
							...state,
							things: {
								...state.things,
								[action.id as string]: innerReducer(thing as T, action),
							},
						}
					}
				} else if (globalActionTypes.includes(action.type)) {
					const newThings: {[key: string]: T} = {}
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
			.map((x): U => things[x])
	}

export type SelectAllOfThing<T extends IThings> = (clientRoomState: IClientRoomState) => T

export interface IThings {
	[key: string]: any
}

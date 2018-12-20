import {Map} from 'immutable'
import {IClientAppState} from './common-redux-types'

export const ADD_COMPLEX_OBJECT = 'ADD_COMPLEX_OBJECT'
export type AddComplexObjectAction = ReturnType<typeof addComplexObject>
export const addComplexObject = (id: string, obj: any) => ({
	type: ADD_COMPLEX_OBJECT as typeof ADD_COMPLEX_OBJECT,
	id,
	obj,
})

export const DELETE_COMPLEX_OBJECT = 'DELETE_COMPLEX_OBJECT'
export type DeleteComplexObjectAction = ReturnType<typeof deleteComplexObject>
export const deleteComplexObject = (id: string) => ({
	type: DELETE_COMPLEX_OBJECT as typeof DELETE_COMPLEX_OBJECT,
	id,
})

type IComplexObjectReferences = Map<string, any>

export interface IComplexObjectsState {
	references: IComplexObjectReferences
}

type IComplexObjectAction = AddComplexObjectAction | DeleteComplexObjectAction

const ComplexObjectReferences = Map

const initialState: IComplexObjectsState = {
	references: ComplexObjectReferences(),
}

export function complexObjectsReducer(state = initialState, action: IComplexObjectAction): IComplexObjectsState {
	return {
		...state,
		references: complexObjectReferenceReducer(state.references, action),
	}
}

function complexObjectReferenceReducer(
	state: IComplexObjectReferences, action: IComplexObjectAction,
): IComplexObjectReferences {
	switch (action.type) {
		case ADD_COMPLEX_OBJECT: return state.set(action.id, action.obj)
		case DELETE_COMPLEX_OBJECT: return state.remove(action.id)
		default: return state
	}
}

export const selectComplexObjectsState = (state: IClientAppState): IComplexObjectsState =>
	state.complexObjects

export const selectComplexObjectReferences = (state: IClientAppState): IComplexObjectReferences =>
	selectComplexObjectsState(state).references

export const selectComplexObjectById = (state: IClientAppState, id: string): any =>
	selectComplexObjectReferences(state).get(id)

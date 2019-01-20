import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {IClientRoomState} from './common-redux-types'
import {ConnectionNodeType, getConnectionNodeInfo, IConnection} from './connections-redux'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const ADD_POSITION = 'ADD_POSITION'
export type AddPositionAction = ReturnType<typeof addPosition>
export const addPosition = (position: IPosition) => ({
	type: ADD_POSITION as typeof ADD_POSITION,
	position,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_POSITIONS = 'DELETE_POSITIONS'
export type DeletePositionsAction = ReturnType<typeof deletePositions>
export const deletePositions = (positionIds: string[]) => ({
	type: DELETE_POSITIONS as typeof DELETE_POSITIONS,
	positionIds,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_ALL_POSITIONS = 'DELETE_ALL_POSITIONS'
export type DeleteAllPositionsAction = ReturnType<typeof deleteAllPositions>
export const deleteAllPositions = () => ({
	type: DELETE_ALL_POSITIONS as typeof DELETE_ALL_POSITIONS,
})

export const UPDATE_POSITIONS = 'UPDATE_POSITIONS'
export type UpdatePositionsAction = ReturnType<typeof updatePositions>
export const updatePositions = (positions: IPositions) => ({
	type: UPDATE_POSITIONS as typeof UPDATE_POSITIONS,
	positions,
	BROADCASTER_ACTION,
})

export interface IPositionsState {
	all: IPositions
}

export type IPositions = Map<string, IPosition>

export const Positions = Map

export interface IPosition {
	id: string
	targetType: ConnectionNodeType
	width: number
	height: number
	x: number
	y: number
}

export class Position implements IPosition {
	constructor(
		public readonly id: string,
		public readonly targetType: ConnectionNodeType,
		public readonly width = -1,
		public readonly height = -1,
		public readonly x = Math.random() * 1600 - 800,
		public readonly y = Math.random() * 1000 - 500,
	) {
		if (width === -1) {
			this.width = getConnectionNodeInfo(targetType).width
		}
		if (height === -1) {
			this.height = getConnectionNodeInfo(targetType).height
		}
	}
}

export type IPositionAction = AddPositionAction | DeletePositionsAction
	| DeleteAllPositionsAction | UpdatePositionsAction

const positionsSpecificReducer: Reducer<IPositions, IPositionAction> =
	(positions = Positions(), action) => {
		switch (action.type) {
			case ADD_POSITION: return positions.set(action.position.id, action.position)
			case DELETE_POSITIONS: return positions.deleteAll(action.positionIds)
			case DELETE_ALL_POSITIONS: return positions.clear()
			case UPDATE_POSITIONS: return positions.merge(action.positions)
			default: return positions
		}
	}

export const positionsReducer: Reducer<IPositionsState, IPositionAction> = combineReducers({
	all: positionsSpecificReducer,
})

export const selectAllPositions = (state: IClientRoomState) =>
	state.positions.all

export const selectPosition = (state: IClientRoomState, id: string) =>
	selectAllPositions(state).get(id)

export const selectAllPositionsAsArray = createSelector(
	selectAllPositions,
	positions => positions.toIndexedSeq().toArray(),
)

export const selectAllPositionIds = createSelector(
	selectAllPositions,
	positions => [...positions.keys()],
)

export const selectPositionsWithIds = (state: IClientRoomState, ids: string[]) => {
	return selectAllPositionsAsArray(state)
		.filter(x => ids.includes(x.id))
}

const defaultPosition: IPosition = {
	id: 'uh oh',
	targetType: ConnectionNodeType.dummy,
	x: 0,
	y: 0,
	width: 0,
	height: 0,
}

const selectConnectionSourcePosition =
	(state: IClientRoomState, connection: IConnection) => selectPosition(state, connection.sourceId)

const selectConnectionTargetPosition =
	(state: IClientRoomState, connection: IConnection) => selectPosition(state, connection.targetId)

export const makeConnectionPositionsSelector = () => createSelector(
	selectConnectionSourcePosition,
	selectConnectionTargetPosition,
	makePositionsObject,
)

function makePositionsObject(sourcePosition = defaultPosition, targetPosition = defaultPosition) {
	return {
		sourcePosition: {
			x: sourcePosition.x + sourcePosition.width,
			y: sourcePosition.y + (sourcePosition.height / 2),
		},
		targetPosition: {
			x: targetPosition.x,
			y: targetPosition.y + (targetPosition.height / 2),
		},
	}
}

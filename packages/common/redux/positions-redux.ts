import {Map, Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, Id} from '../common-types'
import {shamuMetaReducer} from './shamu-graph'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION,
} from '.'

export const SET_ENABLED_NODE = 'SET_ENABLED_NODE'

export const positionActions = Object.freeze({
	setEnabled: (id: Id, enabled: boolean) => ({
		type: SET_ENABLED_NODE as typeof SET_ENABLED_NODE,
		id,
		enabled,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

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
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const REPLACE_POSITIONS = 'REPLACE_POSITIONS'
export type ReplacePositionsAction = ReturnType<typeof replacePositions>
export const replacePositions = (positions: IPositions) => ({
	type: REPLACE_POSITIONS as typeof REPLACE_POSITIONS,
	positions,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UPDATE_POSITION = 'UPDATE_POSITION'
export type UpdatePositionAction = ReturnType<typeof updatePosition>
export const updatePosition = (id: string, position: Partial<IPosition>) => ({
	type: UPDATE_POSITION as typeof UPDATE_POSITION,
	id,
	position,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const MOVE_POSITION = 'MOVE_POSITION'
export type MovePositionAction = ReturnType<typeof movePosition>
export const movePosition = (id: string, position: Pick<IPosition, 'x' | 'y'>) => ({
	type: MOVE_POSITION as typeof MOVE_POSITION,
	id,
	position,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const NODE_CLICKED = 'NODE_CLICKED'
export type NodeClickedAction = ReturnType<typeof nodeClicked>
export const nodeClicked = (id: string) => ({
	type: NODE_CLICKED as typeof NODE_CLICKED,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export interface IPositionsState {
	all: IPositions
	meta: ReturnType<typeof shamuMetaReducer>
}

export type IPositions = Map<string, IPosition>

export const Positions = Map

export type IPosition = typeof defaultPosition

const defaultPosition = {
	id: '-1',
	targetType: ConnectionNodeType.dummy,
	width: -1,
	height: -1,
	x: Math.random() * 1600 - 800,
	y: Math.random() * 1000 - 500,
	zIndex: 0,
	inputPortCount: 1,
	outputPortCount: 1,
	enabled: true,
}

const makePositionRecord = Record(defaultPosition)

export const makePosition = (
	position: Pick<IPosition, 'id' | 'targetType' | 'width' | 'height'> & Partial<IPosition>,
): Readonly<IPosition> => {
	return makePositionRecord(position).toJS()
}

export type PositionAction = AddPositionAction | DeletePositionsAction | NodeClickedAction
| DeleteAllPositionsAction | UpdatePositionsAction | UpdatePositionAction | MovePositionAction
| ReplacePositionsAction | ActionType<typeof positionActions>

// Reducers
const positionsSpecificReducer: Reducer<IPositions, PositionAction> =
	(positions = Positions(), action) => {
		switch (action.type) {
			case ADD_POSITION: return sortPositions(positions.set(
				action.position.id,
				{
					...action.position,
					zIndex: getNewZIndex(positions, 0),
				},
			))
			case DELETE_POSITIONS: return sortPositions(positions.deleteAll(action.positionIds))
			case DELETE_ALL_POSITIONS: return positions.clear()
			case REPLACE_POSITIONS: return sortPositions(Map<string, IPosition>().merge(action.positions))
			case UPDATE_POSITIONS: return sortPositions(positions.merge(action.positions))
			case UPDATE_POSITION: return positions.update(action.id, x => ({...x, ...action.position}))
			case MOVE_POSITION: return positions.update(action.id, x => ({...x, ...action.position}))
			case NODE_CLICKED: return positions.update(action.id, x => ({
				...x,
				zIndex: getNewZIndex(positions, x.zIndex),
			}))
			case SET_ENABLED_NODE: return positions.update(action.id, x => ({...x, enabled: action.enabled}))
			default: return positions
		}
	}

function getNewZIndex(positions: IPositions, currentZIndex: number) {
	const highest = selectHighestZIndexOfAllPositionsLocal(positions)
	if (currentZIndex === 0) return highest + 1
	return currentZIndex < highest ? highest + 1 : currentZIndex
}

function sortPositions(positions: IPositions) {
	return positions.sortBy(x => x.id)
}

export const positionsReducer: Reducer<IPositionsState, PositionAction> = combineReducers({
	all: positionsSpecificReducer,
	meta: shamuMetaReducer,
})

// Selectors
export const selectAllPositions = (state: IClientRoomState) =>
	state.positions.all

export const selectPosition = (state: IClientRoomState, id: string) =>
	selectAllPositions(state).get(id) || defaultPosition

export const selectAllPositionsAsArray = createSelector(
	selectAllPositions,
	positions => positions.toIndexedSeq().toArray(),
)

export const selectAllPositionIds = createSelector(
	selectAllPositions,
	positions => positions.keySeq(),
)

export const selectPositionsWithIds = (state: IClientRoomState, ids: string[]) => {
	return selectAllPositionsAsArray(state)
		.filter(x => ids.includes(x.id))
}

export const selectPositionExtremes = createSelector(
	selectAllPositions,
	calculateExtremes,
)

export function calculateExtremes(positions: IPositions) {
	let leftMost = 0
	let rightMost = 0
	let topMost = 0
	let bottomMost = 0

	positions.forEach(x => {
		if (x.x < leftMost) leftMost = x.x
		if (x.x + x.width > rightMost) rightMost = x.x + x.width
		if (x.y < topMost) topMost = x.y
		if (x.y + x.height > bottomMost) bottomMost = x.y + x.height
	})

	return Object.freeze({
		leftMost,
		rightMost,
		topMost,
		bottomMost,
	})
}

const selectHighestZIndexOfAllPositionsLocal = createSelector(
	(positions: IPositions) => positions,
	positions => positions.reduce(maxPositionZIndex, 0),
)

function maxPositionZIndex(highestZIndex: number, pos: IPosition) {
	return Math.max(highestZIndex, pos.zIndex)
}

export const selectHighestZIndexOfAllPositions = createSelector(
	selectAllPositions,
	selectHighestZIndexOfAllPositionsLocal,
)
import {Map, Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ConnectionNodeType} from '../common-types'
import {BROADCASTER_ACTION, getConnectionNodeInfo, IClientRoomState, IConnection, SERVER_ACTION} from './index'

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

export const UPDATE_POSITION = 'UPDATE_POSITION'
export type UpdatePositionAction = ReturnType<typeof updatePosition>
export const updatePosition = (id: string, position: Partial<IPosition>) => ({
	type: UPDATE_POSITION as typeof UPDATE_POSITION,
	id,
	position,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export interface IPositionsState {
	all: IPositions
	meta: IPositionsMetaState
}

export type IPositionsMetaState = ReturnType<typeof makePositionsMetaRecord>

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
}

const defaultPositionsMeta = Object.freeze({
	lastTouchedId: '-1',
})

const makePositionRecord = Record(defaultPosition)

const makePositionsMetaRecord = Record(defaultPositionsMeta)

export const makePosition = (
	position: Pick<IPosition, 'id' | 'targetType'> & Partial<IPosition>,
): Readonly<IPosition> => {
	return makePositionRecord({
		...position,
		width: position.width === undefined ? getConnectionNodeInfo(position.targetType).width : position.width,
		height: position.height === undefined ? getConnectionNodeInfo(position.targetType).height : position.height,
	}).toJS()
}

export type IPositionAction = AddPositionAction | DeletePositionsAction
	| DeleteAllPositionsAction | UpdatePositionsAction | UpdatePositionAction

// Reducers
const positionsSpecificReducer: Reducer<IPositions, IPositionAction> =
	(positions = Positions(), action) => {
		switch (action.type) {
			case ADD_POSITION: return sortPositions(positions.set(action.position.id, action.position))
			case DELETE_POSITIONS: return sortPositions(positions.deleteAll(action.positionIds))
			case DELETE_ALL_POSITIONS: return positions.clear()
			case UPDATE_POSITIONS: return sortPositions(positions.merge(action.positions))
			case UPDATE_POSITION: return positions.update(action.id, x => ({...x, ...action.position}))
			default: return positions
		}
	}

function sortPositions(positions: IPositions) {
	return positions.sortBy(x => x.id)
}

const metaReducer: Reducer<IPositionsMetaState, IPositionAction> =
	(meta = makePositionsMetaRecord(), action) => {
		switch (action.type) {
			case UPDATE_POSITION: return meta.set('lastTouchedId', action.id)
			default: return meta
		}
	}

export const positionsReducer: Reducer<IPositionsState, IPositionAction> = combineReducers({
	all: positionsSpecificReducer,
	meta: metaReducer,
})

// Selectors
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

export const selectPositionsMeta = (roomState: IClientRoomState) => roomState.positions.meta

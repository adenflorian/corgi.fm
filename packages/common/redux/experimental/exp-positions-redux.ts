import {Map, Record} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {CssColor} from '../../shamu-color'
import {shamuMetaReducer} from '../shamu-graph'
import {IClientAppState} from '../common-redux-types'
import {
	BROADCASTER_ACTION, IClientRoomState, SERVER_ACTION, ExpNodeType,
} from '..'

export const expPositionActions = {
	resizePosition: (
		id: Id, position: Pick<ExpPosition, 'x' | 'y' | 'width' | 'height'>,
	) => ({
		type: 'EXP_RESIZE_POSITION',
		id,
		position,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	add: (position: ExpPosition) => ({
		type: 'EXP_ADD_POSITION' as const,
		position,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (positionIds: Id[]) => ({
		type: 'EXP_DELETE_POSITIONS' as const,
		positionIds,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	deleteAll: () => ({
		type: 'EXP_DELETE_ALL_POSITIONS' as const,
	} as const),
	updateAll: (positions: ExpPositions) => ({
		type: 'EXP_UPDATE_POSITIONS' as const,
		positions,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	replaceAll: (positions: ExpPositions) => ({
		type: 'EXP_REPLACE_POSITIONS' as const,
		positions,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	update: (id: Id, position: Partial<ExpPosition>) => ({
		type: 'EXP_UPDATE_POSITION' as const,
		id,
		position,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	move: (id: Id, position: Pick<ExpPosition, 'x' | 'y'>) => ({
		type: 'EXP_MOVE_POSITION' as const,
		id,
		position,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	clicked: (id: Id) => ({
		type: 'EXP_NODE_CLICKED' as const,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export interface ExpPositionsState {
	all: ExpPositions
	meta: ReturnType<typeof shamuMetaReducer>
}

export type ExpPositions = Map<Id, ExpPosition>

export const defaultExpPosition = Object.freeze({
	id: '-1' as Id,
	ownerId: '-1' as Id,
	width: 300,
	height: 220,
	x: Math.random() * 1600 - 800,
	y: Math.random() * 1000 - 500,
	zIndex: 0,
	enabled: true,
	color: CssColor.blue,
	targetType: 'dummy' as ExpNodeType,
})

const makeExpPositionRecord = Record(defaultExpPosition)

const defaultExpPositionRecord = makeExpPositionRecord()

export function makeExpPosition(position: Pick<typeof defaultExpPosition, 'id' | 'ownerId'> & Partial<typeof defaultExpPosition>): ExpPosition {
	return makeExpPositionRecord(position)
}

export interface ExpPosition extends ReturnType<typeof makeExpPositionRecord> {}

export type ExpPositionRaw = typeof defaultExpPosition

export type ExpPositionAction = ActionType<typeof expPositionActions>

// Reducers
const positionsSpecificReducer: Reducer<ExpPositions, ExpPositionAction> =
	(positions = Map(), action) => {
		switch (action.type) {
			case 'EXP_ADD_POSITION': return sortPositions(positions.set(
				action.position.id,
				makeExpPosition(action.position).set('zIndex', getNewZIndex(positions, 0)),
			))
			case 'EXP_DELETE_POSITIONS': return sortPositions(positions.deleteAll(action.positionIds))
			case 'EXP_DELETE_ALL_POSITIONS': return positions.clear()
			case 'EXP_REPLACE_POSITIONS': return sortPositions(Map<string, ExpPosition>().merge(action.positions).map(x => makeExpPosition(x)))
			case 'EXP_UPDATE_POSITIONS': return sortPositions(positions.merge(action.positions).map(x => makeExpPosition(x)))
			case 'EXP_UPDATE_POSITION': return positions.update(action.id, x => x.merge(action.position))
			case 'EXP_MOVE_POSITION': return positions.update(action.id, x => x.merge(action.position))
			case 'EXP_RESIZE_POSITION': return positions.update(action.id, x => x.merge(action.position))
			case 'EXP_NODE_CLICKED': return positions.update(action.id, x => x.set('zIndex', getNewZIndex(positions, x.zIndex)))
			default: return positions
		}
	}

function getNewZIndex(positions: ExpPositions, currentZIndex: number) {
	const highest = selectExpHighestZIndexOfAllPositionsLocal(positions)
	if (currentZIndex === 0) return highest + 1
	return currentZIndex < highest ? highest + 1 : currentZIndex
}

function sortPositions(positions: ExpPositions) {
	return positions.sortBy(x => x.id)
}

export const expPositionsReducer: Reducer<ExpPositionsState, ExpPositionAction> = combineReducers({
	all: positionsSpecificReducer,
	meta: shamuMetaReducer,
})

// Selectors
export const selectExpAllPositions = (state: IClientRoomState) =>
	state.expPositions.all

export const selectExpPosition = (state: IClientRoomState, id: Id) =>
	selectExpAllPositions(state).get(id) || defaultExpPositionRecord

export const selectExpPositionsByOwner = (state: IClientRoomState, ownerId: Id) =>
	selectExpAllPositions(state).filter(x => x.ownerId === ownerId)

export const selectExpAllPositionsAsArray = createSelector(
	selectExpAllPositions,
	positions => positions.toIndexedSeq().toArray(),
)

export const selectExpPositionsWithIds = (state: IClientRoomState, ids: Id[]) => {
	return selectExpAllPositionsAsArray(state)
		.filter(x => ids.includes(x.id))
}

export const selectExpPositionExtremes = createSelector(
	selectExpAllPositions,
	calculateExpExtremes,
)

export function calculateExpExtremes(positions: ExpPositions) {
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

	return {
		leftMost,
		rightMost,
		topMost,
		bottomMost,
	} as const
}

const selectExpHighestZIndexOfAllPositionsLocal = createSelector(
	(positions: ExpPositions) => positions,
	positions => positions.reduce(maxPositionZIndex, 0),
)

function maxPositionZIndex(highestZIndex: number, pos: ExpPosition) {
	return Math.max(highestZIndex, pos.zIndex)
}

export const selectExpHighestZIndexOfAllPositions = createSelector(
	selectExpAllPositions,
	selectExpHighestZIndexOfAllPositionsLocal,
)

export const createExpPositionSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id)

export const createExpPositionColorSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).color

export const createExpPositionXSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).x

export const createExpPositionYSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).y

export const createExpPositionWidthSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).width

export const createExpPositionHeightSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).height

export const createExpPositionSelectedSelector = (id: Id) => (state: IClientAppState) =>
	state.room.positions.meta.selectedNodes.includes(id)

export const createExpPositionEnabledSelector = (id: Id) => (state: IClientAppState) =>
	selectExpPosition(state.room, id).enabled

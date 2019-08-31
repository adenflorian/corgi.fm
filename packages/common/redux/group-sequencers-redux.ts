import {List} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, IConnectable} from '../common-types'
import {CssColor} from '../shamu-color'
import {
	addMultiThing, BROADCASTER_ACTION, findNodeInfo,
	IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType,
	NodeSpecialState, SERVER_ACTION,
} from '.'

import uuid = require('uuid')

export const addGroupSequencer = (groupSequencer: GroupSequencer) =>
	addMultiThing(groupSequencer, ConnectionNodeType.groupSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const groupSequencerActions = {
	setEnabled: (id: Id, port: number, index: number, enabled: boolean) => ({
		type: 'GROUP_SEQ_SET_ENABLED',
		id,
		port,
		index,
		enabled,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
}

export interface GroupSequencersState extends IMultiState {
	things: GroupSequencers
}

export interface GroupSequencers {
	[key: string]: GroupSequencer
}

export class GroupSequencer implements IConnectable, NodeSpecialState {
	public static dummy: GroupSequencer = {
		id: 'dummy',
		type: ConnectionNodeType.groupSequencer,
		groups: makeGroups([CssColor.red, CssColor.green], 2, 4),
		length: 2,
		groupEventBeatLength: 1,
		outputPortCount: 2,
		zoom: {x: 1, y: 1},
		pan: {x: 0, y: 0},
	}

	public readonly id = uuid.v4()
	public readonly type = ConnectionNodeType.groupSequencer
	public readonly groups: Groups
	public readonly length: number = 16
	public readonly groupEventBeatLength: number = 16
	public readonly outputPortCount: number
	public readonly zoom: Point = {x: 1, y: 1}
	public readonly pan: Point = {x: 0, y: 0}

	public constructor() {
		this.groups = makeGroups([CssColor.red, CssColor.green, CssColor.blue], this.length, this.groupEventBeatLength)
		this.outputPortCount = this.groups.count()
		// TODO
		// this.color = this.groups.map(x => x.color).toList()
	}
}

export function deserializeGroupSequencerState(state: IConnectable): IConnectable {
	const x = state as GroupSequencer
	const y: GroupSequencer = {
		...(new GroupSequencer()),
		...x,
		groups: List<Group>(x.groups)
			.map(group => ({
				...group,
				events: List(group.events),
			})),
		// color: List(x.color),
		// notesDisplayStartX: 0,
		// notesDisplayWidth: GroupSequencer.defaultWidth,
	}
	return y
}

export function makeGroups(colors: string[], length: number, eventLength: number): Groups {
	return List<Group>(
		colors.map((color, i) => ({
			color,
			events: makeGroupEvents(length, i, eventLength),
		})),
	)
}

export function makeGroupEvents(count: number, mod: number, eventLength: number): GroupEvents {
	return List<GroupEvent>(new Array(count)
		.fill(0)
		.map((_, i) => ({
			on: i % (mod + 2) === 0,
			startBeat: i * eventLength,
			length: eventLength,
		})))
}

export type Groups = List<Group>

export interface Group {
	color: string
	events: GroupEvents
}

export type GroupEvents = List<GroupEvent>

export interface GroupEvent {
	on: boolean
	startBeat: number
	length: number
}

export type GroupSequencerAction = ActionType<typeof groupSequencerActions>

type GroupSequencerActionTypes = {
	[key in GroupSequencerAction['type']]: 0
}

const groupSequencerActionTypes2: GroupSequencerActionTypes = {
	GROUP_SEQ_SET_ENABLED: 0,
}

const groupSequencerActionTypes = Object.keys(groupSequencerActionTypes2)

export const groupSequencersReducer = makeMultiReducer<GroupSequencer, GroupSequencersState>(
	groupSequencerReducer,
	ConnectionNodeType.groupSequencer,
	groupSequencerActionTypes,
)

function groupSequencerReducer(groupSequencer: GroupSequencer, action: GroupSequencerAction): GroupSequencer {
	switch (action.type) {
		case 'GROUP_SEQ_SET_ENABLED': return {
			...groupSequencer,
			groups: groupsReducer(groupSequencer.groups, action),
		}
		default: return groupSequencer
	}
}

function groupsReducer(groups: Groups, action: GroupSequencerAction): Groups {
	switch (action.type) {
		case 'GROUP_SEQ_SET_ENABLED': return groups.update(action.port, x => groupReducer(x, action))
		default: return groups
	}
}

function groupReducer(group: Group, action: GroupSequencerAction): Group {
	switch (action.type) {
		case 'GROUP_SEQ_SET_ENABLED': return {
			...group,
			events: group.events.update(action.index, x => eventReducer(x, action)),
		}
		default: return group
	}
}

function eventReducer(event: GroupEvent, action: GroupSequencerAction): GroupEvent {
	switch (action.type) {
		case 'GROUP_SEQ_SET_ENABLED': return {
			...event,
			on: action.enabled,
		}
		default: return event
	}
}

export const selectAllGroupSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.groupSequencers.things

export const selectGroupSequencer = (state: IClientRoomState, id: Id): GroupSequencer =>
	selectAllGroupSequencers(state)[id as string] || GroupSequencer.dummy

import {List} from 'immutable'
import {ActionType} from 'typesafe-actions'
import uuid = require('uuid')
import {ConnectionNodeType, IConnectable, Id, IMultiStateThing} from '../common-types'
import {CssColor} from '../shamu-color'
import {
	addMultiThing, BROADCASTER_ACTION, getConnectionNodeInfo,
	IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType,
	NodeSpecialState, SERVER_ACTION,
} from './index'

export const GROUP_SEQ_SET_ENABLED = 'GROUP_SEQ_SET_ENABLED'

export const addGroupSequencer = (groupSequencer: GroupSequencer) =>
	addMultiThing(groupSequencer, ConnectionNodeType.groupSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const groupSequencerActions = Object.freeze({
	setEnabled: (id: Id, port: number, index: number, enabled: boolean) => ({
		type: GROUP_SEQ_SET_ENABLED as typeof GROUP_SEQ_SET_ENABLED,
		id,
		port,
		index,
		enabled,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
})

export interface GroupSequencersState extends IMultiState {
	things: GroupSequencers
}

export interface GroupSequencers {
	[key: string]: GroupSequencer
}

export class GroupSequencer implements IConnectable, NodeSpecialState, IMultiStateThing {
	public static defaultWidth = 800
	public static defaultHeight = 200

	public static dummy: GroupSequencer = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		color: List([CssColor.defaultGray]),
		type: ConnectionNodeType.groupSequencer,
		width: GroupSequencer.defaultWidth,
		height: GroupSequencer.defaultHeight,
		name: 'Dummy Group Sequencer',
		groups: makeGroups([CssColor.red, CssColor.green], 2, 4),
		length: 2,
		groupEventBeatLength: 1,
		outputPortCount: 2,
		notesDisplayStartX: 0,
		notesDisplayWidth: GroupSequencer.defaultWidth,
	}

	public readonly id = uuid.v4()
	public readonly color: List<string>
	public readonly type = ConnectionNodeType.groupSequencer
	public readonly width = GroupSequencer.defaultWidth
	public readonly height = GroupSequencer.defaultHeight
	public readonly name: string = getConnectionNodeInfo(ConnectionNodeType.groupSequencer).typeName
	public readonly groups: Groups
	public readonly length: number = 16
	public readonly groupEventBeatLength: number = 16
	public readonly outputPortCount: number
	public readonly notesDisplayStartX = 0
	public readonly notesDisplayWidth: number

	constructor(
		public readonly ownerId: string,
	) {
		this.groups = makeGroups([CssColor.red, CssColor.green, CssColor.blue], this.length, this.groupEventBeatLength)
		this.outputPortCount = this.groups.count()
		this.color = this.groups.map(x => x.color).toList()
		this.notesDisplayWidth = GroupSequencer.defaultWidth
	}
}

export function deserializeGroupSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as GroupSequencer
	const y = {
		...(new GroupSequencer(x.ownerId)),
		...x,
		groups: List<Group>(x.groups)
			.map(group => ({
				...group,
				events: List(group.events),
			})),
		color: List(x.color),
		width: Math.max(x.width, GroupSequencer.defaultWidth),
		height: Math.max(x.height, GroupSequencer.defaultHeight),
		notesDisplayStartX: 0,
		notesDisplayWidth: GroupSequencer.defaultWidth,
	} as GroupSequencer
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
	startBeat: number,
	length: number,
}

export type GroupSequencerAction = ActionType<typeof groupSequencerActions>

const groupSequencerActionTypes: string[] = [
	GROUP_SEQ_SET_ENABLED,
]

export const groupSequencersReducer = makeMultiReducer<GroupSequencer, GroupSequencersState>(
	groupSequencerReducer,
	ConnectionNodeType.groupSequencer,
	groupSequencerActionTypes,
)

function groupSequencerReducer(groupSequencer: GroupSequencer, action: GroupSequencerAction): GroupSequencer {
	switch (action.type) {
		case GROUP_SEQ_SET_ENABLED: return {
			...groupSequencer,
			groups: groupsReducer(groupSequencer.groups, action),
		}
		default: return groupSequencer
	}
}

function groupsReducer(groups: Groups, action: GroupSequencerAction): Groups {
	switch (action.type) {
		case GROUP_SEQ_SET_ENABLED: return groups.update(action.port, x => groupReducer(x, action))
		default: return groups
	}
}

function groupReducer(group: Group, action: GroupSequencerAction): Group {
	switch (action.type) {
		case GROUP_SEQ_SET_ENABLED: return {
			...group,
			events: group.events.update(action.index, x => eventReducer(x, action)),
		}
		default: return group
	}
}

function eventReducer(event: GroupEvent, action: GroupSequencerAction): GroupEvent {
	switch (action.type) {
		case GROUP_SEQ_SET_ENABLED: return {
			...event,
			on: action.enabled,
		}
		default: return event
	}
}

export const selectAllGroupSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.groupSequencers.things

export const selectGroupSequencer = (state: IClientRoomState, id: string) =>
	selectAllGroupSequencers(state)[id] || GroupSequencer.dummy

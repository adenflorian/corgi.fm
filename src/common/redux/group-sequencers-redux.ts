import {List, Map, OrderedMap} from 'immutable'
import {AnyAction} from 'redux'
import uuid = require('uuid')
import {ConnectionNodeType, IConnectable, Id, IMultiStateThing} from '../common-types'
import {CssColor} from '../shamu-color'
import {
	addMultiThing, getConnectionNodeInfo, IClientRoomState,
	IMultiState, makeMultiReducer, NetworkActionType, NodeSpecialState,
} from './index'

export const addGroupSequencer = (groupSequencer: GroupSequencer) =>
	addMultiThing(groupSequencer, ConnectionNodeType.groupSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const groupSequencerActions = Object.freeze({
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
		color: CssColor.defaultGray,
		type: ConnectionNodeType.groupSequencer,
		width: GroupSequencer.defaultWidth,
		height: GroupSequencer.defaultHeight,
		name: 'Dummy Group Sequencer',
		groups: makeGroups([CssColor.red, CssColor.green], 2),
		length: 2,
		groupEventBeatLength: 1,
	}

	public readonly id = uuid.v4()
	public readonly color: string = CssColor.green
	public readonly type = ConnectionNodeType.groupSequencer
	public readonly width = GroupSequencer.defaultWidth
	public readonly height = GroupSequencer.defaultHeight
	public readonly name: string = getConnectionNodeInfo(ConnectionNodeType.groupSequencer).typeName
	public readonly groups: Groups
	public readonly length: number = 16
	public readonly groupEventBeatLength: number = 16

	constructor(
		public readonly ownerId: string,
	) {
		this.groups = makeGroups([CssColor.red, CssColor.green, CssColor.blue], this.length)
	}
}

export function deserializeGroupSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as GroupSequencer
	const y = {
		...x,
		groups: OrderedMap<Id, Group>(x.groups),
	} as GroupSequencer
	return y
}

export function makeGroups(colors: string[], length: number): Groups {
	return OrderedMap<Id, Group>(
		colors.map((color, i) => ([
			uuid.v4(),
			{
				color,
				events: makeGroupEvents(length, i),
			},
		])) as unknown as Iterable<[string, Group]>,
	)
}

export function makeGroupEvents(count: number, mod: number): GroupEvents {
	return List<GroupEvent>(new Array(count)
		.fill(0)
		.map((_, i) => ({on: i % (mod + 2) === 0})))
}

export type Groups = OrderedMap<Id, Group>

export interface Group {
	color: string
	events: GroupEvents
}

export type GroupEvents = List<GroupEvent>

export interface GroupEvent {
	on: boolean
}

export type GroupSequencerAction = AnyAction

const groupSequencerActionTypes: string[] = [
]

export const groupSequencersReducer = makeMultiReducer<GroupSequencer, GroupSequencersState>(
	groupSequencerReducer,
	ConnectionNodeType.groupSequencer,
	groupSequencerActionTypes,
)

function groupSequencerReducer(groupSequencer: GroupSequencer, action: AnyAction) {
	switch (action.type) {
		default:
			return groupSequencer
	}
}

export const selectAllGroupSequencers = (state: IClientRoomState) => state.shamuGraph.nodes.groupSequencers.things

export const selectGroupSequencer = (state: IClientRoomState, id: string) =>
	selectAllGroupSequencers(state)[id] || GroupSequencer.dummy

import {AnyAction} from 'redux'
import uuid = require('uuid')
import {ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {CssColor} from '../shamu-color'
import {IClientRoomState} from './common-redux-types'
import {addMultiThing, IMultiState, makeMultiReducer} from './multi-reducer'
import {NetworkActionType} from './redux-utils'
import {NodeSpecialState} from './shamu-graph'

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
	}

	public readonly id = uuid.v4()
	public readonly color: string = CssColor.green
	public readonly type = ConnectionNodeType.groupSequencer
	public readonly width = GroupSequencer.defaultWidth
	public readonly height = GroupSequencer.defaultHeight
	public readonly name: string = 'group seq'

	constructor(
		public readonly ownerId: string,
	) {}
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

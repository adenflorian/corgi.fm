import {Map, Record} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {topGroupId} from '../common-constants'
import {IClientAppState} from './common-redux-types'
import {IClientRoomState} from '.'

export const roomMemberActions = {
	// Actions only to be sent from server
	replaceAll: (members: RoomMembers) => ({
		type: 'ROOM_MEMBERS_REPLACE_ALL' as const,
		members,
	} as const),
	add: (member: RoomMember) => ({
		type: 'ADD_ROOM_MEMBER' as const,
		member,
	} as const),
	delete: (memberId: ClientId) => ({
		type: 'DELETE_ROOM_MEMBER' as const,
		memberId,
	} as const),
	// Actions that can be sent by client
	setNodeGroup: (memberId: ClientId, nodeGroupId: Id) => ({
		type: 'ROOM_MEMBERS_SET_NODE_GROUP' as const,
		memberId,
		nodeGroupId,
	} as const),
} as const

export type RoomMembersAction = ActionType<typeof roomMemberActions>

export type RoomMembers = Map<ClientId, RoomMember>

const defaultRoomMember = {
	id: 'dummyRoomMemberId' as Id,
	groupNodeId: topGroupId as Id | typeof topGroupId,
}

const _makeRoomMember = Record(defaultRoomMember)

const defaultRoomMemberRecord = _makeRoomMember()

export interface RoomMember extends ReturnType<typeof _makeRoomMember> {}

export function makeRoomMember(
	member: Pick<typeof defaultRoomMember, 'id'> & Partial<typeof defaultRoomMember>,
): RoomMember {
	return _makeRoomMember(member)
}

const initialState = Map<ClientId, RoomMember>()

export const roomMembersReducer = (state = initialState, action: RoomMembersAction) => {
	switch (action.type) {
		case 'ROOM_MEMBERS_REPLACE_ALL': return Map(action.members).map(makeRoomMember)
		case 'ADD_ROOM_MEMBER': return state.set(action.member.id, makeRoomMember(action.member))
		case 'DELETE_ROOM_MEMBER': return state.delete(action.memberId)
		case 'ROOM_MEMBERS_SET_NODE_GROUP': return state.update(action.memberId, member => member.set('groupNodeId', action.nodeGroupId))
		default: return state
	}
}

export const selectRoomMemberState = (state: IClientRoomState) => state.members

export const selectAllRoomMemberIds = (state: IClientRoomState) => selectRoomMemberState(state).keySeq().toSet()

export const selectMemberCount = (state: IClientRoomState): number => selectAllRoomMemberIds(state).count()

export const selectRoomMember = (state: IClientRoomState, id: ClientId): RoomMember =>
	state.members.get(id, defaultRoomMemberRecord)

export function createRoomMemberSelector(id: ClientId) {
	return (state: IClientAppState): RoomMember => selectRoomMember(state.room, id)
}

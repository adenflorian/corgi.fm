import {List} from 'immutable'
import {ClientId} from '../common-types'
import {IClientRoomState} from './common-redux-types'
import {createReducer} from './redux-utils'

export interface IRoomMembersState {
	ids: IRoomMembersIds,
	// owner: ClientId
}

export type IRoomMembersIds = List<ClientId>

export const SET_ROOM_MEMBERS = 'SET_ROOM_MEMBERS'
export type SetRoomMembersAction = ReturnType<typeof setRoomMembers>
export const setRoomMembers = (memberIds: IRoomMembersIds) => ({
	type: SET_ROOM_MEMBERS,
	memberIds,
})

export const ADD_ROOM_MEMBER = 'ADD_ROOM_MEMBER'
export type AddRoomMemberAction = ReturnType<typeof addRoomMember>
export const addRoomMember = (memberId: ClientId) => ({
	type: ADD_ROOM_MEMBER,
	memberId,
})

export const DELETE_ROOM_MEMBER = 'DELETE_ROOM_MEMBER'
export type DeleteRoomMemberAction = ReturnType<typeof deleteRoomMember>
export const deleteRoomMember = (memberId: ClientId) => ({
	type: DELETE_ROOM_MEMBER,
	memberId,
})

const initialState: IRoomMembersState = {
	ids: List<ClientId>(),
}

export const roomMembersReducer = createReducer(initialState, {
	[SET_ROOM_MEMBERS]: (_, {memberIds}: SetRoomMembersAction) => ({
		...StaticRange,
		ids: List<ClientId>(memberIds),
	}),
	[ADD_ROOM_MEMBER]: (state, {memberId}: AddRoomMemberAction) => ({
		...state,
		ids: state.ids.push(memberId),
	}),
	[DELETE_ROOM_MEMBER]: (state, {memberId}: AddRoomMemberAction) => ({
		...state,
		ids: state.ids.filter(x => x !== memberId),
	}),
})

export const selectRoomMemberState = (state: IClientRoomState): IRoomMembersState => state.members

export const selectAllRoomMemberIds = (state: IClientRoomState): IRoomMembersIds => selectRoomMemberState(state).ids

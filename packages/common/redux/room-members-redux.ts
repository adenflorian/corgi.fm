import {List} from 'immutable'
import {createSelector} from 'reselect'
import {createReducer, IClientRoomState, selectLocalClientId} from '.'

export interface IRoomMembersState {
	ids: IRoomMembersIds
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
	[SET_ROOM_MEMBERS]: (state, {memberIds}: SetRoomMembersAction) => ({
		...state,
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

export const selectAllOtherRoomMemberIds = createSelector(
	selectLocalClientId,
	state => selectAllRoomMemberIds(state.room),
	(localClientId, allClientIds) =>
		allClientIds.filter(x => x !== 'server' && x !== localClientId),
)

export const selectMemberCount = (state: IClientRoomState): number => selectAllRoomMemberIds(state).count()

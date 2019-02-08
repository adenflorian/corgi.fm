import {AnyAction} from 'redux'
import {IAudioState, IBasicSamplersState, IBasicSynthesizersState, IChatState, IClientsState, IConnectionsState, IGlobalClockState, IGridSequencersState, IInfiniteSequencersState, IOptionsState, IPositionsState, IRoomMembersState, IRoomsState, IVirtualKeyboardsState, IWebsocketState, UserInputState} from './index'
import {BROADCASTER_ACTION} from './redux-utils'

export interface IClientAppState {
	audio: IAudioState
	clients: IClientsState
	options: IOptionsState
	rooms: IRoomsState
	websocket: IWebsocketState
	room: IClientRoomState
	userInput: UserInputState
}

export interface IClientRoomState {
	basicSynthesizers: IBasicSynthesizersState
	basicSamplers: IBasicSamplersState
	chat: IChatState
	connections: IConnectionsState
	globalClock: IGlobalClockState
	gridSequencers: IGridSequencersState
	infiniteSequencers: IInfiniteSequencersState
	members: IRoomMembersState
	positions: IPositionsState
	virtualKeyboards: IVirtualKeyboardsState
}

export interface BroadcastAction extends AnyAction {
	alreadyBroadcasted: boolean
	[BROADCASTER_ACTION]: any
}

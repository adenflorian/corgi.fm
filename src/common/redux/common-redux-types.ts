import {IAudioState} from './audio-redux'
import {IBasicInstrumentsState} from './basic-instruments-redux'
import {IBasicSamplersState} from './basic-sampler-redux'
import {IChatState} from './chat-redux'
import {IClientsState} from './clients-redux'
import {IConnectionsState} from './connections-redux'
import {IOptionsState} from './options-redux'
import {IRoomMembersState} from './room-members-redux'
import {IRoomsState} from './rooms-redux'
import {ITracksState} from './tracks-redux'
import {IVirtualKeyboardsState} from './virtual-keyboard-redux'
import {IWebsocketState} from './websocket-redux'

export interface IClientAppState {
	audio: IAudioState
	clients: IClientsState
	options: IOptionsState
	rooms: IRoomsState
	websocket: IWebsocketState
	room: IClientRoomState
}

export interface IClientRoomState {
	basicInstruments: IBasicInstrumentsState
	basicSamplers: IBasicSamplersState
	chat: IChatState
	connections: IConnectionsState
	members: IRoomMembersState
	tracks: ITracksState
	virtualKeyboards: IVirtualKeyboardsState
}

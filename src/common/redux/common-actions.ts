import {BROADCASTER_ACTION, SERVER_ACTION} from './index'

export const SELF_DISCONNECTED = 'SELF_DISCONNECTED'
export const selfDisconnected = () => ({type: SELF_DISCONNECTED})

export const PLAY_ALL = 'PLAY_ALL'
export type PlayAllAction = ReturnType<typeof playAll>
export const playAll = () => ({
	type: PLAY_ALL as typeof PLAY_ALL,
	BROADCASTER_ACTION,
	SERVER_ACTION,
})

export const STOP_ALL = 'STOP_ALL'
export type StopAllAction = ReturnType<typeof stopAll>
export const stopAll = () => ({
	type: STOP_ALL as typeof STOP_ALL,
	BROADCASTER_ACTION,
	SERVER_ACTION,
})

export const READY = 'READY'
export type ReadyAction = ReturnType<typeof ready>
export const ready = () => ({
	type: READY as typeof READY,
})

import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const CLEAR_SEQUENCER = 'CLEAR_SEQUENCER'
export type ClearSequencerAction = ReturnType<typeof clearSequencer>
export const clearSequencer = (id: string) => ({
	type: CLEAR_SEQUENCER as typeof CLEAR_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UNDO_SEQUENCER = 'UNDO_SEQUENCER'
export type UndoSequencerAction = ReturnType<typeof undoSequencer>
export const undoSequencer = (id: string) => ({
	type: UNDO_SEQUENCER as typeof UNDO_SEQUENCER,
	id,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const createSequencerEvents = (indexCount: number) => {
	return new Array(indexCount)
		.fill({notes: []})
}

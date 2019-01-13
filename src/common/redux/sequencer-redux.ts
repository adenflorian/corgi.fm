export const CLEAR_SEQUENCER = 'CLEAR_SEQUENCER'
export type ClearSequencerAction = ReturnType<typeof clearSequencer>
export const clearSequencer = (id: string) => ({
	type: CLEAR_SEQUENCER as typeof CLEAR_SEQUENCER,
	id,
})

export const createSequencerEvents = (indexCount: number) => {
	return new Array(indexCount)
		.fill({notes: []})
}

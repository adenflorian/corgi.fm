export const NOTE_PRESSED = 'NOTE_PRESSED'
export const NOTE_UP = 'NOTE_UP'

export const notePressed = (note: string) => {
	return {
		type: NOTE_PRESSED,
		note,
	}
}

export function notesReducer(state = {}, action) {
	switch (action.type) {
		case NOTE_PRESSED:
			return {...state, [action.note]: true}
		case NOTE_UP:
			return {...state, [action.note]: false}
		default:
			return state
	}
}

export function selectPressedNotes(notes) {
	return Object.keys(notes).filter(key => notes[key] === true)
}

export function notesReducer(state = {}, action) {
    switch (action.type) {
        case 'NOTE_PRESSED':
            return {...state, [action.note]: true}
        case 'NOTE_UP':
            return {...state, [action.note]: false}
        default:
            return state
    }
}

export function selectPressedNotes(notes) {
    return Object.keys(notes).filter(key => notes[key] === true)
}

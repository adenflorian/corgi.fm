import {notesReducer} from './notes-redux.js';

export const rootReducer = Redux.combineReducers({
    otherClients: otherClientsReducer,
    keys: keysReducer,
    notes: notesReducer,
})

function otherClientsReducer(state = [], action) {
    switch (action.type) {
        case 'SET_CLIENTS':
            return action.clients
        default:
            return state
    }
}

function keysReducer(state = {}, action) {
    switch (action.type) {
        case 'KEY_DOWN':
            return {...state, [action.key]: true}
        case 'KEY_UP':
            return {...state, [action.key]: false}
        default:
            return state
    }
}

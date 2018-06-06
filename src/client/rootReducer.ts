export const rootReducer = Redux.combineReducers({
    otherClients: otherClientsReducer
})

function otherClientsReducer(state = {}, action) {
    switch (action.type) {
        case 'SET_CLIENTS':
            return action.clients
        default:
            return state
    }
}

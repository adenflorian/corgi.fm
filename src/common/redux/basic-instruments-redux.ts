import {AnyAction} from 'redux'
import uuidv4 from 'uuid/v4'
import {ClientId} from '../../client/websocket-listeners'
import {IAppState} from './configureStore'
import {makeActionCreator} from './redux-utils'

export const CREATE_BASIC_INSTRUMENT = 'CREATE_BASIC_INSTRUMENT'
export const createBasicInstrument = makeActionCreator(CREATE_BASIC_INSTRUMENT, 'ownerId')

export interface IBasicInstrumentsState {
	instruments: IBasicInstrumentState[]
}

export interface IBasicInstrumentState {
	oscillatorType: OscillatorType
	id: string
	ownerId: ClientId
}

const basicInstrumentsInitialState: IBasicInstrumentsState = {
	instruments: [],
}

export function basicInstrumentsReducer(state = basicInstrumentsInitialState, action: AnyAction) {
	switch (action.type) {
		case CREATE_BASIC_INSTRUMENT:
			return {
				...state,
				instruments: [...state.instruments, new BasicInstrumentState(action.ownerId)],
			}
		case 'other action type thing here':
			return {
				...state,
				instruments: state.instruments.map(instrument => basicInstrumentReducer(instrument, action)),
			}
		default:
			return state
	}
}

class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: OscillatorType = 'sine'
	public id = uuidv4()
	public ownerId

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function basicInstrumentReducer(state = {}, _action: AnyAction) {
	return state
}

export function selectInstrumentByOwner(state: IAppState, ownerId: ClientId) {
	return state.basicInstruments.instruments.find(x => x.ownerId === ownerId)
}

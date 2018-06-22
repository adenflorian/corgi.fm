import {AnyAction} from 'redux'
import uuidv4 from 'uuid/v4'
import {ClientId} from '../../client/websocket-listeners'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'

export const CREATE_BASIC_INSTRUMENT = 'CREATE_BASIC_INSTRUMENT'
export const createBasicInstrument = makeActionCreator(CREATE_BASIC_INSTRUMENT, 'ownerId')

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicInstrumentOscillatorType = makeServerAction(makeBroadcaster(makeActionCreator(
	SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE, 'ownerId', 'oscillatorType',
)))

export const UPDATE_BASIC_INSTRUMENTS = 'UPDATE_BASIC_INSTRUMENTS'
export const updateBasicInstruments = makeBroadcaster(makeActionCreator(
	UPDATE_BASIC_INSTRUMENTS, 'instruments',
))

export interface IBasicInstrumentsState {
	instruments: IBasicInstrumentState[]
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
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
			return {
				...state,
				instruments: state.instruments.map(instrument => basicInstrumentReducer(instrument, action)),
			}
		case UPDATE_BASIC_INSTRUMENTS:
			return {
				...state,
				instruments: state.instruments.map(stateInstrument => {
					return {
						...stateInstrument,
						...(action.instruments.find(actionInstrument => actionInstrument.ownerId === stateInstrument.ownerId) || {}),
					}
				}),
			}
		default:
			return state
	}
}

export interface IBasicInstrumentState {
	oscillatorType: OscillatorType
	id: string
	ownerId: ClientId
}

class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: OscillatorType = 'sine'
	public id = uuidv4()
	public ownerId

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

function basicInstrumentReducer(instrument: IBasicInstrumentState, action: AnyAction) {
	if (instrument.ownerId !== action.ownerId) return instrument

	switch (action.type) {
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
			return {
				...instrument,
				oscillatorType: action.oscillatorType,
			}
		default:
			return instrument
	}
}

export function selectAllInstruments(state: IAppState) {
	return state.basicInstruments.instruments
}

export function selectInstrumentByOwner(state: IAppState, ownerId: ClientId) {
	return selectAllInstruments(state)
		.find(x => x.ownerId === ownerId)
}

import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId} from '../../client/websocket-listeners'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'

export const ADD_BASIC_INSTRUMENT = 'ADD_BASIC_INSTRUMENT'
export const addBasicInstrument = makeServerAction(makeBroadcaster((instrument: IBasicInstrumentState) => ({
	type: ADD_BASIC_INSTRUMENT,
	instrument,
})))

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicInstrumentOscillatorType = makeServerAction(makeBroadcaster(
	(id: string, oscillatorType: OscillatorType) => ({
		type: SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
		id,
		oscillatorType,
	}),
))

export const UPDATE_BASIC_INSTRUMENTS = 'UPDATE_BASIC_INSTRUMENTS'
export const updateBasicInstruments = makeBroadcaster(makeActionCreator(
	UPDATE_BASIC_INSTRUMENTS, 'instruments',
))

export interface IBasicInstrumentsState {
	instruments: {
		[key: string]: IBasicInstrumentState,
	}
}

export interface IBasicInstruments {
	[key: string]: IBasicInstrumentState
}

const basicInstrumentsInitialState: IBasicInstrumentsState = {
	instruments: {},
}

interface BasicInstrumentAction extends AnyAction {
	instrument?: IBasicInstrumentState
	instruments?: IBasicInstruments
}

export function basicInstrumentsReducer(
	state = basicInstrumentsInitialState, action: BasicInstrumentAction,
): IBasicInstrumentsState {
	switch (action.type) {
		case ADD_BASIC_INSTRUMENT:
			return {
				...state,
				instruments: {...state.instruments, [action.instrument.id]: action.instrument},
			}
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
			if (state.instruments[action.id] === undefined) {
				throw new Error('instrument dos not exist with id: ' + action.id)
			}
			return {
				...state,
				instruments: {
					...state.instruments,
					[action.id]: {
						...state.instruments[action.id],
						oscillatorType: action.oscillatorType,
					},
				},
			}
		case UPDATE_BASIC_INSTRUMENTS:
			return {
				...state,
				instruments: {
					...state.instruments,
					...action.instruments,
				},
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

export class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: OscillatorType = 'sine'
	public id = uuid.v4()
	public ownerId

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export const selectAllInstruments = (state: IAppState) => state.basicInstruments.instruments

export function selectInstrumentsByOwner(state: IAppState, ownerId: ClientId) {
	const instruments = selectAllInstruments(state)
	return Object.keys(instruments)
		.map(x => instruments[x])
		.filter(x => x.ownerId === ownerId)
}

export const selectInstrumentByOwner = (state, ownerId) => selectInstrumentsByOwner(state, ownerId)[0]

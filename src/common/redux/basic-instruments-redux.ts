import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId} from '../../client/websocket-listeners'
import {pickRandomArrayElement} from '../common-utils'
import {IAppState} from './configureStore'
import {BROADCASTER_ACTION, makeActionCreator, SERVER_ACTION} from './redux-utils'

export const ADD_BASIC_INSTRUMENT = 'ADD_BASIC_INSTRUMENT'
export const addBasicInstrument = (instrument: IBasicInstrumentState) => ({
	type: ADD_BASIC_INSTRUMENT,
	instrument,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_BASIC_INSTRUMENTS = 'DELETE_BASIC_INSTRUMENTS'
export const deleteBasicInstruments = (instrumentIds: string[]) => ({
	type: DELETE_BASIC_INSTRUMENTS,
	instrumentIds,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UPDATE_BASIC_INSTRUMENTS = 'UPDATE_BASIC_INSTRUMENTS'
export const updateBasicInstruments = (instruments: IBasicInstruments) => ({
	type: UPDATE_BASIC_INSTRUMENTS,
	instruments,
	BROADCASTER_ACTION,
})

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicInstrumentOscillatorType =
	(id: string, oscillatorType: OscillatorType) => ({
		type: SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
		id,
		oscillatorType,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export const SET_BASIC_INSTRUMENT_PARAM = 'SET_BASIC_INSTRUMENT_PARAM'
export const setBasicInstrumentParam =
	(id: string, paramName: BasicInstrumentParam, value: any) => ({
		type: SET_BASIC_INSTRUMENT_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export enum BasicInstrumentParam {
	pan = 'pan',
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
	attack = 'attack',
	release = 'release',
}

export interface BasicInstrumentAction extends AnyAction {
	instrument?: IBasicInstrumentState
	instruments?: IBasicInstruments
}

export interface IBasicInstrumentsState {
	instruments: {
		[key: string]: IBasicInstrumentState,
	}
}

export interface IBasicInstruments {
	[key: string]: IBasicInstrumentState
}

export interface IBasicInstrumentState {
	oscillatorType: OscillatorType
	id: string
	ownerId: ClientId
	pan: number
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
}

export class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: OscillatorType = pickRandomArrayElement(['sine', 'sawtooth', 'square']) as OscillatorType
	public id = uuid.v4()
	public ownerId: string
	public pan: number = Math.random() - 0.5
	public lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000
	public attack: number = 0.01
	public release: number = 1

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const basicInstrumentsInitialState: IBasicInstrumentsState = {
	instruments: {},
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
		case DELETE_BASIC_INSTRUMENTS:
			const newState = {...state, instruments: {...state.instruments}}
			action.instrumentIds.forEach(x => delete newState.instruments[x])
			return newState
		case UPDATE_BASIC_INSTRUMENTS:
			return {
				...state,
				instruments: {
					...state.instruments,
					...action.instruments,
				},
			}
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
		case SET_BASIC_INSTRUMENT_PARAM:
			return {
				...state,
				instruments: {
					...state.instruments,
					[action.id]: basicInstrumentReducer(state.instruments[action.id], action),
				},
			}
		default:
			return state
	}
}

function basicInstrumentReducer(basicInstrument: IBasicInstrumentState, action: AnyAction) {
	switch (action.type) {
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
			return {
				...basicInstrument,
				oscillatorType: action.oscillatorType,
			}
		case SET_BASIC_INSTRUMENT_PARAM:
			return {
				...basicInstrument,
				[action.paramName]: action.value,
			}
		default:
			throw new Error('invalid basicInstrument action type')
	}
}

export const selectAllInstruments = (state: IAppState) => state.basicInstruments.instruments

export const selectAllInstrumentIds = (state: IAppState) => Object.keys(selectAllInstruments(state))

export function selectInstrumentsByOwner(state: IAppState, ownerId: ClientId) {
	const instruments = selectAllInstruments(state)
	return Object.keys(instruments)
		.map(x => instruments[x])
		.filter(x => x.ownerId === ownerId)
}

export const selectInstrument = (state, id) => selectAllInstruments(state)[id]

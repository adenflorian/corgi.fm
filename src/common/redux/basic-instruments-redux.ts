import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ClientId} from '../../client/websocket-listeners'
import {pickRandomArrayElement} from '../common-utils'
import {IAppState} from './configureStore'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'

export const ADD_BASIC_INSTRUMENT = 'ADD_BASIC_INSTRUMENT'
export const addBasicInstrument = makeServerAction(makeBroadcaster((instrument: IBasicInstrumentState) => ({
	type: ADD_BASIC_INSTRUMENT,
	instrument,
})))

export const DELETE_BASIC_INSTRUMENTS = 'DELETE_BASIC_INSTRUMENTS'
export const deleteBasicInstruments = makeServerAction(makeBroadcaster((instrumentIds: string[]) => ({
	type: DELETE_BASIC_INSTRUMENTS,
	instrumentIds,
})))

export const UPDATE_BASIC_INSTRUMENTS = 'UPDATE_BASIC_INSTRUMENTS'
export const updateBasicInstruments = makeBroadcaster(makeActionCreator(
	UPDATE_BASIC_INSTRUMENTS, 'instruments',
))

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicInstrumentOscillatorType = makeServerAction(makeBroadcaster(
	(id: string, oscillatorType: OscillatorType) => ({
		type: SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
		id,
		oscillatorType,
	}),
))

export const SET_BASIC_INSTRUMENT_PARAM = 'SET_BASIC_INSTRUMENT_PARAM'
export const setBasicInstrumentParam = makeServerAction(makeBroadcaster(
	(id: string, paramName: BasicInstrumentParam, value: any) => ({
		type: SET_BASIC_INSTRUMENT_PARAM,
		id,
		paramName,
		value,
	}),
))

export enum BasicInstrumentParam {
	pan = 'pan',
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
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
}

export class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: OscillatorType = pickRandomArrayElement(['sine', 'sawtooth', 'square']) as OscillatorType
	public id = uuid.v4()
	public ownerId: string
	public pan: number = Math.random() - 0.5
	public lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000

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

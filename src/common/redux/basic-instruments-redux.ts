import {AnyAction} from 'redux'
import * as uuid from 'uuid'
import {ShamuOscillatorType} from '../../client/Instruments/BasicInstrument'
import {ClientId} from '../../client/websocket-listeners'
import {pickRandomArrayElement} from '../common-utils'
import {IAppState} from './configureStore'
import {addMultiThing, deleteThings, makeMultiReducer, updateThings} from './multi-reducer'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const BASIC_INSTRUMENT_THING_TYPE = 'BASIC_INSTRUMENT'

export const ADD_BASIC_INSTRUMENT = 'ADD_BASIC_INSTRUMENT'
export const addBasicInstrument = (instrument: IBasicInstrumentState) => ({
	...addMultiThing(instrument, BASIC_INSTRUMENT_THING_TYPE),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_BASIC_INSTRUMENTS = 'DELETE_BASIC_INSTRUMENTS'
export const deleteBasicInstruments = (instrumentIds: string[]) => ({
	...deleteThings(instrumentIds, BASIC_INSTRUMENT_THING_TYPE),
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const UPDATE_BASIC_INSTRUMENTS = 'UPDATE_BASIC_INSTRUMENTS'
export const updateBasicInstruments = (instruments: IBasicInstruments) => ({
	...updateThings(instruments, BASIC_INSTRUMENT_THING_TYPE),
	BROADCASTER_ACTION,
})

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicInstrumentOscillatorType =
	(id: string, oscillatorType: ShamuOscillatorType) => ({
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
	things: {
		[key: string]: IBasicInstrumentState,
	}
}

export interface IBasicInstruments {
	[key: string]: IBasicInstrumentState
}

export interface IBasicInstrumentState {
	oscillatorType: ShamuOscillatorType
	id: string
	ownerId: ClientId
	pan: number
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
}

export class BasicInstrumentState implements IBasicInstrumentState {
	public oscillatorType: ShamuOscillatorType
		= pickRandomArrayElement(['sine', 'sawtooth', 'square', 'triangle']) as ShamuOscillatorType
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

const basicInstrumentActionTypes = [
	SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
	SET_BASIC_INSTRUMENT_PARAM,
]

export const basicInstrumentsReducer = makeMultiReducer(
	basicInstrumentReducer,
	BASIC_INSTRUMENT_THING_TYPE,
	basicInstrumentActionTypes,
)

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

export const selectAllInstruments = (state: IAppState) => state.basicInstruments.things

export const selectAllInstrumentIds = (state: IAppState) => Object.keys(selectAllInstruments(state))

export function selectInstrumentsByOwner(state: IAppState, ownerId: ClientId) {
	const instruments = selectAllInstruments(state)
	return Object.keys(instruments)
		.map(x => instruments[x])
		.filter(x => x.ownerId === ownerId)
}

export const selectInstrument = (state, id) => selectAllInstruments(state)[id]

import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ClientId} from '../common-types'
import {pickRandomArrayElement} from '../common-utils'
import {BuiltInOscillatorType, ShamuOscillatorType} from '../OscillatorTypes'
import {CssColor} from '../shamu-color'
import {IClientRoomState} from './common-redux-types'
import {IConnectable} from './connections-redux'
import {
	addMultiThing, createSelectAllOfThingAsArray, deleteThings,
	IMultiState, makeMultiReducer, MultiThingType, updateThings,
} from './multi-reducer'
import {BROADCASTER_ACTION, NetworkActionType, SERVER_ACTION} from './redux-utils'

export const addBasicInstrument = (instrument: IBasicInstrumentState) =>
	addMultiThing(instrument, MultiThingType.basicInstrument, NetworkActionType.SERVER_AND_BROADCASTER)

export const deleteBasicInstruments = (instrumentIds: string[]) =>
	deleteThings(instrumentIds, MultiThingType.basicInstrument, NetworkActionType.SERVER_AND_BROADCASTER)

export const updateBasicInstruments = (instruments: IBasicInstruments) =>
	updateThings(instruments, MultiThingType.basicInstrument, NetworkActionType.BROADCASTER)

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

export interface IBasicInstrumentsState extends IMultiState {
	things: IBasicInstruments
}

export interface IBasicInstruments {
	[key: string]: IBasicInstrumentState
}

export interface IBasicInstrumentState extends IConnectable {
	oscillatorType: ShamuOscillatorType
	id: string
	ownerId: ClientId
	pan: number
	lowPassFilterCutoffFrequency: number
	attack: number
	release: number
}

export class BasicInstrumentState implements IBasicInstrumentState {
	public static dummy: IBasicInstrumentState = {
		oscillatorType: BuiltInOscillatorType.sine,
		id: 'dummy',
		ownerId: 'dummyOwner',
		pan: 0,
		lowPassFilterCutoffFrequency: 0,
		attack: 0,
		release: 0,
		color: 'gray',
	}

	public oscillatorType: ShamuOscillatorType
		= pickRandomArrayElement(['sine', 'sawtooth', 'square', 'triangle']) as ShamuOscillatorType
	public id = uuid.v4()
	public ownerId: string
	public pan: number = Math.random() - 0.5
	public lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000
	public attack: number = 0.01
	public release: number = 1
	public color: string = CssColor.panelGray

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const basicInstrumentActionTypes = [
	SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
	SET_BASIC_INSTRUMENT_PARAM,
]

export const basicInstrumentsReducer = makeMultiReducer<IBasicInstrumentState, IBasicInstrumentsState>(
	basicInstrumentReducer,
	MultiThingType.basicInstrument,
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
			return basicInstrument
	}
}

export const selectAllBasicInstruments = (state: IClientRoomState) => state.basicInstruments.things

export const selectAllBasicInstrumentsAsArray =
	createSelectAllOfThingAsArray<IBasicInstruments, IBasicInstrumentState>(selectAllBasicInstruments)

export const selectAllBasicInstrumentIds = createSelector(
	selectAllBasicInstruments,
	basicInstruments => Object.keys(basicInstruments),
)

export const selectBasicInstrumentsByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllBasicInstrumentsAsArray(state).filter(x => x.ownerId === ownerId)

export const selectBasicInstrument = (state: IClientRoomState, id: string) =>
	selectAllBasicInstruments(state)[id] || BasicInstrumentState.dummy

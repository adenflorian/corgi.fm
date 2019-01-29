import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ClientId, ConnectionNodeType, IConnectable} from '../common-types'
import {pickRandomArrayElement} from '../common-utils'
import {BuiltInOscillatorType, ShamuOscillatorType} from '../OscillatorTypes'
import {addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray, deleteThings, IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType, SERVER_ACTION, updateThings} from './index'

export const addBasicInstrument = (instrument: BasicInstrumentState) =>
	addMultiThing(instrument, ConnectionNodeType.basicInstrument, NetworkActionType.SERVER_AND_BROADCASTER)

export const deleteBasicInstruments = (instrumentIds: string[]) =>
	deleteThings(instrumentIds, ConnectionNodeType.basicInstrument, NetworkActionType.SERVER_AND_BROADCASTER)

export const updateBasicInstruments = (instruments: IBasicInstruments) =>
	updateThings(instruments, ConnectionNodeType.basicInstrument, NetworkActionType.BROADCASTER)

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
	instrument?: BasicInstrumentState
	instruments?: IBasicInstruments
}

export interface IBasicInstrumentsState extends IMultiState {
	things: IBasicInstruments
}

export interface IBasicInstruments {
	[key: string]: BasicInstrumentState
}

export class BasicInstrumentState implements IConnectable {
	public static dummy: BasicInstrumentState = {
		oscillatorType: BuiltInOscillatorType.sine,
		id: 'dummy',
		ownerId: 'dummyOwner',
		pan: 0,
		lowPassFilterCutoffFrequency: 0,
		attack: 0,
		release: 0,
		color: false,
		type: ConnectionNodeType.basicInstrument,
	}

	public readonly oscillatorType: ShamuOscillatorType
		= pickRandomArrayElement(['sine', 'sawtooth', 'square', 'triangle']) as ShamuOscillatorType
	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly pan: number = Math.random() - 0.5
	public readonly lowPassFilterCutoffFrequency: number = Math.random() * 10000 + 1000
	public readonly attack: number = 0.01
	public readonly release: number = 1
	public readonly color: false = false
	public readonly type = ConnectionNodeType.basicInstrument

	constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

const basicInstrumentActionTypes = [
	SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
	SET_BASIC_INSTRUMENT_PARAM,
]

export const basicInstrumentsReducer = makeMultiReducer<BasicInstrumentState, IBasicInstrumentsState>(
	basicInstrumentReducer,
	ConnectionNodeType.basicInstrument,
	basicInstrumentActionTypes,
)

function basicInstrumentReducer(basicInstrument: BasicInstrumentState, action: AnyAction) {
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
	createSelectAllOfThingAsArray<IBasicInstruments, BasicInstrumentState>(selectAllBasicInstruments)

export const selectAllBasicInstrumentIds = createSelector(
	selectAllBasicInstruments,
	basicInstruments => Object.keys(basicInstruments),
)

export const selectBasicInstrumentsByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllBasicInstrumentsAsArray(state).filter(x => x.ownerId === ownerId)

export const selectBasicInstrument = (state: IClientRoomState, id: string) =>
	selectAllBasicInstruments(state)[id] || BasicInstrumentState.dummy

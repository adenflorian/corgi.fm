import {AnyAction} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {ClientId, ConnectionNodeType, IConnectable, IMultiStateThing} from '../common-types'
import {pickRandomArrayElement} from '../common-utils'
import {BuiltInBQFilterType, BuiltInOscillatorType, LfoOscillatorType, ShamuOscillatorType} from '../OscillatorTypes'
import {NodeSpecialState} from './shamu-graph'
import {addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray, IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType, SERVER_ACTION} from '.'

export const addBasicSynthesizer = (instrument: BasicSynthesizerState) =>
	addMultiThing(instrument, ConnectionNodeType.basicSynthesizer, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE = 'SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE'
export const setBasicSynthesizerOscillatorType =
	(id: string, oscillatorType: ShamuOscillatorType) => ({
		type: SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
		id,
		oscillatorType,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export const SET_BASIC_INSTRUMENT_PARAM = 'SET_BASIC_INSTRUMENT_PARAM'
export const setBasicSynthesizerParam =
	(id: string, paramName: BasicSynthesizerParam, value: any) => ({
		type: SET_BASIC_INSTRUMENT_PARAM,
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	})

export enum BasicSynthesizerParam {
	pan = 'pan',
	lowPassFilterCutoffFrequency = 'lowPassFilterCutoffFrequency',
	attack = 'attack',
	decay = 'decay',
	sustain = 'sustain',
	release = 'release',
	filterAttack = 'filterAttack',
	filterDecay = 'filterDecay',
	filterSustain = 'filterSustain',
	filterRelease = 'filterRelease',
	fineTuning = 'fineTuning',
	gain = 'gain',
	lfoRate = 'lfoRate',
	lfoAmount = 'lfoAmount',
	lfoTarget = 'lfoTarget',
	lfoWave = 'lfoWave',
	filterType = 'filterType',
}

export enum SynthLfoTarget {
	Gain = 'Gain',
	Pitch = 'Pitch',
	Pan = 'Pan',
	Filter = 'Filter',
}

export interface BasicSynthesizerAction extends AnyAction {
	instrument?: BasicSynthesizerState
	instruments?: IBasicSynthesizers
}

export interface IBasicSynthesizersState extends IMultiState {
	things: IBasicSynthesizers
}

export interface IBasicSynthesizers {
	[key: string]: BasicSynthesizerState
}

export class BasicSynthesizerState implements IConnectable, NodeSpecialState {
	public static defaultWidth = 64 * 5
	public static defaultHeight = 56 + (88 * 3)
	public static defaultFilterType = BuiltInBQFilterType.lowpass

	public static dummy: BasicSynthesizerState = {
		oscillatorType: BuiltInOscillatorType.sine,
		id: 'dummy',
		ownerId: 'dummyOwner',
		pan: 0,
		lowPassFilterCutoffFrequency: 0,
		attack: 0,
		decay: 0,
		sustain: 0,
		release: 0,
		filterAttack: 0,
		filterDecay: 0,
		filterSustain: 0,
		filterRelease: 0,
		color: false,
		type: ConnectionNodeType.basicSynthesizer,
		fineTuning: 0,
		gain: 0.5,
		width: BasicSynthesizerState.defaultWidth,
		height: BasicSynthesizerState.defaultHeight,
		name: 'Dummy Basic Synth',
		enabled: false,
		lfoRate: 0,
		lfoAmount: 0,
		lfoTarget: SynthLfoTarget.Gain,
		lfoWave: LfoOscillatorType.sine,
		filterType: BasicSynthesizerState.defaultFilterType,
	}

	public readonly oscillatorType: ShamuOscillatorType
	= pickRandomArrayElement(['sine', 'sawtooth', 'square', 'triangle']) as ShamuOscillatorType

	public readonly id = uuid.v4()
	public readonly ownerId: string
	public readonly pan: number = Math.random() - 0.5
	public readonly lowPassFilterCutoffFrequency: number = Math.min(10000, Math.random() * 10000 + 1000)
	public readonly attack: number = 0.01
	public readonly decay: number = 0
	public readonly sustain: number = 1
	public readonly release: number = 1
	public readonly filterAttack: number = 0.01
	public readonly filterDecay: number = 0
	public readonly filterSustain: number = 1
	public readonly filterRelease: number = 1
	public readonly fineTuning: number = 0
	public readonly gain: number = 0.5
	public readonly color: false = false
	public readonly type = ConnectionNodeType.basicSynthesizer
	public readonly width: number = BasicSynthesizerState.defaultWidth
	public readonly height: number = BasicSynthesizerState.defaultHeight
	public readonly name: string = 'Basic Synth'
	public readonly enabled: boolean = true
	public readonly lfoRate: number = 0
	public readonly lfoAmount: number = 0.1
	public readonly lfoTarget: SynthLfoTarget = SynthLfoTarget.Gain
	public readonly lfoWave: LfoOscillatorType = LfoOscillatorType.sine
	public readonly filterType: BuiltInBQFilterType = BasicSynthesizerState.defaultFilterType

	public constructor(ownerId: ClientId) {
		this.ownerId = ownerId	// TODO Is this still needed?
	}
}

export function deserializeBasicSynthesizerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as BasicSynthesizerState
	const y: BasicSynthesizerState = {
		...(new BasicSynthesizerState(x.ownerId)),
		...x,
		width: Math.max(x.width, BasicSynthesizerState.defaultWidth),
		height: Math.max(x.height, BasicSynthesizerState.defaultHeight),
	}
	return y
}

const basicSynthesizerActionTypes = [
	SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE,
	SET_BASIC_INSTRUMENT_PARAM,
]

export const basicSynthesizersReducer = makeMultiReducer<BasicSynthesizerState, IBasicSynthesizersState>(
	basicSynthesizerReducer,
	ConnectionNodeType.basicSynthesizer,
	basicSynthesizerActionTypes,
)

function basicSynthesizerReducer(basicSynthesizer: BasicSynthesizerState, action: AnyAction) {
	switch (action.type) {
		case SET_BASIC_INSTRUMENT_OSCILLATOR_TYPE:
			return {
				...basicSynthesizer,
				oscillatorType: action.oscillatorType,
			}
		case SET_BASIC_INSTRUMENT_PARAM:
			return {
				...basicSynthesizer,
				[action.paramName]: action.value,
			}
		default:
			return basicSynthesizer
	}
}

export const selectAllBasicSynthesizers = (state: IClientRoomState) => state.shamuGraph.nodes.basicSynthesizers.things

export const selectAllBasicSynthesizersAsArray =
	createSelectAllOfThingAsArray<IBasicSynthesizers, BasicSynthesizerState>(selectAllBasicSynthesizers)

export const selectAllBasicSynthesizerIds = createSelector(
	selectAllBasicSynthesizers,
	basicSynthesizers => Object.keys(basicSynthesizers),
)

export const selectBasicSynthesizersByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllBasicSynthesizersAsArray(state).filter(x => x.ownerId === ownerId)

export const selectBasicSynthesizer = (state: IClientRoomState, id: string) =>
	selectAllBasicSynthesizers(state)[id] || BasicSynthesizerState.dummy

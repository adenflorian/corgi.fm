import * as uuid from 'uuid'
import {ActionType} from 'typesafe-actions'
import {Map} from 'immutable'
import {createSelector} from 'reselect'
import {ConnectionNodeType, IConnectable, IMultiStateThing, Octave} from '../common-types'
import {BuiltInBQFilterType} from '../OscillatorTypes'
import {samplerBasicPianoNotes, Samples, makeSamples, Sample, SampleParams, makeSampleParams} from '../common-samples-stuff'
import {convertToNumberKeyMap, clamp} from '../common-utils'
import {IMidiNote} from '../MidiNote'
import {NodeSpecialState} from './shamu-graph'
import {IClientAppState} from './common-redux-types'
import {
	addMultiThing, BROADCASTER_ACTION, createSelectAllOfThingAsArray,
	IClientRoomState, IMultiState, makeMultiReducer, NetworkActionType,
	SERVER_ACTION,
} from '.'

export const basicSamplerActions = {
	add: (sampler: BasicSamplerState) =>
		addMultiThing(
			sampler,
			ConnectionNodeType.basicSampler,
			NetworkActionType.SERVER_AND_BROADCASTER
		),
	setParam: (
		id: Id, paramName: BasicSamplerParam, value: BasicSamplerParamTypes
	) => ({
		type: 'SET_BASIC_SAMPLER_PARAM',
		id,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setSampleColor: (
		samplerId: Id, midiNote: IMidiNote, color: Sample['color']
	) => ({
		type: 'SET_SAMPLE_COLOR',
		id: samplerId,
		midiNote,
		color,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setSampleParam: (
		samplerId: Id, midiNote: IMidiNote,
		paramName: BasicSamplerParam, value: BasicSamplerParamTypes,
	) => ({
		type: 'SET_SAMPLE_PARAM',
		id: samplerId,
		midiNote,
		paramName,
		value,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setViewOctave: (samplerId: Id, octave: Octave) => ({
		type: 'SET_SAMPLER_VIEW_OCTAVE',
		id: samplerId,
		octave,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setSample: (
		samplerId: Id, midiNote: IMidiNote, sample: Sample
	) => ({
		type: 'SET_SAMPLE',
		id: samplerId,
		midiNote,
		sample,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	selectSamplePad: (
		samplerId: Id, midiNote?: IMidiNote,
	) => ({
		type: 'SELECT_SAMPLE_PAD',
		id: samplerId,
		midiNote,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
} as const

export type BasicSamplerParamTypes = number | BuiltInBQFilterType

export enum BasicSamplerParam {
	pan = 'pan',
	filterCutoff = 'filterCutoff',
	attack = 'attack',
	decay = 'decay',
	sustain = 'sustain',
	release = 'release',
	detune = 'detune',
	gain = 'gain',
	filterType = 'filterType',
	playbackRate = 'playbackRate',
}

export interface IBasicSamplersState extends IMultiState {
	things: IBasicSamplers
}

export interface IBasicSamplers {
	[key: string]: BasicSamplerState
}

export class BasicSamplerState implements IConnectable, NodeSpecialState {
	public static defaultFilterType = BuiltInBQFilterType.lowpass
	public static minViewOctave = -1
	public static maxViewOctave = 9
	public static defaultViewOctave = 4

	public static dummy: BasicSamplerState = {
		id: 'dummy',
		ownerId: 'dummyOwner',
		color: false,
		type: ConnectionNodeType.basicSampler,
		name: 'Dummy Basic Piano Sampler',
		enabled: false,
		filterType: BasicSamplerState.defaultFilterType,
		samples: makeSamples(),
		samplesViewOctave: 4,
		selectedSamplePad: undefined,
		params: makeSampleParams(),
	}

	public readonly id = uuid.v4()
	public readonly ownerId: Id
	public readonly color: false = false
	public readonly type = ConnectionNodeType.basicSampler
	public readonly name: string = 'Basic Piano Sampler'
	public readonly enabled: boolean = true
	public readonly filterType: BuiltInBQFilterType = BasicSamplerState.defaultFilterType
	public readonly samples: Samples = samplerBasicPianoNotes
	public readonly samplesViewOctave: number = 4
	public readonly selectedSamplePad?: IMidiNote = undefined
	public readonly params: SampleParams = makeSampleParams()

	public constructor(ownerId: ClientId) {
		this.ownerId = ownerId
	}
}

export function deserializeBasicSamplerState(
	state: IMultiStateThing
): BasicSamplerState {
	const x = state as BasicSamplerState
	return {
		...(new BasicSamplerState(x.ownerId)),
		...x,
		samples: x.samples === undefined
			? samplerBasicPianoNotes
			: convertToNumberKeyMap(Map<string, Sample>(x.samples as any)),
	}
}

export type BasicSamplerAction = ActionType<typeof basicSamplerActions>

type BasicSamplerActionTypes = {
	[key in BasicSamplerAction['type']]: 0
}

const basicSamplerActionTypes: BasicSamplerActionTypes = {
	SET_BASIC_SAMPLER_PARAM: 0,
	SET_SAMPLE_COLOR: 0,
	SET_SAMPLER_VIEW_OCTAVE: 0,
	SET_SAMPLE: 0,
	SELECT_SAMPLE_PAD: 0,
	ADD_MULTI_THING: 0,
	SET_SAMPLE_PARAM: 0,
}

export const basicSamplersReducer = makeMultiReducer<BasicSamplerState, IBasicSamplersState>(
	basicSamplerReducer,
	ConnectionNodeType.basicSampler,
	Object.keys(basicSamplerActionTypes),
)

function basicSamplerReducer(basicSampler: BasicSamplerState, action: BasicSamplerAction): BasicSamplerState {
	switch (action.type) {
		case 'SET_BASIC_SAMPLER_PARAM':
			return {
				...basicSampler,
				params: {
					...basicSampler.params,
					[action.paramName]: action.value,
				},
			}
		case 'SET_SAMPLE_COLOR':
			return {
				...basicSampler,
				samples: basicSampler.samples.update(action.midiNote, sample => ({
					...sample,
					color: action.color,
				})),
			}
		case 'SET_SAMPLE_PARAM':
			return {
				...basicSampler,
				samples: basicSampler.samples.update(action.midiNote, sample => ({
					...sample,
					parameters: {
						...(sample.parameters ? sample.parameters : makeSampleParams()),
						gain: 1,
						[action.paramName]: action.value,
					},
				})),
			}
		case 'SET_SAMPLE':
			return {
				...basicSampler,
				samples: basicSampler.samples.set(action.midiNote, action.sample),
			}
		case 'SET_SAMPLER_VIEW_OCTAVE':
			return {
				...basicSampler,
				samplesViewOctave: clamp(
					action.octave,
					BasicSamplerState.minViewOctave,
					BasicSamplerState.maxViewOctave),
			}
		case 'SELECT_SAMPLE_PAD':
			return {
				...basicSampler,
				selectedSamplePad: action.midiNote,
			}
		default:
			return basicSampler
	}
}

export const selectAllSamplers = (state: IClientRoomState) => state.shamuGraph.nodes.basicSamplers.things

export const selectAllSamplerIds = (state: IClientRoomState) => Object.keys(selectAllSamplers(state))

export const selectAllSamplersAsArray =
	createSelectAllOfThingAsArray<IBasicSamplers, BasicSamplerState>(selectAllSamplers)

export const selectSamplersByOwner = (state: IClientRoomState, ownerId: ClientId) =>
	selectAllSamplersAsArray(state).filter(x => x.ownerId === ownerId)

export const selectSampler = (state: IClientRoomState, id: Id) =>
	selectAllSamplers(state)[id as string] || BasicSamplerState.dummy

export const selectSamples = (id: Id) => (state: IClientAppState) =>
	selectSampler(state.room, id).samples

export const selectSamplerViewOctave = (id: Id) => (state: IClientAppState) =>
	selectSampler(state.room, id).samplesViewOctave

export const createIsPadSelectedSelector = (id: Id, midiNote: IMidiNote) => (state: IClientAppState) =>
	selectSampler(state.room, id).selectedSamplePad === midiNote

export const createSelectedPadNumberSelector = (id: Id) => (state: IClientAppState) => {
	return selectSampler(state.room, id).selectedSamplePad
}

export const createSelectSamplePadSelector = (id: Id, note?: IMidiNote) => (state: IClientAppState) => {
	return note === undefined
		? undefined
		: selectSampler(state.room, id).samples.get(note, undefined)
}

export const samplerParamsSelector = (id: Id) => createSelector(
	(state: IClientAppState) => {
		const sampler = selectSampler(state.room, id)
		if (sampler.selectedSamplePad) {
			const sample = sampler.samples.get(sampler.selectedSamplePad, undefined)
			return sample ? sample.parameters : undefined
		} else {
			return sampler.params
		}
	},
	params => {
		const finalParams = params || {...makeSampleParams(), gain: 1}
		return {
			pan: finalParams.pan,
			filterCutoff: finalParams.filterCutoff,
			attack: finalParams.attack,
			decay: finalParams.decay,
			sustain: finalParams.sustain,
			release: finalParams.release,
			detune: finalParams.detune,
			playbackRate: finalParams.playbackRate,
			gain: finalParams.gain,
			filterType: finalParams.filterType,
		}
	}
)

import {Store} from 'redux'
// import {OscillatorType} from 'tone'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {
	BasicSamplerState, BasicSynthesizerState, globalClockActions, IClientAppState,
	IClientRoomState, IConnection, isAudioNodeType,
	MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicSynthesizerIds, selectAllSamplerIds,
	selectAllSimpleReverbIds, selectBasicSynthesizer,
	selectConnectionSourceNotesByTargetId, selectConnectionsWithSourceIds, selectGlobalClockState,
	selectSampler, selectSimpleReverb, SimpleReverbState,
} from '../common/redux'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicSamplerInstrument} from './WebAudio/BasicSamplerInstrument'
import {BasicSynthesizer} from './WebAudio/BasicSynthesizer'
// import {BasicToneSynth} from './WebAudio/BasicToneSynth'
import {
	AudioNodeWrapper, IAudioNodeWrapperOptions, IInstrument,
	IInstrumentOptions, MasterAudioOutput,
} from './WebAudio/Instrument'
import {SimpleReverb} from './WebAudio/SimpleReverb'
import {Map} from 'immutable';

type IdsSelector = (roomState: IClientRoomState) => string[]
type StateSelector<S> = (roomState: IClientRoomState, id: string) => S

type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

type EffectFactory<E, S> = (options: IAudioNodeWrapperOptions, effectState: S) => E
type UpdateSpecificEffect<E, S> = (effect: E, effectState: S) => void

type StuffMap = Map<string, AudioNodeWrapper>

// Need separate properties to match up with what IDs selector is used
// so that we can delete stuff properly
// This might be able to be simplified if we can simplify the shamuGraph redux state
let stuffMaps = Map<ConnectionNodeType, StuffMap>([
	[ConnectionNodeType.basicSampler, Map()],
	[ConnectionNodeType.basicSynthesizer, Map()],
	[ConnectionNodeType.audioOutput, Map()],
	[ConnectionNodeType.simpleReverb, Map()],
])

export function getAllInstruments() {
	return stuffMaps.get(ConnectionNodeType.basicSampler)!
		.concat(
			stuffMaps.get(ConnectionNodeType.basicSynthesizer)!
		) as Map<string, IInstrument>
}

let previousState: IClientAppState | undefined

export const setupInstrumentManager = (
	store: Store<IClientAppState>,
	audioContext: AudioContext,
	preFx: GainNode,
	isNewNoteScannerEnabled: boolean,
) => {

	stuffMaps = stuffMaps.set(ConnectionNodeType.audioOutput, Map([[
		MASTER_AUDIO_OUTPUT_TARGET_ID,
		new MasterAudioOutput({
			audioNode: preFx,
			audioContext,
			id: MASTER_AUDIO_OUTPUT_TARGET_ID,
		})
	]]))

	const globalClock = new GridSequencerPlayer(
		audioContext,
		index => store.dispatch(globalClockActions.setIndex(index)),
	)

	store.subscribe(updateInstrumentLayer)

	function updateInstrumentLayer() {
		const state = store.getState()

		// Optimization
		if (!previousState || state.room === previousState.room) {
			previousState = state
			return
		}

		if (isNewNoteScannerEnabled === false) {
			const newGlobalClockState = selectGlobalClockState(state.room)

			if (newGlobalClockState.isPlaying) {
				globalClock.play(newGlobalClockState.playCount)
			} else {
				globalClock.stop()
			}
		}

		previousState = state

		handleSamplers()
		handleBasicSynthesizers()
		handleSimpleReverbs()

		function handleSamplers() {
			updateInstrumentType(
				selectAllSamplerIds,
				selectSampler,
				options => new BasicSamplerInstrument({
					...options,
					voiceCount: 20,
				}),
				ConnectionNodeType.basicSampler,
				(instrument: BasicSamplerInstrument, instrumentState: BasicSamplerState) => {
					instrument.setPan(instrumentState.pan)
					instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
					instrument.setAttack(instrumentState.attack)
					instrument.setRelease(instrumentState.release)
				},
			)
		}

		function handleBasicSynthesizers() {
			updateInstrumentType(
				selectAllBasicSynthesizerIds,
				selectBasicSynthesizer,
				(options, instrumentState) => new BasicSynthesizer({
					...options,
					voiceCount: 9,
					...instrumentState,
				}),
				ConnectionNodeType.basicSynthesizer,
				(instrument: BasicSynthesizer, instrumentState: BasicSynthesizerState) => {
					instrument.setOscillatorType(instrumentState.oscillatorType)
					instrument.setPan(instrumentState.pan)
					instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
					instrument.setAttack(instrumentState.attack)
					instrument.setRelease(instrumentState.release)
					instrument.setFineTuning(instrumentState.fineTuning)
				},
			)
			// updateInstrumentType(
			// 	selectAllBasicSynthesizerIds,
			// 	selectBasicSynthesizer,
			// 	(options, instrumentState) => new BasicToneSynth({
			// 		...options,
			// 		...instrumentState,
			// 	}),
			// 	stuffMaps.get(ConnectionNodeType.basicSynthesizer)!,
			// 	(instrument: BasicToneSynth, instrumentState: BasicSynthesizerState) => {
			// 		instrument.setOscillatorType(instrumentState.oscillatorType as OscillatorType)
			// 		instrument.setPan(instrumentState.pan)
			// 		instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
			// 		instrument.setAttack(instrumentState.attack)
			// 		instrument.setRelease(instrumentState.release)
			// 		instrument.setFineTuning(instrumentState.fineTuning)
			// 	},
			// )
			// updateToneType(
			// 	selectAllBasicSynthesizerIds,
			// 	selectBasicSynthesizer,
			// 	stuffMaps.get(ConnectionNodeType.basicSynthesizer)!,
			// )
		}

		function updateInstrumentType<I extends IInstrument, S extends IConnectable>(
			instrumentIdsSelector: IdsSelector,
			instrumentStateSelector: StateSelector<S>,
			instrumentCreator: InstrumentFactory<I, S>,
			nodeType: ConnectionNodeType,
			updateSpecificInstrument?: UpdateSpecificInstrument<I, S>,
		) {
			const instrumentIds = instrumentIdsSelector(state.room)

			deleteStuffThatNeedsToBe(nodeType, instrumentIds)

			instrumentIds.forEach(instrumentId => {
				const instrumentState = instrumentStateSelector(state.room, instrumentId)

				const instrument = createIfNotExisting(
					nodeType,
					instrumentId,
					stuffMaps.get(nodeType)!.get(instrumentId),
					() => instrumentCreator({
						id: instrumentId,
						audioContext,
						voiceCount: 1,
					}, instrumentState),
				)

				updateAudioConnectionsFromSource(state.room, instrumentId, instrument)

				const sourceNotes = selectConnectionSourceNotesByTargetId(state.room, instrumentId)

				if (isNewNoteScannerEnabled === false) {
					// In old system, all note changes go thru here
					instrument.setMidiNotes(sourceNotes)
				}

				if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
			})
		}

		// function updateToneType<S extends IConnectable>(
		// 	instrumentIdsSelector: IdsSelector,
		// 	instrumentStateSelector: StateSelector<S>,
		// 	stuff: StuffMap,
		// ) {
		// 	const instrumentIds = instrumentIdsSelector(state.room)

		// 	stuff.forEach((_, key) => {
		// 		if (instrumentIds.includes(key) === false) {
		// 			stuff.get(key)!.dispose()
		// 			stuff.delete(key)
		// 		}
		// 	})

		// 	instrumentIds.forEach(instrumentId => {
		// 		const instrumentState = instrumentStateSelector(state.room, instrumentId)

		// 		const instrument = createIfNotExisting(
		// 			stuff,
		// 			instrumentId,
		// 			stuff.get(instrumentId),
		// 			() => new BasicToneSynth({
		// 				audioContext,
		// 				id: instrumentId,
		// 			}),
		// 		)

		// 		// updateAudioConnectionsFromSource(state.room, instrumentId, instrument)

		// 		const sourceNotes = selectConnectionSourceNotesByTargetId(state.room, instrumentId)

		// 		instrument.setMidiNotes(sourceNotes)

		// 		// instrument.setMidiNotes(sourceNotes)

		// 	})
		// }

		function handleSimpleReverbs() {
			updateEffectType(
				selectAllSimpleReverbIds,
				selectSimpleReverb,
				(options, effectState) => new SimpleReverb({
					...options,
					...effectState,
				}),
				ConnectionNodeType.simpleReverb,
				(effect: SimpleReverb, effectState: SimpleReverbState) => {
					effect.setTime(effectState.time)
					effect.setCutoff(effectState.lowPassFilterCutoffFrequency)
				},
			)
		}

		function updateEffectType<E extends AudioNodeWrapper, S extends IConnectable>(
			effectIdsSelector: IdsSelector,
			effectStateSelector: StateSelector<S>,
			effectCreator: EffectFactory<E, S>,
			nodeType: ConnectionNodeType,
			updateSpecificEffect?: UpdateSpecificEffect<E, S>,
		) {
			const effectIds = effectIdsSelector(state.room)

			deleteStuffThatNeedsToBe(nodeType, effectIds)

			effectIds.forEach(effectId => {
				const effectState = effectStateSelector(state.room, effectId)

				const effect = createIfNotExisting(
					nodeType,
					effectId,
					stuffMaps.get(nodeType)!.get(effectId),
					() => effectCreator({
						id: effectId,
						audioContext,
					}, effectState),
				)

				updateAudioConnectionsFromSource(state.room, effectId, effect)

				if (updateSpecificEffect) updateSpecificEffect(effect, effectState)
			})
		}
	}
}

function deleteStuffThatNeedsToBe(nodeType: ConnectionNodeType, thingIds: string[]) {
	stuffMaps = stuffMaps.set(nodeType, stuffMaps.get(nodeType)!.withMutations(mutable => {
		mutable.forEach((_, key) => {
			if (thingIds.includes(key) === false) {
				mutable.get(key)!.dispose()
				mutable.delete(key)
			}
		})
	}))
}

function updateAudioConnectionsFromSource(roomState: IClientRoomState, sourceId: string, audioNodeWrapper: AudioNodeWrapper) {
	const outgoingConnections = selectConnectionsWithSourceIds(roomState, [sourceId])

	if (outgoingConnections.count() === 0) {
		return audioNodeWrapper.disconnectAll()
	}

	const validOutgoingConnections = outgoingConnections.filter(isConnectionToAudioNode)
	const newConnections = validOutgoingConnections.filter(x => audioNodeWrapper.getConnectedTargets().has(x.targetId) === false)
	const deletedTargetIds = audioNodeWrapper.getConnectedTargets().keySeq().filter(id => validOutgoingConnections.some(x => x.targetId === id) === false)

	newConnections.forEach(newConnection => {
		const targetAudioNodeWrapper = stuffMaps.get(newConnection.targetType)!.get(newConnection.targetId)
		if (!targetAudioNodeWrapper) return
		audioNodeWrapper.connect(targetAudioNodeWrapper, newConnection.targetId)
	})

	deletedTargetIds.forEach(deletedTargetId => {
		audioNodeWrapper.disconnect(deletedTargetId)
	})
}

function createIfNotExisting<T>(nodeType: ConnectionNodeType, id: string, thing: any, thingFactory: () => T): T {
	if (thing === undefined) {
		thing = thingFactory()
		stuffMaps = stuffMaps.set(
			nodeType,
			stuffMaps.get(nodeType)!.set(id, thing)
		)
	}
	return thing
}

function isConnectionToAudioNode(connection: IConnection) {
	return isAudioNodeType(connection.targetType)
}

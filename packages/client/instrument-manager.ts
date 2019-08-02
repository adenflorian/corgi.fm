import {Map} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '@corgifm/common/common-types'
import {
	BasicSamplerState, BasicSynthesizerState, IClientAppState,
	IClientRoomState, IConnection, isAudioNodeType,
	MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicSynthesizerIds,
	selectAllSamplerIds, selectAllSimpleCompressorIds, selectAllSimpleDelayIds,
	selectAllSimpleReverbIds, selectBasicSynthesizer,
	selectConnectionsWithSourceIds, selectPosition,
	selectSampler, selectSimpleCompressor, selectSimpleDelay,
	selectSimpleReverb, SimpleCompressorState, SimpleDelayState,
	SimpleReverbState,
} from '@corgifm/common/redux'
import {
	AudioNodeWrapper, IAudioNodeWrapperOptions, IInstrumentOptions,
	Instrument, MasterAudioOutput, SimpleCompressor, Voice, Voices,
} from './WebAudio'
import {BasicSamplerInstrument} from './WebAudio/BasicSamplerInstrument'
import {BasicSynthesizer} from './WebAudio/BasicSynthesizer'
import {SimpleDelay} from './WebAudio/SimpleDelay'
import {SimpleReverb} from './WebAudio/SimpleReverb'

type IdsSelector = (roomState: IClientRoomState) => Id[]
type StateSelector<S> = (roomState: IClientRoomState, id: Id) => S

type InstrumentFactory<I extends Instrument<Voices<Voice>, Voice>, S>
	= (options: IInstrumentOptions, instrumentState: S) => I

type UpdateSpecificInstrument<I extends Instrument<Voices<Voice>, Voice>, S>
	= (instrument: I, instrumentState: S) => void

type EffectFactory<E, S> = (options: IAudioNodeWrapperOptions, effectState: S) => E
type UpdateSpecificEffect<E, S> = (effect: E, effectState: S) => void

type StuffMap = Map<Id, AudioNodeWrapper>

export type GetAllInstruments = () => Map<Id, Instrument<Voices<Voice>, Voice>>

export type GetAllAudioNodes = () => StuffMap

export const setupInstrumentManager = (
	store: Store<IClientAppState>,
	audioContext: AudioContext,
	preFx: GainNode,
): {getAllInstruments: GetAllInstruments, getAllAudioNodes: GetAllAudioNodes} => {

	// Need separate properties to match up with what IDs selector is used
	// so that we can delete stuff properly
	// This might be able to be simplified if we can simplify the shamuGraph redux state
	let stuffMaps = Map<ConnectionNodeType, StuffMap>([
		[ConnectionNodeType.basicSampler, Map()],
		[ConnectionNodeType.basicSynthesizer, Map()],
		[ConnectionNodeType.simpleReverb, Map()],
		[ConnectionNodeType.simpleCompressor, Map()],
		[ConnectionNodeType.simpleDelay, Map()],
		[ConnectionNodeType.audioOutput, Map([[
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			new MasterAudioOutput({
				audioNode: preFx,
				audioContext,
				id: MASTER_AUDIO_OUTPUT_TARGET_ID,
			}),
		]])],
	])

	let previousState: IClientAppState | undefined

	store.subscribe(updateInstrumentLayer)

	return {getAllInstruments, getAllAudioNodes}

	function updateInstrumentLayer() {
		const state = store.getState()

		// Optimization
		if (!previousState || state.room === previousState.room) {
			previousState = state
			return
		}

		previousState = state

		// const bpm = selectGlobalClockState(state.room).bpm

		handleSamplers()
		handleBasicSynthesizers()
		handleSimpleReverbs()
		handleSimpleCompressors()
		handleSimpleDelays()

		function handleSamplers() {
			updateInstrumentType(
				selectAllSamplerIds,
				selectSampler,
				options => new BasicSamplerInstrument({
					...options,
				}),
				ConnectionNodeType.basicSampler,
				(instrument: BasicSamplerInstrument, instrumentState: BasicSamplerState) => {
					instrument.setPan(instrumentState.pan)
					instrument.setFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
					instrument.setAttack(instrumentState.attack)
					instrument.setDecay(instrumentState.decay)
					instrument.setSustain(instrumentState.sustain)
					instrument.setRelease(instrumentState.release)
					instrument.setDetune(instrumentState.detune)
					instrument.setGain(instrumentState.gain)
					instrument.setFilterType(instrumentState.filterType)
				},
			)
		}

		function handleBasicSynthesizers() {
			updateInstrumentType(
				selectAllBasicSynthesizerIds,
				selectBasicSynthesizer,
				(options, instrumentState) => new BasicSynthesizer({
					...options,
					...instrumentState,
				}),
				ConnectionNodeType.basicSynthesizer,
				(instrument: BasicSynthesizer, instrumentState: BasicSynthesizerState) => {
					instrument.setOscillatorType(instrumentState.oscillatorType)
					instrument.setPan(instrumentState.pan)
					instrument.setFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
					instrument.setAttack(instrumentState.attack)
					instrument.setDecay(instrumentState.decay)
					instrument.setSustain(instrumentState.sustain)
					instrument.setRelease(instrumentState.release)
					instrument.setFilterAttack(instrumentState.filterAttack)
					instrument.setFilterDecay(instrumentState.filterDecay)
					instrument.setFilterSustain(instrumentState.filterSustain)
					instrument.setFilterRelease(instrumentState.filterRelease)
					instrument.setDetune(instrumentState.fineTuning)
					instrument.setGain(instrumentState.gain)
					instrument.setLfoRate(instrumentState.lfoRate)
					// instrument.setLfoRate((bpm / 60) * instrumentState.lfoRate)
					instrument.setLfoAmount(instrumentState.lfoAmount)
					instrument.setLfoWave(instrumentState.lfoWave)
					instrument.setLfoTarget(instrumentState.lfoTarget)
					instrument.setFilterType(instrumentState.filterType)
				},
			)
		}

		function updateInstrumentType<I extends Instrument<Voices<Voice>, Voice>, S extends IConnectable>(
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
					}, instrumentState),
				)

				updateAudioNodeWrapper(instrumentId, instrument)

				const {enabled} = selectPosition(state.room, instrumentId)

				instrument.setEnabled(enabled)

				if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
			})
		}

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
					effect.setDry(effectState.dry)
					effect.setWet(effectState.wet)
					effect.setReverse(effectState.reverse)
					effect.setDecay(effectState.decay)
					effect.setFilterType(effectState.filterType)
				},
			)
		}

		function handleSimpleCompressors() {
			updateEffectType(
				selectAllSimpleCompressorIds,
				selectSimpleCompressor,
				(options, effectState) => new SimpleCompressor({
					...options,
					...effectState,
				}),
				ConnectionNodeType.simpleCompressor,
				(effect: SimpleCompressor, effectState: SimpleCompressorState) => {
					effect.setThreshold(effectState.threshold)
					effect.setKnee(effectState.knee)
					effect.setRatio(effectState.ratio)
					effect.setAttack(effectState.attack)
					effect.setRelease(effectState.release)
				},
			)
		}

		function handleSimpleDelays() {
			updateEffectType(
				selectAllSimpleDelayIds,
				selectSimpleDelay,
				(options, effectState) => new SimpleDelay({
					...options,
					...effectState,
					time: effectState.timeLeft,
				}),
				ConnectionNodeType.simpleDelay,
				(effect: SimpleDelay, effectState: SimpleDelayState) => {
					effect.setDelayTime(effectState.timeLeft)
					effect.setFeedback(effectState.feedback)
					effect.setMix(effectState.mix)
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

				updateAudioNodeWrapper(effectId, effect)

				const {enabled} = selectPosition(state.room, effectId)

				effect.setPassthroughMode(!enabled)

				if (updateSpecificEffect) updateSpecificEffect(effect, effectState)
			})
		}

		function updateAudioNodeWrapper(id: Id, audioNodeWrapper: AudioNodeWrapper) {
			updateAudioConnectionsFromSource(state.room, id, audioNodeWrapper)
		}
	}

	function getAllInstruments() {
		return stuffMaps.get(ConnectionNodeType.basicSampler)!
			.concat(
				stuffMaps.get(ConnectionNodeType.basicSynthesizer)!,
			) as Map<string, Instrument<Voices<Voice>, Voice>>
	}

	function getAllAudioNodes() {
		return stuffMaps.flatMap(x => x)
	}

	function deleteStuffThatNeedsToBe(nodeType: ConnectionNodeType, thingIds: Id[]) {
		stuffMaps = stuffMaps.set(nodeType, stuffMaps.get(nodeType)!.withMutations(mutable => {
			mutable.forEach((_, key) => {
				if (thingIds.includes(key) === false) {
					mutable.get(key)!.dispose()
					mutable.delete(key)
				}
			})
		}))
	}

	function updateAudioConnectionsFromSource(roomState: IClientRoomState, sourceId: Id, audioNodeWrapper: AudioNodeWrapper) {
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

	function createIfNotExisting<T>(nodeType: ConnectionNodeType, id: Id, thing: any, thingFactory: () => T): T {
		if (thing === undefined) {
			// eslint-disable-next-line no-param-reassign
			thing = thingFactory()
			stuffMaps = stuffMaps.set(
				nodeType,
				stuffMaps.get(nodeType)!.set(id, thing),
			)
		}
		return thing
	}
}

function isConnectionToAudioNode(connection: IConnection) {
	return isAudioNodeType(connection.targetType)
}

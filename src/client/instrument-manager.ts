import {Map} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, IConnectable, Id} from '../common/common-types'
import {
	BasicSamplerState, BasicSynthesizerState, IClientAppState,
	IClientRoomState, IConnection, isAudioNodeType,
	MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicSynthesizerIds, selectAllSamplerIds,
	selectAllSimpleCompressorIds, selectAllSimpleReverbIds,
	selectBasicSynthesizer, selectConnectionsWithSourceIds,
	selectPosition, selectSampler, selectSimpleCompressor,
	selectSimpleReverb, SimpleCompressorState, SimpleReverbState,
} from '../common/redux'
import {
	AudioNodeWrapper, IAudioNodeWrapperOptions, IInstrumentOptions,
	Instrument, MasterAudioOutput, SimpleCompressor, Voice, Voices,
} from './WebAudio'
import {BasicSamplerInstrument} from './WebAudio/BasicSamplerInstrument'
import {BasicSynthesizer} from './WebAudio/BasicSynthesizer'
import {SimpleReverb} from './WebAudio/SimpleReverb'

type IdsSelector = (roomState: IClientRoomState) => string[]
type StateSelector<S> = (roomState: IClientRoomState, id: string) => S

type InstrumentFactory<I extends Instrument<Voices<Voice>, Voice>, S>
	= (options: IInstrumentOptions, instrumentState: S) => I

type UpdateSpecificInstrument<I extends Instrument<Voices<Voice>, Voice>, S>
	= (instrument: I, instrumentState: S) => void

type EffectFactory<E, S> = (options: IAudioNodeWrapperOptions, effectState: S) => E
type UpdateSpecificEffect<E, S> = (effect: E, effectState: S) => void

type StuffMap = Map<string, AudioNodeWrapper>

export type GetAllInstruments = () => Map<string, Instrument<Voices<Voice>, Voice>>

export const setupInstrumentManager = (
	store: Store<IClientAppState>,
	audioContext: AudioContext,
	preFx: GainNode,
) => {

	// Need separate properties to match up with what IDs selector is used
	// so that we can delete stuff properly
	// This might be able to be simplified if we can simplify the shamuGraph redux state
	let stuffMaps = Map<ConnectionNodeType, StuffMap>([
		[ConnectionNodeType.basicSampler, Map()],
		[ConnectionNodeType.basicSynthesizer, Map()],
		[ConnectionNodeType.simpleReverb, Map()],
		[ConnectionNodeType.simpleCompressor, Map()],
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

	return {getAllInstruments} as {getAllInstruments: GetAllInstruments}

	function updateInstrumentLayer() {
		const state = store.getState()

		// Optimization
		if (!previousState || state.room === previousState.room) {
			previousState = state
			return
		}

		previousState = state

		handleSamplers()
		handleBasicSynthesizers()
		handleSimpleReverbs()
		handleSimpleCompressors()

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
					instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
					instrument.setAttack(instrumentState.attack)
					instrument.setDecay(instrumentState.decay)
					instrument.setSustain(instrumentState.sustain)
					instrument.setRelease(instrumentState.release)
					instrument.setDetune(instrumentState.detune)
					instrument.setGain(instrumentState.gain)
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
					instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
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
					instrument.setLfoAmount(instrumentState.lfoAmount)
					instrument.setLfoWave(instrumentState.lfoWave)
					instrument.setLfoTarget(instrumentState.lfoTarget)
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
				stuffMaps.get(nodeType)!.set(id, thing),
			)
		}
		return thing
	}
}

function isConnectionToAudioNode(connection: IConnection) {
	return isAudioNodeType(connection.targetType)
}

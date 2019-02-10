import * as Immutable from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {
	BasicSynthesizerState, isAudioNodeType, MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicSynthesizerIds, selectAllSimpleReverbIds, selectBasicSynthesizer, selectConnectionsWithSourceIds, selectSimpleReverb, SimpleReverbState,
} from '../common/redux'
import {IClientAppState, IClientRoomState} from '../common/redux'
import {setGlobalClockIndex} from '../common/redux'
import {
	selectConnectionSourceNotesByTargetId,
} from '../common/redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicSynthesizer} from './Instruments/BasicSynthesizer'
import {IAudioNodeWrapper, IAudioNodeWrapperOptions, IInstrument, IInstrumentOptions} from './Instruments/Instrument'
import {SimpleReverb} from './ShamuNodes/SimpleReverb/SimpleReverb'

type IdsSelector = (roomState: IClientRoomState) => string[]
type StateSelector<S> = (roomState: IClientRoomState, id: string) => S

type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

type EffectFactory<E, S> = (options: IAudioNodeWrapperOptions, effectState: S) => E
type UpdateSpecificEffect<E, S> = (effect: E, effectState: S) => void

class StuffMap extends Map<string, IAudioNodeWrapper> {}

// Need separate properties to match up with what IDs selector is used
// so that we can delete stuff properly
const stuffMaps: {[key: string]: StuffMap} = Object.freeze({
	[ConnectionNodeType.basicSampler]: new StuffMap(),
	[ConnectionNodeType.basicSynthesizer]: new StuffMap(),
	[ConnectionNodeType.audioOutput]: new StuffMap(),
	[ConnectionNodeType.simpleReverb]: new StuffMap(),
})

export const setupInstrumentManager =
	(store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {

		stuffMaps[ConnectionNodeType.audioOutput].set(
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			{
				getInputAudioNode: () => preFx,
				connect: () => null,
				disconnectAll: () => null,
				dispose: () => null,
				getOutputAudioNode: () => preFx,
				getConnectedTargets: () => Immutable.Map(),
			},
		)

		const globalClock = new GridSequencerPlayer(
			audioContext,
			index => store.dispatch(setGlobalClockIndex(index)),
		)

		globalClock.play()

		store.subscribe(updateInstrumentLayer)

		function updateInstrumentLayer() {
			const state = store.getState()

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
					stuffMaps[ConnectionNodeType.basicSampler],
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
					stuffMaps[ConnectionNodeType.basicSynthesizer],
					(instrument: BasicSynthesizer, instrumentState: BasicSynthesizerState) => {
						instrument.setOscillatorType(instrumentState.oscillatorType)
						instrument.setPan(instrumentState.pan)
						instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
						instrument.setAttack(instrumentState.attack)
						instrument.setRelease(instrumentState.release)
						instrument.setFineTuning(instrumentState.fineTuning)
					},
				)
			}

			function updateInstrumentType<I extends IInstrument, S extends IConnectable>(
				instrumentIdsSelector: IdsSelector,
				instrumentStateSelector: StateSelector<S>,
				instrumentCreator: InstrumentFactory<I, S>,
				stuff: StuffMap,
				updateSpecificInstrument?: UpdateSpecificInstrument<I, S>,
			) {
				const instrumentIds = instrumentIdsSelector(state.room)

				stuff.forEach((_, key) => {
					if (instrumentIds.includes(key) === false) {
						stuff.get(key)!.dispose()
						stuff.delete(key)
					}
				})

				instrumentIds.forEach(instrumentId => {
					const instrumentState = instrumentStateSelector(state.room, instrumentId)

					const instrument = createIfNotExisting(
						stuff,
						instrumentId,
						stuff.get(instrumentId),
						() => instrumentCreator({
							audioContext,
							voiceCount: 1,
						}, instrumentState),
					)

					updateAudioConnections(instrumentId, instrument)

					const sourceNotes = selectConnectionSourceNotesByTargetId(state.room, instrumentId)

					instrument.setMidiNotes(sourceNotes)

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
					stuffMaps[ConnectionNodeType.simpleReverb],
					(effect: SimpleReverb, effectState: SimpleReverbState) => {
						effect.setTime(effectState.time)
						effect.setCutoff(effectState.lowPassFilterCutoffFrequency)
					},
				)
			}

			function updateEffectType<E extends IAudioNodeWrapper, S extends IConnectable>(
				effectIdsSelector: IdsSelector,
				effectStateSelector: StateSelector<S>,
				effectCreator: EffectFactory<E, S>,
				stuff: StuffMap,
				updateSpecificEffect?: UpdateSpecificEffect<E, S>,
			) {
				const effectIds = effectIdsSelector(state.room)

				stuff.forEach((_, key) => {
					if (effectIds.includes(key) === false) {
						stuff.get(key)!.dispose()
						stuff.delete(key)
					}
				})

				effectIds.forEach(effectId => {
					const effectState = effectStateSelector(state.room, effectId)

					const effect = createIfNotExisting(
						stuff,
						effectId,
						stuff.get(effectId),
						() => effectCreator({
							audioContext,
						}, effectState),
					)

					updateAudioConnections(effectId, effect)

					if (updateSpecificEffect) updateSpecificEffect(effect, effectState)
				})
			}

			function createIfNotExisting<T>(stuff: StuffMap, id: string, thing: any, thingFactory: () => T): T {
				if (thing === undefined) {
					thing = thingFactory()
					stuff.set(id, thing)
				}
				return thing
			}

			function updateAudioConnections(audioNodeWrapperId: string, audioNodeWrapper: IAudioNodeWrapper) {

				// TODO What do if multiple connections?
				const outgoingConnections = selectConnectionsWithSourceIds(state.room, [audioNodeWrapperId])

				let hasNewConnection = false

				if (outgoingConnections.count() === 0) {
					audioNodeWrapper.disconnectAll()
				}

				outgoingConnections.forEach(outgoingConnection => {
					if (outgoingConnection && isAudioNodeType(outgoingConnection.targetType)) {
						const targetAudioNodeWrapper = stuffMaps[outgoingConnection.targetType].get(outgoingConnection.targetId)

						if (targetAudioNodeWrapper) {
							if (audioNodeWrapper.getConnectedTargets().has(outgoingConnection.targetId) === false) {
								if (hasNewConnection === false) {
									hasNewConnection = true
									audioNodeWrapper.disconnectAll()
								}
								audioNodeWrapper.connect(targetAudioNodeWrapper, outgoingConnection.targetId)
							}
						} else {
							audioNodeWrapper.disconnectAll()
						}
					} else {
						audioNodeWrapper.disconnectAll()
					}
				})
			}
		}
	}

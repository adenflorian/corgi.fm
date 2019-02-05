import {Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {IDisposable} from '../common/common-types'
import {
	BasicInstrumentState, isAudioNodeType, MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicInstrumentIds, selectBasicInstrument, selectConnectionSourceColorByTargetId, selectConnectionsWithSourceIds,
} from '../common/redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux'
import {IClientAppState, IClientRoomState} from '../common/redux'
import {setGlobalClockIndex} from '../common/redux'
import {
	selectConnectionSourceNotesByTargetId,
} from '../common/redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicInstrument} from './Instruments/BasicInstrument'
import {IAudioNodeWrapper, IInstrument, IInstrumentOptions} from './Instruments/Instrument'

type InstrumentIdsSelector = (roomState: IClientRoomState) => string[]
type InstrumentStateSelector<S> = (roomState: IClientRoomState, id: string) => S
type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

class StuffMap extends Map<string, IAudioNodeWrapper> {}

// Need separate properties to match up with what IDs selector is used
// so that we can delete stuff properly
const stuffMaps: {[key: string]: StuffMap} = Object.freeze({
	[ConnectionNodeType.basicSampler]: new StuffMap(),
	[ConnectionNodeType.basicInstrument]: new StuffMap(),
	[ConnectionNodeType.audioOutput]: new StuffMap(),
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
				getConnectedTargetId: () => '-1',
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
			handleBasicInstruments()

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

			function handleBasicInstruments() {
				updateInstrumentType(
					selectAllBasicInstrumentIds,
					selectBasicInstrument,
					(options, instrumentState) => new BasicInstrument({
						...options,
						voiceCount: 9,
						...instrumentState,
					}),
					stuffMaps[ConnectionNodeType.basicInstrument],
					(instrument: BasicInstrument, instrumentState: BasicInstrumentState) => {
						instrument.setOscillatorType(instrumentState.oscillatorType)
						instrument.setPan(instrumentState.pan)
						instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
						instrument.setAttack(instrumentState.attack)
						instrument.setRelease(instrumentState.release)
					},
				)
			}

			function updateInstrumentType<I extends IInstrument, S extends IConnectable>(
				instrumentIdsSelector: InstrumentIdsSelector,
				instrumentStateSelector: InstrumentStateSelector<S>,
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
							destination: preFx,
							voiceCount: 1,
						}, instrumentState),
					)

					updateAudioConnections(instrumentId, instrument)

					const sourceNotes = selectConnectionSourceNotesByTargetId(state.room, instrumentId)

					instrument.setMidiNotes(sourceNotes)

					if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
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
				const outgoingConnection = selectConnectionsWithSourceIds(state.room, [audioNodeWrapperId]).first(null)

				if (outgoingConnection && isAudioNodeType(outgoingConnection.targetType)) {
					const targetAudioNodeWrapper = stuffMaps[outgoingConnection.targetType].get(outgoingConnection.targetId)

					if (targetAudioNodeWrapper) {
						if (audioNodeWrapper.getConnectedTargetId() !== outgoingConnection.targetId) {
							audioNodeWrapper.connect(targetAudioNodeWrapper, outgoingConnection.targetId)
						}
					} else {
						audioNodeWrapper.disconnectAll()
					}
				} else {
					audioNodeWrapper.disconnectAll()
				}
			}
		}
	}

import {Store} from 'redux'
import {IDisposable} from '../common/common-types'
import {IConnectable} from '../common/common-types'
import {
	BasicInstrumentState, selectAllBasicInstrumentIds, selectBasicInstrument,
} from '../common/redux/basic-instruments-redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux/basic-sampler-redux'
import {IClientAppState, IClientRoomState} from '../common/redux/common-redux-types'
import {
	selectConnectionSourceNotes, selectConnectionsWithTargetIds,
} from '../common/redux/connections-redux'
import {setGlobalClockIndex} from '../common/redux/global-clock-redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicInstrument} from './Instruments/BasicInstrument'
import {IInstrument, IInstrumentOptions} from './Instruments/Instrument'

type InstrumentIdsSelector = (roomState: IClientRoomState) => string[]
type InstrumentStateSelector<S> = (roomState: IClientRoomState, id: string) => S
type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

type StuffMap = Map<string, IDisposable>

const stuffMap = Object.freeze({
	samplers: new Map<string, IDisposable>() as StuffMap,
	basicInstruments: new Map<string, IDisposable>() as StuffMap,
})

export const setupInstrumentManager = (store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {

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
				options => new BasicSamplerInstrument({...options, voiceCount: 20}),
				stuffMap.samplers,
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
				(options, instrumentState) => new BasicInstrument({...options, voiceCount: 9, ...instrumentState}),
				stuffMap.basicInstruments,
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
				const connection = selectConnectionsWithTargetIds(state.room, [instrumentId])[0]

				const instrumentState = instrumentStateSelector(state.room, instrumentId)

				const instrument = createIfNotExisting(
					stuff,
					instrumentId,
					stuff.get(instrumentId),
					() => instrumentCreator({audioContext, destination: preFx, voiceCount: 1}, instrumentState),
				)

				if (connection === undefined) {
					instrument.setMidiNotes([])
					return
				}

				const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)

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
	}
}

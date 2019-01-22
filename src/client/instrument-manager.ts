import {Store} from 'redux'
import {IDisposable} from '../common/common-types'
import {toArray} from '../common/common-utils'
import {
	BasicInstrumentState, selectAllBasicInstrumentIds, selectBasicInstrument,
} from '../common/redux/basic-instruments-redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux/basic-sampler-redux'
import {IClientAppState, IClientRoomState} from '../common/redux/common-redux-types'
import {selectConnectionSourceNotes, selectConnectionsWithTargetIds} from '../common/redux/connections-redux'
import {setGlobalClockIndex} from '../common/redux/global-clock-redux'
import {
	selectAllGridSequencers, setGridSequencerField,
} from '../common/redux/grid-Sequencers-redux'
import {
	InfiniteSequencerFields, selectAllInfiniteSequencers, setInfiniteSequencerField,
} from '../common/redux/infinite-sequencers-redux'
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

// let previousState: any = {}

export const setupInstrumentManager = (store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {

	const globalClock = new GridSequencerPlayer(
		audioContext,
		index => store.dispatch(setGlobalClockIndex(index)),
	)

	globalClock.play()

	store.subscribe(updateInstrumentLayer)

	function updateInstrumentLayer() {
		const state = store.getState()

		// if (state.room === previousState.room) return

		// previousState = state

		// console.log('instr manager update')

		handleSamplers()
		handleBasicInstruments()

		// handleGridSequencers()
		// handleInfiniteSequencers()

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

		function updateInstrumentType<I extends IInstrument, S>(
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

				const instrumentState = instrumentStateSelector(state.room, instrumentId)

				instrument.setMidiNotes(sourceNotes)

				if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
			})

		}

		// function handleGridSequencers() {
		// 	const gridSequencers = toArray(selectAllGridSequencers(state.room))

		// 	gridSequencers.forEach(gridSequencer => {
		// 		let sequencer = stuffMap.get(gridSequencer.id) as GridSequencerPlayer

		// 		sequencer = createIfNotExisting(gridSequencer.id, sequencer, () => {
		// 			return new GridSequencerPlayer(
		// 				audioContext,
		// 				index => store.dispatch(setGridSequencerField(gridSequencer.id, 'index', index)),
		// 			)
		// 		})

		// 		if (gridSequencer.isPlaying !== sequencer.isPlaying()) {
		// 			if (gridSequencer.isPlaying) {
		// 				sequencer.play()
		// 			} else {
		// 				sequencer.stop()
		// 			}
		// 		}
		// 	})
		// }

		// function handleInfiniteSequencers() {
		// 	const infiniteSequencers = toArray(selectAllInfiniteSequencers(state.room))

		// 	infiniteSequencers.forEach(infiniteSequencer => {
		// 		let sequencer = stuffMap.get(infiniteSequencer.id) as GridSequencerPlayer

		// 		sequencer = createIfNotExisting(infiniteSequencer.id, sequencer, () => {
		// 			return new GridSequencerPlayer(
		// 				audioContext,
		// 				index => store.dispatch(setInfiniteSequencerField(infiniteSequencer.id, InfiniteSequencerFields.index, index)),
		// 			)
		// 		})

		// 		if (infiniteSequencer.isPlaying !== sequencer.isPlaying()) {
		// 			if (infiniteSequencer.isPlaying) {
		// 				sequencer.play()
		// 			} else {
		// 				sequencer.stop()
		// 			}
		// 		}
		// 	})
		// }

		function createIfNotExisting<T>(stuff: StuffMap, id: string, thing: any, thingFactory: () => T): T {
			if (thing === undefined) {
				thing = thingFactory()
				stuff.set(id, thing)
			}
			return thing
		}
	}
}

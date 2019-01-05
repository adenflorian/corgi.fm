import {Store} from 'redux'
import {toArray} from '../common/common-utils'
import {
	BasicInstrumentState, selectAllBasicInstrumentIds, selectInstrument,
} from '../common/redux/basic-instruments-redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux/basic-sampler-redux'
import {IClientAppState, IClientRoomState} from '../common/redux/common-redux-types'
import {selectConnectionSourceNotes, selectConnectionsWithSourceOrTargetIds} from '../common/redux/connections-redux'
import {
	selectAllGridSequencers, setGridSequencerField,
} from '../common/redux/grid-Sequencers-redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicInstrument} from './Instruments/BasicInstrument'
import {IInstrument, IInstrumentOptions} from './Instruments/Instrument'

type InstrumentIdsSelector = (roomState: IClientRoomState) => string[]
type InstrumentStateSelector<S> = (roomState: IClientRoomState, id: string) => S
type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

const stuffMap = new Map<string, any>()

export const setupInstrumentManager = (store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {
	store.subscribe(() => {
		const state = store.getState()

		handleSamplers(state)

		handleBasicInstruments(state)

		handleGridSequencers(state)
	})

	function handleSamplers(state: IClientAppState) {
		updateInstrumentType(
			state,
			selectAllSamplerIds,
			selectSampler,
			options => new BasicSamplerInstrument({...options, voiceCount: 20}),
			(instrument: BasicSamplerInstrument, instrumentState: BasicSamplerState) => {
				instrument.setPan(instrumentState.pan)
				instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
				instrument.setAttack(instrumentState.attack)
				instrument.setRelease(instrumentState.release)
			},
		)
	}

	function handleBasicInstruments(state: IClientAppState) {
		updateInstrumentType(
			state,
			selectAllBasicInstrumentIds,
			selectInstrument,
			(options, instrumentState) => new BasicInstrument({...options, voiceCount: 9, ...instrumentState}),
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
		state: IClientAppState,
		instrumentIdsSelector: InstrumentIdsSelector,
		instrumentStateSelector: InstrumentStateSelector<S>,
		instrumentCreator: InstrumentFactory<I, S>,
		updateSpecificInstrument?: UpdateSpecificInstrument<I, S>,
	) {
		instrumentIdsSelector(state.room).forEach(instrumentId => {
			const connection = selectConnectionsWithSourceOrTargetIds(state.room, [instrumentId])[0]

			if (connection === undefined) return

			const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)
			let instrument: I = stuffMap.get(instrumentId)

			const instrumentState = instrumentStateSelector(state.room, instrumentId)

			instrument = createIfNotExisting(
				instrumentId,
				instrument,
				() => instrumentCreator({audioContext, destination: preFx, voiceCount: 1}, instrumentState),
			)

			instrument.setMidiNotes(sourceNotes)

			if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
		})
	}

	function handleGridSequencers(state: IClientAppState) {
		const gridSequencers = toArray(selectAllGridSequencers(state.room))

		gridSequencers.forEach(gridSequencer => {
			let sequencer = stuffMap.get(gridSequencer.id) as GridSequencerPlayer

			sequencer = createIfNotExisting(gridSequencer.id, sequencer, () => {
				return new GridSequencerPlayer(
					audioContext,
					index => store.dispatch(setGridSequencerField(gridSequencer.id, 'index', index)),
				)
			})

			if (gridSequencer.isPlaying !== sequencer.isPlaying()) {
				if (gridSequencer.isPlaying) {
					sequencer.play(gridSequencer.events.length)
				} else {
					sequencer.stop()
				}
			}
		})
	}

	function createIfNotExisting<T>(id: string, thing: any, thingFactory: () => T): T {
		if (thing === undefined) {
			thing = thingFactory()
			stuffMap.set(id, thing)
		}
		return thing
	}
}

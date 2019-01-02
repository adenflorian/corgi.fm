import {Store} from 'redux'
import {
	BasicInstrumentState, selectAllBasicInstrumentIds, selectInstrument,
} from '../common/redux/basic-instruments-redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux/basic-sampler-redux'
import {IClientAppState, IClientRoomState} from '../common/redux/common-redux-types'
import {addComplexObject, selectComplexObjectById} from '../common/redux/complex-objects-redux'
import {selectConnectionSourceNotes, selectConnectionsWithSourceOrTargetIds} from '../common/redux/connections-redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {BasicInstrument} from './Instruments/BasicInstrument'
import {IInstrument, IInstrumentOptions} from './Instruments/IInstrument'

type InstrumentIdsSelector = (roomState: IClientRoomState) => string[]
type InstrumentStateSelector<S> = (roomState: IClientRoomState, id: string) => S
type InstrumentCreator<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

export const setupInstrumentManager = (store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {
	store.subscribe(() => {
		const state = store.getState()

		handleSamplers(state)

		handleBasicInstruments(state)
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
		instrumentCreator: InstrumentCreator<I, S>,
		updateSpecificInstrument?: UpdateSpecificInstrument<I, S>,
	) {
		instrumentIdsSelector(state.room).forEach(instrumentId => {
			const connection = selectConnectionsWithSourceOrTargetIds(state.room, [instrumentId])[0]

			if (connection === undefined) return

			const sourceNotes = selectConnectionSourceNotes(state.room, connection.id)
			let instrument: I = selectComplexObjectById(state, instrumentId)

			const instrumentState = instrumentStateSelector(state.room, instrumentId)

			if (instrument === undefined) {
				instrument = instrumentCreator({audioContext, destination: preFx, voiceCount: 1}, instrumentState)
				store.dispatch(
					addComplexObject(instrumentId, instrument),
				)
			}

			instrument.setMidiNotes(sourceNotes)

			if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
		})
	}
}

import {Middleware} from 'redux'
import {
	IClientAppState, ShamuGraphAction, selectAllSamplersAsArray,
	BasicSamplerState,
} from '@corgifm/common/redux'
import {Sample} from '@corgifm/common/common-samples-stuff'
import {SamplesManager} from './SamplesManager'

type Actions = ShamuGraphAction

export const samplesManagerMiddleware =
	(samplesManager: SamplesManager): Middleware<{}, IClientAppState> =>
		({dispatch, getState}) => next => (action: Actions) => {

			const beforeState = getState()

			next(action)

			const afterState = getState()

			switch (action.type) {
				case 'REPLACE_SHAMU_GRAPH_STATE':
					return handleReplaceShamuGraphState()
				default: return
			}

			function handleReplaceShamuGraphState(): void {
				const fetchSamplerSamples = ({samples}: BasicSamplerState) =>
					samples.forEach(fetchSample)

				const fetchSample = ({filePath}: Sample) =>
					samplesManager.loadSampleAsync(filePath)

				return selectAllSamplersAsArray(afterState.room)
					.forEach(fetchSamplerSamples)
			}
		}

import {Middleware} from 'redux'
import {
	IClientAppState, ShamuGraphAction, selectAllSamplersAsArray,
	BasicSamplerState,
	BasicSamplerAction,
} from '@corgifm/common/redux'
import {Sample} from '@corgifm/common/common-samples-stuff'
import {SamplesManager} from './SamplesManager'

type Actions = ShamuGraphAction | BasicSamplerAction

export function createSamplesManagerMiddleware(
	samplesManager: SamplesManager,
): Middleware<{}, IClientAppState> {

		return ({dispatch, getState}) => next => (action: Actions) => {
			switch (action.type) {
				case 'REPLACE_SHAMU_GRAPH_STATE':
					next(action)
					// Do it after so that stuff will be deserialized
					return handleReplaceShamuGraphState(getState())
				case 'SET_SAMPLE':
					fetchSample(action.sample)
					return next(action)
				default: return next(action)
			}
		}

		function handleReplaceShamuGraphState(afterState: IClientAppState): void {
			const fetchSamplerSamples = ({samples}: BasicSamplerState) =>
				samples.forEach(fetchSample)

			return selectAllSamplersAsArray(afterState.room)
				.forEach(fetchSamplerSamples)
		}

		function fetchSample({filePath}: Sample) {
			return samplesManager.loadSampleAsync(filePath)
		}
	}

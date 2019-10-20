import {logger} from '@corgifm/common/logger'
import {simpleGlobalClientState} from '../../SimpleGlobalClientState'

export const corgiAnalyserName = 'corgi-analyser-processor'
export const corgiDownSamplerName = 'corgi-down-sampler-processor'

const audioWorkletNames = [
	// corgiAnalyserName,
	corgiDownSamplerName,
] as const

type AudioWorkletNames = typeof audioWorkletNames[number]

let x = 0

export async function loadAudioWorkletsAsync(audioContext: AudioContext) {
	if (simpleGlobalClientState.onAudioWorkletLoaded.currentValue) {
		logger.warn('AudioWorklet already loaded!')
	}
	try {
		await Promise.all(audioWorkletNames.map(async name => {
			logger.log('loading:', name)
			await _loadAudioWorkletAsync(audioContext)(name)
		}))
		logger.log('all audio worklets loaded!')
		simpleGlobalClientState.onAudioWorkletLoaded.invokeNextFrame(true)
	} catch (error) {
		logger.error('error loading audio worklet ☹️:', {error})
	}
}

function _loadAudioWorkletAsync(audioContext: AudioContext) {
	return async (workletName: AudioWorkletNames) => {
		await audioContext.audioWorklet.addModule(`WebAudio/AudioWorklets/Processors/${workletName}.js`)
		x++
		logger.log(workletName + ' audio worklet loaded! ' + x)
	}
}

// export function createCorgiAnalyserWorkletNode(audioContext: AudioContext) {
// 	return _createAudioWorkletNode(corgiAnalyserName, audioContext)
// }

export function createCorgiDownSamplerWorkletNode(audioContext: AudioContext) {
	return _createAudioWorkletNode(corgiDownSamplerName, audioContext)
}

function _createAudioWorkletNode(moduleName: AudioWorkletNames, audioContext: AudioContext): AudioWorkletNode | null {
	if (simpleGlobalClientState.onAudioWorkletLoaded.currentValue) {
		return new AudioWorkletNode(audioContext, moduleName)
	} else {
		return null
	}
}

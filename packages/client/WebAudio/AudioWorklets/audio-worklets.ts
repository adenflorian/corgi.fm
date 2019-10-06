import {logger} from '@corgifm/common/logger'

export const corgiAnalyserName = 'corgi-analyser-processor'

const audioWorkletNames = [corgiAnalyserName] as const

type AudioWorkletNames = typeof audioWorkletNames[number]

let x = 0

export async function loadAudioWorkletsAsync(audioContext: AudioContext) {
	try {
		for (const name of audioWorkletNames) {
			await _loadAudioWorkletAsync(audioContext)(name)
		}
		logger.log('all audio worklets loaded!')
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

export function createCorgiAnalyserWorkletNode(audioContext: AudioContext) {
	return _createAudioWorkletNode(corgiAnalyserName, audioContext)
}

function _createAudioWorkletNode(moduleName: AudioWorkletNames, audioContext: AudioContext): AudioWorkletNode {
	return new AudioWorkletNode(audioContext, moduleName)
}

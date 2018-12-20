import {isLocalDevClient} from '../is-prod-client'

export class SamplesManager {
	public static initAsync = async (audioContext: AudioContext) => {
		if (SamplesManager._isInitialized) return

		SamplesManager._isInitialized = true

		SamplesManager._sampleC4 = await fetch(`${getUrl()}/C4.mp3`)
			.then(async response => {
				return await audioContext.decodeAudioData(await response.arrayBuffer())
			})
	}

	private static _isInitialized = false
	private static _sampleC4: AudioBuffer

	public static get sampleC4() {
		return SamplesManager._sampleC4
	}
}

function getUrl() {
	if (isLocalDevClient()) {
		return `http://${window.location.hostname}:3000`
	} else {
		return `https://${window.location.host}`
	}
}

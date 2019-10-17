import WebMidi, {
	WebMidiEventConnected, WebMidiEventDisconnected, Input, Output,
} from 'webmidi'
import {logger} from '../client-logger'
import {CorgiObjectChangedEvent} from '../Experimental/CorgiEvents'

export class MidiService {
	public readonly onInputsChanged = new CorgiObjectChangedEvent([] as readonly Input[])
	public readonly onOutputsChanged = new CorgiObjectChangedEvent([] as readonly Output[])

	public constructor() {
		this._enableMidi()
	}

	private _enableMidi() {
		WebMidi.enable(err => {
			if (err) return logger.log('WebMidi could not be enabled.', err)

			logger.log('WebMidi enabled!')
			logger.log('inputs:', WebMidi.inputs)
			logger.log('outputs:', WebMidi.outputs)

			this._onInputsChanged()

			WebMidi.addListener('connected', this._onConnected)
			WebMidi.addListener('disconnected', this._onDisconnected)
		})
	}

	private _onInputsChanged() {
		this.onInputsChanged.invokeImmediately(WebMidi.inputs)
	}

	private readonly _onConnected = (event: WebMidiEventConnected) => {
		logger.log('[MidiService._onConnected]', event)
		this._onInputsChanged()
	}

	private readonly _onDisconnected = (event: WebMidiEventDisconnected) => {
		logger.log('[MidiService._onDisconnected]', event)
		this._onInputsChanged()
	}

	public dispose() {
		WebMidi.removeListener('connected', this._onConnected)
		WebMidi.removeListener('disconnected', this._onDisconnected)
	}
}

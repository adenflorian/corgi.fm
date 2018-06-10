import {Store} from 'redux'
import {IAppState} from './redux/configureStore'
import {virtualKeyPressed, virtualKeyUp} from './redux/virtual-keyboard-redux'

declare global {
	interface Navigator {
		requestMIDIAccess: (any) => Promise<any>
	}
}

let _store: Store
let _logger

export function setupMidiSupport(store: Store, logger) {
	_store = store
	_logger = logger

	if (navigator.requestMIDIAccess) {
		navigator.requestMIDIAccess({
			sysex: false, // this defaults to 'false' and we won't be covering sysex in this article.
		})
			.then(onMidiSuccess, onMidiFailure)
	} else {
		onMidiNotAvailable()
	}
}

function onMidiNotAvailable() {
	_logger.log('No MIDI support in your browser.')
}

function onMidiFailure() {
	_logger.log('fail')
}

type MidiAccess = any
type MIDIInput = any

function onMidiSuccess(midiAccess: MidiAccess) {
	_logger.log('success: ', midiAccess)

	for (const input of midiAccess.inputs.values()) {
		_logger.log('input: ', input)
		input.valueOf().onmidimessage = onMidiMessage
	}

	midiAccess.onstatechange = onStateChange
}

function onStateChange(event) {
	_logger.log('midi state change: ', event)

	if (event.port.type === 'input') {
		onInputStateChange(event.port)
	}
}

function onInputStateChange(input: MIDIInput) {
	if (input.state === 'disconnected') {
		onInputDisconnected(input)
	} else if (input.state === 'connected') {
		onInputConnected(input)
	}
}

function onInputDisconnected(input: MIDIInput) {
	_logger.log('input disconnected: ', input)
}

function onInputConnected(input: MIDIInput) {
	_logger.log('input connected: ', input)
	input.valueOf().onmidimessage = onMidiMessage
}

function onMidiMessage(event) {
	_logger.debug('MIDI MESSAGE!', event.data)
	// const note = message.data[1]
	// const velocity = message.data[0]

	const data = event.data
	// tslint:disable-next-line:no-bitwise
	const cmd = data[0] >> 4
	// tslint:disable-next-line:no-bitwise
	const channel = data[0] & 0xf
	// tslint:disable-next-line:no-bitwise
	const type = data[0] & 0xf0 // channel agnostic message type. Thanks, Phil Burk.
	const note = data[1]
	const velocity = data[2]

	// with pressure and tilt off
	// note off: 128, cmd: 8
	// note on: 144, cmd: 9
	// pressure / tilt on
	// pressure: 176, cmd 11:
	// bend: 224, cmd: 14

	const state: IAppState = _store.getState()
	const myClientId = state.websocket.myClientId

	switch (type) {
		case 144:
			_store.dispatch(virtualKeyPressed(myClientId, note))
			break
		case 128:
			_store.dispatch(virtualKeyUp(myClientId, note))
			break
	}

	if (velocity === 0) {
		_store.dispatch(virtualKeyUp(myClientId, note))
	}
}

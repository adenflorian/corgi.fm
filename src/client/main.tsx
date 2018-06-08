import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import io from 'socket.io-client'
import {ConnectedApp} from './app'
import {logger} from './logger'
import {configureStore, IAppState} from './redux/configureStore'
import {getFrequencyUsingHalfStepsFromA4, noteToHalfStepMap} from './redux/notes-middleware'
import {selectPressedNotes} from './redux/notes-redux'
import {OTHER_CLIENT_NOTE, SET_CLIENTS} from './redux/other-clients-redux'
import {SET_MY_CLIENT_ID, setInfo, setSocket} from './redux/websocket-redux'

const store = configureStore()

const socket = io('/')

store.dispatch(setSocket(socket))

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const onVolume = 0.1

class BasicInstrument {
	public oscillator = audioContext.createOscillator()
	public panNode = audioContext.createStereoPanner()

	constructor(destination) {
		this.oscillator.type = 'square'
		this.oscillator.frequency.value = 0

		this.oscillator.connect(this.panNode)
			.connect(destination)

		this.oscillator.start()
	}
}

const masterVolume = audioContext.createGain()
masterVolume.connect(audioContext.destination)

const myInstrument = new BasicInstrument(masterVolume)
myInstrument.panNode.pan.setValueAtTime(-1, audioContext.currentTime)

const otherClientsInstrument = new BasicInstrument(masterVolume)
otherClientsInstrument.panNode.pan.setValueAtTime(1, audioContext.currentTime)

changeMasterVolume(onVolume)

store.subscribe(() => {
	const state: IAppState = store.getState()
	const pressedNotes = selectPressedNotes(state.notes)

	if (pressedNotes.length === 0) {
		changeMyOscillatorFrequency(0)
	} else {
		const note = pressedNotes[0]
		const halfSteps = noteToHalfStepMap[note]
		const frequency = getFrequencyUsingHalfStepsFromA4(halfSteps)

		changeMyOscillatorFrequency(frequency || 0)
	}
})

window.addEventListener('keydown', e => {
	if (e.repeat) return

	store.dispatch({
		type: 'KEY_DOWN',
		e,
	})
})

window.addEventListener('keyup', e => {
	store.dispatch({
		type: 'KEY_UP',
		e,
	})
})

/** @param {number} newFrequency */
function changeMyOscillatorFrequency(newFrequency) {
	myInstrument.oscillator.frequency.value = newFrequency
	setFrequencyDivText(newFrequency)
}

/** @param {number} newFrequency */
function changeOtherClientsOscillatorFrequency(newFrequency) {
	otherClientsInstrument.oscillator.frequency.value = newFrequency
}

/** @param {number} newFrequency */
function changeMasterVolume(newGain) {
	masterVolume.gain.value = newGain
}

/** @param {string} newText */
function setFrequencyDivText(newText) {
	document.querySelector('#frequency').textContent = newText
}

socket.on('connect', () => {
	dispatchSetInfo('connected')
	logger.log('connected')
	setClientId(socket.id)
})

function setClientId(newClientId) {
	store.dispatch({
		type: SET_MY_CLIENT_ID,
		id: newClientId,
	})
}

socket.on('disconnect', reason => {
	dispatchSetInfo('disconnected: ' + reason)
	logger.log('disconnected: ' + reason)
})

socket.on('reconnect_attempt', attemptNumber => {
	dispatchSetInfo('reconnect_attempt: ' + attemptNumber)
	logger.log('reconnect_attempt: ' + attemptNumber)
})

socket.on('reconnecting', attemptNumber => {
	dispatchSetInfo('reconnecting: ' + attemptNumber)
	logger.log('reconnecting: ' + attemptNumber)
})

socket.on('reconnect_error', error => {
	dispatchSetInfo('reconnect_error: ' + JSON.stringify(error, null, 2))
	logger.log('reconnect_error: ' + JSON.stringify(error, null, 2))
})

socket.on('reconnect_failed', () => {
	dispatchSetInfo('reconnect_failed')
	logger.log('reconnect_failed')
})

socket.on('ping', () => {
	dispatchSetInfo('ping')
	logger.log('ping')
})

socket.on('pong', latency => {
	dispatchSetInfo('pong - latency: ' + latency)
	logger.log('pong - latency: ' + latency)
})

socket.on('reconnect', attemptNumber => {
	dispatchSetInfo('reconnected: ' + attemptNumber)
	logger.log('reconnected: ' + attemptNumber)
})

socket.on('connect_timeout', timeout => {
	dispatchSetInfo('connect_timeout: ' + timeout)
	logger.log('connect_timeout: ' + timeout)
})

socket.on('error', error => {
	dispatchSetInfo('error: ' + JSON.stringify(error, null, 2))
	logger.log('error: ' + JSON.stringify(error, null, 2))
})

socket.on('connect_error', error => {
	dispatchSetInfo('connection error: ' + JSON.stringify(error, null, 2))
	logger.log('connection error: ' + JSON.stringify(error, null, 2))
})

socket.on('clients', data => {
	logger.log('clients: ', data.clients)
	setClients(data.clients)
})

function setClients(newClients) {
	store.dispatch({
		type: SET_CLIENTS,
		clients: newClients,
	})
}

socket.on('note', note => {
	logger.debug('note: ', note)
	changeOtherClientsOscillatorFrequency(note.frequency)

	store.dispatch({
		type: OTHER_CLIENT_NOTE,
		note,
		clientId: note.clientId,
	})
})

function dispatchSetInfo(newInfo) {
	store.dispatch(setInfo(newInfo))
}

ReactDOM.render(
	<Provider store={store}>
		<ConnectedApp />
	</Provider>,
	document.getElementById('react-app'),
)

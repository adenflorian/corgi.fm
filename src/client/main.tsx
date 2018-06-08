import * as React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {createStore} from 'redux'
import io from 'socket.io-client'
import {ConnectedApp} from './app'
import {logger} from './logger'
import {selectPressedNotes} from './redux/notes-redux'
import {rootReducer} from './redux/rootReducer'

declare const __REDUX_DEVTOOLS_EXTENSION__: () => any

const store = createStore(
	rootReducer,
	typeof __REDUX_DEVTOOLS_EXTENSION__ !== 'undefined' && __REDUX_DEVTOOLS_EXTENSION__(),
)

const socket = io('/')

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

class BasicInstrument {
	public oscillator = audioContext.createOscillator()
	public panNode = audioContext.createStereoPanner()

	constructor(destination) {
		this.oscillator.type = 'sawtooth'
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

const offVolume = 0.0
const onVolume = 0.1

masterVolume.gain.value = onVolume

const downKeys = {}

const clientNoteMap = {}

const keyToNoteMap = {
	a: 'C',
	w: 'C#',
	s: 'D',
	e: 'D#',
	d: 'E',
	f: 'F',
	t: 'F#',
	g: 'G',
	y: 'G#',
	h: 'A',
	u: 'A#',
	j: 'B',
}

const noteToHalfStepMap = {
	'C': 3,
	'C#': 4,
	'D': 5,
	'D#': 6,
	'E': 7,
	'F': 8,
	'F#': 9,
	'G': 10,
	'G#': 11,
	'A': 12,
	'A#': 13,
	'B': 14,
}

store.subscribe(() => {
	const state: any = store.getState()
	const pressedNotes = selectPressedNotes(state.notes)

	if (pressedNotes.length === 0) {
		changeMyOscillatorFrequency(0)
		socket.emit('note', {frequency: 0})
	} else {
		const note = pressedNotes[0]
		const halfSteps = noteToHalfStepMap[note]
		const freq = getFrequencyUsingHalfStepsFromA4(halfSteps)

		changeMyOscillatorFrequency(freq || 0)

		socket.emit('note', {frequency: freq})
	}
})

window.addEventListener('keydown', e => {
	store.dispatch({
		type: 'KEY_DOWN',
		key: e.key,
	})

	const keyname = e.key

	if (isMidiKey(keyname) === false) return
	if (downKeys[keyname]) return
	downKeys[keyname] = true

	store.dispatch({
		type: 'NOTE_PRESSED',
		note: keyToNoteMap[keyname],
	})
})

window.addEventListener('keyup', e => {
	store.dispatch({
		type: 'KEY_UP',
		key: e.key,
	})
	const keyname = e.key
	if (isMidiKey(keyname) === false) return

	downKeys[keyname] = false

	store.dispatch({
		type: 'NOTE_UP',
		note: keyToNoteMap[keyname],
	})
})

function GetHalfStepsForKey(keyname) {
	// Add 3 to A4 to get C4
	// Subtract 12 to get to C3
	return halfStepMap[keyname] + 3 - 12
}

const pianoKeys = Object.freeze({
	'C4': {color: 'white', keyboardKey: 'a'},
	'C#4': {color: 'black', keyboardKey: 'w'},
	'D4': {color: 'white', keyboardKey: 's'},
	'D#4': {color: 'black', keyboardKey: 'e'},
	'E4': {color: 'white', keyboardKey: 'd'},
	'F4': {color: 'white', keyboardKey: 'f'},
	'F#4': {color: 'black', keyboardKey: 't'},
	'G4': {color: 'white', keyboardKey: 'g'},
	'G#4': {color: 'black', keyboardKey: 'y'},
	'A4': {color: 'white', keyboardKey: 'h'},
	'A#4': {color: 'black', keyboardKey: 'u'},
	'B4': {color: 'white', keyboardKey: 'j'},
})

const halfStepMap = {
	'a': 3,   // white C
	'w': 4,   // black C#
	's': 5,   // white D
	'e': 6,   // black D#
	'd': 7,   // white E
	'f': 8,   // white F
	't': 9,   // black F#
	'g': 10,   // white G
	'y': 11,   // black G#
	'h': 12,   // white A
	'u': 13,   // black A#
	'j': 14,   // white B
	'k': 15,   // white C
	'o': 16,   // black C#
	'l': 17,   // white D
	'p': 18,   // black D#
	';': 19,   // white E
	// stop at semi colon
	// single quote opens a quick find box
	// so we wouldn't want to sue that
}

/** @param {string} keyname */
function isMidiKey(keyname) {
	return halfStepMap[keyname.toLowerCase()] !== undefined
}

/** @param {number} halfSteps */
function getFrequencyUsingHalfStepsFromA4(halfSteps) {
	const fixedNoteFrequency = 440
	const twelthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelthRootOf2, halfSteps)
}

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
function changeGain(newGain) {
	masterVolume.gain.value = newGain
}

/** @param {string} newText */
function setFrequencyDivText(newText) {
	document.querySelector('#frequency').textContent = newText
}

let myClientId

{
	socket.on('connect', () => {
		setInfo('connected')
		logger.log('connected')
		setClientId(socket.id)
	})

	socket.on('disconnect', reason => {
		setInfo('disconnected: ' + reason)
		logger.log('disconnected: ' + reason)
	})

	socket.on('reconnect_attempt', attemptNumber => {
		setInfo('reconnect_attempt: ' + attemptNumber)
		logger.log('reconnect_attempt: ' + attemptNumber)
	})

	socket.on('reconnecting', attemptNumber => {
		setInfo('reconnecting: ' + attemptNumber)
		logger.log('reconnecting: ' + attemptNumber)
	})

	socket.on('reconnect_error', error => {
		setInfo('reconnect_error: ' + JSON.stringify(error, null, 2))
		logger.log('reconnect_error: ' + JSON.stringify(error, null, 2))
	})

	socket.on('reconnect_failed', () => {
		setInfo('reconnect_failed')
		logger.log('reconnect_failed')
	})

	socket.on('ping', () => {
		setInfo('ping')
		logger.log('ping')
	})

	socket.on('pong', latency => {
		setInfo('pong - latency: ' + latency)
		logger.log('pong - latency: ' + latency)
	})

	socket.on('reconnect', attemptNumber => {
		setInfo('reconnected: ' + attemptNumber)
		logger.log('reconnected: ' + attemptNumber)
	})

	socket.on('connect_timeout', timeout => {
		setInfo('connect_timeout: ' + timeout)
		logger.log('connect_timeout: ' + timeout)
	})

	socket.on('error', error => {
		setInfo('error: ' + JSON.stringify(error, null, 2))
		logger.log('error: ' + JSON.stringify(error, null, 2))
	})

	socket.on('connect_error', error => {
		setInfo('connection error: ' + JSON.stringify(error, null, 2))
		logger.log('connection error: ' + JSON.stringify(error, null, 2))
	})

	socket.on('clients', data => {
		logger.log('clients: ', data.clients)
		setClients(data.clients)
	})

	socket.on('note', note => {
		logger.debug('note: ', note)
		clientNoteMap[note.clientId] = note
		renderClients()
		changeOtherClientsOscillatorFrequency(note.frequency)
	})
}

function setInfo(newInfo) {
	document.querySelector('#info').textContent = newInfo
}

function setClientId(newClientId) {
	myClientId = newClientId
	document.querySelector('#clientId').textContent = newClientId
}

let clients = []

function setClients(newClients) {
	clients = newClients
	store.dispatch({
		type: 'SET_CLIENTS',
		clients: newClients,
	})
	renderClients()
}

function renderClients() {
	const clientsDiv = document.querySelector('#otherClients')

	while (clientsDiv.hasChildNodes()) {
		clientsDiv.removeChild(clientsDiv.lastChild)
	}

	clients.forEach(client => {
		if (client.id === myClientId) {return }
		const newClientDiv = document.createElement('div')
		newClientDiv.textContent = client.id
		newClientDiv.textContent += ` ${(clientNoteMap[client.id] && clientNoteMap[client.id].frequency) || 0}`
		clientsDiv.appendChild(newClientDiv)
	})
}

ReactDOM.render(
	<Provider store={store}>
		<ConnectedApp />
	</Provider>,
	document.getElementById('react-app'),
)

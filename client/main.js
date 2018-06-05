import {logger} from './logger.js'
const socket = io('http://localhost')

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

class BasicInstrument {
	constructor(destination) {
		this.oscillator = audioCtx.createOscillator()
		this.oscillator.type = 'sawtooth'
		this.oscillator.frequency.value = 0
		this.panNode = audioCtx.createStereoPanner()

		this.oscillator.connect(this.panNode)
			.connect(destination)

		this.oscillator.start()
	}
}

const gainNode = audioCtx.createGain()
gainNode.connect(audioCtx.destination)

const myInstrument = new BasicInstrument(gainNode)
myInstrument.panNode.pan.setValueAtTime(-1, audioCtx.currentTime)

const otherClientsInstrument = new BasicInstrument(gainNode)
otherClientsInstrument.panNode.pan.setValueAtTime(1, audioCtx.currentTime)

const offVolume = 0.0
const onVolume = 0.1

gainNode.gain.value = onVolume

const downKeys = {}

const clientNoteMap = {}

window.addEventListener('keydown', (e) => {
	const keyname = e.key

	if (isMidiKey(keyname) === false) return
	if (downKeys[keyname]) return
	downKeys[keyname] = true

	const halfSteps = halfStepMap[keyname]
	const freq = getFrequencyUsingStepsFromA4(halfSteps)

	changeMyOscillatorFrequency(freq)

	socket.emit('note', {frequency: freq})
})

window.addEventListener('keyup', (e) => {
	const keyname = e.key

	downKeys[keyname] = false

	changeMyOscillatorFrequency(0)

	socket.emit('note', {frequency: 0})
})

const halfStepMap = {
	a: 0,   // white
	w: 1,   // black
	s: 2,   // white
	e: 3,   // black
	d: 4,   // white
	f: 5,   // white
	t: 6,   // black
	g: 7,   // white
	y: 8,   // black
	h: 9,   // white
	u: 10,   // black
	j: 11,   // white
	k: 12,   // white
	o: 13,   // black
	l: 14,   // white
	p: 15,   // black
}

/** @param {string} keyname */
function isMidiKey(keyname) {
	return halfStepMap[keyname.toLowerCase()] !== undefined
}

/** @param {number} steps */
function getFrequencyUsingStepsFromA4(steps) {
	const fixedNoteFrequency = 440
	const twelthRootOf2 = Math.pow(2, 1 / 12) // 1.059463094359...

	return fixedNoteFrequency * Math.pow(twelthRootOf2, steps)
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
	gainNode.gain.value = newGain
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

	socket.on('disconnect', (reason) => {
		setInfo('disconnected: ' + reason)
		logger.log('disconnected: ' + reason)
	})

	socket.on('reconnect_attempt', (attemptNumber) => {
		setInfo('reconnect_attempt: ' + attemptNumber)
		logger.log('reconnect_attempt: ' + attemptNumber)
	})

	socket.on('reconnecting', (attemptNumber) => {
		setInfo('reconnecting: ' + attemptNumber)
		logger.log('reconnecting: ' + attemptNumber)
	})

	socket.on('reconnect_error', (error) => {
		setInfo('reconnect_error: ' + JSON.stringify(error, 2))
		logger.log('reconnect_error: ' + JSON.stringify(error, 2))
	})

	socket.on('reconnect_failed', () => {
		setInfo('reconnect_failed')
		logger.log('reconnect_failed')
	})

	socket.on('ping', () => {
		setInfo('ping')
		logger.log('ping')
	})

	socket.on('pong', (latency) => {
		setInfo('pong - latency: ' + latency)
		logger.log('pong - latency: ' + latency)
	})

	socket.on('reconnect', (attemptNumber) => {
		setInfo('reconnected: ' + attemptNumber)
		logger.log('reconnected: ' + attemptNumber)
	})

	socket.on('connect_timeout', (timeout) => {
		setInfo('connect_timeout: ' + timeout)
		logger.log('connect_timeout: ' + timeout)
	})

	socket.on('error', (error) => {
		setInfo('error: ' + JSON.stringify(error, 2))
		logger.log('error: ' + JSON.stringify(error, 2))
	})

	socket.on('connect_error', (error) => {
		setInfo('connection error: ' + JSON.stringify(error, 2))
		logger.log('connection error: ' + JSON.stringify(error, 2))
	})

	socket.on('clients', ({clients}) => {
		logger.log('clients: ', clients)
		setClients(clients)
	})

	socket.on('note', (note) => {
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
	renderClients()
}

function renderClients() {
	const clientsDiv = document.querySelector('#otherClients')

	while (clientsDiv.hasChildNodes()) {
		clientsDiv.removeChild(clientsDiv.lastChild)
	}

	clients.forEach(client => {
		if (client.id === myClientId) return
		const newClientDiv = document.createElement('div')
		newClientDiv.textContent = client.id
		newClientDiv.textContent += ` ${(clientNoteMap[client.id] && clientNoteMap[client.id].frequency) || 0}`
		clientsDiv.appendChild(newClientDiv)
	})
}



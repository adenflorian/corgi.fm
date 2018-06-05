const socket = io('http://localhost')

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

const oscillator = audioCtx.createOscillator()
const gainNode = audioCtx.createGain()

oscillator.connect(gainNode)
gainNode.connect(audioCtx.destination)

const offVolume = 0.0
const onVolume = 0.1

oscillator.type = 'sawtooth' // sine wave — other values are 'square', 'sawtooth', 'triangle' and 'custom'
oscillator.start()

gainNode.gain.value = offVolume

window.addEventListener('keydown', (e) => {
	const keyname = e.key

	if (isMidiKey(keyname) === false) return

	const halfSteps = halfStepMap[keyname]
	const freq = getFrequencyUsingStepsFromA4(halfSteps)

	changeOscillatorFrequency(freq)
	changeGain(onVolume)
	socket.emit('note', {frequency: freq})
})

window.addEventListener('keyup', () => {
	changeGain(offVolume)
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
function changeOscillatorFrequency(newFrequency) {
	oscillator.frequency.value = newFrequency
	setFrequencyDivText(newFrequency)
}

/** @param {number} newFrequency */
function changeGain(newGain) {
	gainNode.gain.value = newGain
	if (newGain === offVolume) {
		setFrequencyDivText('0')
	}
}

/** @param {string} newText */
function setFrequencyDivText(newText) {
	document.querySelector('#frequency').textContent = newText
}




{
	socket.on('connect', () => {
		setInfo('connected')
		console.log('connected')
		setClientId(socket.id)
	})

	socket.on('disconnect', (reason) => {
		setInfo('disconnected: ' + reason)
		console.log('disconnected: ' + reason)
	})

	socket.on('reconnect_attempt', (attemptNumber) => {
		setInfo('reconnect_attempt: ' + attemptNumber)
		console.log('reconnect_attempt: ' + attemptNumber)
	})

	socket.on('reconnecting', (attemptNumber) => {
		setInfo('reconnecting: ' + attemptNumber)
		console.log('reconnecting: ' + attemptNumber)
	})

	socket.on('reconnect_error', (error) => {
		setInfo('reconnect_error: ' + JSON.stringify(error, 2))
		console.log('reconnect_error: ' + JSON.stringify(error, 2))
	})

	socket.on('reconnect_failed', () => {
		setInfo('reconnect_failed')
		console.log('reconnect_failed')
	})

	socket.on('ping', () => {
		setInfo('ping')
		console.log('ping')
	})

	socket.on('pong', (latency) => {
		setInfo('pong - latency: ' + latency)
		console.log('pong - latency: ' + latency)
	})

	socket.on('reconnect', (attemptNumber) => {
		setInfo('reconnected: ' + attemptNumber)
		console.log('reconnected: ' + attemptNumber)
	})

	socket.on('connect_timeout', (timeout) => {
		setInfo('connect_timeout: ' + timeout)
		console.log('connect_timeout: ' + timeout)
	})

	socket.on('error', (error) => {
		setInfo('error: ' + JSON.stringify(error, 2))
		console.log('error: ' + JSON.stringify(error, 2))
	})

	socket.on('connect_error', (error) => {
		setInfo('connection error: ' + JSON.stringify(error, 2))
		console.log('connection error: ' + JSON.stringify(error, 2))
	})

	socket.on('clients', ({clients}) => {
		console.log('clients: ', clients)
		setClients(clients)
	})
}


function setInfo(newInfo) {
	document.querySelector('#info').textContent = newInfo
}

function setClientId(newClientId) {
	document.querySelector('#clientId').textContent = newClientId
}

function setClients(clients) {
	const clientsDiv = document.querySelector('#clients')

	while (clientsDiv.hasChildNodes()) {
		clientsDiv.removeChild(clientsDiv.lastChild);
	}

	clients.forEach(client => {
		const newClientDiv = document.createElement('div');
		newClientDiv.textContent = client.id;
		clientsDiv.appendChild(newClientDiv)
	});
}



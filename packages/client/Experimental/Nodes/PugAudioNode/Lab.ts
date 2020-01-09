abstract class LabNode {
	public connect(target: LabNode | LabAudioParam) {

	}

	public disconnect(target?: LabNode | LabAudioParam) {

	}

	public setVoiceCount(newVoiceCount: number | 'mono') {

	}

	public dispose() {

	}
}

class LabAudioParam {
	public set value(value: number) {}
	public linearRampToValueAtTime(value: number, time: number, voices: number | 'all' = 'all') {

	}
}

class LabOscillator extends LabNode {
	public readonly frequency: LabAudioParam
	public set type(value: OscillatorType) {}

	public constructor(protected readonly _audioContext: AudioContext, voiceCount: number | 'mono' | 'autoPoly') {
		super()
		this.frequency = new LabAudioParam()
	}
}

class LabGain extends LabNode {
	public readonly gain: LabAudioParam
	public constructor(protected readonly _audioContext: AudioContext, voiceCount: number | 'mono' | 'autoPoly') {
		super()
		this.gain = new LabAudioParam()
	}
}

const audioContext = new AudioContext()

// 1 voice (autoPoly, inherits voice count from source nodes)
const myOsc1 = new LabOscillator(audioContext, 'autoPoly')

// 1 voice (poly, downstream autoPoly nodes will match this count)
const myOsc2 = new LabOscillator(audioContext, 1)

// 1 voice (mono)
const myGain = new LabGain(audioContext, 'mono')

// 1 autoPoly voice connecting to 1 mono voice
myOsc1.connect(myGain)

// Creates more voices, but they aren't connected to anything yet
myOsc2.setVoiceCount(7)

// 6 voices will be created in myOsc1, and each of the 7 voices between the 2 nodes will be connected
// The 6 new voices in myOsc1 will all connect to the same internal gain node in myGain
myOsc2.connect(myOsc1.frequency)

// will set the type on all 7 oscillators, and value will be stored and used when new voices are created in the future
myOsc1.type = 'sawtooth'

myGain.gain.value = 0

myGain.gain.linearRampToValueAtTime(0.5, 4)

// linearRampToValueAtTime will be called on voice 2
myOsc2.frequency.linearRampToValueAtTime(220, 6, 2)

// all 7 oscillators are disconnect from myGain
myOsc1.disconnect(myGain)

// 4 voices in myOsc1 and myOsc2 are disconnected and deleted
myOsc2.setVoiceCount(3)

// all 4 oscillators are disconnected from myOsc1.frequency
// myOsc1 goes back to 1 oscillator, because there are no sources connected
myOsc2.disconnect(myOsc1.frequency)

myGain.disconnect()

myOsc1.dispose()

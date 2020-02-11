import {CssColor} from '@corgifm/common/shamu-color'
import {lfoFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	lfoRateValueToString, detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabGain, LabAudioBufferSourceNode} from './PugAudioNode/Lab'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

export class LowFrequencyOscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _bufferSource: LabAudioBufferSourceNode
	private readonly _gain: LabGain
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Low Frequency Oscillator', color: CssColor.purple})

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sine', oscillatorTypes)
		this._customEnumParams = arrayToESIdKeyMap([this._type] as ExpCustomEnumParam<string>[])

		this._bufferSource = new LabAudioBufferSourceNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		this._bufferSource.loop = true
		this._bufferSource.loopEnd = 1
		this._bufferSource.playbackRate.onMakeVoice = rate => rate.setValueAtTime(0, 0)

		this._gain = new LabGain({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		this._gain.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)

		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)

		this._bufferSource
			.connect(this._gain)
			.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._bufferSource.playbackRate, 1, 32, 'unipolar', {valueString: lfoRateValueToString, curveFunctions: lfoFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._bufferSource.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		const gainParam = new ExpAudioParam('gain', this._gain.gain, 1, 1, 'unipolar', {valueString: percentageValueString})
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam, gainParam])

		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)
		this._ports = arrayToESIdKeyMap([frequencyPort, detunePort, gainPort, outputPort])

		this._type.onChange.subscribe(this.onTypeChange)
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._bufferSource.dispose()
			this._gain.dispose()
		})
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._bufferSource.buffer = generateWave(type, this._audioContext)
	}
}

function generateWave(type: OscillatorType, audioContext: AudioContext): AudioBuffer {
	switch (type) {
		case "sawtooth": return generateSawtoothWaveBuffer(audioContext)
		case "sine": return generateSineWaveBuffer(audioContext)
		case "square": return generateSquareWaveBuffer(audioContext)
		case "triangle": return generateTriangleWaveBuffer(audioContext)
	}
}

function generateSineWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = Math.sin(2 * Math.PI * time)
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateTriangleWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (-Math.abs((4 * time) - 2)) + 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateSawtoothWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (2 * time) - 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateSquareWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (time % 1) > 0.5 ? -1 : 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

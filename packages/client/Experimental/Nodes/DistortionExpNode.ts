/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {percentageValueString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
} from '../ExpPorts'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {createCorgiDownSamplerWorkletNode} from '../../WebAudio/AudioWorklets/audio-worklets'
import {logger} from '../../client-logger'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class DistortionExpNode extends CorgiNode {
	private readonly _downSamplerWorkletNode: AudioWorkletNode
	private readonly _dryWetChain: DryWetChain

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const downSamplerWorkletNode = createCorgiDownSamplerWorkletNode(corgiNodeArgs.audioContext)

		const dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, downSamplerWorkletNode)

		let driveAudioParam = downSamplerWorkletNode.parameters.get('drive')

		if (!driveAudioParam) {
			logger.error('driveAudioParam not defined! Something wrong with AudioWorklet stuff:', {driveAudioParam})
			driveAudioParam = corgiNodeArgs.audioContext.createGain().gain
		}

		const driveParam = new ExpAudioParam('drive', driveAudioParam, 0.25, 1, 'unipolar', {valueString: percentageValueString})
		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
		const drivePort = new ExpNodeAudioParamInputPort(driveParam, () => this, corgiNodeArgs.audioContext, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain, 'bipolar')

		super(corgiNodeArgs, {
			ports: [inputPort, drivePort, outputPort],
			audioParams: [driveParam],
		})

		// Make sure to add these to the dispose method!
		this._downSamplerWorkletNode = downSamplerWorkletNode
		this._dryWetChain = dryWetChain
	}

	public getColor(): string {
		return CssColor.orange
	}

	public getName() {return 'Downsample'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._dryWetChain.wetOnly()
	}

	protected _disable() {
		this._dryWetChain.dryOnly()
	}

	protected _dispose() {
		this._downSamplerWorkletNode.disconnect()
		this._dryWetChain.dispose()
	}
}

// /* eslint-disable no-empty-function */
// import {CssColor} from '@corgifm/common/shamu-color'
// import {gainDecibelValueToString, percentageValueString} from '../../client-constants'
// import {
// 	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort,
// } from '../ExpPorts'
// import {ExpAudioParam, ExpCustomNumberParam, buildCustomNumberParamDesc} from '../ExpParams'
// import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
// import {DryWetChain} from './NodeHelpers/DryWetChain'

// export class DistortionExpNode extends CorgiNode {
// 	private readonly _waveShaper: WaveShaperNode
// 	private readonly _preGain: GainNode
// 	private readonly _dryWetChain: DryWetChain

// 	public constructor(
// 		corgiNodeArgs: CorgiNodeArgs,
// 	) {
// 		const preGain = corgiNodeArgs.audioContext.createGain()
// 		const waveShaper = corgiNodeArgs.audioContext.createWaveShaper()
// 		// waveShaper.curve = new Float32Array([-1, 1])
// 		waveShaper.oversample = '4x'

// 		preGain.connect(waveShaper)

// 		const dryWetChain = new DryWetChain(corgiNodeArgs.audioContext, preGain, waveShaper)

// 		const gainParam = new ExpAudioParam('preGain', preGain.gain, 1, 20, 'unipolar', {valueString: gainDecibelValueToString})

// 		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, dryWetChain.inputGain)
// 		const gainPort = new ExpNodeAudioParamInputPort(gainParam, () => this, corgiNodeArgs.audioContext, 'offset')

// 		const outputPort = new ExpNodeAudioOutputPort('output', 'output', () => this, dryWetChain.outputGain, 'bipolar')

// 		super(corgiNodeArgs, {
// 			ports: [inputPort, gainPort, outputPort],
// 			audioParams: [gainParam],
// 			customNumberParams: new Map<Id, ExpCustomNumberParam>([
// 				// TODO Store in private class field
// 				buildCustomNumberParamDesc('drive', 0.25, 0, 1, 1, percentageValueString),
// 			]),
// 		})

// 		waveShaper.curve = makeDownSamplingCurve(this._distortionAmount)

// 		// Make sure to add these to the dispose method!
// 		this._preGain = preGain
// 		this._waveShaper = waveShaper
// 		this._dryWetChain = dryWetChain
// 	}

// 	private get _distortionAmount() {return this._customNumberParams.get('drive')!.value}

// 	public onCustomNumberParamChange(paramId: Id, newValue: number) {
// 		super.onCustomNumberParamChange(paramId, newValue)

// 		if (paramId === 'drive') {
// 			this._waveShaper.curve = makeDownSamplingCurve(this._distortionAmount)
// 		}
// 	}

// 	public getColor(): string {
// 		return CssColor.orange
// 	}

// 	public getName() {return 'Wave Shaper'}

// 	public render() {
// 		return this.getDebugView()
// 	}

// 	protected _enable() {
// 		this._dryWetChain.wetOnly()
// 	}

// 	protected _disable() {
// 		this._dryWetChain.dryOnly()
// 	}

// 	protected _dispose() {
// 		this._waveShaper.disconnect()
// 		this._dryWetChain.dispose()
// 	}
// }

// function makeDistortionCurve(amount = 50) {
// 	const k = amount
// 	const sampleCount = 44100
// 	const curve = new Float32Array(sampleCount)
// 	const deg = Math.PI / 180
// 	let i = 0
// 	let x
// 	for (; i < sampleCount; ++i) {
// 		x = i * 2 / sampleCount - 1
// 		curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
// 	}
// 	return curve
// }

// const minParts = 2
// const maxParts = 128

// function makeDownSamplingCurve(drive: number) {
// 	const parts = 5
// 	return new Float32Array([-1, -1, -0.5, -0.5, 0, 0, 0.5, 0.5, 1, 1])
// }

// // Curve functions
// const length = 65535
// const halfLength = Math.floor(length / 2) // 32767

// function createExpWaveShaperCurve(b: number) {
// 	return new Float32Array(length).map((_, i) => {
// 		if (i < halfLength) {
// 			return b
// 		} else {
// 			const x = (i - halfLength) / halfLength
// 			return b ** (-x + 1)
// 		}
// 	})
// }

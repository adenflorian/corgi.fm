import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../../ExpPorts'
import {ExpAudioParams, ExpCustomEnumParams,
	ExpCustomEnumParam, ExpCustomNumberParams, ExpCustomNumberParam, ExpAudioParam} from '../../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'
import {AutomaticPolyphonicMidiConverterHound} from '../AutomaticPolyphonicMidiConverterNode'
import {OscillatorExpHound} from '../ExpOscillatorNode'
import {EnvelopeHound} from '../EnvelopeNode'
import {LabGain, LabStereoPannerNode} from '../PugAudioNode/Lab'
import {FilterHound} from '../FilterNode'
import {getEnvelopeControlsComponent} from '../EnvelopeControls'
import {gainDecibelValueToString, panValueToString} from '../../../client-constants'

export class ExpBasicSynthNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _autoPolyHound: AutomaticPolyphonicMidiConverterHound
	private readonly _oscillatorHound: OscillatorExpHound
	private readonly _envelopeHound: EnvelopeHound
	private readonly _filterHound: FilterHound
	private readonly _envelopeGain: LabGain
	private readonly _pan: LabStereoPannerNode
	private readonly _masterGain: LabGain
	public readonly attack: ExpCustomNumberParam
	public readonly hold: ExpCustomNumberParam
	public readonly decay: ExpCustomNumberParam
	public readonly sustain: ExpCustomNumberParam
	public readonly release: ExpCustomNumberParam

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Synth', color: CssColor.green})

		this._oscillatorHound = new OscillatorExpHound(corgiNodeArgs)
		this._envelopeHound = new EnvelopeHound(corgiNodeArgs)
		this._filterHound = new FilterHound(corgiNodeArgs)
		this._autoPolyHound = new AutomaticPolyphonicMidiConverterHound(
			this._audioContext, this._onHoundMidiActionOut, false)

		this.attack = this._envelopeHound.attack
		this.hold = this._envelopeHound.hold
		this.decay = this._envelopeHound.decay
		this.sustain = this._envelopeHound.sustain
		this.release = this._envelopeHound.release

		this._envelopeGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'ExpBasicSynthNode.envelopeGain'})
		this._pan = new LabStereoPannerNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'ExpBasicSynthNode.pan'})
		this._masterGain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'ExpBasicSynthNode.masterGain'})
		this._masterGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)

		this._autoPolyHound.pitchSource.connect(this._oscillatorHound.frequencyParam.audioParam)

		this._envelopeHound.waveShaperOutput.connect(this._envelopeGain.gain)

		this._oscillatorHound.outputChain.output
			.connect(this._filterHound.filter)
			.connect(this._envelopeGain)
			.connect(this._pan)
			.connect(this._masterGain)

		this._customEnumParams = arrayToESIdKeyMap([this._filterHound.type, this._oscillatorHound.type] as ExpCustomEnumParam<string>[])

		const panParam = new ExpAudioParam('pan', this._pan.pan, 0, 1, 'bipolar', {valueString: panValueToString})
		const masterGainParam = new ExpAudioParam('gain', this._masterGain.gain, 1, 1, 'unipolar', {valueString: gainDecibelValueToString})
		this._audioParams = arrayToESIdKeyMap([
			this._oscillatorHound.detuneParam,
			this._oscillatorHound.unisonDetuneParam,
			this._filterHound.frequencyParam,
			panParam,
			masterGainParam,
		])

		const midiInputPort = new ExpMidiInputPort('midiIn', 'midiIn', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		// const frequencyPort = new ExpNodeAudioParamInputPort(this._oscillatorHound.frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.detuneParam, this, corgiNodeArgs, 'center')
		const unisonDetunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.unisonDetuneParam, this, corgiNodeArgs, 'offset')
		const filterFrequencyPort = new ExpNodeAudioParamInputPort(this._filterHound.frequencyParam, this, corgiNodeArgs, 'center')
		const panPort = new ExpNodeAudioParamInputPort(panParam, this, corgiNodeArgs, 'center')
		const gainPort = new ExpNodeAudioParamInputPort(masterGainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._masterGain)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([
			midiInputPort, detunePort, unisonDetunePort, filterFrequencyPort, panPort, gainPort, outputPort, this._midiOutputPort])

		this._customNumberParams = arrayToESIdKeyMap([
			this._oscillatorHound.unisonCount,
			this._autoPolyHound.voiceCount,
			this._autoPolyHound.portamento,
			this._envelopeHound.attack,
			this._envelopeHound.hold,
			this._envelopeHound.decay,
			this._envelopeHound.sustain,
			this._envelopeHound.release,
		])

		this._autoPolyHound.init()
	}

	public render = () => this.getDebugView(getEnvelopeControlsComponent())

	protected _enable = () => this._oscillatorHound.outputChain.enable()
	protected _disable = () => this._oscillatorHound.outputChain.disable()

	protected _dispose() {
		this._autoPolyHound.dispose()
		this._oscillatorHound.dispose()
	}

	private readonly _onHoundMidiActionOut = (action: MidiAction) => {
		this._envelopeHound.receiveMidiAction(action)
		this._midiOutputPort.sendMidiAction(action)
	}

	private _onMidiMessage(midiAction: MidiAction) {
		if (!this._enabled && midiAction.type !== 'VOICE_COUNT_CHANGE') return
		this.debugInfo.invokeNextFrame(JSON.stringify(midiAction))

		if (midiAction.type === 'MIDI_NOTE') {
			this._autoPolyHound.onMidiMessage(midiAction)
		}
	}
}

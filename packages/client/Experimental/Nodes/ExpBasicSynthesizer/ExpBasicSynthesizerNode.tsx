import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../../ExpPorts'
import {ExpAudioParams, ExpCustomEnumParams,
	ExpCustomEnumParam, ExpCustomNumberParams} from '../../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'
import {AutomaticPolyphonicMidiConverterHound} from '../AutomaticPolyphonicMidiConverterNode'
import {OscillatorExpHound} from '../ExpOscillatorNode'

export class ExpBasicSynthNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	protected readonly _customNumberParams: ExpCustomNumberParams
	private readonly _autoPolyHound: AutomaticPolyphonicMidiConverterHound
	private readonly _oscillatorHound: OscillatorExpHound
	private readonly _midiOutputPort: ExpMidiOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Synth', color: CssColor.green})

		this._autoPolyHound = new AutomaticPolyphonicMidiConverterHound(
			this._audioContext, this._onHoundMidiActionOut, false)

		this._oscillatorHound = new OscillatorExpHound(corgiNodeArgs)

		this._autoPolyHound.pitchSource.connect(this._oscillatorHound.frequencyParam.audioParam)

		this._customEnumParams = arrayToESIdKeyMap([this._oscillatorHound.type] as ExpCustomEnumParam<string>[])

		this._audioParams = arrayToESIdKeyMap([this._oscillatorHound.detuneParam, this._oscillatorHound.unisonDetuneParam])

		const midiInputPort = new ExpMidiInputPort('midiIn', 'midiIn', this, midiAction => this._onMidiMessage.bind(this)(midiAction))
		// const frequencyPort = new ExpNodeAudioParamInputPort(this._oscillatorHound.frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.detuneParam, this, corgiNodeArgs, 'center')
		const unisonDetunePort = new ExpNodeAudioParamInputPort(this._oscillatorHound.unisonDetuneParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._oscillatorHound.outputChain.output)
		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([midiInputPort, detunePort, unisonDetunePort, outputPort, this._midiOutputPort])

		this._customNumberParams = arrayToESIdKeyMap([this._oscillatorHound.unisonCount, this._autoPolyHound.voiceCount])

		this._autoPolyHound.init()
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._oscillatorHound.outputChain.enable()
	protected _disable = () => this._oscillatorHound.outputChain.disable()

	protected _dispose() {
		this._autoPolyHound.dispose()
		this._oscillatorHound.dispose()
	}

	private readonly _onHoundMidiActionOut = (action: MidiAction) => {
		// TODO Do something with midi message
		// Forward to internal envelope?
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
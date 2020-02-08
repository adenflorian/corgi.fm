import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomEnumParam, ExpCustomEnumParams} from '../ExpParams'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpNodeAudioOutputPort, ExpPorts, ExpNodeAudioInputPort} from '../ExpPorts'
import {LabGain} from './PugAudioNode/Lab'

const gateOptions = ['allow', 'block'] as const
type GateMode = typeof gateOptions[number]

export class MidiGateNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _gateMode: ExpCustomEnumParam<GateMode>
	private readonly _gain: LabGain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Gate', color: CssColor.yellow})

		this._gain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'MidiGateNode'})

		const midiInputPort = new ExpMidiInputPort('gate', 'gate', this, this._onMidiMessage)
		const audioInPort = new ExpNodeAudioInputPort('input', 'input', this, this._gain)
		const audioOutPort = new ExpNodeAudioOutputPort('output', 'output', this, this._gain)
		this._ports = arrayToESIdKeyMap([midiInputPort, audioInPort, audioOutPort])

		this._gateMode = new ExpCustomEnumParam<GateMode>('mode', 'allow', gateOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._gateMode] as ExpCustomEnumParam<string>[])

		this._gateMode.onChange.subscribe(this._enable)
	}

	public render = () => this.getDebugView()

	protected readonly _enable = () => {
		console.log('_enable: ', this._gateMode.onChange.current)
		if (this._gateMode.onChange.current === 'allow') {
			this._gain.gain.onMakeVoice = gain => gain.setTargetAtTime(1, 0, 0.005)
		} else {
			this._gain.gain.onMakeVoice = gain => gain.setTargetAtTime(0, 0, 0.005)
		}
	}

	protected readonly _disable = () => {
		if (this._gateMode.onChange.current === 'block') {
			this._gain.gain.onMakeVoice = gain => gain.setTargetAtTime(1, 0, 0.005)
		}
	}

	protected _dispose() {}

	private _onMidiMessage = (midiAction: MidiAction) => {
		if (!this._enabled) return

		if (midiAction.type === 'MIDI_GATE') {
			if (midiAction.gate) {
				console.log(('on'))
				this._gateMode.onChange.invokeImmediately('allow')
			} else {
				console.log(('off'))
				this._gateMode.onChange.invokeImmediately('block')
			}
		}
	}
}

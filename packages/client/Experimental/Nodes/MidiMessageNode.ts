import {CssColor} from '@corgifm/common/shamu-color'
import {MidiAction, midiActions} from '@corgifm/common/common-types'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpCustomStringParam, ExpCustomStringParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {ExpMidiInputPort, ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'

const pulseOptions = ['send', 'idle'] as const
type PulseMode = typeof pulseOptions[number]

export class MidiMessageNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customEnumParams: ExpCustomEnumParams
	protected readonly _customStringParams: ExpCustomStringParams
	private readonly _pulseMode: ExpCustomEnumParam<PulseMode>
	private readonly _message: ExpCustomStringParam
	private readonly _midiOutputPort: ExpMidiOutputPort

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Midi Message', color: CssColor.yellow})

		this._midiOutputPort = new ExpMidiOutputPort('gate', 'gate', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._message = new ExpCustomStringParam('pattern', '')
		this._customStringParams = arrayToESIdKeyMap([this._message] as ExpCustomStringParam[])

		this._pulseMode = new ExpCustomEnumParam<PulseMode>('mode', 'idle', pulseOptions)
		this._customEnumParams = arrayToESIdKeyMap([this._pulseMode] as ExpCustomEnumParam<string>[])

		this._pulseMode.onChange.subscribe(this._onChange)
	}

	public render = () => this.getDebugView()

	protected _enable() {}
	protected _disable() {}
	protected _dispose() {
		this._pulseMode.onChange.unsubscribe(this._onChange)
	}

	private readonly _onChange = (mode: PulseMode) => {
		if (mode !== 'idle') this._pulseMode.onChange.invokeNextFrame('idle')

		if (this._enabled && mode === 'send') {
			this._midiOutputPort.sendMidiAction(midiActions.message(this._audioContext.currentTime, this._message.value.current))
		}
	}
}

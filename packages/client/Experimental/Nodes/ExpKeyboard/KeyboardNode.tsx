import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {Input, InputEventNoteon, InputEventNoteoff} from 'webmidi'
import {midiActions} from '@corgifm/common/common-types'
import {nodeToNodeActions, NodeToNodeAction} from '@corgifm/common/server-constants'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {ExpMidiOutputPort} from '../../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {CorgiObjectChangedEvent} from '../../CorgiEvents'
import {ExpPorts} from '../../ExpPorts'
import {KeyboardNodeExtra} from './KeyboardNodeView'

export class KeyboardNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _onInputChanged = new CorgiObjectChangedEvent<Input | undefined>(undefined)
	private currentInput?: Input

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Keyboard', color: CssColor.yellow})

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])
	}

	public render() {
		return this.getDebugView(
			<div>
				<KeyboardNodeExtra
					onInputSelected={this._subscribeToInput}
					inputChangedEvent={this._onInputChanged}
					ownerId={this.ownerId}
				/>
			</div>
		)
	}

	protected _enable() {}
	protected _disable() {}

	protected _dispose() {
		this._unsubscribeFromCurrentInput()
	}

	private readonly _subscribeToInput = (input: Input) => {
		this._unsubscribeFromCurrentInput()

		this.currentInput = input

		input.addListener('noteon', 'all', this._onNoteOn)
		input.addListener('noteoff', 'all', this._onNoteOff)

		this._onInputChanged.invokeImmediately(this.currentInput)
	}

	private _unsubscribeFromCurrentInput() {
		if (!this.currentInput) return

		this.currentInput.removeListener('noteon', 'all', this._onNoteOn)

		delete this.currentInput
		this._onInputChanged.invokeImmediately(this.currentInput)
	}

	private readonly _onNoteOn = (event: InputEventNoteon) => {
		if (!this._enabled) return
		const midiAction = midiActions.note(this._audioContext.currentTime, true, event.note.number, event.velocity)
		this._midiOutputPort.sendMidiAction(midiAction)
		this.singletonContext.webSocketService.nodeToNode(nodeToNodeActions.midi(this.id, midiAction))
	}

	private readonly _onNoteOff = (event: InputEventNoteoff) => {
		if (!this._enabled) return
		const midiAction = midiActions.note(this._audioContext.currentTime, false, event.note.number, event.velocity)
		this._midiOutputPort.sendMidiAction(midiAction)
		this.singletonContext.webSocketService.nodeToNode(nodeToNodeActions.midi(this.id, midiAction))
	}

	protected readonly _onNodeToNode = (action: NodeToNodeAction) => {
		if (action.type === 'NODE_TO_NODE_MIDI') {
			this._midiOutputPort.sendMidiAction({
				...action.midiAction,
				time: this._audioContext.currentTime,
			})
		}
	}
}

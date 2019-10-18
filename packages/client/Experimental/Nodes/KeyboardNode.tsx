/* eslint-disable no-empty-function */
import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {Input, InputEventNoteon, InputEventNoteoff} from 'webmidi'
import {midiActions} from '@corgifm/common/common-types'
import {nodeToNodeActions, NodeToNodeAction} from '@corgifm/common/server-constants'
import {ExpCustomNumberParam} from '../ExpParams'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {KeyboardNodeExtra} from './KeyboardNodeView'

export class KeyboardNode extends CorgiNode {
	private readonly _midiOutputPort: ExpMidiOutputPort
	private readonly _onInputChanged: CorgiObjectChangedEvent<Input | undefined>
	private currentInput?: Input

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const midiOutputPort = new ExpMidiOutputPort('output', 'output', () => this)

		super(corgiNodeArgs, {
			ports: [midiOutputPort],
			customNumberParams: new Map<Id, ExpCustomNumberParam>([
			]),
		})

		this._midiOutputPort = midiOutputPort
		this._subscribeToInputBound = this._subscribeToInput.bind(this)
		this._onNoteOnBound = this._onNoteOn.bind(this)
		this._onNoteOffBound = this._onNoteOff.bind(this)
		this._onInputChanged = new CorgiObjectChangedEvent<Input | undefined>(undefined)

		// Make sure to add these to the dispose method!
	}

	public getColor(): string {return CssColor.green}
	public getName() {return 'Keyboard'}

	public render() {
		return this.getDebugView(
			<div>
				<KeyboardNodeExtra
					onInputSelected={this._subscribeToInputBound}
					inputChangedEvent={this._onInputChanged}
					ownerId={this.ownerId}
				/>
			</div>
		)
	}

	private readonly _subscribeToInputBound: (input: Input) => void
	private _subscribeToInput(input: Input) {
		this._unsubscribeFromCurrentInput()

		this.currentInput = input

		input.addListener('noteon', 'all', this._onNoteOnBound)
		input.addListener('noteoff', 'all', this._onNoteOffBound)

		this._onInputChanged.invokeImmediately(this.currentInput)
	}

	private _unsubscribeFromCurrentInput() {
		if (!this.currentInput) return

		this.currentInput.removeListener('noteon', 'all', this._onNoteOnBound)

		delete this.currentInput
		this._onInputChanged.invokeImmediately(this.currentInput)
	}

	private readonly _onNoteOnBound: (input: InputEventNoteon) => void
	private _onNoteOn(event: InputEventNoteon) {
		if (!this._enabled) return
		const midiAction = midiActions.note(this._audioContext.currentTime, true, event.note.number, event.velocity)
		this._midiOutputPort.sendMidiAction(midiAction)
		this._singletonContext.webSocketService.nodeToNode(nodeToNodeActions.midi(this.id, midiAction))
	}

	private readonly _onNoteOffBound: (input: InputEventNoteoff) => void
	private _onNoteOff(event: InputEventNoteoff) {
		if (!this._enabled) return
		const midiAction = midiActions.note(this._audioContext.currentTime, false, event.note.number, event.velocity)
		this._midiOutputPort.sendMidiAction(midiAction)
		this._singletonContext.webSocketService.nodeToNode(nodeToNodeActions.midi(this.id, midiAction))
	}

	public onNodeToNode(action: NodeToNodeAction) {
		if (action.type === 'NODE_TO_NODE_MIDI') {
			this._midiOutputPort.sendMidiAction({
				...action.midiAction,
				time: this._audioContext.currentTime,
			})
		}
	}

	protected _enable() {
	}

	protected _disable() {
	}

	protected _dispose() {
		this._unsubscribeFromCurrentInput()
	}
}

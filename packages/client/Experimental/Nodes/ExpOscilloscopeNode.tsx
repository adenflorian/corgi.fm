/* eslint-disable no-empty-function */
import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {CorgiAnalyserSPNode} from '../CorgiAnalyserSPN'
import {CorgiNumberChangedEvent} from '../CorgiEvents'
import {ExpOscilloscopeNodeExtra} from './ExpOscilloscopeNodeView'

export class ExpOscilloscopeNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gain: GainNode
	private readonly _analyser: CorgiAnalyserSPNode
	private readonly _newSampleEvent = new CorgiNumberChangedEvent(0)

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscilloscope', color: CssColor.blue})

		this._analyser = new CorgiAnalyserSPNode(corgiNodeArgs.audioContext, this._onAnalyserUpdate, true)

		this._gain = corgiNodeArgs.audioContext.createGain()
		this._gain.gain.value = 1

		this._gain.connect(this._analyser.input)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._gain)
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._gain)
		this._ports = arrayToESIdKeyMap([inputPort, outputPort])

		this._analyser.requestUpdate()
	}

	public render() {
		return this.getDebugView(
			<ExpOscilloscopeNodeExtra
				newSampleEvent={this._newSampleEvent}
			/>
		)
	}

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
		this._gain.disconnect()
	}

	private readonly _onAnalyserUpdate = (newValue: number) => {
		if (this._enabled) this._newSampleEvent.invokeNextFrame(newValue)
		this._analyser.requestUpdate()
	}
}

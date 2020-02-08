import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpPorts,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {LabCorgiAnalyserSPNode} from '../CorgiAnalyserSPN'
import {CorgiNumberChangedEvent} from '../CorgiEvents'
import {ExpOscilloscopeNodeExtra} from './ExpOscilloscopeNodeView'
import {LabGain} from './PugAudioNode/Lab'

export class ExpOscilloscopeNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gain: LabGain
	private readonly _analyser: LabCorgiAnalyserSPNode
	private readonly _newSampleEvent = new CorgiNumberChangedEvent(0)

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscilloscope', color: CssColor.blue})

		this._analyser = new LabCorgiAnalyserSPNode(corgiNodeArgs.audioContext, this._onAnalyserUpdate, true, 'ExpOscilloscopeNode')

		this._gain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'ExpOscilloscopeNode'})
		this._gain.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0)

		this._gain.connect(this._analyser)

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

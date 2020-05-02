import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	ExpNodeAudioInputPort, ExpPorts,
} from '../../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../../CorgiNode'
import {LabCorgiAnalyserSPNode} from '../../CorgiAnalyserSPN'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'
import {ExpMilkdropNodeExtra} from './ExpMilkdropNodeView'
import {LabGain} from '../PugAudioNode/Lab'

export class ExpMilkdropNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _gain: LabGain
	private readonly _analyser2: LabCorgiAnalyserSPNode
	private readonly _newSampleEvent = new CorgiNumberChangedEvent(0)

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Oscilloscope', color: CssColor.blue})

		this._analyser2 = new LabCorgiAnalyserSPNode(corgiNodeArgs.audioContext, this._onAnalyserUpdate, true, 'ExpMilkdropNode')

		this._gain = new LabGain({audioContext: this._audioContext, voiceMode: 'autoPoly', creatorName: 'ExpMilkdropNode'})
		this._gain.gain.onMakeVoice = gain => gain.setValueAtTime(1, 0)

		this._gain.connect(this._analyser2)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._gain)
		this._ports = arrayToESIdKeyMap([inputPort])

		this._analyser2.requestUpdate()
	}

	public render() {
		return this.getDebugView(
			undefined,
			<ExpMilkdropNodeExtra
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
		this._analyser2.requestUpdate()
	}
}

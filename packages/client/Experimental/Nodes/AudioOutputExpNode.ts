import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {CssColor} from '@corgifm/common/shamu-color'
import {ExpNodeAudioInputPort, ExpPorts} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

export class AudioOutputExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	private readonly _inputChain: ToggleGainChain

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Audio Output', color: CssColor.blue})

		this._inputChain = new ToggleGainChain(corgiNodeArgs.audioContext, 0.5)
		this._inputChain.output.connect(this._audioContext.destination)
		// inputGain.connect(this.preMasterLimiter)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', this, this._inputChain.input)
		this._ports = arrayToESIdKeyMap([inputPort])

		window.addEventListener('unload', this._onWindowUnload)
	}

	private readonly _onWindowUnload = () => {
		this._inputChain.dispose()

		const startMs = Date.now()

		let stop = false

		// Backup in case something goes wrong with audio context time
		setTimeout(() => (stop = true), 100)

		while (Date.now() - startMs < 50) {
			if (stop) break
		}
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._inputChain.enable()
	protected _disable = () => this._inputChain.disable()

	protected _dispose() {
		this._inputChain.dispose()
		window.removeEventListener('unload', this._onWindowUnload)
	}
}

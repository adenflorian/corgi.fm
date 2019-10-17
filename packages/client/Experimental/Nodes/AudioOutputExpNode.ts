/* eslint-disable no-empty-function */
import {ExpNodeAudioInputPort} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'

export class AudioOutputExpNode extends CorgiNode {
	private readonly _inputChain: ToggleGainChain
	private readonly _onWindowUnloadBound: () => void

	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		const inputChain = new ToggleGainChain(corgiNodeArgs.audioContext, 0.5)

		const inputPort = new ExpNodeAudioInputPort('input', 'input', () => this, inputChain.input)

		super(corgiNodeArgs, {ports: [inputPort]})

		inputChain.output.connect(this._audioContext.destination)
		// inputGain.connect(this.preMasterLimiter)

		// Make sure to add these to the dispose method!
		this._inputChain = inputChain

		this._onWindowUnloadBound = this._onWindowUnload.bind(this)
		window.addEventListener('unload', this._onWindowUnloadBound)
	}

	private _onWindowUnload() {
		this._inputChain.dispose()

		const startMs = Date.now()

		let stop = false

		// Backup in case something goes wrong with audio context time
		setTimeout(() => (stop = true), 100)

		while (Date.now() - startMs < 50) {
			if (stop) break
		}
	}

	public getName() {return 'Audio Output'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
		this._inputChain.enable()
	}

	protected _disable() {
		this._inputChain.disable()
	}

	protected _dispose() {
		this._inputChain.dispose()
		window.removeEventListener('unload', this._onWindowUnloadBound)
	}
}

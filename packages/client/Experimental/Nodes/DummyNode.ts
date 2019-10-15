/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../../client-logger'
import {CorgiNode} from '../CorgiNode'

export class DummyNode extends CorgiNode {
	public constructor(
		id: Id, audioContext: AudioContext, preMasterLimiter: GainNode,
	) {
		super(id, audioContext, preMasterLimiter)
	}

	public getColor(): string {
		return CssColor.disabledGray
	}

	public getName() {return 'Dummy'}

	public render() {
		return this.getDebugView()
	}

	protected _enable() {
	}

	protected _disable() {
	}

	protected _dispose() {
		logger.log('dispose DummyNode')
	}
}

/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {logger} from '../../client-logger'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'

export class DummyNode extends CorgiNode {
	public constructor(
		corgiNodeArgs: CorgiNodeArgs,
	) {
		super(corgiNodeArgs, {name: 'Dummy', color: CssColor.disabledGray})
	}

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

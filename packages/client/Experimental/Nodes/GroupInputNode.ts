/* eslint-disable no-empty-function */
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {gainDecibelValueToString} from '../../client-constants'
import {
	ExpNodeAudioInputPort, ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {DryWetChain} from './NodeHelpers/DryWetChain'

export class GroupInputNode extends CorgiNode {
	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs)
	}

	public getColor = () => CssColor.blue
	public getName = () => 'Group Input'
	public render = () => this.getDebugView()

	protected _enable = () =>	{}
	protected _disable = () => {}

	protected _dispose() {
	}
}

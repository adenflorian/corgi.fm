import React from 'react'
import {hot} from 'react-hot-loader'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpPorts} from './ExpPorts'
import {
	ExpAudioParams, ExpCustomNumberParams,
} from './ExpParams'
import {ExpNodeContext, ExpNodeContextValue} from './CorgiNode'
import './ExpNodes.less'

interface Props {
	readonly children: React.ReactNode
	readonly context: ExpNodeContextValue
	readonly audioParams: ExpAudioParams
	readonly customNumberParams: ExpCustomNumberParams
	readonly ports: ExpPorts
}

export const CorgiNodeView = hot(module)(React.memo(function _CorgiNodeView({
	children, context, audioParams, customNumberParams, ports,
}: Props) {
	return (
		<ExpNodeContext.Provider value={context}>
			<ExpConnectorPlaceholders />
			<SimpleGraphNodeExp>
				<ExpNodeDebugView
					audioParams={audioParams}
					customNumberParams={customNumberParams}
					ports={ports}
				>
					{children}
				</ExpNodeDebugView>
			</SimpleGraphNodeExp>
		</ExpNodeContext.Provider>
	)
}))

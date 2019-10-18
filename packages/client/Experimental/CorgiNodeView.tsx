import React from 'react'
import {hot} from 'react-hot-loader'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpPort} from './ExpPorts'
import {
	ExpAudioParam, ExpCustomNumberParam,
} from './ExpParams'
import {ExpNodeContext, ExpNodeContextValue} from './CorgiNode'
import './ExpNodes.less'

interface Props {
	readonly children: React.ReactNode
	readonly context: ExpNodeContextValue
	readonly audioParams: Map<Id, ExpAudioParam>
	readonly customNumberParams: Map<Id, ExpCustomNumberParam>
	readonly ports: Map<Id, ExpPort>
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

import React from 'react'
import {hot} from 'react-hot-loader'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpPorts} from './ExpPorts'
import {
	ExpAudioParams, ExpCustomNumberParams, ExpCustomEnumParams,
} from './ExpParams'
import {ExpNodeContext, CorgiNodeReact} from './CorgiNode'
import './ExpNodes.less'

interface Props {
	readonly children: React.ReactNode
	readonly context: CorgiNodeReact
	readonly audioParams: ExpAudioParams
	readonly customNumberParams: ExpCustomNumberParams
	readonly customEnumParams: ExpCustomEnumParams
	readonly ports: ExpPorts
}

export const CorgiNodeView = hot(module)(React.memo(function _CorgiNodeView({
	children, context, audioParams, customNumberParams, ports, customEnumParams,
}: Props) {
	return (
		<ExpNodeContext.Provider value={context}>
			<ExpConnectorPlaceholders />
			<SimpleGraphNodeExp>
				<ExpNodeDebugView
					audioParams={audioParams}
					customNumberParams={customNumberParams}
					customEnumParams={customEnumParams}
					ports={ports}
				>
					{children}
				</ExpNodeDebugView>
			</SimpleGraphNodeExp>
		</ExpNodeContext.Provider>
	)
}))

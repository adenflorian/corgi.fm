import React from 'react'
import {hot} from 'react-hot-loader'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpNodeMaxView} from './ExpNodeMaxView'
import {ExpPorts} from './ExpPorts'
import {ExpNodeContext, CorgiNodeReact} from './CorgiNode'
import {
	ExpAudioParams, ExpCustomNumberParams, ExpCustomEnumParams, ExpCustomStringParams,
} from './ExpParams'
import './ExpNodes.less'

interface Props {
	readonly children: React.ReactNode
	readonly context: CorgiNodeReact
	readonly audioParams: ExpAudioParams
	readonly customNumberParams: ExpCustomNumberParams
	readonly customEnumParams: ExpCustomEnumParams
	readonly customStringParams: ExpCustomStringParams
	readonly ports: ExpPorts
}

const viewMode = 'debug' as 'max' | 'debug'

export const CorgiNodeView = hot(module)(React.memo(function _CorgiNodeView({
	children, context, audioParams, customNumberParams, ports, customEnumParams,
	customStringParams,
}: Props) {
	return (
		<ExpNodeContext.Provider value={context}>
			<ExpConnectorPlaceholders />
			<SimpleGraphNodeExp>
				{viewMode === 'debug' &&
					<ExpNodeDebugView
						audioParams={audioParams}
						customNumberParams={customNumberParams}
						customEnumParams={customEnumParams}
						customStringParams={customStringParams}
						ports={ports}
					>
						{children}
					</ExpNodeDebugView>
				}
				{viewMode === 'max' &&
					<ExpNodeMaxView
						audioParams={audioParams}
						customNumberParams={customNumberParams}
						customEnumParams={customEnumParams}
						customStringParams={customStringParams}
						ports={ports}
					>
						{children}
					</ExpNodeMaxView>
				}
			</SimpleGraphNodeExp>
		</ExpNodeContext.Provider>
	)
}))

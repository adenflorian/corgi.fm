import React from 'react'
import {hot} from 'react-hot-loader'
import {
	ExpPorts, AudioParamInputPortContext, ExpNodeAudioParamInputPort,
} from './ExpPorts'
import {ExpAudioParams, ExpCustomNumberParams, AudioParamContext, ExpCustomEnumParams, ExpCustomStringParams} from './ExpParams'
import {useNodeContext} from './CorgiNode'
import {ExpMaxValue} from './ExpMaxValue'
import {useStringChangedEvent} from './hooks/useCorgiEvent'
import './ExpNodeMaxView.less'

interface Props {
	audioParams: ExpAudioParams
	customNumberParams: ExpCustomNumberParams
	customEnumParams: ExpCustomEnumParams
	customStringParams: ExpCustomStringParams
	ports: ExpPorts
	children?: React.ReactNode
}

export const ExpNodeMaxView = hot(module)(React.memo(function _ExpNodeMaxView({
	audioParams, customNumberParams, children,
	ports, customEnumParams, customStringParams,
}: Props) {
	const nodeContext = useNodeContext()
	const nodeName = useStringChangedEvent(nodeContext.onNameChange)

	return (
		<div className="expNodeMaxView">
			<div className="name">{nodeName}</div>
			<div className="params">
				{[...audioParams].map(([id, audioParam]) => {
					const port = ports.get(id) as ExpNodeAudioParamInputPort
					return (
						<AudioParamContext.Provider value={audioParam} key={id as string}>
							<AudioParamInputPortContext.Provider value={port}>
								<ExpMaxValue />
							</AudioParamInputPortContext.Provider>
						</AudioParamContext.Provider>
					)
				})}
			</div>
			{children}
		</div>
	)
}))

import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ExpKnob} from '../Knob/ExpKnob'
import {useNumberChangedEvent} from './hooks/useAudioParam'
import {usePort} from './hooks/usePort'
import {useNodeContext} from './CorgiNode'
import {useAudioParamContext} from './ExpParams'
import {isAudioParamInputPort} from './ExpPorts'

interface Props {
	nodeId: Id
}

export const ExpNodeDebugAudioParamKnob = React.memo(function _ExpNodeDebugAudioParamKnob({
	nodeId,
}: Props) {
	const audioParam = useAudioParamContext()
	const dispatch = useDispatch()
	const onAudioParamChange = useCallback((_, newValue: number) => {
		dispatch(expNodesActions.audioParamChange(nodeId, audioParam.id, newValue))
	}, [audioParam.id, dispatch, nodeId])
	const node = useNodeContext()
	const value = useNumberChangedEvent(audioParam.onChange)
	const port = usePort(nodeId, audioParam.id)

	let chains
	if (port && isAudioParamInputPort(port)) {
		chains = port.getChains()
	}

	return (
		<ExpKnob
			defaultValue={audioParam.defaultValue}
			label={audioParam.id as string}
			onChange={onAudioParamChange}
			tooltip={audioParam.id as string}
			value={value}
			valueString={audioParam.valueString}
			chains={chains}
			color={node.getColor()}
			curveFunctions={audioParam.curveFunctions}
			range={audioParam.paramSignalRange}
			maxValue={audioParam.maxValue}
		/>
	)
})

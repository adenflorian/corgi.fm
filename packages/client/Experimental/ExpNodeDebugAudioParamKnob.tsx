import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ExpKnob} from '../Knob/ExpKnob'
import {useNumberChangedEvent} from './hooks/useCorgiEvent'
import {useNodeContext} from './CorgiNode'
import {useAudioParamContext} from './ExpParams'

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

	return (
		<ExpKnob
			defaultValue={audioParam.defaultNormalizedValue}
			label={audioParam.id as string}
			onChange={onAudioParamChange}
			tooltip={audioParam.id as string}
			value={value}
			valueString={audioParam.valueString}
			color={node.getColor()}
			curveFunctions={audioParam.curveFunctions}
			range={audioParam.paramSignalRange}
			maxValue={audioParam.maxValue}
		/>
	)
})

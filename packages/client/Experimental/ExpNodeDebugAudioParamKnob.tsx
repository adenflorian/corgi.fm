import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ExpKnob} from '../Knob/ExpKnob'
import {useNumberChangedEvent, useStringChangedEvent} from './hooks/useCorgiEvent'
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
	const color = useStringChangedEvent(node.onColorChange)

	return (
		<ExpKnob
			defaultValue={audioParam.defaultNormalizedValue}
			label={audioParam.id as string}
			onChange={onAudioParamChange}
			tooltip={audioParam.id as string}
			value={value}
			valueString={audioParam.valueString}
			color={color}
			curveFunctions={audioParam.curveFunctions}
			range={audioParam.paramSignalRange}
			maxValue={audioParam.maxValue}
		/>
	)
})

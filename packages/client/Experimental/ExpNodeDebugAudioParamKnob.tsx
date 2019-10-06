import React, {useCallback, useEffect} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {Knob} from '../Knob/Knob'
import {logger} from '../client-logger'
import {useAudioParam} from './hooks/useAudioParam'
import {ExpAudioParam} from './ExpParams'

interface Props {
	nodeId: Id
	audioParam: ExpAudioParam
}

export const ExpNodeDebugAudioParamKnob = React.memo(function _ExpNodeDebugAudioParamKnob({
	nodeId, audioParam,
}: Props) {
	const dispatch = useDispatch()
	const onAudioParamChange = useCallback((_, newValue: number) => {
		dispatch(expNodesActions.audioParamChange(nodeId, audioParam.id, newValue))
	}, [audioParam.id, dispatch, nodeId])
	const value = useAudioParam(audioParam.id)

	return (
		<Knob
			defaultValue={audioParam.default}
			label={audioParam.id as string}
			min={audioParam.min}
			max={audioParam.max}
			onChange={onAudioParamChange}
			tooltip={audioParam.id as string}
			value={value}
			curve={audioParam.curve}
			valueString={audioParam.valueString}
		/>
	)
})

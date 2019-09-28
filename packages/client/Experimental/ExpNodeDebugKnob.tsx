import React, {useCallback, useEffect} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {Knob} from '../Knob/Knob'
import {logger} from '../client-logger'
import {
	ExpAudioParam,
} from './ExpTypes'
import {useAudioParam} from './hooks/useAudioParam'

interface Props {
	nodeId: Id
	audioParam: ExpAudioParam
}

export const ExpNodeDebugKnob = React.memo(function _ExpNodeDebugKnob({
	nodeId, audioParam,
}: Props) {
	const dispatch = useDispatch()
	const onAudioParamChange = useCallback((_, newValue: number) => {
		dispatch(expNodesActions.paramChange(nodeId, audioParam.id, newValue))
	}, [audioParam.id, dispatch, nodeId])
	useEffect(() => {
		logger.log('mount')
	}, [])
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
		/>
	)
})

import React, {useCallback, useEffect} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {Knob} from '../Knob/Knob'
import {logger} from '../client-logger'
import {useCustomNumberParam} from './hooks/useCustomNumberParam'
import {ExpCustomNumberParam} from './ExpParams'

interface Props {
	nodeId: Id
	customNumberParam: ExpCustomNumberParam
}

export const ExpNodeDebugCustomNumberParamKnob = React.memo(function _ExpNodeDebugCustomNumberParamKnob({
	nodeId, customNumberParam,
}: Props) {
	const dispatch = useDispatch()
	const onCustomNumberParamChange = useCallback((_, newValue: number) => {
		dispatch(expNodesActions.customNumberParamChange(nodeId, customNumberParam.id, newValue))
	}, [customNumberParam.id, dispatch, nodeId])
	useEffect(() => {
		logger.log('mount')
	}, [])
	const value = useCustomNumberParam(customNumberParam.id)

	return (
		<Knob
			defaultValue={customNumberParam.default}
			label={customNumberParam.id as string}
			min={customNumberParam.min}
			max={customNumberParam.max}
			onChange={onCustomNumberParamChange}
			tooltip={customNumberParam.id as string}
			value={value}
			curve={customNumberParam.curve}
			valueString={customNumberParam.valueString}
		/>
	)
})

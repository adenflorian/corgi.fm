import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {Knob} from '../Knob/Knob'
import {ExpCustomNumberParam} from './ExpParams'
import {useNumberChangedEvent} from './hooks/useCorgiEvent'

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
	const value = useNumberChangedEvent(customNumberParam.onChange)

	return (
		<Knob
			defaultValue={customNumberParam.defaultValue}
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

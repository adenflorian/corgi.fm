import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ExpCustomStringParam} from './ExpParams'
import {useStringChangedEvent} from './hooks/useCorgiEvent'
import {TextField} from '../Inputs/TextField/TextField'

interface Props {
	nodeId: Id
	customStringParam: ExpCustomStringParam
}

export const ExpNodeDebugCustomStringParamField = React.memo(function _ExpNodeDebugCustomStringParamField({
	nodeId, customStringParam,
}: Props) {
	const dispatch = useDispatch()

	const onCustomStringParamChange = useCallback((value: string) => {
		dispatch(expNodesActions.customStringParamChange(nodeId, customStringParam.id, value))
	}, [customStringParam.id, dispatch, nodeId])

	const value = useStringChangedEvent(customStringParam.value)

	return (
		<TextField
			onChange={onCustomStringParamChange}
			value={value}
		/>
	)
})

import React, {useCallback, useMemo} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ButtonSelect, ButtonSelectOption} from '../ButtonSelect/ButtonSelect'
import {ExpCustomEnumParam} from './ExpParams'
import {useEnumChangedEvent} from './hooks/useCorgiEvent'

interface Props {
	nodeId: Id
	customEnumParam: ExpCustomEnumParam
}

export const ExpNodeDebugCustomEnumParamSelect = React.memo(function _ExpNodeDebugCustomEnumParamSelect({
	nodeId, customEnumParam,
}: Props) {
	const dispatch = useDispatch()

	const onCustomEnumParamChange = useCallback((selection: ButtonSelectOption<string>) => {
		dispatch(expNodesActions.customEnumParamChange(nodeId, customEnumParam.id, selection.value))
	}, [customEnumParam.id, dispatch, nodeId])

	const value = useEnumChangedEvent(customEnumParam.value, customEnumParam.onChange)

	const midiInputOptions = useMemo(() => customEnumParam.buildSelectOptions(), [customEnumParam])

	return (
		<ButtonSelect
			key={customEnumParam.id as string}
			options={midiInputOptions}
			onNewSelection={onCustomEnumParamChange}
			selectedOption={midiInputOptions.find(x => x.value === value)}
			orientation={'autoGrid'}
		/>
	)
})

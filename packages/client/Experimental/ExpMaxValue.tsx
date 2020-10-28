import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'
import {ExpKnobValueNumber} from '../Knob/ExpKnobValueNumber'
import {useAudioParamContext} from './ExpParams'
import {useNodeContext} from './CorgiNode'
import {useNumberChangedEvent} from './hooks/useCorgiEvent'

export const ExpMaxValue = React.memo(function _ExpMaxValue() {
	const audioParam = useAudioParamContext()
	const dispatch = useDispatch()
	const node = useNodeContext()
	const onAudioParamChange = useCallback((newValue: number) => {
		dispatch(expNodesActions.audioParamChange(node.id, audioParam.id, newValue))
	}, [audioParam.id, dispatch, node.id])
	const value = useNumberChangedEvent(audioParam.onChange)
	return (
		<div className="expMaxValue">
			<ExpKnobValueNumber
				onValueChange={onAudioParamChange}
				value={value}
				// valueString={v => v.toString()}
				curveFunctions={audioParam.curveFunctions}
				range={audioParam.paramSignalRange}
				maxValue={audioParam.maxValue}
			/>
		</div>
	)
})

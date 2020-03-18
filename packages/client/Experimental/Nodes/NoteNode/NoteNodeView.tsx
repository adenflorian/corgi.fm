import React, {useCallback} from 'react'
import {TextArea} from '../../../Inputs/TextArea/TextArea'
import {useStringChangedEvent} from '../../hooks/useCorgiEvent'
import {useNodeContext} from '../../CorgiNode'
import {NoteNode} from './NoteNode'
import {useDispatch} from 'react-redux'
import {expNodesActions} from '@corgifm/common/redux'

export const NoteNodeView = () => {
	const dispatch = useDispatch()
	const nodeContext = useNodeContext() as NoteNode
	const handleChange = useCallback((newValue: string) => {
		dispatch(expNodesActions.customStringParamChange(nodeContext.id, nodeContext.text.id, newValue))
	}, [dispatch, nodeContext])

	const value = useStringChangedEvent(nodeContext.text.value)

	return (
		<div className="noteNode" style={{height: '100%'}}>
			<TextArea
				value={value}
				onChange={handleChange}
				containerStyle={{height: '100%'}}
				textareaStyle={{
					width: '100%',
					height: '100%',
					padding: 16,
					boxShadow: 'none',
					borderTopRightRadius: 0,
					borderTopLeftRadius: 0,
					resize: 'none',
					fontSize: 16,
					boxSizing: 'border-box',
				}}
			/>
		</div>
	)
}

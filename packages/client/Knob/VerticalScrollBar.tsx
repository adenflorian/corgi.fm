import {List} from 'immutable'
import React, {useCallback, useLayoutEffect, useState} from 'react'
import {clamp} from '@corgifm/common/common-utils'
import {useBoolean} from '../react-hooks'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {VerticalScrollBarView} from './VerticalScrollBarView'

interface Props {
	min: number
	max: number
	onChange: (newValue: number, onChangeId: any) => any
	value: number
	onChangeId?: any
	marks: List<number>
	sliderGrabberHeightPercentage?: number
}

export const VerticalScrollBar = React.memo(function _VerticalScrollBar({
	value, min = 0, max = 1, marks = List(),
	sliderGrabberHeightPercentage, onChange, onChangeId,
}: Props) {

	const [active, activate, deactivate] = useBoolean(false)
	const [startY, setStartY] = useState(0)
	const [startValue, setStartValue] = useState(0)

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		if (e.button !== 0) return

		setStartY(e.clientY)
		setStartValue(value)

		activate()
	}, [activate, value])

	useLayoutEffect(() => {
		if (!active) return

		const onMouseUp = () => {
			if (active) deactivate()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return deactivate()

			const mouseDelta = (startY - e.clientY) * 0.7

			const result = startValue + (mouseDelta / simpleGlobalClientState.zoom)

			const newValue = clamp(result, min, max)

			onChange(newValue, onChangeId)
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [activate, active, deactivate, max, min, onChange, onChangeId, startValue, startY])

	return (
		<VerticalScrollBarView
			percentage={value / max}
			handleMouseDown={onMouseDown}
			marks={marks}
			sliderGrabberHeightPercentage={sliderGrabberHeightPercentage}
		/>
	)
})

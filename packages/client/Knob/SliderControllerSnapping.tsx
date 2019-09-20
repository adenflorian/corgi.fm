import {List} from 'immutable'
import React, {useLayoutEffect, useState, ReactElement} from 'react'
import './Knob.less'

interface Props {
	onChange: (newValue: number | string | boolean) => any
	value: number | string | boolean
	defaultIndex: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number, isMouseDown: boolean) => ReactElement<any>
	possibleValues: List<any>
}

export function SliderControllerSnapping(props: Props) {
	const {
		value, onChange, possibleValues, defaultIndex, children,
	} = props

	const [isMouseDown, setIsMouseDown] = useState(false)
	const [tempValue, setTempValue] = useState(0)

	useLayoutEffect(() => {
		const _handleMouseMove = (e: MouseEvent) => {
			if (isMouseDown) {
				if (e.buttons !== 1) {
					return setIsMouseDown(false)
				}

				let sensitivity = 0.005
				if (e.shiftKey) {
					sensitivity *= 2
				} else if (e.altKey) {
					sensitivity *= 0.25
				}

				const mouseYDelta = e.movementY * sensitivity

				const newNormalizedValue = clamp(tempValue - mouseYDelta)

				const newScaledValue = newNormalizedValue * (possibleValues.count() - 1)

				const roundedScaledValue = Math.round(newScaledValue)

				const newValue = possibleValues.get(roundedScaledValue, 0)

				if (newValue !== value) {
					onChange(newValue)
				}

				setTempValue(newNormalizedValue)
			}
		}

		if (isMouseDown) {
			window.addEventListener('mousemove', _handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [isMouseDown, tempValue, value, possibleValues, onChange])

	function _normalize(v: number | string | boolean): number {
		const index = possibleValues.indexOf(v)
		if (index === -1) return 0
		return index / (possibleValues.count() - 1)
	}

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey)) {
			onChange(possibleValues.get(defaultIndex, 0))
		} else {
			setTempValue(_normalize(value))
			setIsMouseDown(true)
		}
	}

	return children(
		_handleMouseDown,
		_normalize(value),
		_normalize(value),
		isMouseDown,
	)
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value))
}

import {List} from 'immutable'
import React, {useLayoutEffect, useState} from 'react'
import './Knob.less'

interface Props {
	onChange: (newValue: number | string) => any
	value: number | string
	defaultIndex: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => any
	possibleValues: List<any>
}

export function SliderControllerSnapping(props: Props) {
	const {
		value, onChange, possibleValues, defaultIndex, children,
	} = props

	const [isMouseDown, setIsMouseDown] = useState(false)
	const [tempValue, setTempValue] = useState(0)

	useLayoutEffect(() => {
		if (isMouseDown) {
			window.addEventListener('mousemove', _handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [isMouseDown, tempValue, value, possibleValues])

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

	function _normalize(v: number | string): number {
		const index = possibleValues.indexOf(v)
		if (index === -1) return 0
		return index / (possibleValues.count() - 1)
	}

	const _handleMouseDown = (e: React.MouseEvent) => {
		if (e.ctrlKey) {
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
	)
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value))
}

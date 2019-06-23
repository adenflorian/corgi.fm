import React, {useLayoutEffect, useState} from 'react'
import './Knob.less'

interface Props {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	defaultValue: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => any
	increment: number
}

export function SliderControllerIncremental(props: Props) {
	const {
		value, onChange, increment, defaultValue, children, min, max,
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
	}, [isMouseDown, tempValue, value, increment])

	const _handleMouseMove = (e: MouseEvent) => {

		if (isMouseDown) {
			if (e.buttons !== 1) {
				return setIsMouseDown(false)
			}

			let sensitivity = 0.5
			if (e.shiftKey) {
				sensitivity = 4
			} else if (e.altKey) {
				sensitivity = 0.01
			}

			const mouseYDelta = e.movementY * sensitivity

			const newTempValue = clamp(tempValue - mouseYDelta, min, max)

			const roundedValue = e.altKey ? newTempValue : clamp(_round(newTempValue), min, max)

			if (roundedValue !== value) {
				onChange(roundedValue)
			}

			setTempValue(newTempValue)
		}
	}
	function _round(v: number): number {
		return Math.round(v / increment) * increment
	}

	function _normalize(v: number): number {
		const x = (v - min) / (max - min)

		return clamp(x)
	}

	const _handleMouseDown = (e: React.MouseEvent) => {
		if (e.ctrlKey) {
			onChange(defaultValue)
		} else {
			setTempValue(value)
			setIsMouseDown(true)
		}
	}

	return children(
		_handleMouseDown,
		_normalize(value),
		_normalize(value),
	)
}

function clamp(value: number, min = 0, max = 1): number {
	return Math.min(max, Math.max(min, value))
}

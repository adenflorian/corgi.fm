import React, {useLayoutEffect, useState, ReactElement} from 'react'
import {incrementalRound} from '@corgifm/common/common-utils'
import './Knob.less'

interface Props {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	defaultValue: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => ReactElement<any>
	increment: number
	fineIncrement?: number
	allowAltKey?: boolean
}

export function SliderControllerIncremental(props: Props) {
	const {
		value, onChange, increment, defaultValue, children, min, max,
		allowAltKey = false, fineIncrement,
	} = props

	const [isMouseDown, setIsMouseDown] = useState(false)
	const [tempValue, setTempValue] = useState(0)

	useLayoutEffect(() => {
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

				const roundedValue = (allowAltKey && e.altKey && fineIncrement !== undefined)
					? clamp(incrementalRound(newTempValue, fineIncrement), min, max)
					: clamp(incrementalRound(newTempValue, increment), min, max)

				if (roundedValue !== value) {
					onChange(roundedValue)
				}

				setTempValue(newTempValue)
			}
		}

		if (isMouseDown) {
			window.addEventListener('mousemove', _handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [isMouseDown, tempValue, value, increment, min, max, allowAltKey, fineIncrement, onChange])

	function _normalize(v: number): number {
		const x = (v - min) / (max - min)

		return clamp(x)
	}

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey)) {
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

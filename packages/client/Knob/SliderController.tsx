import React, {useLayoutEffect, useState, ReactElement} from 'react'
import {clamp} from '@corgifm/common/common-utils'
import './Knob.less'

interface ISliderControllerProps {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	defaultValue?: number
	curve: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number, isMouseDown: boolean) => ReactElement<any>
}

export function SliderController(props: ISliderControllerProps) {
	const {
		value, defaultValue, onChange = () => undefined,
		min = 0, max = 1, curve = 1,
	} = props

	const [isMouseDown, setIsMouseDown] = useState(false)

	useLayoutEffect(() => {

		const _deNormalize = (n: number) => {
			const deCurvedValue = n ** curve
			const deNormalizedValue = (deCurvedValue * (max - min)) + min
			return deNormalizedValue
		}

		const _handleMouseMove = (e: MouseEvent) => {
			if (isMouseDown) {
				if (e.buttons !== 1) return setIsMouseDown(false)

				let sensitivity = 0.005
				if (e.shiftKey) {
					sensitivity *= 2
				} else if (e.altKey) {
					sensitivity *= 0.25
				}

				const mouseYDelta = e.movementY * sensitivity

				const newNormalizedValue = Math.max(0, Math.min(1, _normalize(value, min, max, curve) - mouseYDelta))

				const newValue = _deNormalize(newNormalizedValue)

				// if (isNaN(newValue)) throw new Error('nan')

				if (newValue !== value) {
					onChange(newValue)
				}
			}
		}

		if (isMouseDown) {
			window.addEventListener('mousemove', _handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [curve, isMouseDown, max, min, onChange, value])

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey) && defaultValue !== undefined) {
			onChange(defaultValue)
		} else {
			setIsMouseDown(true)
		}
	}

	return props.children(
		_handleMouseDown,
		_normalize(value, min, max, curve, true),
		_normalize(value, min, max, curve, false),
		isMouseDown,
	)
}

function _normalize(n: number, min: number, max: number, curve: number, useCurve = true) {
	if (min === max) return min

	const clamped = clamp(n, min, max)
	
	const x = (clamped - min) / (max - min)

	if (useCurve) {
		return clamp(x ** (1 / curve), 0, 1)
	} else {
		return clamp(x, 0, 1)
	}
}

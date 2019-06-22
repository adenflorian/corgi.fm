import React, {useLayoutEffect, useState} from 'react'
import './Knob.less'

interface ISliderControllerProps {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	defaultValue?: number
	curve: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => any
	snapFunction?: (value: number) => number
}

export function SliderController(props: ISliderControllerProps) {
	const {
		value, defaultValue, onChange = () => undefined,
		snapFunction, min = 0, max = 1, curve = 1,
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
	}, [isMouseDown, tempValue, value])

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

			if (snapFunction) {
				const newNormalizedValue = clamp(_normalize(tempValue) - mouseYDelta)

				const newValue = _deNormalize(newNormalizedValue)

				const snappedValue = snapFunction(newValue)

				if (snappedValue !== value) {
					onChange(snappedValue)
					setTempValue(snappedValue)
				} else {
					setTempValue(newValue)
				}
			} else {
				const newNormalizedValue = Math.max(0, Math.min(1, _normalize(value) - mouseYDelta))

				const newValue = _deNormalize(newNormalizedValue)

				if (newValue !== value) {
					onChange(newValue)
					setTempValue(newValue)
				}
			}
		}
	}

	function _normalize(n: number, useCurve = true) {
		// if (n === 0) return 0

		const x = (n - min) / (max - min)

		if (useCurve) {
			return clamp(Math.pow(x, 1 / curve))
		} else {
			return clamp(x)
		}
	}

	const _deNormalize = (n: number) => {
		const deCurvedValue = Math.pow(n, curve)
		const deNormalizedValue = (deCurvedValue * (max - min)) + min
		return deNormalizedValue
	}

	const _handleMouseDown = (e: React.MouseEvent) => {
		if (e.ctrlKey && defaultValue !== undefined) {
			onChange(defaultValue)
		} else {
			setTempValue(value)
			setIsMouseDown(true)
		}
	}

	return props.children(
		_handleMouseDown,
		_normalize(value, true),
		_normalize(value, false),
	)
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value))
}

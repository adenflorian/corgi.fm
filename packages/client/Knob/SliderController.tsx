import React, {useLayoutEffect, useState, ReactNode} from 'react'
import './Knob.less'

interface ISliderControllerProps {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	defaultValue?: number
	curve: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => ReactNode
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

				if (snapFunction) {
					const newNormalizedValue = clamp(_normalize(tempValue, min, max, curve) - mouseYDelta)

					const newValue = _deNormalize(newNormalizedValue)

					const snappedValue = snapFunction(newValue)

					if (snappedValue !== value) {
						onChange(snappedValue)
						setTempValue(snappedValue)
					} else {
						setTempValue(newValue)
					}
				} else {
					const newNormalizedValue = Math.max(0, Math.min(1, _normalize(value, min, max, curve) - mouseYDelta))

					const newValue = _deNormalize(newNormalizedValue)

					if (newValue !== value) {
						onChange(newValue)
						setTempValue(newValue)
					}
				}
			}
		}

		if (isMouseDown) {
			window.addEventListener('mousemove', _handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [curve, isMouseDown, max, min, onChange, snapFunction, tempValue, value])

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey) && defaultValue !== undefined) {
			onChange(defaultValue)
		} else {
			setTempValue(value)
			setIsMouseDown(true)
		}
	}

	return props.children(
		_handleMouseDown,
		_normalize(value, min, max, curve, true),
		_normalize(value, min, max, curve, false),
	)
}

function _normalize(n: number, min: number, max: number, curve: number, useCurve = true) {
	// if (n === 0) return 0

	const x = (n - min) / (max - min)

	if (useCurve) {
		return clamp(x ** (1 / curve))
	} else {
		return clamp(x)
	}
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value))
}

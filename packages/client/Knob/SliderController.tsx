import React, {useLayoutEffect, useState, ReactElement, useCallback} from 'react'
import {clamp, CurveFunctions} from '@corgifm/common/common-utils'
import './Knob.less'

interface ISliderControllerProps {
	readonly min: number
	readonly max: number
	readonly onChange: (newValue: number) => any
	readonly value: number
	readonly defaultValue?: number
	readonly curve: number
	readonly children: (handleMouseDown: any, percentage: number, isMouseDown: boolean) => ReactElement<any>
	readonly curveFunctionOverride?: CurveFunctions
	readonly experimental?: boolean
}

export function SliderController(props: ISliderControllerProps) {
	const {
		value, defaultValue, onChange = () => undefined, experimental = false,
		min = 0, max = 1, curve = 1, curveFunctionOverride,
	} = props

	const [isMouseDown, setIsMouseDown] = useState(false)

	const normalize = useCallback((n: number) => {
		if (min === max) return min

		const clamped = clamp(n, min, max)

		const x = (clamped - min) / (max - min)

		if (curveFunctionOverride) {
			return curveFunctionOverride.unCurve(x)
		} else {
			return clamp(x ** (1 / curve), 0, 1)
		}
	}, [min, max, curve, curveFunctionOverride])

	const deNormalize = useCallback((n: number) => {
		const deCurvedValue = curveFunctionOverride
			? curveFunctionOverride.curve(n)
			: n ** curve
		const deNormalizedValue = (deCurvedValue * (max - min)) + min
		return deNormalizedValue
	}, [min, max, curve, curveFunctionOverride])

	useLayoutEffect(() => {
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

				if (experimental) {
					const newNormalizedValue = Math.max(0, Math.min(1, value - mouseYDelta))

					if (newNormalizedValue !== value) {
						onChange(newNormalizedValue)
					}
				} else {
					const newNormalizedValue = Math.max(0, Math.min(1, normalize(value) - mouseYDelta))

					const newValue = deNormalize(newNormalizedValue)

					if (Number.isNaN(newValue)) throw new Error('nan')

					if (newValue !== value) {
						onChange(newValue)
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
	}, [curve, deNormalize, experimental, isMouseDown, max, min, normalize, onChange, value])

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey) && defaultValue !== undefined) {
			onChange(defaultValue)
		} else {
			setIsMouseDown(true)
		}
	}

	if (experimental) {

		return props.children(
			_handleMouseDown,
			value,
			isMouseDown,
		)
	} else {

		return props.children(
			_handleMouseDown,
			normalize(value),
			isMouseDown,
		)
	}
}

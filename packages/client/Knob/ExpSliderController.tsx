import React, {useLayoutEffect, useState, ReactElement} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {clampPolarized} from '@corgifm/common/common-utils'
import './Knob.less'

interface ISliderControllerProps {
	readonly onChange: (newValue: number) => void
	readonly value: number
	readonly defaultValue: number
	readonly children: (handleMouseDown: any, percentage: number, isMouseDown: boolean) => ReactElement<any>
	readonly range: SignalRange
}

export function ExpSliderController({
	value, defaultValue, onChange, range, children,
}: ISliderControllerProps) {

	const [isMouseDown, setIsMouseDown] = useState(false)

	useLayoutEffect(() => {
		if (!isMouseDown) return

		const _handleMouseMove = (e: MouseEvent) => {
			if (!isMouseDown) return
			if (e.buttons !== 1) return setIsMouseDown(false)

			let sensitivity = 0.005 * (range === 'bipolar' ? 2 : 1)
			if (e.shiftKey) {
				sensitivity *= 2
			} else if (e.altKey) {
				sensitivity *= 0.25
			}

			const mouseYDelta = e.movementY * sensitivity

			const newValue = clampPolarized(value - mouseYDelta, range)

			if (newValue !== value) {
				onChange(newValue)
			}
		}

		window.addEventListener('mousemove', _handleMouseMove)

		return () => {
			window.removeEventListener('mousemove', _handleMouseMove)
		}
	}, [isMouseDown, onChange, value])

	const _handleMouseDown = (e: React.MouseEvent) => {
		if ((e.ctrlKey || e.metaKey)) {
			onChange(defaultValue)
		} else {
			setIsMouseDown(true)
		}
	}

	return children(
		_handleMouseDown,
		value,
		isMouseDown,
	)
}

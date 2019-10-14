import React, {useLayoutEffect, useState, ReactElement} from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {clampPolarized} from '@corgifm/common/common-utils'
import './Knob.less'
import {blockMouse, unblockMouse} from '../SimpleGlobalClientState'
import {useBoolean} from '../react-hooks'

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

	const [isMouseDown, mouseDown, mouseUp] = useBoolean(false)
	const [hasMouseMoved, mouseMoved, resetMouseMoved] = useBoolean(false)

	useLayoutEffect(() => {
		if (isMouseDown && hasMouseMoved) {
			blockMouse()
		} else {
			unblockMouse()
		}
	}, [hasMouseMoved, isMouseDown])

	useLayoutEffect(() => {
		if (!isMouseDown) return

		const handleMouseMove = (e: MouseEvent) => {
			if (!isMouseDown) return
			if (e.buttons !== 1) return mouseUp()

			if (!hasMouseMoved) {
				mouseMoved()
			}

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

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', mouseUp)

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', mouseUp)
		}
	}, [hasMouseMoved, isMouseDown, mouseMoved, mouseUp, onChange, range, value])

	const _handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return
		if ((e.ctrlKey || e.metaKey)) {
			onChange(defaultValue)
		} else {
			resetMouseMoved()
			mouseDown()
		}
	}

	return children(
		_handleMouseDown,
		value,
		isMouseDown,
	)
}

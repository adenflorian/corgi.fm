import React, {FormEvent, useEffect, useRef, useState, useCallback, ChangeEvent} from 'react'
import {clamp, clampPolarized} from '@corgifm/common/common-utils'
import {SignalRange} from '@corgifm/common/common-types'
import {CurveFunctions} from '../client-utils'

interface Props {
	readonly value: number
	readonly valueString?: (value: number) => string
	readonly onValueChange: (value: number) => void
	readonly curveFunctions: CurveFunctions
	readonly maxValue: number
	readonly range: SignalRange
}

export const ExpKnobValueNumber = React.memo(
	function _ExpKnobValueNumber(props: Props) {
		const {
			valueString = (v: number) => v.toFixed(2),
			onValueChange, maxValue, curveFunctions, range,
		} = props

		const curvedValue = curveFunctions.curve(props.value) * maxValue

		const [active, setActive] = useState(false)
		const [tempValue, setTempValue] = useState(curvedValue.toString())
		const inputRef = useRef<HTMLInputElement>(null)

		useEffect(() => {
			if (active && inputRef.current) {
				inputRef.current.focus()
				inputRef.current.select()
			}
		}, [active])

		const handleClick = useCallback((e: React.MouseEvent) => {
			e.stopPropagation()
			setTempValue(curvedValue.toFixed(2))
			setActive(true)
		}, [curvedValue])

		const handleBlur = useCallback(() => {
			setActive(false)
		}, [])

		const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setTempValue(e.target.value.replace(/[^0-9-.]/g, ''))
		}, [])

		const displayValue = valueString(curvedValue)

		if (active) {
			return (
				<form
					className="knobValue unselectable"
					onSubmit={handleSubmit}
					onBlur={handleBlur}
				>
					<input
						value={tempValue}
						onChange={handleChange}
						ref={inputRef}
					/>
				</form>
			)
		} else {
			return (
				<div
					className="knobValue unselectable"
					onMouseDown={handleClick}
				>
					{displayValue}
				</div>
			)
		}

		function handleSubmit(e: FormEvent) {
			e.preventDefault()
			setActive(false)

			const parsedFloat = Number.parseFloat(tempValue)

			if (Number.isNaN(parsedFloat)) return

			const normalized = curveFunctions.unCurve(parsedFloat / maxValue)

			onValueChange(clampPolarized(normalized, range))
		}
	},
)

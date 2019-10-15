import React, {FormEvent, useEffect, useRef, useState, useCallback, ChangeEvent} from 'react'
import {clamp, CurveFunctions} from '@corgifm/common/common-utils'

interface Props {
	readonly value: number
	readonly valueString?: (value: number) => string
	readonly onValueChange: (value: number) => void
	readonly min: number
	readonly max: number
	readonly round?: (value: number) => number
	readonly curveFunctionOverride?: CurveFunctions
}

export const KnobValueNumber = React.memo(
	function _KnobValueNumber(props: Props) {
		const {
			valueString = (v: number) => v.toFixed(2),
			round = (v: number) => v, curveFunctionOverride,
			onValueChange, min, max,
		} = props

		const curvedValue = curveFunctionOverride
			? curveFunctionOverride.curve(props.value) * max
			: props.value

		const [active, setActive] = useState(false)
		const [tempValue, setTempValue] = useState(curvedValue.toString())
		const inputRef = useRef<HTMLInputElement>(null)

		useEffect(() => {
			if (active && inputRef.current) {
				inputRef.current.focus()
				inputRef.current.select()
			}
		}, [active])

		const handleClick = useCallback(() => {
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
					onClick={handleClick}
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

			onValueChange(clamp(round(parsedFloat), min, max))
		}
	},
)

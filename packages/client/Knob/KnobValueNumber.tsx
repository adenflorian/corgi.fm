import React, {FormEvent, useEffect, useRef, useState} from 'react'
import {clamp} from '@corgifm/common/common-utils'

interface Props {
	value: number
	valueString?: (value: number) => string
	onValueChange: (value: number) => void
	min: number
	max: number
	round?: (value: number) => number
}

export const KnobValueNumber = React.memo(
	function _KnobValueNumber(props: Props) {
		const {
			valueString = (v: number) => v.toFixed(2),
			round = (v: number) => v,
			value, onValueChange, min, max,
		} = props

		const [active, setActive] = useState(false)
		const [tempValue, setTempValue] = useState(value.toString())
		const inputRef = useRef<HTMLInputElement>(null)

		useEffect(() => {
			if (active && inputRef.current) {
				inputRef.current.focus()
				inputRef.current.select()
			}
		}, [active])

		const displayValue = valueString(value)

		if (active) {
			return (
				<form
					className="knobValue unselectable"
					onSubmit={handleSubmit}
					onBlur={() => setActive(false)}
				>
					<input
						value={tempValue}
						onChange={e => setTempValue(e.target.value.replace(/[^0-9-\.]/g, ''))}
						ref={inputRef}
					/>
				</form>
			)
		} else {
			return (
				<div
					className="knobValue unselectable"
					onClick={() => {
						setTempValue(value.toFixed(2))
						setActive(true)
					}}
				>
					{displayValue}
				</div>
			)
		}

		function handleSubmit(e: FormEvent) {
			e.preventDefault()
			setActive(false)

			const parsedFloat = Number.parseFloat(tempValue)

			if (isNaN(parsedFloat)) return

			onValueChange(clamp(round(parsedFloat), min, max))
		}
	},
)

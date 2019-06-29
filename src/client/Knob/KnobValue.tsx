import React, {FormEvent, useEffect, useRef, useState} from 'react'
import {KnobValues} from './KnobTypes'

interface Props {
	value: KnobValues
	valueString?: (value: number) => string
	onValueChange?: (value: number) => void
	min?: number
	max?: number
}

export const KnobValue = React.memo(function _KnobValue(props: Props) {
	const {valueString = (v: number) => v.toFixed(2), value, onValueChange} = props

	const [active, setActive] = useState(false)
	const [tempValue, setTempValue] = useState(value.toString())
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (active && inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}
	}, [active])

	const displayValue = typeof value === 'number'
		? valueString
			? valueString(value)
			: value.toFixed(2)
		: typeof value === 'boolean'
			? value ? 'on' : 'off'
			: value

	const isNumber = typeof value === 'number'

	if (active) {
		return (
			<form
				className="knobValueForm"
				onSubmit={handleSubmit}
				onBlur={() => setActive(false)}
			>
				<input
					className="knobValue unselectable"
					value={tempValue}
					onChange={e => setTempValue(e.target.value.replace(/[^0-9]/g, ''))}
					ref={inputRef}
				/>
			</form>
		)
	} else {
		return (
			<div
				className="knobValue unselectable"
				onClick={() => {
					if (typeof value !== 'number') return
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
		if (onValueChange) onValueChange(Number.parseFloat(tempValue))
	}
})

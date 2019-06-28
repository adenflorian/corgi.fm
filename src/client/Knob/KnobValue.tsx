import React from 'react'

interface Props {
	value: number | string | boolean
	valueString?: (value: number) => string
}

export const KnobValue = React.memo(function _KnobValue(props: Props) {
	const {valueString, value} = props

	const displayValue = typeof value === 'number'
		? valueString
			? valueString(value)
			: value.toFixed(2)
		: typeof value === 'boolean'
			? value ? 'on' : 'off'
			: value

	return (
		<div className="knobValue unselectable">{displayValue}</div>
	)
})

import React from 'react'
import {KnobValues} from './KnobTypes'

interface Props {
	value: KnobValues
	valueString?: (value: number) => string
}

export const KnobValueOther = React.memo(function _KnobValueOther(props: Props) {
	const {valueString = (v: number) => v.toFixed(2), value} = props

	const displayValue = typeof value === 'number'
		? valueString(value)
		: typeof value === 'boolean'
			? value ? 'on' : 'off'
			: value

	return (
		<div className="knobValue unselectable">
			{displayValue}
		</div>
	)
})

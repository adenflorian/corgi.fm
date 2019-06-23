import React from 'react'
import './Knob.less'
import {KnobView} from './KnobView'
import {SliderControllerIncremental} from './SliderControllerIncremental'

interface Props {
	label: string
	markColor?: string
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	onChangeId?: any
	readOnly?: boolean
	value: number
	defaultValue: number
	size?: number
	tooltip: string
	valueString?: (value: number) => string
	increment: number
}

export const KnobIncremental = React.memo(function _KnobIncremental(props: Props) {
	const {
		value, label = '', readOnly = false, markColor = 'currentColor', onChangeId,
		size = 32, tooltip, valueString, onChange,
		increment, defaultValue, min, max,
	} = props

	const _handleOnChange = (newValue: number) => {
		onChange(onChangeId, newValue)
	}

	return (
		<SliderControllerIncremental
			min={min}
			max={max}
			onChange={_handleOnChange}
			value={value}
			defaultValue={defaultValue}
			increment={increment}
		>
			{(handleMouseDown, percentage, adjustedPercentage) =>
				<KnobView
					percentage={percentage}
					adjustedPercentage={adjustedPercentage}
					label={label}
					readOnly={readOnly}
					markColor={markColor}
					handleMouseDown={handleMouseDown}
					size={size}
					tooltip={tooltip}
					value={value}
					valueString={valueString}
				/>
			}
		</SliderControllerIncremental>
	)
})

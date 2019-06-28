import React from 'react'
import './Knob.less'
import {KnobBaseProps} from './KnobTypes'
import {KnobView} from './KnobView'
import {SliderControllerIncremental} from './SliderControllerIncremental'

interface Props extends KnobBaseProps {
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	defaultValue: number
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

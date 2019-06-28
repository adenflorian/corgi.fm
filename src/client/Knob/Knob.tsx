import * as React from 'react'
import './Knob.less'
import {KnobBaseProps} from './KnobTypes'
import {KnobView} from './KnobView'
import {SliderController} from './SliderController'

interface IKnobProps extends KnobBaseProps {
	curve?: number
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	defaultValue: number
	valueString?: (value: number) => string
}

export const Knob = React.memo(function _Knob(props: IKnobProps) {
	const {
		value, label = '', readOnly = false, markColor = 'currentColor', defaultValue, onChangeId,
		min = 0, max = 1, curve = 1, size = 32, tooltip, valueString, onChange = () => undefined,
	} = props

	const _handleOnChange = (newValue: number) => {
		onChange(onChangeId, newValue)
	}

	return (
		<SliderController
			min={min}
			max={max}
			curve={curve}
			onChange={_handleOnChange}
			value={value}
			defaultValue={defaultValue}
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
		</SliderController>
	)
})

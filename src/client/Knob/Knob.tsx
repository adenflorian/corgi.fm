import React from 'react'
import './Knob.less'
import {KnobBaseProps} from './KnobTypes'
import {KnobValueNumber} from './KnobValueNumber'
import {KnobView} from './KnobView'
import {SliderController} from './SliderController'

interface IKnobProps extends KnobBaseProps {
	curve?: number
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	defaultValue: number
	valueString?: (value: number) => string
	value: number
}

export const Knob = React.memo(function _Knob(props: IKnobProps) {
	const {
		value, label = '', readOnly = false, defaultValue, onChangeId,
		min = 0, max = 1, curve = 1, tooltip, valueString, onChange = () => undefined,
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
					handleMouseDown={handleMouseDown}
					tooltip={tooltip}
					canEdit={true}
				>
					<KnobValueNumber
						value={value}
						valueString={valueString}
						onValueChange={_handleOnChange}
						min={min}
						max={max}
					/>
				</KnobView>
			}
		</SliderController>
	)
})

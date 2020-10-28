import React from 'react'
import {KnobBaseProps} from './KnobTypes'
import {KnobValueNumber} from './KnobValueNumber'
import {KnobView} from './KnobView'
import {SliderController} from './SliderController'
import './Knob.less'

interface IKnobProps extends KnobBaseProps {
	readonly curve?: number
	readonly max: number
	readonly min: number
	readonly onChange: (onChangeId: any, newValue: number) => any
	readonly defaultValue: number
	readonly valueString?: (value: number) => string
	readonly value: number
	readonly color?: string
}

export const Knob = React.memo(function _Knob(props: IKnobProps) {
	const {
		value, label = '', readOnly = false, defaultValue, onChangeId, color,
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
			{(handleMouseDown, percentage, isMouseDown) =>
				<KnobView
					percentage={percentage}
					label={label}
					readOnly={readOnly}
					handleMouseDown={handleMouseDown}
					tooltip={tooltip}
					canEdit={true}
					isMouseDown={isMouseDown}
					color={color}
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

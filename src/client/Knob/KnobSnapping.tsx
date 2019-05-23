import {List} from 'immutable'
import * as React from 'react'
import './Knob.less'
import {KnobView} from './KnobView'
import {SliderControllerSnapping} from './SliderControllerSnapping'

interface Props {
	curve?: number
	label: string
	markColor?: string
	onChange: (onChangeId: any, newValue: number | string) => any
	onChangeId?: any
	readOnly?: boolean
	value: number | string
	defaultIndex: number
	size?: number
	tooltip: string
	valueString?: (value: number) => string
	possibleValues: List<any>
}

export const KnobSnapping = React.memo(function _KnobSnapping(props: Props) {
	const {
		value, label = '', readOnly = false, markColor = 'currentColor', onChangeId,
		size = 32, tooltip, valueString, onChange,
		possibleValues, defaultIndex,
	} = props

	const _handleOnChange = (newValue: number | string) => {
		onChange(onChangeId, newValue)
	}

	return (
		<SliderControllerSnapping
			onChange={_handleOnChange}
			value={value}
			defaultIndex={defaultIndex}
			possibleValues={possibleValues}
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
		</SliderControllerSnapping>
	)
})

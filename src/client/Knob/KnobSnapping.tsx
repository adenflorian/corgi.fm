import {List} from 'immutable'
import * as React from 'react'
import './Knob.less'
import {KnobBaseProps} from './KnobTypes'
import {KnobView} from './KnobView'
import {SliderControllerSnapping} from './SliderControllerSnapping'

interface Props extends KnobBaseProps {
	curve?: number
	onChange: (onChangeId: any, newValue: number | string | boolean) => any
	defaultIndex: number
	valueString?: (value: number) => string
	possibleValues: List<any>
}

export const KnobSnapping = React.memo(function _KnobSnapping(props: Props) {
	const {
		value, label = '', readOnly = false, onChangeId,
		tooltip, valueString, onChange,
		possibleValues, defaultIndex,
	} = props

	const _handleOnChange = (newValue: number | string | boolean) => {
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
					handleMouseDown={handleMouseDown}
					tooltip={tooltip}
					value={value}
					valueString={valueString}
				/>
			}
		</SliderControllerSnapping>
	)
})

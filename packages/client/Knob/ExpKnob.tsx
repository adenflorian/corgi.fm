import React from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {ParamInputChainReact} from '../Experimental/ExpPorts'
import {CurveFunctions} from '../client-utils'
import {KnobBaseProps} from './KnobTypes'
import {ExpKnobView} from './ExpKnobView'
import {ExpSliderController} from './ExpSliderController'
import {ExpKnobValueNumber} from './ExpKnobValueNumber'
import './Knob.less'

interface Props extends KnobBaseProps {
	readonly onChange: (onChangeId: any, newValue: number) => any
	readonly defaultValue: number
	readonly valueString?: (value: number) => string
	readonly value: number
	readonly chains?: readonly ParamInputChainReact[]
	readonly color?: string
	readonly curveFunctions: CurveFunctions
	readonly range: SignalRange
	readonly maxValue: number
}

export const ExpKnob = React.memo(function _Knob(props: Props) {
	const {
		value, label = '', readOnly = false, defaultValue, onChangeId, chains, color,
		tooltip, valueString, onChange, maxValue,
		curveFunctions, range,
	} = props

	const _handleOnChange = (newValue: number) => {
		onChange(onChangeId, newValue)
	}

	return (
		<ExpSliderController
			onChange={_handleOnChange}
			value={value}
			defaultValue={defaultValue}
			range={range}
		>
			{(handleMouseDown, percentage, isMouseDown) =>
				<ExpKnobView
					percentage={percentage}
					label={label}
					readOnly={readOnly}
					handleMouseDown={handleMouseDown}
					tooltip={tooltip}
					canEdit={true}
					isMouseDown={isMouseDown}
					chains={chains}
					color={color}
					range={range}
				>
					<ExpKnobValueNumber
						value={value}
						valueString={valueString}
						onValueChange={_handleOnChange}
						curveFunctions={curveFunctions}
						range={range}
						maxValue={maxValue}
					/>
				</ExpKnobView>
			}
		</ExpSliderController>
	)
})

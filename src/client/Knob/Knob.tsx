import * as React from 'react'
import './Knob.less'
import {KnobView} from './KnobView'
import {SliderController} from './SliderController'

interface IKnobProps {
	curve: number
	label: string
	markColor: string
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	onChangeId?: any
	readOnly: boolean
	value: number
	size: number
	tooltip: string
}

export class Knob extends React.PureComponent<IKnobProps> {
	public static defaultProps: Partial<IKnobProps> = {
		curve: 1,
		label: '',
		markColor: 'currentColor',
		max: 1,
		min: 0,
		onChange: () => undefined,
		readOnly: false,
		size: 32,
	}

	public render() {
		const {
			value, label, readOnly, markColor,
			min, max, curve, size, tooltip,
		} = this.props

		return (
			<SliderController min={min} max={max} curve={curve} onChange={this._handleOnChange} value={value}>
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
					/>
				}
			</SliderController>
		)
	}

	private readonly _handleOnChange = (newValue: number) => {
		this.props.onChange(this.props.onChangeId, newValue)
	}
}

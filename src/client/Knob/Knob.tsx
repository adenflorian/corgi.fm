import * as React from 'react'
import './Knob.less'
import {KnobView} from './KnobView'
import {SliderController} from './SliderController'

interface IKnobProps {
	label?: string
	min?: number
	max?: number
	onChange?: (newValue: number, onChangeId: any) => any
	value: number
	readOnly?: boolean
	markColor?: string
	curve?: number
	onChangeId?: any
}

export class Knob extends React.PureComponent<IKnobProps> {
	public static defaultProps = {
		onChange: () => undefined,
		min: 0,
		max: 1,
		readOnly: false,
		markColor: 'currentColor',
		curve: 1,
	}

	public render() {
		const {value, label, readOnly, markColor, min, max, curve} = this.props

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
					/>
				}
			</SliderController>
		)
	}

	private _handleOnChange = (newValue: number) => {
		this.props.onChange(newValue, this.props.onChangeId)
	}
}

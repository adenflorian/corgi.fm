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
	onChange: (newValue: number, onChangeId: any) => any
	onChangeId?: any
	readOnly: boolean
	value: number
}

export class Knob extends React.PureComponent<IKnobProps> {
	public static defaultProps = {
		curve: 1,
		label: '',
		markColor: 'currentColor',
		max: 1,
		min: 0,
		onChange: () => undefined,
		readOnly: false,
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

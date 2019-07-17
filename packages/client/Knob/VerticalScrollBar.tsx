import {List} from 'immutable'
import React from 'react'
import {SliderController} from './SliderController'
import {VerticalScrollBarView} from './VerticalScrollBarView'

interface IVerticalScrollBarProps {
	min: number
	max: number
	onChange: (newValue: number, onChangeId: any) => any
	value: number
	curve: number
	onChangeId?: any
	marks: List<number>
	sliderGrabberHeightPercentage?: number
}

export class VerticalScrollBar extends React.PureComponent<IVerticalScrollBarProps> {
	public static defaultProps = {
		min: 0,
		max: 1,
		curve: 1,
		marks: [],
	}

	public render() {
		const {value, min, max, curve, marks} = this.props

		return (
			<SliderController min={min} max={max} curve={curve} onChange={this._handleOnChange} value={value}>
				{(handleMouseDown, percentage) =>
					<VerticalScrollBarView
						percentage={percentage}
						handleMouseDown={handleMouseDown}
						marks={marks}
						sliderGrabberHeightPercentage={this.props.sliderGrabberHeightPercentage}
					/>
				}
			</SliderController>
		)
	}

	private readonly _handleOnChange = (newValue: number) => {
		this.props.onChange(newValue, this.props.onChangeId)
	}
}

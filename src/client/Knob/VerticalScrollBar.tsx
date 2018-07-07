import * as React from 'react'
import {SliderController} from './SliderController'
import {VerticalScrollBarView} from './VerticalScrollBarView'

interface IVerticalScrollBarProps {
	min?: number
	max?: number
	onChange: (newValue: number, onChangeId: any) => any
	value: number
	curve?: number
	onChangeId?: any
}

export class VerticalScrollBar extends React.PureComponent<IVerticalScrollBarProps> {
	public static defaultProps = {
		min: 0,
		max: 1,
		readOnly: false,
		markColor: 'currentColor',
		curve: 1,
	}

	public render() {
		const {value, min, max, curve} = this.props

		return (
			<SliderController min={min} max={max} curve={curve} onChange={this._handleOnChange} value={value}>
				{(handleMouseDown, percentage, adjustedPercentage) =>
					<VerticalScrollBarView
						percentage={percentage}
						adjustedPercentage={adjustedPercentage}
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

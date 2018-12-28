import * as React from 'react'
import './Knob.less'

interface ISliderControllerProps {
	min: number
	max: number
	onChange: (newValue: number) => any
	value: number
	curve: number
	children: (handleMouseDown: any, percentage: number, adjustedPercentage: number) => any
}

interface ISliderControllerState {
	mouseDownPosition: {
		x: number,
		y: number,
	}
	isMouseDown: boolean,
	normalizedValue: number
}

export class SliderController extends React.Component<ISliderControllerProps, ISliderControllerState> {
	public static defaultProps = {
		onChange: () => undefined,
		min: 0,
		max: 1,
		curve: 1,
	}

	public state: ISliderControllerState = {
		mouseDownPosition: {
			x: 0,
			y: 0,
		},
		isMouseDown: false,
		normalizedValue: 0.5,
	}

	constructor(props: ISliderControllerProps) {
		super(props)
		this.state.normalizedValue = this._normalize(this.props.value)
		window.addEventListener('mousemove', this._handleMouseMove)
		window.addEventListener('mouseup', this._handleMouseUp)
	}

	public componentWillReceiveProps(nextProps: ISliderControllerProps) {
		const normalizedNextValue = this._normalize(nextProps.value)
		if (normalizedNextValue !== this.state.normalizedValue) {
			this.setState({normalizedValue: normalizedNextValue})
		}
	}

	public componentWillUnmount() {
		window.removeEventListener('mousemove', this._handleMouseMove)
		window.removeEventListener('mouseup', this._handleMouseUp)
	}

	public render() {
		return this.props.children(
			this._handleMouseDown,
			this.state.normalizedValue,
			this._normalize(this.props.value, false),
		)
	}

	private readonly _handleMouseUp = () => {
		if (this.state.isMouseDown) {
			this.setState({
				isMouseDown: false,
			})
		}
	}

	private readonly _handleMouseMove = (e: MouseEvent) => {
		if (this.state.isMouseDown) {
			let sensitivity = 0.005
			if (e.shiftKey) {
				sensitivity *= 2
			} else if (e.altKey) {
				sensitivity *= 0.25
			}
			const mouseYDelta = e.movementY * sensitivity

			const normalizedValue = this.state.normalizedValue

			const newNormalizedValue = Math.max(0, Math.min(1, normalizedValue - mouseYDelta))

			if (newNormalizedValue !== normalizedValue) {
				this.setState({normalizedValue: newNormalizedValue})
				this.props.onChange(this._deNormalize(newNormalizedValue))
			}
		}
	}

	private readonly _normalize = (value: number, curve = true) => {
		const normalizedValue = (value - this.props.min) / (this.props.max - this.props.min)
		if (curve) {
			return Math.pow(normalizedValue, 1 / this.props.curve)
		} else {
			return normalizedValue
		}
	}

	private readonly _deNormalize = (value: number) => {
		const deCurvedValue = Math.pow(value, this.props.curve)
		const deNormalizedValue = (deCurvedValue * (this.props.max - this.props.min)) + this.props.min
		return deNormalizedValue
	}

	private readonly _handleMouseDown = (e: React.MouseEvent) => {
		this.setState({
			mouseDownPosition: {
				x: e.screenX,
				y: e.screenY,
			},
			isMouseDown: true,
		})
	}
}

import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import {valueToPercentageOfMinMax} from '../utils'
import './Knob.less'

interface IKnobProps {
	label?: string
	min?: number
	max?: number
	onChange?: (newValue: number) => any
	sensitivity?: number
	value: number
	readOnly?: boolean
	markColor?: string
}

interface IKnobState {
	mouseDownPosition: {
		x: number,
		y: number,
	}
	isMouseDown: boolean,
	valueWhenMouseDown?: number
}

export class Knob extends Component<IKnobProps, IKnobState> {
	public static defaultProps = {
		onChange: () => undefined,
		min: 0,
		max: 1,
		sensitivity: 0.005,
		readOnly: false,
		markColor: 'currentColor',
	}

	public state: IKnobState = {
		mouseDownPosition: {
			x: 0,
			y: 0,
		},
		isMouseDown: false,
	}

	constructor(props: IKnobProps) {
		super(props)
		window.addEventListener('mousemove', this._handleMouseMove)
		window.addEventListener('mouseup', this._handleMouseUp)
	}

	public componentWillUnmount() {
		window.removeEventListener('mousemove', this._handleMouseMove)
		window.removeEventListener('mouseup', this._handleMouseUp)
	}

	public render() {
		const {value, label, min, max, readOnly, markColor} = this.props

		const percentage = valueToPercentageOfMinMax(value, min, max)

		return (
			<div
				className={`knob ${readOnly ? 'readOnly' : ''}`}
			>
				<div className="actualKnobContainer">
					<svg className="arc colorize" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
						style={{
							position: 'absolute',
							overflow: 'visible',
							transform: `rotate(90deg)`,
						}}
					>
						<circle cx="50%" cy="50%" r="64%"
							fill="none" stroke="currentColor" strokeWidth="2"
							strokeDasharray={`0 50% ${percentage * 3}% 100000`} strokeDashoffset="1"
						/>
					</svg>
					<div
						className="actualKnob"
						style={{
							transform: `rotate(${this._getRotation(value, min, max)}deg)`,
						}}
						onMouseDown={this._handleMouseDown}
					>
						<div className="mark" style={{backgroundColor: markColor}}></div>
					</div>
				</div>
				<div className="label unselectable">{label}</div>
			</div>
		)
	}

	private _handleMouseUp = () => {
		this.setState({
			isMouseDown: false,
		})
	}

	private _handleMouseMove = (e: MouseEvent) => {
		if (this.state.isMouseDown) {
			const mouseYDelta = (e.screenY - this.state.mouseDownPosition.y) * this.props.sensitivity

			const calculateNewVolume = (oldValue: number, mouseDeltaY: number): number => {
				const delta = -mouseDeltaY
				const combined = oldValue + delta
				return Math.max(this.props.min, Math.min(this.props.max, combined))
			}

			const newValue = calculateNewVolume(this.state.valueWhenMouseDown, mouseYDelta)

			if (newValue !== this.props.value) {
				this.props.onChange(newValue)
			}
		}
	}

	private _handleMouseDown = (e: React.MouseEvent) => {
		this.setState({
			mouseDownPosition: {
				x: e.screenX,
				y: e.screenY,
			},
			isMouseDown: true,
			valueWhenMouseDown: this.props.value,
		})
	}

	private _getRotation(input: number, min: number, max: number): number {
		const minDegrees = 220
		const maxDegrees = 500
		const rangeDegrees = maxDegrees - minDegrees
		const inputRange = Math.abs(max - min)
		const inputDistanceFromMin = Math.abs(input - min)
		const inputToRangeRatio = inputDistanceFromMin / inputRange
		const amountOfDegreesToApply = rangeDegrees * inputToRangeRatio
		return minDegrees + amountOfDegreesToApply
	}
}

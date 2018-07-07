import {normalize} from 'path'
import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
import './Knob.less'

interface IKnobProps {
	label?: string
	min?: number
	max?: number
	onChange?: (newValue: number) => any
	value: number
	readOnly?: boolean
	markColor?: string
	curve?: number
}

interface IKnobState {
	mouseDownPosition: {
		x: number,
		y: number,
	}
	isMouseDown: boolean,
	normalizedValue: number
}

export class Knob extends Component<IKnobProps, IKnobState> {
	public static defaultProps = {
		onChange: () => undefined,
		min: 0,
		max: 1,
		readOnly: false,
		markColor: 'currentColor',
		curve: 1,
	}

	public state: IKnobState = {
		mouseDownPosition: {
			x: 0,
			y: 0,
		},
		isMouseDown: false,
		normalizedValue: 0.5,
	}

	constructor(props: IKnobProps) {
		super(props)
		this.state.normalizedValue = this._normalize(this.props.value)
		window.addEventListener('mousemove', this._handleMouseMove)
		window.addEventListener('mouseup', this._handleMouseUp)
	}

	public componentWillUnmount() {
		window.removeEventListener('mousemove', this._handleMouseMove)
		window.removeEventListener('mouseup', this._handleMouseUp)
	}

	public render() {
		const {value, label, readOnly, markColor} = this.props

		const normalizedValue = this.state.normalizedValue

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
							fill="none" stroke="gray" strokeWidth="2"
							strokeDasharray={`0 50% ${normalizedValue * 300}% 100000`} strokeDashoffset="1"
						/>
						<circle cx="50%" cy="50%" r="64%"
							fill="none" stroke="currentColor" strokeWidth="2"
							strokeDasharray={`0 50% ${this._normalize(value, false) * 300}% 100000`} strokeDashoffset="1"
						/>
					</svg>
					<div
						className="actualKnob"
						style={{
							transform: `rotate(${this._getRotation(normalizedValue)}deg)`,
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
			let sensitivity = 0.005
			if (e.shiftKey) {
				sensitivity *= 2
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

	private _normalize = (value: number, curve = true) => {
		const normalizedValue = (value - this.props.min) / (this.props.max - this.props.min)
		if (curve) {
			return Math.pow(normalizedValue, 1 / this.props.curve)
		} else {
			return normalizedValue
		}
	}

	private _deNormalize = (value: number) => {
		const deCurvedValue = Math.pow(value, this.props.curve)
		const deNormalizedValue = (deCurvedValue * (this.props.max - this.props.min)) + this.props.min
		return deNormalizedValue
	}

	private _handleMouseDown = (e: React.MouseEvent) => {
		this.setState({
			mouseDownPosition: {
				x: e.screenX,
				y: e.screenY,
			},
			isMouseDown: true,
		})
	}

	private _getRotation(normalizedInput: number): number {
		const minDegrees = 220
		const maxDegrees = 500
		const rangeDegrees = maxDegrees - minDegrees
		const amountOfDegreesToApply = rangeDegrees * normalizedInput
		return minDegrees + amountOfDegreesToApply
	}
}

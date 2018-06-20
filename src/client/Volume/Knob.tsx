import classnames from 'classnames'
import 'rc-slider/assets/index.css'
import React = require('react')
import {Component} from 'react'
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
	mouseX: number
	mouseY: number
	mouseDownPosition: {
		x: number,
		y: number,
	}
	lastMousePosition: {
		x: number,
		y: number,
	}
	isMouseDown: boolean
}

export class Knob extends Component<IKnobProps, IKnobState> {
	public static defaultProps = {
		onChange: () => undefined,
		min: 0,
		max: 1,
		sensitivity: 0.005,
		readOnly: false,
		markColor: 'gray',
	}

	public state: IKnobState = {
		mouseX: 0,
		mouseY: 0,
		mouseDownPosition: {
			x: 0,
			y: 0,
		},
		lastMousePosition: {
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

		return (
			<div className={classnames(['knob', readOnly ? 'readOnly' : ''])}>
				<div className="wedge">
					<div
						className="actualKnob"
						style={{
							transform: `rotate(${this._getRotation(value, min, max)}deg)`,
						}}
						onMouseDown={this._handleMouseDown}
					>
						<div className="mark" style={{backgroundColor: markColor}}></div>
						<div className="label unselectable">{label}</div>
					</div>
				</div>
			</div>
		)
	}

	private _handleMouseUp = () => {
		this.setState({
			isMouseDown: false,
		})
	}

	private _handleMouseMove = (e: MouseEvent) => {
		this.setState({
			mouseX: e.screenX,
			mouseY: e.screenY,
			lastMousePosition: {
				x: this.state.mouseX,
				y: this.state.mouseY,
			},
		})
		if (this.state.isMouseDown) {
			const mouseXDelta = (this.state.mouseX - this.state.lastMousePosition.x) * this.props.sensitivity
			const mouseYDelta = (this.state.mouseY - this.state.lastMousePosition.y) * this.props.sensitivity

			const calculateNewVolume = (oldValue: number, mouseDeltaX: number, mouseDeltaY: number): number => {
				const delta = mouseDeltaX - mouseDeltaY
				const combined = oldValue + delta
				return Math.max(this.props.min, Math.min(this.props.max, combined))
			}

			this.props.onChange(calculateNewVolume(this.props.value, mouseXDelta, mouseYDelta))
		}
	}

	private _handleMouseDown = () => {
		this.setState({
			mouseDownPosition: {
				x: this.state.mouseX,
				y: this.state.mouseY,
			},
			isMouseDown: true,
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

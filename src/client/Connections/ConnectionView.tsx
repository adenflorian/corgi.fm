import * as React from 'react'
import {
	// colorFunc,
	saturateColor,
} from '../../common/shamu-color'
import './ConnectionView.less'

export interface Point {
	x: number
	y: number
}

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	connectorWidth: number
	connectorHeight: number
	saturateSource: boolean
	saturateTarget: boolean
	id: string
}

class LineState {
	constructor(
		public readonly x1: number,
		public readonly y1: number,
		public readonly x2: number,
		public readonly y2: number,
	) {}

	public readonly width = () => Math.abs(this.x1 - this.x2)
	public readonly height = () => Math.abs(this.y1 - this.y2)
	public readonly leftMost = () => Math.min(this.x1, this.x2)
	public readonly topMost = () => Math.min(this.y1, this.y2)
}

export class ConnectionView extends React.PureComponent<IConnectionViewProps> {
	public static defaultProps = {
		connectorWidth: 16,
		connectorHeight: 8,
	}

	public render() {
		const {color, saturateSource, saturateTarget, id} = this.props

		const longLineStrokeWidth = 2
		const connectorStrokeWidth = 8

		const line = new LineState(
			this.props.sourceX + this.props.connectorWidth,
			this.props.sourceY,
			this.props.targetX,
			this.props.targetY,
		)

		return (
			<div className="connection">
				<svg
					className={`colorize longLine`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: line.width(),
						height: line.height(),
						minHeight: longLineStrokeWidth,
						top: line.topMost(),
						left: line.leftMost(),
						zIndex: -3,
					}}
				>
					<defs>
						<linearGradient
							id={id}
							x1={(line.x1 - line.leftMost())}
							y1={(line.y1 - line.topMost())}
							x2={(line.x2 - line.leftMost())}
							y2={(line.y2 - line.topMost())}
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor={saturateSource ? saturateColor(color) : color} offset="0%" />
							<stop stopColor={saturateTarget ? saturateColor(color) : color} offset="100%" />
						</linearGradient>
					</defs>
					<line
						x1={line.x1 - line.leftMost()}
						y1={line.y1 - line.topMost()}
						x2={line.x2 - line.leftMost()}
						y2={line.y2 - line.topMost()}
						stroke={`url(#${id})`}
						strokeWidth={longLineStrokeWidth + 'px'}
					/>
				</svg>
				<svg
					className={`colorize connector source ${saturateSource ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: this.props.connectorHeight,
						top: this.props.sourceY - (this.props.connectorHeight / 2),
						left: this.props.sourceX,
					}}
				>
					<line
						x1={0}
						y1={this.props.connectorHeight / 2}
						x2={this.props.connectorWidth}
						y2={this.props.connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
				<svg
					className={`colorize connector target ${saturateTarget ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: this.props.connectorHeight,
						top: this.props.targetY - (this.props.connectorHeight / 2),
						left: this.props.targetX,
					}}
				>
					<line
						x1={0}
						y1={this.props.connectorHeight / 2}
						x2={this.props.connectorWidth}
						y2={this.props.connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
			</div>
		)
	}
}

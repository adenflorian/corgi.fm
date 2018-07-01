import Color from 'color'
import * as React from 'react'
import './ConnectionView.less'

export interface Point {
	x: number
	y: number
}

export interface IConnectionViewProps {
	color: string
	sourcePoint: Point
	destinationPoint: Point
	connectorWidth?: number
	connectorHeight?: number
}

export class ConnectionView extends React.PureComponent<IConnectionViewProps> {
	public static defaultProps = {
		connectorWidth: 16,
		connectorHeight: 8,
	}

	public render() {
		const color = this.props.color
		const darkerColor = Color(color).darken(0.6).hsl().string()
		const strokeWidth = '2px'
		const strokeWidth2 = '8px'

		return (
			<React.Fragment>
				<svg className="connection longLine" xmlns="http://www.w3.org/2000/svg">
					<line
						x1={this.props.sourcePoint.x + this.props.connectorWidth}
						y1={this.props.sourcePoint.y}
						x2={this.props.destinationPoint.x}
						y2={this.props.destinationPoint.y}
						stroke={darkerColor}
						strokeWidth={strokeWidth}
					/>
				</svg>
				<svg
					className="connection connector source"
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: 8,
						top: this.props.sourcePoint.y - (this.props.connectorHeight / 2),
						left: this.props.sourcePoint.x,
					}}
				>
					<line
						x1={0}
						y1={4}
						x2={this.props.connectorWidth}
						y2={4}
						stroke={color}
						strokeWidth={strokeWidth2}
					/>
				</svg>
				<svg
					className="connection connector target"
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: 8,
						top: this.props.destinationPoint.y - (this.props.connectorHeight / 2),
						left: this.props.destinationPoint.x,
					}}
				>
					<line
						x1={0}
						y1={4}
						x2={this.props.connectorWidth}
						y2={4}
						stroke={color}
						strokeWidth={strokeWidth2}
					/>
				</svg>
			</React.Fragment>
		)
	}
}

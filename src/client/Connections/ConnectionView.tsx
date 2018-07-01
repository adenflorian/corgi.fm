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
}

export class ConnectionView extends React.PureComponent<IConnectionViewProps> {
	public render() {
		const color = this.props.color
		const darkerColor = Color(color).darken(0.6).hsl().string()
		const strokeWidth = '2px'
		const strokeWidth2 = '8px'

		return (
			<svg className="connection" xmlns="http://www.w3.org/2000/svg">
				<line
					x1={this.props.sourcePoint.x}
					y1={this.props.sourcePoint.y}
					x2={this.props.destinationPoint.x}
					y2={this.props.destinationPoint.y}
					stroke={darkerColor}
					strokeWidth={strokeWidth}
				/>
				<line
					x1={this.props.sourcePoint.x}
					y1={this.props.sourcePoint.y}
					x2={this.props.sourcePoint.x - 16}
					y2={this.props.sourcePoint.y}
					stroke={color}
					strokeWidth={strokeWidth2}
				/>
				<line
					x1={this.props.destinationPoint.x}
					y1={this.props.destinationPoint.y}
					x2={this.props.destinationPoint.x + 16}
					y2={this.props.destinationPoint.y}
					stroke={color}
					strokeWidth={strokeWidth2}
				/>
			</svg>
		)
	}
}

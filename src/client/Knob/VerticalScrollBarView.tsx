import * as React from 'react'
import './VerticalScrollBar.less'

interface IVerticalScrollBarViewProps {
	percentage: number
	adjustedPercentage: number
	handleMouseDown: (e: React.MouseEvent) => any
}

export const VerticalScrollBarView = (props: IVerticalScrollBarViewProps) => {
	const {handleMouseDown, percentage, adjustedPercentage} = props

	return (
		<div
			className={`verticalScrollBar`}
			style={{
				width: 16,
			}}
		>
			<div
				className="slider"
				style={{
					top: `${90 - (percentage * 90)}%`,
				}}
				onMouseDown={handleMouseDown}
			/>
		</div>
	)
}

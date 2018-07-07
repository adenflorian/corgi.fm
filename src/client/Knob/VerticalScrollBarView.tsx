import * as React from 'react'
import './VerticalScrollBar.less'

interface IVerticalScrollBarViewProps {
	percentage: number
	handleMouseDown: (e: React.MouseEvent) => any
	marks: number[]
}

export const VerticalScrollBarView = (props: IVerticalScrollBarViewProps) => {
	const {handleMouseDown, percentage, marks} = props

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
			{marks.map((mark, index) => {
				return (
					<div
						key={index}
						className="mark"
						style={{
							position: 'absolute',
							top: `${90 - (mark * 90)}%`,
							backgroundColor: 'currentColor',
							width: '100%',
							height: '1px',
							filter: 'opacity(0.4)',
							backgroundBlendMode: 'add',
						}}
					/>
				)
			})}
		</div>
	)
}

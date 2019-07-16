import {List} from 'immutable'
import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'

interface IVerticalScrollBarViewProps {
	percentage: number
	handleMouseDown: (e: React.MouseEvent) => any
	marks: List<number>
	sliderGrabberHeightPercentage?: number,
}

export const VerticalScrollBarView = (props: IVerticalScrollBarViewProps) => {
	const {handleMouseDown, percentage, marks, sliderGrabberHeightPercentage = 10} = props

	const inversePercentage = 100 - sliderGrabberHeightPercentage

	return (
		<div
			className={`verticalScrollBar`}
			style={{
				width: 16,
				position: 'relative',
			}}
		>
			<div
				className="slider"
				style={{
					top: `${inversePercentage - (percentage * inversePercentage)}%`,
					position: 'absolute',
					zIndex: 2,
					width: '100%',
					height: `${sliderGrabberHeightPercentage}%`,
					backgroundColor: CssColor.panelGrayLight,
					borderRadius: 4,
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
							top: `${99 - Math.floor(mark * 100)}%`,
							backgroundColor: 'currentColor',
							width: '100%',
							height: '2%',
							filter: 'opacity(0.4)',
							zIndex: 2,
							pointerEvents: 'none',
							borderRadius: 2,
						}}
					/>
				)
			})}
		</div>
	)
}

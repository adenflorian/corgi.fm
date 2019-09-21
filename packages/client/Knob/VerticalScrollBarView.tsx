import {List, Map} from 'immutable'
import React, {useMemo} from 'react'

interface IVerticalScrollBarViewProps {
	percentage: number
	handleMouseDown: (e: React.MouseEvent) => any
	marks: List<number>
	sliderGrabberHeightPercentage?: number
}

export const VerticalScrollBarView = (props: IVerticalScrollBarViewProps) => {
	const {handleMouseDown, percentage, marks, sliderGrabberHeightPercentage = 10} = props

	const inversePercentage = 100 - sliderGrabberHeightPercentage

	const finalMarks = useMemo(() =>
		marks.reduce((result, mark) => {
			return result.update(mark, 0, x => x + 1)
		}, Map<number, number>()),
	[marks])

	const mostMarks = useMemo(() => finalMarks.max() || 1, [finalMarks])

	return (
		<svg className="verticalScrollBar">
			<rect
				className="slider"
				y={`${inversePercentage - (percentage * inversePercentage)}%`}
				height={`${sliderGrabberHeightPercentage}%`}
				onMouseDown={handleMouseDown}
			/>
			{useMemo(() => (
				finalMarks.map((count, mark) => (
					<rect
						key={mark}
						className="mark"
						y={`${99 - Math.floor(mark * 100)}%`}
						opacity={(count / mostMarks) + ((1 - (count / mostMarks)) * 0.2)}
					/>
				)).toList()
			), [finalMarks, mostMarks])}
		</svg>
	)
}

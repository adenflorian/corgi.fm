import React from 'react'
import {TimeSelect} from './BetterSequencerHelpers'

interface Props {
	panPixelsX: number
	columnWidth: number
	lengthBeats: number
	timeSelect: TimeSelect
}

export const BetterColumns = React.memo((
	{panPixelsX, columnWidth, lengthBeats, timeSelect}: Props,
) => {

	const columns = new Array(lengthBeats).fill(0)

	return (
		<div className="columns">
			<div
				className="scalable"
				style={{
					transform: `translateX(${-panPixelsX}px)`,
				}}
			>
				{columns.map((_, beat) => {
					return (
						<div
							key={beat}
							className={`column beat-${beat}`}
							style={{
								width: columnWidth,
							}}
						>
							<div className="line" />
						</div>
					)
				})}
				<div
					className="timeBar"
					style={{
						left: timeSelect.start * columnWidth,
					}}
				/>
			</div>
		</div>
	)
})

import React from 'react'

interface Props {
	panPixelsX: number
	columnWidth: number
	lengthBeats: number
}

export const BetterColumns = React.memo((
	{panPixelsX, columnWidth, lengthBeats}: Props,
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
			</div>
		</div>
	)
})

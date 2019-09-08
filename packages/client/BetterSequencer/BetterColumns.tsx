import React, {Fragment} from 'react'
import {TimeSelect} from './BetterSequencerHelpers'

interface Props {
	columnWidth: number
	lengthBeats: number
	timeSelect: TimeSelect
}

export const BetterColumns = React.memo(function _BetterColumns(
	{columnWidth, lengthBeats, timeSelect}: Props,
) {

	const columns = new Array(lengthBeats).fill(0)

	return (
		<div className="columns">
			<div
				className="scalable"
			>
				<BetterColumnsArray
					columnWidth={columnWidth}
					lengthBeats={lengthBeats}
				/>
				<div
					className="farRightColumn"
				/>
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

interface BetterColumnsArrayProps {
	columnWidth: number
	lengthBeats: number
}

export const BetterColumnsArray = React.memo(function _BetterColumnsArray(
	{columnWidth, lengthBeats}: BetterColumnsArrayProps,
) {
	const columns = new Array(lengthBeats).fill(0)

	return (
		<Fragment>
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
		</Fragment>
	)
})

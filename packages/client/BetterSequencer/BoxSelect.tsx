import React from 'react'
import './BoxSelect.less'

interface Props {
	origin: Point
	otherCorner: Point
}

export const BoxSelect = React.memo(function _BoxSelect({origin, otherCorner}: Props) {
	let box = {width: 0, height: 0, left: 0, top: 0}

	if (origin.x <= otherCorner.x) {
		box = {
			...box,
			left: origin.x,
			width: otherCorner.x - origin.x,
		}
	} else {
		box = {
			...box,
			left: otherCorner.x,
			width: origin.x - otherCorner.x,
		}
	}

	if (origin.y <= otherCorner.y) {
		box = {
			...box,
			top: origin.y,
			height: otherCorner.y - origin.y,
		}
	} else {
		box = {
			...box,
			top: otherCorner.y,
			height: origin.y - otherCorner.y,
		}
	}

	if (box.width < 1 && box.height < 1) return null

	return (
		<div className="boxSelect">
			<div
				className="box"
				style={{
					...box,
				}}
			/>
		</div>
	)
})

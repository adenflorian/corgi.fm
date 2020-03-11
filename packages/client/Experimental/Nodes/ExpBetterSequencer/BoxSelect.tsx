import React from 'react'
import './BoxSelect.less'

interface Props {
	origin: Point
	otherCorner: Point
	top?: number
	style?: React.CSSProperties
}

export const BoxSelect = React.memo(function _BoxSelect({
	origin, otherCorner, top = 0, style,
}: Props) {
	let box = {width: 0, height: 0, marginLeft: 0, marginTop: 0}

	if (origin.x <= otherCorner.x) {
		box = {
			...box,
			marginLeft: origin.x,
			width: otherCorner.x - origin.x,
		}
	} else {
		box = {
			...box,
			marginLeft: otherCorner.x,
			width: origin.x - otherCorner.x,
		}
	}

	if (origin.y <= otherCorner.y) {
		box = {
			...box,
			marginTop: origin.y,
			height: otherCorner.y - origin.y,
		}
	} else {
		box = {
			...box,
			marginTop: otherCorner.y,
			height: origin.y - otherCorner.y,
		}
	}

	if (box.width < 1 && box.height < 1) return null

	return (
		<div className="expBoxSelect" style={{marginTop: -top}}>
			<div
				className="box"
				style={{
					...box,
					...style,
				}}
			/>
		</div>
	)
})

import React, {useLayoutEffect, useRef, Fragment} from 'react'
import './BetterNoteResizer.less'

interface Props {
	eventId: Id
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => void
	width: number
}

const debug = false

const hitWidth = 6

export const BetterNoteResizer = React.memo(function _BetterNoteResizer({
	handleMouseDown, eventId, width,
}: Props) {

	const leftRef = useRef<SVGRectElement>(null)
	const rightRef = useRef<SVGRectElement>(null)
	const centerRef = useRef<SVGRectElement>(null)

	useLayoutEffect(() => {
		const onMouseDownLeft = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'left', eventId)
		}
		const onMouseDownRight = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'right', eventId)
		}
		const onMouseDownCenter = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'center', eventId)
		}

		const leftElement = leftRef.current
		const rightElement = rightRef.current
		const centerElement = centerRef.current

		if (leftElement === null || rightElement === null || centerElement === null) return

		leftElement.addEventListener('mousedown', onMouseDownLeft)
		rightElement.addEventListener('mousedown', onMouseDownRight)
		centerElement.addEventListener('mousedown', onMouseDownCenter)

		return () => {
			leftElement.removeEventListener('mousedown', onMouseDownLeft)
			rightElement.removeEventListener('mousedown', onMouseDownRight)
			centerElement.removeEventListener('mousedown', onMouseDownCenter)
		}
	}, [eventId, handleMouseDown])

	return (
		<g className="expBS_noteResizer" style={{opacity: debug ? 0.5 : undefined}}>
			<rect
				style={{fill: debug ? 'red' : undefined}}
				className="resizeHandle left"
				ref={leftRef}
				width={hitWidth}
			/>
			<rect
				style={{fill: debug ? 'blue' : undefined}}
				className="resizeHandle mid"
				ref={centerRef}
				width={Math.max(0, width - (hitWidth * 2))}
				x={hitWidth}
			/>
			<rect
				style={{fill: debug ? 'green' : undefined}}
				className="resizeHandle right"
				ref={rightRef}
				width={hitWidth}
				x={width - hitWidth}
			/>
		</g>
	)
})

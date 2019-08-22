import React, {useLayoutEffect, useRef} from 'react'
import './BetterNoteResizer.less'

interface Props {
	id: Id
	eventId: Id
	handleMouseDown: (direction: 'left' | 'right', eventId: Id) => void
	selectNote: () => void
}

const overlap = 8

const debug = false

export const BetterNoteResizer = React.memo(({
	id, handleMouseDown, selectNote, eventId,
}: Props) => {

	const leftRef = useRef<HTMLDivElement>(null)
	const rightRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const onMouseDownLeft = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown('left', eventId)
		}
		const onMouseDownRight = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown('right', eventId)
		}

		const leftElement = leftRef.current
		const rightElement = rightRef.current

		if (leftElement === null || rightElement === null) return

		leftElement.addEventListener('mousedown', onMouseDownLeft)
		rightElement.addEventListener('mousedown', onMouseDownRight)

		return () => {
			leftElement.removeEventListener('mousedown', onMouseDownLeft)
			rightElement.removeEventListener('mousedown', onMouseDownRight)
		}
	}, [handleMouseDown])

	return (
		<div
			className="resizer"
			style={{
				// width: width + overlap,
				// height: height + overlap,
				width: '100%',
				height: '100%',
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				display: 'flex',
				flexDirection: 'column',
				pointerEvents: 'none',
			}}
		>
			<div className="midRow resizerRow">
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'red' : undefined, cursor: 'w-resize'}}
					className="resizeHandle left"
					ref={leftRef}
				/>
				<div
					className="resizeHandle mid"
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'green' : undefined, cursor: 'e-resize'}}
					className="resizeHandle right"
					ref={rightRef}
				/>
			</div>
		</div>
	)
})

import React, {useLayoutEffect, useRef} from 'react'
import './BetterNoteResizer.less'

interface Props {
	id: Id
	eventId: Id
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => void
}

const debug = false

export const BetterNoteResizer = React.memo(({
	id, handleMouseDown, eventId,
}: Props) => {

	const leftRef = useRef<HTMLDivElement>(null)
	const rightRef = useRef<HTMLDivElement>(null)
	const centerRef = useRef<HTMLDivElement>(null)

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
		<div
			className="noteResizer"
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
					style={{backgroundColor: debug ? 'red' : undefined}}
					className="resizeHandle left"
					ref={leftRef}
				/>
				<div
					className="resizeHandle mid"
					ref={centerRef}
				/>
				<div
					style={{backgroundColor: debug ? 'green' : undefined}}
					className="resizeHandle right"
					ref={rightRef}
				/>
			</div>
		</div>
	)
})

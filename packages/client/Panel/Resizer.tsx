import React, {useState, useCallback, useLayoutEffect} from 'react'
import './Resizer.less'
import {useSelector, useDispatch} from 'react-redux'
import {
	positionActions, createPositionSelector,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

interface Props {
	id: Id
}

const overlap = 8;

type ActiveInfo = false | {
	vert: 'up' | 'down' | 'none',
	hoz: 'left' | 'right' | 'none',
}

const debug = false

export const Resizer = React.memo(({id}: Props) => {
	const {x, y, width, height} = useSelector(createPositionSelector(id))
	
	const [active, setActive] = useState<ActiveInfo>(false)

	const dispatch = useDispatch()

	const onMouseMove = useCallback((delta: Point) => {
		if (!active) return

		dispatch(positionActions.resizePosition(id, {
			x: active.hoz === 'left'
				? x + delta.x
				: x,
			y: active.vert === 'up'
				? y + -delta.y
				: y,
			width: active.hoz === 'left'
				? width - delta.x
				: active.hoz === 'right'
					? width + delta.x
					: width,
			height: active.vert === 'up'
				? height + delta.y
				: active.vert === 'down'
					? height - delta.y
					: height,
		}))
	}, [dispatch, x, y, width, height, active])

	const setInactive = useCallback(() => {
		setActive(false)
	}, [setActive])

	useLayoutEffect(() => {
		const foo = (e: MouseEvent) => {
			if (e.buttons !== 1) return setInactive()
			onMouseMove({
				x: e.movementX / simpleGlobalClientState.zoom,
				y: -e.movementY / simpleGlobalClientState.zoom,
			})
		}

		if (active) {
			window.addEventListener('mousemove', foo)
		}

		return () => {
			window.removeEventListener('mousemove', foo)
		}
	}, [onMouseMove, active, setInactive])

	return (
		<div
			className="resizer"
			style={{
				width: width + overlap,
				height: height + panelHeaderHeight + overlap,
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				display: 'flex',
				flexDirection: 'column',
				pointerEvents: 'none',
			}}
			onMouseUp={setInactive}
		>
			<div className="topRow resizerRow">
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'red' : undefined, cursor: 'nw-resize'}}
					className="resizeHandle top left topLeft corner"
					onMouseDown={() => setActive({hoz: 'left', vert: 'up'})}
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'blue' : undefined, cursor: 'n-resize'}}
					className="resizeHandle top mid topMid edge"
					onMouseDown={() => setActive({hoz: 'none', vert: 'up'})}
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'red' : undefined, cursor: 'ne-resize'}}
					className="resizeHandle top right topRight corner"
					onMouseDown={() => setActive({hoz: 'right', vert: 'up'})}
				/>
			</div>
			<div className="midRow resizerRow">
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'blue' : undefined, cursor: 'w-resize'}}
					className="resizeHandle left midLeft edge"
					onMouseDown={() => setActive({hoz: 'left', vert: 'none'})}
				/>
				<div
					className="resizeHandle mid midMid"
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'blue' : undefined, cursor: 'e-resize'}}
					className="resizeHandle right midRight edge"
					onMouseDown={() => setActive({hoz: 'right', vert: 'none'})}
				/>
			</div>
			<div className="bottomRow resizerRow">
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'red' : undefined, cursor: 'sw-resize'}}
					className="resizeHandle bottom left bottomLeft corner"
					onMouseDown={() => setActive({hoz: 'left', vert: 'down'})}
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'blue' : undefined, cursor: 's-resize'}}
					className="resizeHandle bottom mid bottomMid edge"
					onMouseDown={() => setActive({hoz: 'none', vert: 'down'})}
				/>
				<div
					style={{pointerEvents: 'all', backgroundColor: debug ? 'red' : undefined, cursor: 'se-resize'}}
					className="resizeHandle bottom right bottomRight corner"
					onMouseDown={() => setActive({hoz: 'right', vert: 'down'})}
				/>
			</div>
		</div>
	)
})

import React, {useState, useCallback, useLayoutEffect, Fragment, useMemo} from 'react'
import './Resizer.less'
import {useSelector, useDispatch} from 'react-redux'
import {
	findNodeInfo, createExpPositionSelector, expPositionActions,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants';
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ConnectionNodeType} from '@corgifm/common/common-types';

interface Props {
	id: Id
}

interface ActiveInfo {
	vert: 'up' | 'down' | 'none'
	hoz: 'left' | 'right' | 'none'
}

const debug = false

export const ExpResizer = React.memo(function _Resizer({id}: Props) {
	const {x, y, width, height} = useSelector(createExpPositionSelector(id))
	const nodeType = ConnectionNodeType.dummy

	const {defaultWidth, defaultHeight} = findNodeInfo(nodeType)

	const [active, setActive] = useState<false | ActiveInfo>(false)
	const [delta, setDelta] = useState({x: 0, y: 0})
	const [start, setStart] = useState({x: 0, y: 0, width: 0, height: 0})

	const dispatch = useDispatch()

	const onMouseMove = useCallback((delta2: Point) => {
		if (!active) return

		const delta3 = {
			x: delta.x + delta2.x,
			y: delta.y + delta2.y,
		}

		const maxX = start.x + (start.width - defaultWidth)
		const maxY = start.y + (start.height - defaultHeight)

		dispatch(expPositionActions.resizePosition(id, {
			x: Math.min(maxX, getNewX(active, start.x, delta3)),
			y: Math.min(maxY, getNewY(active, start.y, delta3)),
			width: Math.max(defaultWidth, getNewWidth(active, start.width, delta3)),
			height: Math.max(defaultHeight, getNewHeight(active, start.height, delta3)),
		}))

		setDelta(delta3)
	}, [active, delta, dispatch, id, start, defaultWidth, defaultHeight])

	const setInactive = useCallback(() => {
		setActive(false)
	}, [setActive])

	const handleMouseDown = useCallback((activeInfo: ActiveInfo) => {
		setDelta({x: 0, y: 0})
		setStart({
			x,
			y,
			width,
			height,
		})
		setActive(activeInfo)
	}, [height, width, x, y])

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
				opacity: debug ? 0.2 : undefined,
				marginTop: -(height + panelHeaderHeight),
			}}
			onMouseUp={setInactive}
		>
			{useMemo(() => (
				<Fragment>
					<div className="row top">
						<div
							style={{backgroundColor: debug ? 'red' : undefined, cursor: 'nw-resize'}}
							className="resizeHandle left topLeft corner"
							onMouseDown={() => handleMouseDown({hoz: 'left', vert: 'up'})}
						/>
						<div
							style={{backgroundColor: debug ? 'blue' : undefined, cursor: 'n-resize'}}
							className="resizeHandle mid topMid edge hoz"
							onMouseDown={() => handleMouseDown({hoz: 'none', vert: 'up'})}
						/>
						<div
							style={{backgroundColor: debug ? 'red' : undefined, cursor: 'ne-resize'}}
							className="resizeHandle right topRight corner"
							onMouseDown={() => handleMouseDown({hoz: 'right', vert: 'up'})}
						/>
					</div>
					<div className="row vert">
						<div
							style={{backgroundColor: debug ? 'blue' : undefined, cursor: 'w-resize'}}
							className="resizeHandle left midLeft edge vert"
							onMouseDown={() => handleMouseDown({hoz: 'left', vert: 'none'})}
						/>
						<div
							style={{backgroundColor: debug ? 'green' : undefined}}
							className="vert hoz"
						/>
						<div
							style={{backgroundColor: debug ? 'blue' : undefined, cursor: 'e-resize'}}
							className="resizeHandle right midRight edge vert"
							onMouseDown={() => handleMouseDown({hoz: 'right', vert: 'none'})}
						/>
					</div>
					<div className="row bottom">
						<div
							style={{backgroundColor: debug ? 'red' : undefined, cursor: 'sw-resize'}}
							className="resizeHandle left bottomLeft corner"
							onMouseDown={() => handleMouseDown({hoz: 'left', vert: 'down'})}
						/>
						<div
							style={{backgroundColor: debug ? 'blue' : undefined, cursor: 's-resize'}}
							className="resizeHandle mid bottomMid edge hoz"
							onMouseDown={() => handleMouseDown({hoz: 'none', vert: 'down'})}
						/>
						<div
							style={{backgroundColor: debug ? 'red' : undefined, cursor: 'se-resize'}}
							className="resizeHandle right bottomRight corner"
							onMouseDown={() => handleMouseDown({hoz: 'right', vert: 'down'})}
						/>
					</div>
				</Fragment>
			), [handleMouseDown])}
		</div>
	)
})

function getNewX(active: ActiveInfo, x: number, delta: Point) {
	return active.hoz === 'left'
		? x + delta.x
		: x
}

function getNewY(active: ActiveInfo, y: number, delta: Point) {
	return active.vert === 'up'
		? y + -delta.y
		: y
}

function getNewWidth(active: ActiveInfo, width: number, delta: Point) {
	return active.hoz === 'left'
		? width - delta.x
		: active.hoz === 'right'
			? width + delta.x
			: width
}

function getNewHeight(active: ActiveInfo, height: number, delta: Point) {
	return active.vert === 'up'
		? height + delta.y
		: active.vert === 'down'
			? height - delta.y
			: height
}

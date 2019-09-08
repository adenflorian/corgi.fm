import React, {useState, useCallback, useLayoutEffect, useEffect} from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Set} from 'immutable'
import {
	selectLocalClientId, selectOptions, selectRoomSettings, IClientAppState,
	createAnimationFrameSelector, animationActions,
} from '@corgifm/common/redux'
import {oneLine} from 'common-tags'
import {useSelector} from 'react-redux'
import {backgroundMenuId, graphSizeX, zoomBackgroundClass} from '../client-constants'
// eslint-disable-next-line import/no-internal-modules
import PlusSVG from '../OtherSVG/plus.svg'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

interface Props {
	children: React.ReactNode
}

const maxZoom = 3
const minZoom = -3
const scrollZoomMod = 0.002
const mouseZoomMod = 0.001
const mousePanMod = 1
const maxPan = graphSizeX
const defaultZoom = 0
const defaultZoomReal = 1
const makeDefaultPan = () => ({x: 0, y: 0})
// const zoomTextLength = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

const bgSize = 10000

const zoomLevels = {
	close: 1,
	default: defaultZoom,
	far: -1,
} as const

function getZoomClasses(zoom: number): string {
	return zoom >= zoomLevels.close
		? 'zoomCloser'
		: zoom <= zoomLevels.far
			? 'zoomFarther'
			: zoom < zoomLevels.default - 0.0001
				? 'zoomFar'
				: zoom > zoomLevels.default + 0.0001
					? 'zoomClose'
					: 'zoomDefault'
}

export const globalZoomAnimParentKey = 'globalZoom'
export const globalZoomResetZoomAnimChildKey = 'resetZoom'
export const globalZoomResetPanAnimChildKey = 'resetPan'

export const createResetZoomAction = () => animationActions.trigger(Set([globalZoomAnimParentKey]), globalZoomResetZoomAnimChildKey)
export const createResetPanAction = () => animationActions.trigger(Set([globalZoomAnimParentKey]), globalZoomResetPanAnimChildKey)

export const ConnectedZoom = React.memo(function _Zoom({
	children,
}: Props) {

	const triggerZoomReset = useSelector(createAnimationFrameSelector(globalZoomAnimParentKey, globalZoomResetZoomAnimChildKey))
	const triggerPanReset = useSelector(createAnimationFrameSelector(globalZoomAnimParentKey, globalZoomResetPanAnimChildKey))
	const requireCtrlToZoom = useSelector((state: IClientAppState) => selectOptions(state).requireCtrlToScroll)
	const fancyZoomPan = useSelector((state: IClientAppState) => selectOptions(state).graphicsExpensiveZoomPan)
	const disableMenu = useSelector((state: IClientAppState) => {
		const roomSettings = selectRoomSettings(state.room)
		return selectLocalClientId(state) !== roomSettings.ownerId && roomSettings.onlyOwnerCanDoStuff
	})

	const [backgroundClicked, setBackgroundClicked] = useState(false)
	const [zoomReal, setZoomReal] = useState(defaultZoomReal)
	const [zoom, setZoom] = useState(defaultZoom)
	const [pan, setPan] = useState(makeDefaultPan())

	const clampPan = useCallback((pan2: number, zoom2: number = zoomReal) => {
		return Math.min(maxPan * zoom2, Math.max(-maxPan * zoom2, pan2))
	}, [zoomReal])

	const clampZoom = useCallback((val: number) => {
		return Math.min(maxZoom, Math.max(minZoom, val))
	}, [])

	const doZoom = useCallback((zoom2: number, clientX?: number, clientY?: number, controlKey = false) => {
		const newZoom = clampZoom(zoom - zoom2)

		const newZoomReal = 2 ** newZoom

		const zoomDelta = newZoomReal - zoomReal

		if (zoomDelta === 0) return

		const zoomPercentChange = (newZoomReal - zoomReal) / zoomReal

		const distanceFromCenterX = clientX && !controlKey ? clientX - (window.innerWidth / 2) : 0
		const distanceFromCenterY = clientY && !controlKey ? clientY - (window.innerHeight / 2) : 0

		const panX = ((distanceFromCenterX * zoomPercentChange) / newZoomReal)
		const panY = ((distanceFromCenterY * zoomPercentChange) / newZoomReal)

		const newPan = {
			x: clampPan(pan.x - panX, newZoomReal),
			y: clampPan(pan.y - panY, newZoomReal),
		}

		simpleGlobalClientState.zoom = newZoomReal
		simpleGlobalClientState.zoomDisplay = newZoom
		simpleGlobalClientState.pan = newPan

		setZoom(newZoom)
		setZoomReal(newZoomReal)
		setPan(newPan)
	}, [clampPan, clampZoom, pan.x, pan.y, zoom, zoomReal])

	const doPan = useCallback((x = 0, y = 0) => {
		const newPan = {
			x: clampPan(pan.x + (x * mousePanMod / zoomReal)),
			y: clampPan(pan.y + (y * mousePanMod / zoomReal)),
		}
		simpleGlobalClientState.pan = newPan
		setPan(newPan)
	}, [clampPan, pan.x, pan.y, zoomReal])

	const onBgMouseEvent = useCallback((e: React.MouseEvent) => {
		if (e.type === 'mousedown') {
			setBackgroundClicked(true)
		}
	}, [])

	const onMouseWheel = useCallback((e: WheelEvent) => {
		// Turning off rounding so that two finger track pad scrolling will be smooth
		// TODO Detect if scroll amount is small or large, if large, round it
		if (requireCtrlToZoom === false || e.ctrlKey) {
			doZoom(e.deltaY * scrollZoomMod, e.clientX, e.clientY, e.ctrlKey)
		} else {
			doPan(-e.deltaX, -e.deltaY)
		}
		e.preventDefault()
	}, [doPan, doZoom, requireCtrlToZoom])

	const onMouseMove = useCallback((e: MouseEvent) => {
		if (e.buttons !== 1 && backgroundClicked) {
			setBackgroundClicked(false)
		}
		if (e.buttons === 4 && !e.shiftKey) {
			// console.log({x: e.defaultPrevented, y: e.bubbles, d: e.detail})
			doPan(e.movementX, e.movementY)
		}
		if (backgroundClicked && e.buttons === 1) {
			if (e.ctrlKey) {
				doZoom(e.movementY * mouseZoomMod)
			} else {
				doPan(e.movementX, e.movementY)
			}
		}
	}, [backgroundClicked, doPan, doZoom])

	useLayoutEffect(() => {
		window.addEventListener('wheel', onMouseWheel, {passive: false})
		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('wheel', onMouseWheel)
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [onMouseMove, onMouseWheel])

	const resetZoom = useCallback(() => {
		setZoom(defaultZoom)
		setZoomReal(defaultZoomReal)
		simpleGlobalClientState.zoom = defaultZoomReal
		simpleGlobalClientState.zoomDisplay = defaultZoom
	}, [])

	const resetPan = useCallback(() => {
		setPan(makeDefaultPan())
		simpleGlobalClientState.pan = makeDefaultPan()
	}, [])

	useEffect(() => {
		resetZoom()
	}, [resetZoom, triggerZoomReset])

	useEffect(() => {
		resetPan()
	}, [resetPan, triggerPanReset])

	return (
		<div
			className={oneLine`
				zoomZoom
				${getZoomClasses(Math.round(zoom * 10) / 10)}
			`}
			style={{
				transform: `scale(${zoomReal}) translate(${pan.x}px, ${pan.y}px)`,
				willChange: fancyZoomPan ? '' : 'transform',
				// transition: backgroundClicked ? '' : 'transform 0.05s ease 0s',
			}}
		>
			<ZoomBackground
				onMouseEvent={onBgMouseEvent}
				disableMenu={disableMenu}
			/>
			{children}
		</div>
	)
})

interface ZoomBgProps {
	onMouseEvent: (e: React.MouseEvent) => void
	disableMenu: boolean
}

const ZoomBackground = React.memo(
	function _ZoomBackground({onMouseEvent, disableMenu}: ZoomBgProps) {
		return (
			// @ts-ignore disableIfShiftIsPressed
			<ContextMenuTrigger
				id={backgroundMenuId}
				disableIfShiftIsPressed={true}
				holdToDisplay={-1}
				disable={disableMenu}
			>
				<div
					className={zoomBackgroundClass}
					style={{
						position: 'fixed',
						width: `${bgSize}vw`,
						height: `${bgSize}vh`,
						top: `-${bgSize / 2}vh`,
						left: `-${bgSize / 2}vw`,
						backgroundImage: `url(${PlusSVG})`,
					}}
					onMouseDown={onMouseEvent}
				/>
			</ContextMenuTrigger>
		)
	},
)

export function toGraphSpace(x = 0, y = 0) {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return {
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	} as const
}

export function fromGraphSpace(x = 0, y = 0) {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return {
		x: ((x + pan.x) * zoom) + (window.innerWidth / 2),
		y: ((y + pan.y) * zoom) + (window.innerHeight / 2),
	} as const
}

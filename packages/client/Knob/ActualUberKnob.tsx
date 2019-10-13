import React, {Fragment, useMemo, useRef, useEffect, useCallback, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {expConnectionsActions} from '@corgifm/common/redux'
import {clamp} from '@corgifm/common/common-utils'
import {SignalRange} from '@corgifm/common/common-types'
import {setLightness} from '@corgifm/common/shamu-color'
import {ParamInputChainReact} from '../Experimental/ExpPorts'
import {useAudioParamContext} from '../Experimental/ExpParams'
import {CorgiNumberChangedEvent, CorgiStringChangedEvent} from '../Experimental/CorgiEvents'
import {useStringChangedEvent, useNumberChangedEvent, useEnumChangedEvent} from '../Experimental/hooks/useCorgiEvent'
import {useNodeContext} from '../Experimental/CorgiNode'
import {useNodeManagerContext} from '../Experimental/NodeManager'
import {useBoolean} from '../react-hooks'
import './UberKnob.less'
import {blockMouse, unblockMouse} from '../SimpleGlobalClientState'

interface Props {
	percentage: number
	chains: readonly ParamInputChainReact[]
	range: SignalRange
}

const size = 32

export const ActualUberKnob = React.memo(function _ActualUberKnob({
	percentage, chains, range,
}: Props) {
	const nodeContext = useNodeContext()

	return (
		<div
			className="actualKnobContainer"
			style={{
				width: size,
				height: size,
			}}
		>
			<svg
				className="arc colorize"
				width="100%"
				height="100%"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g transform={`rotate(135, ${size / 2}, ${size / 2})`}>
					<UberArcMain
						colorEvent={nodeContext.node.onColorChange}
						chains={chains}
						knobValueRatio={percentage}
						range={range}
					/>
				</g>
			</svg>
		</div>
	)
})

const limit = 0.75
const strokeWidth = 3
const mainDiameter = 40

interface UberArcMainProps {
	readonly colorEvent: CorgiStringChangedEvent
	readonly chains: readonly ParamInputChainReact[]
	readonly knobValueRatio: number
	readonly range: SignalRange
}

function UberArcMain({
	colorEvent, chains, knobValueRatio, range,
}: UberArcMainProps) {

	const activeColor = useStringChangedEvent(colorEvent)
	const railColor = useMemo(() => setLightness(activeColor, 12), [activeColor])
	const audioParam = useAudioParamContext()

	const activeRatio = knobValueRatio * (range === 'bipolar' ? 0.5 : 1)
	const activeOffset = range === 'bipolar' ? 0.5 : 0

	return (
		<UberArcDumb
			layer={0}
			activeColor={activeColor}
			railColor={railColor}
			railRatio={1}
			activeRatio={activeRatio}
			activeOffset={activeOffset}
			className="mainArc"
			// hideDot={true}
		>
			{chains.map((chain, i) => {
				return <UberArcMod
					key={chain.id as string}
					layer={-1 - i}
					chain={chain}
					parentRatio={knobValueRatio}
					parentRange={range}
				/>
			})}
			<UberArcLiveValue
				layer={-chains.length - 1}
				liveEvent={audioParam.onModdedLiveValueChange}
				parentRatio={activeRatio}
			/>
		</UberArcDumb>
	)
}

interface UberArcModProps {
	readonly layer: number
	readonly chain: ParamInputChainReact
	readonly parentRatio: number
	readonly parentRange: SignalRange
}

function UberArcMod({
	layer, chain, parentRatio, parentRange,
}: UberArcModProps) {
	const nodeManagerContext = useNodeManagerContext()
	const connection = nodeManagerContext.connections.get(chain.id)
	const colorEvent = connection
		? connection.outputPort.getNode().onColorChange
		: undefined
	const activeColor = useStringChangedEvent(colorEvent)
	const railColor = useMemo(() => setLightness(activeColor, 12), [activeColor])
	const gain = useNumberChangedEvent(chain.onGainChange)
	const centering = useEnumChangedEvent(chain.centering, chain.onCenteringChange)

	const [active, setActive, setInactive] = useBoolean(false)

	const dispatch = useDispatch()

	const onRailMouseDown = useCallback((e: React.MouseEvent) => {
		e.stopPropagation()
		if (e.shiftKey && e.altKey) {
			dispatch(expConnectionsActions.setAudioParamInputCentering(chain.id, chain.centering === 'center' ? 'offset' : 'center'))
		} else {
			setActive()
		}
	}, [chain.centering, chain.id, dispatch, setActive])

	useLayoutEffect(() => {
		if (!active) return

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return setInactive()
			dispatch(expConnectionsActions.setAudioParamInputGain(chain.id, gain - (e.movementY * 0.005)))
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', setInactive)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', setInactive)
		}
	}, [active, chain.id, dispatch, gain, setInactive])

	useLayoutEffect(() => {
		if (active) {
			blockMouse()
		} else {
			unblockMouse()
		}
	}, [active])

	const activeRatio = 0

	const absGain = Math.abs(gain)

	const railRatio = parentRange === 'unipolar'
		? centering === 'center'
			? clamp((-Math.abs(parentRatio - 0.5) + 1) - ((-0.5 * absGain) + 0.5), absGain / 2, absGain)
			: Math.max(Math.min(-parentRatio + 1, gain), -parentRatio)
		: centering === 'center'
			? Math.min((-Math.abs(parentRatio / 2) + 1) - ((-0.5 * absGain) + 0.5), absGain)
			: Math.max(Math.min((-parentRatio / 2) + 0.5, gain), (-parentRatio / 2) - 0.5)
	const railRatio2 = -0.25

	const offset = parentRange === 'unipolar'
		? centering === 'center'
			? -Math.min(parentRatio, absGain / 2)
			: 0
		: centering === 'center'
			? -Math.min((parentRatio / 2) + 0.5, absGain / 2)
			: 0
	const offset2 = 0

	return (
		<UberArcDumb
			className="modArc"
			layer={layer}
			activeColor={activeColor}
			railColor={railColor}
			railRatio={railRatio}
			activeRatio={activeRatio}
			activeOffset={(activeRatio / -2) + 0.5}
			offset={offset}
			hideDot={true}
			hideTail={true}
			onRailMouseDown={onRailMouseDown}
		/>
	)
}

interface UberArcLiveValueProps {
	readonly layer: number
	readonly liveEvent: CorgiNumberChangedEvent
	readonly parentRatio: number
}

function UberArcLiveValue({
	layer, liveEvent, parentRatio,
}: UberArcLiveValueProps) {
	const moddedValueCircleRef = useRef<SVGGElement>(null)
	const liveValueRef = useRef(0)

	const updateLiveValueDot = useCallback(() => {
		const moddedValueGroupElement = moddedValueCircleRef.current

		if (!moddedValueGroupElement) return

		const value2 = liveValueRef.current - parentRatio

		moddedValueGroupElement.transform.baseVal.getItem(0).setRotate((value2 * 360 * limit) + (360 * 0.25), 16, 16)
	}, [moddedValueCircleRef, parentRatio])

	useEffect(() => {
		function onNewValue(newValue: number) {
			liveValueRef.current = newValue
			updateLiveValueDot()
		}

		liveEvent.subscribe(onNewValue)

		return () => {
			liveEvent.unsubscribe(onNewValue)
		}
	}, [liveEvent, updateLiveValueDot])

	useLayoutEffect(updateLiveValueDot, [parentRatio])

	return (
		<UberArcDumb
			layer={layer}
			activeColor={'#E3E3E3'}
			railColor={'#1C1C1C'}
			railRatio={1}
			activeRatio={0}
			// // activeOffset={main.moddedRatio + 0.5}
			// activeOffset={mainActiveOffset}
			// offset={-0.5}
			hideTail={true}
			// hideRail={true}
			gDotRef={moddedValueCircleRef}
			className="liveValueArc"
		/>
	)
}

interface UberArcDumbProps {
	readonly layer: number
	readonly activeColor: string
	readonly activeRatio: number
	readonly activeOffset?: number
	readonly railColor: string
	readonly railRatio: number
	readonly offset?: number
	readonly hideTail?: boolean
	readonly hideRail?: boolean
	readonly hideDot?: boolean
	readonly bigDot?: boolean
	readonly onRailMouseDown?: (event: React.MouseEvent<SVGCircleElement>) => void
	readonly gDotRef?: React.RefObject<SVGGElement>
	readonly className?: string
	readonly children?: React.ReactNode
}

function UberArcDumb({
	layer,
	activeColor,
	activeRatio,
	activeOffset = 0,
	railColor,
	railRatio,
	offset = 0,
	hideTail = false,
	hideRail = false,
	hideDot = false,
	bigDot = false,
	onRailMouseDown,
	gDotRef,
	className = '',
	children,
}: UberArcDumbProps) {
	const actualActiveRatio = clamp(activeRatio * railRatio, (0 - activeOffset) * railRatio, (1 - activeOffset) * railRatio)
	const actualActiveOffset = activeOffset * railRatio
	const diameter = mainDiameter + ((strokeWidth * layer) * 2)
	const circumference = diameter * Math.PI
	const radius = diameter / 2
	const dotY = -4 - (strokeWidth * layer)

	return (
		<g
			className={`uberArc ${className}`}
			style={{color: activeColor}}
			transform={`rotate(${offset * (360 * limit)}, 16, 16)`}
		>
			{/* Click arc */}
			{<circle
				className="clickArc"
				cx="50%"
				cy="50%"
				r={radius}
				fill="none"
				stroke="#0000"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={0}
				onMouseDown={onRailMouseDown}
			/>}
			{/* Rail arc */}
			{!hideRail && <circle
				className="railArc"
				cx="50%"
				cy="50%"
				r={radius}
				fill="none"
				stroke={railColor}
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={(1 - (railRatio * limit)) * circumference}
			/>}
			{/* Active arc */}
			{!hideTail && <circle
				className="activeArc"
				cx="50%"
				cy="50%"
				r={radius}
				fill="none"
				stroke={activeColor}
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={(1 - (actualActiveRatio * limit)) * circumference}
				transform={`rotate(${actualActiveOffset * (360 * limit)}, 16, 16)`}
			/>}
			<g
				className="gDot"
				transform={getDotTransform(actualActiveRatio, actualActiveOffset)}
				ref={gDotRef}
			>
				{hideDot && <circle
					className="otherDot"
					cx="50%"
					cy={dotY}
					r={strokeWidth / 2}
					fill={railColor}
					strokeWidth={0.25}
				/>}
				{!hideDot && <circle
					className="dot"
					cx="50%"
					cy={dotY}
					r={strokeWidth / (bigDot ? 1.5 : 2)}
					fill={activeColor}
					strokeWidth={0.25}
				/>}
				{/* Dark dot */}
				{/* <circle
					cx="50%"
					cy={dotY}
					r={strokeWidth / 3}
					fill={railColor}
					stroke={'none'}
				/> */}
			</g>
			{children &&
				<g
					className="gDot"
					transform={getChildrenTransform(actualActiveRatio, actualActiveOffset)}
				>
					{children}
				</g>
			}
		</g>
	)
}

function getDotTransform(actualActiveRatio: number, actualActiveOffset: number) {
	return `rotate(${getDotRotate(actualActiveRatio, actualActiveOffset)}, 16, 16)`
}

function getDotRotate(actualActiveRatio: number, actualActiveOffset: number) {
	return ((actualActiveRatio + actualActiveOffset) * (360 * (limit))) + (360 * 0.25)
}

function getChildrenTransform(actualActiveRatio: number, actualActiveOffset: number) {
	return `rotate(${getChildrenRotate(actualActiveRatio, actualActiveOffset)}, 16, 16)`
}

function getChildrenRotate(actualActiveRatio: number, actualActiveOffset: number) {
	return ((actualActiveRatio + actualActiveOffset) * (360 * (limit)))
}

// mods: [{
// 	activeColor: '#FF5C00',
// 	railColor: '#3D1600',
// 	gain: 1 / 3,
// 	activeValue: 100,
// 	centering: 'center',
// 	// 0.5,
// 	// main.knobValueRatio - 1 / 6,
// }, {
// 	activeColor: '#7FFF00',
// 	railColor: '#1F3D00',
// 	gain: 1 / 6,
// 	activeValue: -0.25,
// 	centering: 'center',
// 	// 0.5,
// 	// main.knobValueRatio - 1 / 12,
// }, {
// 	activeColor: '#FF0099',
// 	railColor: '#3D0025',
// 	gain: -1 / 6,
// 	activeValue: -0.5,
// 	centering: 'offset',
// 	// 1,
// 	// main.knobValueRatio - 1 / 6,
// }],

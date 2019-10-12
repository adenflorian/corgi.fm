import React, {Fragment, useMemo, useRef, useEffect} from 'react'
import {clamp} from '@corgifm/common/common-utils'
import {ParamInputCentering, SignalRange} from '@corgifm/common/common-types'
import {setLightness, CssColor} from '@corgifm/common/shamu-color'
import {ParamInputChainReact, CorgiNumberChangedEvent} from '../Experimental/ExpPorts'
import {useAudioParamContext} from '../Experimental/ExpParams'

interface Props {
	percentage: number
	chains: readonly ParamInputChainReact[]
	color?: string
	range: SignalRange
}

const size = 32

export const ActualUberKnob = React.memo(function _ActualUberKnob(props: Props) {
	const {percentage, chains, range, color = CssColor.blue} = props

	// console.log({liveModdedValue})

	const darkMainColor = useMemo(() => setLightness(color, 12), [color])

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
					{makeUberKnob({
						main: {
							knobValueRatio: percentage,
							activeColor: color,
							railColor: darkMainColor,
							range,
							// moddedRatio: (liveModdedValue / 2) + 0.25,
						},
						mods: chains.map((chain): ModInfo => {
							return {
								activeColor: '#7FFF00',
								railColor: '#1F3D00',
								gain: chain.gain,
								activeValue: 0.001,
								centering: chain.centering,
								id: chain.id,
							}
						}),
					})}
				</g>
			</svg>
		</div>
	)
})

interface ModInfo {
	readonly centering: ParamInputCentering
	/** -1 to 1 */
	readonly gain: number
	/** 0 to 1, or -1 to 1 */
	readonly activeValue: number
	readonly activeColor: string
	readonly railColor: string
	readonly id: Id
}

interface MainInfo {
	/** 0 to 1, or -1 to 1, or -1 to 0 */
	readonly knobValueRatio: number
	/** 0 to 1, or -1 to 1, or -1 to 0 */
	// readonly moddedRatio: number
	readonly range: SignalRange
	readonly activeColor: string
	readonly railColor: string
}

interface UberKnobProps {
	readonly main: MainInfo
	readonly mods: readonly ModInfo[]
}

function makeUberKnob(
	{main, mods}: UberKnobProps,
) {

	const audioParam = useAudioParamContext()

	const mainActiveRatio = main.knobValueRatio * (main.range === 'bipolar' ? 0.5 : 1)
	const mainActiveOffset = main.range === 'bipolar' ? 0.5 : 0

	return (
		<Fragment>
			<UberArc
				layer={0}
				activeColor={main.activeColor}
				railColor={main.railColor}
				railRatio={1}
				activeRatio={mainActiveRatio}
				activeOffset={mainActiveOffset}
				hideDot={true}
			/>
			{mods.map((mod, i) => {
				return <UberArc
					key={mod.id as string}
					layer={-1 - i}
					activeColor={mod.activeColor}
					railColor={mod.railColor}
					railRatio={Math.abs(mod.gain)}
					activeRatio={mod.activeValue}
					activeOffset={mod.centering === 'center'
						? 0.5
						: 1}
					offset={main.knobValueRatio - (mod.centering === 'center'
						? Math.abs(mod.gain) * 0.5
						: (mod.gain >= 0 ? 0 : Math.abs(mod.gain)))}
				/>
			})}
			{/* {makeArc(-1, '#FF5C00', '#3D1600', 1 / 3, 100, 0.5, main.knobValueRatio - 1 / 6)}
			{makeArc(-2, '#7FFF00', '#1F3D00', 1 / 6, -0.25, 0.5, main.knobValueRatio - 1 / 12)}
			{makeArc(-3, '#FF0099', '#3D0025', 1 / 6, -0.5, 1, main.knobValueRatio - 1 / 6)} */}
			{mods.length >= 0
				? <UberArc
					layer={-mods.length - 1}
					activeColor={'#E3E3E3'}
					railColor={'#1C1C1C'}
					railRatio={1}
					activeRatio={0}
					// activeOffset={main.moddedRatio + 0.5}
					activeOffset={mainActiveOffset}
					// offset={main.knobValueRatio - 0.25}
					hideTail={true}
					liveEvent={audioParam.onModdedLiveValueChange}
					liveValueMax={audioParam.maxValue}
				/>
				: <UberArc
					layer={-2}
					activeColor={main.activeColor}
					railColor={main.railColor}
					railRatio={1}
					activeRatio={mainActiveRatio}
					activeOffset={mainActiveOffset}
					hideTail={true}
					hideRail={true}
					bigDot={true}
				/>}
		</Fragment>
	)
}

const limit = 0.75
const strokeWidth = 3
const mainDiameter = 40

interface MakeArcArgs {
	readonly layer: number
	readonly activeColor: string
	readonly railColor: string
	readonly railRatio: number
	readonly activeRatio: number
	readonly activeOffset?: number
	readonly offset?: number
	readonly hideTail?: boolean
	readonly liveEvent?: CorgiNumberChangedEvent
	readonly liveValueMax?: number
	readonly hideRail?: boolean
	readonly hideDot?: boolean
	readonly bigDot?: boolean
}

function UberArc({
	layer,
	activeColor,
	railColor,
	railRatio,
	activeRatio,
	activeOffset = 0,
	offset = 0,
	hideTail = false,
	hideRail = false,
	hideDot = false,
	bigDot = false,
	liveEvent,
	liveValueMax = 1,
}: MakeArcArgs) {
	const actualActiveOffsetRef = useRef(0)

	const diameter = mainDiameter + ((strokeWidth * layer) * 2)
	const circumference = diameter * Math.PI
	const radius = diameter / 2
	const dotY = -4 - (strokeWidth * layer)
	// console.log({activeRatio})
	const actualActiveRatio = clamp(activeRatio * railRatio, (0 - activeOffset) * railRatio, (1 - activeOffset) * railRatio)
	actualActiveOffsetRef.current = activeOffset * railRatio

	const moddedValueCircleRef = useRef<SVGGElement>(null)

	useEffect(() => {
		if (!liveEvent) return

		function onNewValue(value: number) {
			// console.log('onNewValue:', {value})
			const moddedValueGroupElement = moddedValueCircleRef.current

			if (!moddedValueGroupElement) return

			// console.log('foo:', {value, foo2: value * 360 * limit, liveValueMax, vdlm: value / liveValueMax})

			moddedValueGroupElement.transform.baseVal.getItem(0).setRotate(value * 360 * limit, 16, 16)
		}

		liveEvent.subscribe(onNewValue)

		return () => {
			liveEvent.unsubscribe(onNewValue)
		}
	}, [liveEvent, 12111311])

	return (
		<g>
			<g transform={`rotate(${offset * (360 * limit)}, 16, 16)`}>
				{/* Rail arc */}
				{!hideRail && <circle
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
					cx="50%"
					cy="50%"
					r={radius}
					fill="none"
					stroke={activeColor}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={(1 - (actualActiveRatio * limit)) * circumference}
					transform={`rotate(${actualActiveOffsetRef.current * (360 * limit)}, 16, 16)`}
				/>}
				<g
					className="gDot"
					transform={getDotTransform(actualActiveRatio, actualActiveOffsetRef.current)}
				>
					<g
						className="gDot2"
						transform={`rotate(0, 0, 0)`}
						ref={moddedValueCircleRef}
					>
						<circle
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
				</g>}
			</g>
		</g>
	)
}

function getDotTransform(actualActiveRatio: number, actualActiveOffset: number) {
	// return `rotate(${((actualActiveRatio + actualActiveOffset) * (360 * (limit))) + (360 * 0.25)}, 16, 16)`
	return `rotate(${getDotRotate(actualActiveRatio, actualActiveOffset)}, 16, 16)`
	// return `rotate(99, 16, 16)`
}

function getDotRotate(actualActiveRatio: number, actualActiveOffset: number) {
	return ((actualActiveRatio + actualActiveOffset) * (360 * (limit))) + (360 * 0.25)
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

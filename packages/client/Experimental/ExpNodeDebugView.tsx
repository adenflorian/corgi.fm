import React from 'react'
import {hot} from 'react-hot-loader'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {audioWorkletToolTip} from '../client-constants'
import {
	ExpPort, ExpPorts, AudioParamInputPortContext, ExpNodeAudioParamInputPort,
} from './ExpPorts'
import {ExpNodeDebugAudioParamKnob} from './ExpNodeDebugAudioParamKnob'
import {
	ExpAudioParams, ExpCustomNumberParams, AudioParamContext,
	ExpCustomEnumParams, ExpCustomStringParams, ExpButtons, ExpReferenceParams,
} from './ExpParams'
import {ExpNodeDebugCustomNumberParamKnob} from './ExpNodeDebugCustomNumberParamKnob'
import {useNodeContext} from './CorgiNode'
import {useObjectChangedEvent, useStringChangedEvent} from './hooks/useCorgiEvent'
import {ExpNodeDebugCustomEnumParamSelect} from './ExpNodeDebugCustomEnumParamSelect'
import {ExpNodeDebugCustomStringParamField} from './ExpNodeDebugCustomStringParamField'
import {CssColor} from '@corgifm/common/shamu-color'
import {ExpOscilloscopeNodeExtra} from './Nodes/ExpOscilloscopeNodeView'
import {ExpNodeDebugButton} from './ExpNodeDebugButton'
import {ExpNodeDebugReferenceParamField} from './ExpNodeDebugReferenceParamField'

interface Props {
	audioParams: ExpAudioParams
	customNumberParams: ExpCustomNumberParams
	customEnumParams: ExpCustomEnumParams
	customStringParams: ExpCustomStringParams
	referenceParams: ExpReferenceParams
	buttons: ExpButtons
	ports: ExpPorts
	children: React.ReactNode
	beforeChildren: React.ReactNode
}

export const ExpNodeDebugView = hot(module)(React.memo(function _ExpNodeDebugView({
	audioParams, customNumberParams, children, beforeChildren,
	ports, customEnumParams, customStringParams, referenceParams, buttons,
}: Props) {
	const nodeContext = useNodeContext()
	// const nodeName = useStringChangedEvent(nodeContext.onNameChange)
	const nodeId = nodeContext.id
	const isAudioWorkletLoaded = useObjectChangedEvent(simpleGlobalClientState.onAudioWorkletLoaded)
	const {renderDebugStuff} = nodeContext

	return (
		<div style={{position: 'relative', width: '100%'}}>
			{nodeContext.newSampleEvent && <ExpOscilloscopeNodeExtra newSampleEvent={nodeContext.newSampleEvent} />}
			{beforeChildren}
			<div className="expNodeDebugView">
				{renderDebugStuff && <div style={{padding: 8}}>
					{/* <div className="nodeName">{nodeName}</div> */}
					{/* <div className="nodeId">{nodeId}</div> */}
					<Ports ports={ports} />
					{nodeContext.requiresAudioWorklet && !isAudioWorkletLoaded &&
						<div
							className="audioWorkletWarning"
							title={audioWorkletToolTip}
						>
							This node needs AudioWorklet to work properly, but AudioWorklet is not loaded.
					</div>
					}
					<div className="params">
						{/* {audioParams.size > 0 &&
					<div className="sectionLabel">Audio Params</div>} */}
						{/* <div className="paramTexts">
					{[...audioParams].map(([id, audioParam]) => (
						<div className="param" key={id as string}>
							<div className="paramId">{id}</div>
							<div className="paramValue">{audioParam.audioParam.value}</div>
						</div>
					))}
				</div> */}
						<div className="paramKnobs">
							{[...audioParams].map(([id, audioParam]) => {
								const port = ports.get(id) as ExpNodeAudioParamInputPort
								return (
									<AudioParamContext.Provider value={audioParam} key={id as string}>
										<AudioParamInputPortContext.Provider value={port}>
											<ExpNodeDebugAudioParamKnob
												nodeId={nodeId}
											/>
										</AudioParamInputPortContext.Provider>
									</AudioParamContext.Provider>
								)
							})}
						</div>
						{/* {customNumberParams.size > 0 &&
					<div className="sectionLabel">Custom Number Params</div>} */}
						<div className="paramKnobs">
							{[...customNumberParams].map(([id, customNumberParam]) => (
								<ExpNodeDebugCustomNumberParamKnob
									key={id as string}
									nodeId={nodeId}
									customNumberParam={customNumberParam}
								/>
							))}
						</div>
						{/* {customEnumParams.size > 0 &&
					<div className="sectionLabel">Custom Enum Params</div>} */}
						{customEnumParams.size > 0 && <div className="enumParams">
							{[...customEnumParams].map(([id, customEnumParam]) => (
								<ExpNodeDebugCustomEnumParamSelect
									key={id as string}
									nodeId={nodeId}
									customEnumParam={customEnumParam}
								/>
							))}
						</div>}
						{customStringParams.size > 0 && <div className="stringParams">
							{[...customStringParams].filter(x => x[1].showInDebugView).map(([id, customStringParam]) => (
								<ExpNodeDebugCustomStringParamField
									key={id as string}
									nodeId={nodeId}
									customStringParam={customStringParam}
								/>
							))}
						</div>}
						{referenceParams.size > 0 && <div className="stringParams">
							{[...referenceParams].map(([id, referenceParam]) => (
								<ExpNodeDebugReferenceParamField
									key={id as string}
									nodeId={nodeId}
									referenceParam={referenceParam}
								/>
							))}
						</div>}
						{buttons.size > 0 && <div className="buttons">
							{[...buttons].map(([id, button]) => (
								<ExpNodeDebugButton
									key={id as string}
									nodeId={nodeId}
									button={button}
								/>
							))}
						</div>}
						<DebugInfo />
					</div>
				</div>}
				{children}
			</div>
		</div>
	)
}))

interface PortsProps {
	readonly ports: ExpPorts
}

const xOffset = 0
const portHeight = 24
const heightOffset = 8 + 8 + 4

const Ports = React.memo(function _Ports({ports}: PortsProps) {
	const portsMapped = [...ports].map(x => x[1])

	return (
		<div className="ports">
			{foo('inputPorts', 'Inputs', portsMapped.filter(x => x.side === 'in'))}
			{foo('outputPorts', 'Outputs', portsMapped.filter(x => x.side === 'out'))}
		</div>
	)

	function foo(
		className: string, label: string, ports2: readonly ExpPort[],
	) {
		return (
			<div className={className}>
				{/* <div className="sectionLabel">{label}</div> */}
				{ports2.map((port, i) => {
					return (
						<Port
							key={port.id as string}
							port={port}
							index={i}
						/>
					)
				})}
			</div>
		)
	}
})

interface PortProps {
	readonly port: ExpPort
	readonly index: number
}

const Port = React.memo(function _Port({port, index}: PortProps) {
	const x = xOffset
	const y = heightOffset + (portHeight * index)
	port.node.setPortPosition(port.id, {
		x,
		y,
	})
	const enabled = useObjectChangedEvent(port.enabled)
	return (
		<div
			className={`port enabled-${enabled}`}
			key={port.id as string}
		>
			<div className={`portDropZone type-${port.type}`} />
			{/* <div className="portId">{port.id}</div> */}
			<div className="portName">{port.name}</div>
		</div>
	)
})

const DebugInfo = React.memo(function _DebugInfo() {
	const nodeContext = useNodeContext()
	const debugString = useStringChangedEvent(nodeContext.debugInfo)
	return (
		<div
			className={`debugString smallFont`}
			style={{
				color: CssColor.defaultGray,
				fontSize: 12,
				width: '100%',
			}}
		>
			{debugString}
		</div>
	)
})

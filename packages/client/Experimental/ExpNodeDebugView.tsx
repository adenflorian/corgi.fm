import React from 'react'
import {logger} from '../client-logger'
import {
	ExpPort, ExpPorts,
} from './ExpPorts'
import {ExpNodeDebugAudioParamKnob} from './ExpNodeDebugAudioParamKnob'
import {ExpAudioParams, ExpCustomNumberParams} from './ExpParams'
import {ExpNodeDebugCustomNumberParamKnob} from './ExpNodeDebugCustomNumberParamKnob'
import {useNodeContext} from './CorgiNode'

interface Props {
	audioParams: ExpAudioParams
	customNumberParams: ExpCustomNumberParams
	ports: ExpPorts
}

export const ExpNodeDebugView = React.memo(function _ExpNodeDebugView({
	audioParams, customNumberParams,
	ports,
}: Props) {
	logger.log('ExpNodeDebugView render')
	const nodeContext = useNodeContext()
	const nodeName = nodeContext.getName()
	const nodeId = nodeContext.id
	return (
		<div className="expNodeDebugView">
			<div className="nodeName">{nodeName}</div>
			<div className="nodeId">{nodeId}</div>
			<Ports ports={ports} />
			<div className="params">
				{audioParams.size > 0 &&
					<div className="sectionLabel">Audio Params</div>}
				{/* <div className="paramTexts">
					{[...audioParams].map(([id, audioParam]) => (
						<div className="param" key={id as string}>
							<div className="paramId">{id}</div>
							<div className="paramValue">{audioParam.audioParam.value}</div>
						</div>
					))}
				</div> */}
				<div className="paramKnobs">
					{[...audioParams].map(([id, audioParam]) => (
						<ExpNodeDebugAudioParamKnob
							key={id as string}
							nodeId={nodeId}
							audioParam={audioParam}
						/>
					))}
				</div>
				{customNumberParams.size > 0 &&
					<div className="sectionLabel">Custom Number Params</div>}
				<div className="paramKnobs">
					{[...customNumberParams].map(([id, customNumberParam]) => (
						<ExpNodeDebugCustomNumberParamKnob
							key={id as string}
							nodeId={nodeId}
							customNumberParam={customNumberParam}
						/>
					))}
				</div>
			</div>
		</div>
	)
})

interface PortsProps {
	readonly ports: ExpPorts
}

const xOffset = 16
const portHeight = 24
const heightOffset = 8 + 16 + 4 + 12 + 4 + 16 + 8 + 4

const Ports = React.memo(function _Ports({ports}: PortsProps) {
	const nodeContext = useNodeContext()

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
				<div className="sectionLabel">{label}</div>
				{ports2.map((port, i) => {
					const x = xOffset
					const y = heightOffset + (portHeight * i)
					nodeContext.setPortPosition(port.id, {
						x,
						y,
					})
					return (
						<div
							className="port"
							key={port.id as string}
						>
							<div className={`portDropZone type-${port.type}`} />
							{/* <div className="portId">{port.id}</div> */}
							<div className="portName">{port.name}</div>
						</div>
					)
				})}
			</div>
		)
	}
})

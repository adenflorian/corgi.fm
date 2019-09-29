import React from 'react'
import {logger} from '../client-logger'
import {
	ExpAudioParams, ExpNodeAudioInputPorts, ExpNodeAudioOutputPorts,
} from './ExpTypes'
import {ExpNodeDebugKnob} from './ExpNodeDebugKnob'

interface Props {
	nodeId: Id
	nodeName: string
	audioParams: ExpAudioParams
	audioInputPorts: ExpNodeAudioInputPorts
	audioOutputPorts: ExpNodeAudioOutputPorts
}

export const ExpNodeDebugView = React.memo(function _ExpNodeDebugView({
	nodeId, nodeName, audioParams, audioInputPorts, audioOutputPorts,
}: Props) {
	logger.log('ExpNodeDebugView render')
	return (
		<div className="expNodeDebugView">
			<div className="nodeName">{nodeName}</div>
			<div className="nodeId">{nodeId}</div>
			<div className="ports">
				<div className="audioInputPorts">
					<div className="sectionLabel">Audio Input Ports</div>
					{audioInputPorts.map((port, id) => (
						<div className="port" key={id}>
							<div className="portDropZone"></div>
							<div className="portId">{id}</div>
							<div className="portName">{port.name}</div>
						</div>
					))}
				</div>
				<div className="audioOutputPorts">
					<div className="sectionLabel">Audio Output Ports</div>
					{audioOutputPorts.map((port, id) => (
						<div className="port" key={id}>
							<div className="portName">{port.name}</div>
							<div className="portId">{id}</div>
							<div className="portDropZone"></div>
						</div>
					))}
				</div>
			</div>
			<div className="params">
				<div className="sectionLabel">Audio Params</div>
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
						<ExpNodeDebugKnob
							key={id as string}
							nodeId={nodeId}
							audioParam={audioParam}
						/>
					))}
				</div>
			</div>
		</div>
	)
})

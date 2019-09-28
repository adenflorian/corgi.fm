import React from 'react'
import {
	ExpAudioParams, ExpNodeAudioInputPorts, ExpNodeAudioOutputPorts,
} from './ExpTypes';

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
	return (
		<div className="expNodeDebugView">
			<div className="nodeName">{nodeName}</div>
			<div className="nodeId">{nodeId}</div>
			<div className="params">
				<div className="sectionLabel">Audio Params</div>
				{[...audioParams].map(([id, audioParam]) => (
					<div className="param" key={id}>
						<div className="paramId">{id}</div>
						<div className="paramValue">{audioParam.audioParam.value}</div>
					</div>
				))}
			</div>
			<div className="audioInputPorts">
				<div className="sectionLabel">Audio Input Ports</div>
				{[...audioInputPorts].map(([id, port]) => (
					<div className="port" key={id}>
						<div className="portId">{id}</div>
						<div className="portName">{port.name}</div>
					</div>
				))}
			</div>
			<div className="audioOutputPorts">
				<div className="sectionLabel">Audio Output Ports</div>
				{[...audioOutputPorts].map(([id, port]) => (
					<div className="port" key={id}>
						<div className="portId">{id}</div>
						<div className="portName">{port.name}</div>
					</div>
				))}
			</div>
		</div>
	)
})

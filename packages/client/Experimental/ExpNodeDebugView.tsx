import React from 'react'
import {logger} from '../client-logger'
import {
	ExpNodeAudioInputPorts, ExpNodeAudioOutputPorts,
} from './ExpPorts'
import {ExpNodeDebugAudioParamKnob} from './ExpNodeDebugAudioParamKnob'
import {ExpAudioParams, ExpCustomNumberParams} from './ExpParams'
import {ExpNodeDebugCustomNumberParamKnob} from './ExpNodeDebugCustomNumberParamKnob'

interface Props {
	nodeId: Id
	nodeName: string
	audioParams: ExpAudioParams
	customNumberParams: ExpCustomNumberParams
	audioInputPorts: ExpNodeAudioInputPorts
	audioOutputPorts: ExpNodeAudioOutputPorts
}

export const ExpNodeDebugView = React.memo(function _ExpNodeDebugView({
	nodeId, nodeName, audioParams, customNumberParams,
	audioInputPorts, audioOutputPorts,
}: Props) {
	logger.log('ExpNodeDebugView render')
	return (
		<div className="expNodeDebugView">
			<div className="nodeName">{nodeName}</div>
			<div className="nodeId">{nodeId}</div>
			<div className="ports">
				<div className="audioInputPorts">
					<div className="sectionLabel">Audio Ins</div>
					{audioInputPorts.map((port, id) => (
						<div className="port" key={id}>
							<div className="portDropZone"></div>
							<div className="portId">{id}</div>
							<div className="portName">{port.name}</div>
						</div>
					))}
				</div>
				<div className="audioOutputPorts">
					<div className="sectionLabel">Audio Outs</div>
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

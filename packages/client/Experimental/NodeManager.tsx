import React, {Fragment} from 'react'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import {typeClassMap} from './ExpNodes'
import {CorgiNode, ExpNodeContext} from './CorgiNode'
import {AudioParamChange, ExpNodeAudioConnection} from './ExpTypes'
import {ConnectedExpConnectorPlaceholders} from '../Connections/ConnectorPlaceholders';
import {ConnectedSimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp';

export class NodeManager {
	private readonly _nodes = new Map<Id, CorgiNode>()
	private readonly _audioConnections = new Map<Id, ExpNodeAudioConnection>()

	public constructor(
		private readonly _audioContext: AudioContext,
	) {}

	public renderNodeId = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) {
			logger.warn('[renderNodeId] 404 node not found: ', nodeId)
			return null
		}

		return (
			<Fragment>
				<ConnectedExpConnectorPlaceholders
					parentId={nodeId}
					inputAudioPortCount={node.getAudioInputPortCount()}
					outputAudioPortCount={node.getAudioOutputPortCount()}
				/>
				<ConnectedSimpleGraphNodeExp
					key={nodeId as string}
					positionId={nodeId}
				>
					<ExpNodeContext.Provider value={node.reactContext}>
						{node.render()}
					</ExpNodeContext.Provider>
				</ConnectedSimpleGraphNodeExp>
			</Fragment>
		)
	}

	// public onNodeParamChange = (paramChange: AudioParamChange) => {
	// 	const node = this._nodes.get(paramChange.nodeId)

	// 	if (!node) return logger.warn('404 node not found: ', {paramChange})

	// 	node.onParamChange(paramChange)

	// 	// TODO
	// }

	public enableNode(id: Id, enabled: boolean) {
		const node = this._nodes.get(id)

		if (!node) return logger.warn('[enableNode] 404 node not found: ', {id})

		node.setEnabled(enabled)
	}

	public onAudioParamChange = (paramChange: AudioParamChange) => {
		const node = this._nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onAudioParamChange] 404 node not found: ', {paramChange})

		node.onAudioParamChange(paramChange.paramId, paramChange.newValue)
	}

	public addNodes = (newNodes: immutable.Map<Id, ExpNodeState>) => {
		newNodes.forEach(this.addNode)
	}

	public addNode = (nodeState: ExpNodeState) => {
		const newNode = new typeClassMap[nodeState.type](nodeState.id, this._audioContext)
		this._nodes.set(newNode.id, newNode)
		nodeState.audioParams.forEach((newValue, paramId) => newNode.onAudioParamChange(paramId, newValue))
		newNode.setEnabled(nodeState.enabled)
	}

	public addAudioConnections = (connections: immutable.Map<Id, IExpConnection>) => {
		connections.forEach(this.addAudioConnection)
	}

	public addAudioConnection = (expConnection: IExpConnection) => {
		// Get nodes
		const source = this._nodes.get(expConnection.sourceId)
		const target = this._nodes.get(expConnection.targetId)
		if (!source || !target) {
			logger.warn('uh oh: ', {source, target})
			return
		}

		// Get and connect ports
		const sourcePort = source.getAudioOutputPort(expConnection.sourcePort)
		const targetPort = target.getAudioInputPort(expConnection.targetPort)
		if (!sourcePort || !targetPort) return logger.warn('404 port not found: ', {sourcePort, targetPort})

		// Create connection
		const connection = new ExpNodeAudioConnection(expConnection.id, sourcePort, targetPort)
		this._audioConnections.set(connection.id, connection)
	}

	public deleteAudioConnection = (connectionId: Id) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('tried to delete non existent connection: ', connectionId)

		this._audioConnections.delete(connectionId)

		connection.dispose()
	}

	public deleteAllAudioConnections = () => {
		this._audioConnections.forEach(x => this.deleteAudioConnection(x.id))
	}

	public changeAudioConnectionSource = (connectionId: Id, newSourceId: Id, newSourcePort: number) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const source = this._nodes.get(newSourceId)
		if (!source) return logger.warn('uh oh: ', {source})

		// Get and connect ports
		const sourcePort = source.getAudioOutputPort(newSourcePort)
		if (!sourcePort) return logger.warn('404 port not found: ', {sourcePort})

		// Disconnect old source
		connection.changeSource(sourcePort)
	}

	public changeAudioConnectionTarget = (connectionId: Id, newTargetId: Id, newTargetPort: number) => {
		const connection = this._audioConnections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const target = this._nodes.get(newTargetId)
		if (!target) return logger.warn('uh oh: ', {target})

		// Get and connect ports
		const targetPort = target.getAudioInputPort(newTargetPort)
		if (!targetPort) return logger.warn('404 port not found: ', {targetPort})

		// Disconnect old target
		connection.changeTarget(targetPort)
	}

	public cleanup = () => {
		this._nodes.forEach(node => {
			node.dispose()
		})
		this._nodes.clear()
		this._audioConnections.clear()
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API

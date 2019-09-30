import React, {Fragment, useContext} from 'react'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection} from '@corgifm/common/redux'
import {logger} from '../client-logger'
import {typeClassMap} from './ExpNodes'
import {CorgiNode, ExpNodeContext} from './CorgiNode'
import {AudioParamChange, ExpNodeAudioConnection} from './ExpTypes'
import {ConnectedExpConnectorPlaceholders} from '../Connections/ConnectorPlaceholders';
import {ConnectedSimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp';

export const NodeManagerContext = React.createContext<null | NodeManagerContextValue>(null)

export interface NodeManagerContextValue extends ReturnType<NodeManager['_makeContextValue']> {}

export function useNodeManagerContext() {
	const context = useContext(NodeManagerContext)

	if (!context) throw new Error(`missing node manager context, maybe there's no provider`)

	return context
}

export class NodeManager {
	private readonly _nodes = new Map<Id, CorgiNode>()
	private readonly _audioConnections = new Map<Id, ExpNodeAudioConnection>()
	public readonly reactContext: NodeManagerContextValue

	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _preMasterLimiter: GainNode,
	) {
		this.reactContext = this._makeContextValue()
	}

	private _makeContextValue = () => {
		return {
			getNodeInfo: (nodeId: Id) => {
				const node = this._nodes.get(nodeId)

				if (!node) return logger.warn('[getNodeInfo] 404 node not found: ', {nodeId})

				// Only static info should go in here
				return {
					audioInputPortCount: node.getAudioInputPortCount(),
					audioOutputPortCount: node.getAudioOutputPortCount(),
					color: node.getColor(),
				} as const
			}
		}
	}

	public renderNodeId = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) {
			logger.warn('[renderNodeId] 404 node not found: ', nodeId)
			return null
		}

		return (
			<Fragment key={nodeId as string}>
				<ConnectedExpConnectorPlaceholders
					parentId={nodeId}
					inputAudioPortCount={node.getAudioInputPortCount()}
					outputAudioPortCount={node.getAudioOutputPortCount()}
				/>
				<ConnectedSimpleGraphNodeExp
					positionId={nodeId}
					overrideColor={node.getColor()}
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
		const newNode = new typeClassMap[nodeState.type](nodeState.id, this._audioContext, this._preMasterLimiter)
		this._nodes.set(newNode.id, newNode)
		nodeState.audioParams.forEach((newValue, paramId) => newNode.onAudioParamChange(paramId, newValue))
		newNode.setEnabled(nodeState.enabled)
	}

	public deleteNode = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) return logger.warn('[deleteNode] 404 node not found: ', {nodeId})

		node.dispose()
		this._nodes.delete(nodeId)
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
		if (!sourcePort || !targetPort) return logger.warn('[addAudioConnection] 404 port not found: ', {node: this, sourcePort, targetPort})

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
		if (!sourcePort) return logger.warn('[changeAudioConnectionSource] 404 port not found: ', {node: this, sourcePort})

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
		if (!targetPort) return logger.warn('[changeAudioConnectionTarget] 404 port not found: ', {node: this, targetPort})

		// Disconnect old target
		connection.changeTarget(targetPort)
	}

	public cleanup = () => {
		this._nodes.forEach(node => node.dispose())
		this._nodes.clear()
		this._audioConnections.clear()
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API

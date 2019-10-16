import React, {Fragment, useContext} from 'react'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection} from '@corgifm/common/redux'
import {ParamInputCentering} from '@corgifm/common/common-types'
import {logger} from '../client-logger'
import {typeClassMap} from './Nodes/ExpNodes'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection, ExpNodeConnection, isAudioConnection,
	ExpConnectionCallback, ExpGateConnection, isGateConnection,
} from './ExpConnections'
import {NumberParamChange} from './ExpParams'
import {
	isAudioOutputPort, isAudioInputPort, ExpPortCallback, ExpPortType, isAudioParamInputPort,
} from './ExpPorts'
import {isGateOutputPort, isGateInputPort} from './ExpGatePorts'

export const NodeManagerContext = React.createContext<null | NodeManagerContextValue>(null)

export interface NodeManagerContextValue extends ReturnType<NodeManager['_makeContextValue']> {}

export function useNodeManagerContext() {
	const context = useContext(NodeManagerContext)

	if (!context) throw new Error(`missing node manager context, maybe there's no provider`)

	return context
}

export class NodeManager {
	private readonly _nodes = new Map<Id, CorgiNode>()
	private readonly _connections = new Map<Id, ExpNodeConnection>()
	public readonly reactContext: NodeManagerContextValue

	public constructor(
		private readonly _audioContext: AudioContext,
		private readonly _preMasterLimiter: GainNode,
	) {
		this.reactContext = this._makeContextValue()
	}

	private readonly _makeContextValue = () => {
		return {
			getNodeInfo: (nodeId: Id) => {
				const node = this._nodes.get(nodeId)

				if (!node) return logger.warn('[getNodeInfo] 404 node not found: ', {nodeId})

				return {
					// Only static info should go in here
					color: node.getColor(),
				} as const
			},
			connections: {
				register: (id: Id, callback: ExpConnectionCallback) => {
					const connection = this._connections.get(id)
					if (!connection) return logger.warn('[connections.register] 404 connection not found: ', {id, connections: this._connections})
					connection.subscribers.set(callback, callback)
					callback(connection)
				},
				unregister: (id: Id, callback: ExpConnectionCallback) => {
					const connection = this._connections.get(id)
					if (!connection) return // logger.warn('[connections.unregister] 404 connection not found: ', {id, connections: this._connections})
					connection.subscribers.delete(callback)
				},
				get: (id: Id) => {
					const connection = this._connections.get(id)
					if (!connection) return logger.warn('[connections.get] 404 connection not found: ', {id, connections: this._connections})
					return connection
				},
			} as const,
			ports: {
				register: (nodeId: Id, portId: Id, callback: ExpPortCallback) => {
					const node = this._nodes.get(nodeId)
					if (!node) return logger.warn('[ports.register] 404 node not found: ', {nodeId, portId})
					const port = node.getPort(portId)
					if (!port) return logger.warn('[ports.register] 404 port not found: ', {nodeId, portId})
					port.subscribers.set(callback, callback)
					callback(port)
				},
				unregister: (nodeId: Id, portId: Id, callback: ExpPortCallback) => {
					const node = this._nodes.get(nodeId)
					if (!node) return logger.warn('[ports.unregister] 404 node not found: ', {nodeId, portId})
					const port = node.getPort(portId)
					if (!port) return logger.warn('[ports.unregister] 404 port not found: ', {nodeId, portId})
					port.subscribers.delete(callback)
				},
				get: (nodeId: Id, portId: Id) => {
					const node = this._nodes.get(nodeId)
					if (!node) return logger.warn('[ports.get] 404 node not found: ', {nodeId, portId})
					const port = node.getPort(portId)
					if (!port) return logger.warn('[ports.get] 404 port not found: ', {nodeId, portId})
					return port
				},
			} as const,
		} as const
	}

	public renderNodeId = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) {
			logger.warn('[renderNodeId] 404 node not found: ', nodeId)
			return null
		}

		return (
			<Fragment key={nodeId as string}>
				{node.render()}
			</Fragment>
		)
	}

	public getPortType(nodeId: Id, portId: Id): ExpPortType | void {
		const node = this._nodes.get(nodeId)
		if (!node) return logger.warn('[getPortType] 404 node not found: ', {nodeId, portId})
		const port = node.getPort(portId)
		if (!port) return logger.warn('[getPortType] 404 port not found: ', {nodeId, portId})
		return port.type
	}

	public onTick() {
		const maxReadAhead = 0.2
		this._nodes.forEach(node => node.onTick(this._audioContext.currentTime, maxReadAhead))
	}

	public enableNode(id: Id, enabled: boolean) {
		const node = this._nodes.get(id)

		if (!node) return logger.warn('[enableNode] 404 node not found: ', {id})

		node.setEnabled(enabled)
	}

	public onAudioParamChange = (paramChange: NumberParamChange) => {
		const node = this._nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onAudioParamChange] 404 node not found: ', {paramChange})

		node.onAudioParamChange(paramChange.paramId, paramChange.newValue)
	}

	public onAudioParamInputGainChange = (connectionId: Id, newGain: number) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('[onAudioParamInputGainChange] 404 connection not found: ', connectionId)

		const inputPort = connection.inputPort

		if (!isAudioParamInputPort(inputPort)) {
			return logger.error('[onAudioParamInputGainChange] !isAudioParamInputPort(inputPort): ', {connectionId, connection, inputPort})
		}

		inputPort.setChainGain(connectionId, newGain)
	}

	public onAudioParamInputCenteringChange = (connectionId: Id, newCentering: ParamInputCentering) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('[onAudioParamInputCenteringChange] 404 connection not found: ', connectionId)

		const inputPort = connection.inputPort

		if (!isAudioParamInputPort(inputPort)) {
			return logger.error('[onAudioParamInputCenteringChange] !isAudioParamInputPort(inputPort): ', {connectionId, connection, inputPort})
		}

		inputPort.setChainCentering(connectionId, newCentering)
	}

	public onCustomNumberParamChange = (paramChange: NumberParamChange) => {
		const node = this._nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onCustomNumberParamChange] 404 node not found: ', {paramChange})

		node.onCustomNumberParamChange(paramChange.paramId, paramChange.newValue)
	}

	public addNodes = (newNodes: immutable.Map<Id, ExpNodeState>) => {
		newNodes.forEach(this.addNode)
	}

	public addNode = (nodeState: ExpNodeState) => {
		const newNode = new typeClassMap[nodeState.type](nodeState.id, this._audioContext, this._preMasterLimiter)
		this._nodes.set(newNode.id, newNode)
		nodeState.audioParams.forEach((newValue, paramId) => newNode.onAudioParamChange(paramId, newValue))
		nodeState.customNumberParams.forEach((newValue, paramId) => newNode.onCustomNumberParamChange(paramId, newValue))
		newNode.setEnabled(nodeState.enabled)
	}

	public deleteNode = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) return logger.warn('[deleteNode] 404 node not found: ', {nodeId})

		node.dispose()
		this._nodes.delete(nodeId)
	}

	public addAudioConnections = (connections: immutable.Map<Id, IExpConnection>) => {
		connections.forEach(this.addConnection)
	}

	public addConnection = (expConnection: IExpConnection) => {
		switch (expConnection.type) {
			case 'audio': return this._addAudioConnection(expConnection)
			case 'gate': return this._addGateConnection(expConnection)
			default: return
		}
	}

	private readonly _addAudioConnection = (expConnection: IExpConnection) => {
		// Get nodes
		const source = this._nodes.get(expConnection.sourceId)
		const target = this._nodes.get(expConnection.targetId)
		if (!source || !target) {
			logger.warn('uh oh: ', {source, target})
			return
		}

		// Get and connect ports
		const sourcePort = source.getPort(expConnection.sourcePort)
		const targetPort = target.getPort(expConnection.targetPort)
		if (!sourcePort || !targetPort) return logger.warn('[addAudioConnection] 404 port not found: ', {node: this, sourcePort, targetPort})
		if (!isAudioOutputPort(sourcePort)) return logger.error('[addAudioConnection] expected audio output port: ', {node: this, sourcePort, targetPort})
		if (!isAudioInputPort(targetPort)) return logger.error('[addAudioConnection] expected audio input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpNodeAudioConnection(expConnection.id, sourcePort, targetPort)
		this._connections.set(connection.id, connection)
	}

	private readonly _addGateConnection = (expConnection: IExpConnection) => {
		// Get nodes
		const source = this._nodes.get(expConnection.sourceId)
		const target = this._nodes.get(expConnection.targetId)
		if (!source || !target) {
			logger.warn('uh oh: ', {source, target})
			return
		}

		// Get and connect ports
		const sourcePort = source.getPort(expConnection.sourcePort)
		const targetPort = target.getPort(expConnection.targetPort)
		if (!sourcePort || !targetPort) return logger.warn('[addGateConnection] 404 port not found: ', {node: this, sourcePort, targetPort})
		if (!isGateOutputPort(sourcePort)) return logger.error('[addGateConnection] expected gate output port: ', {node: this, sourcePort, targetPort})
		if (!isGateInputPort(targetPort)) return logger.error('[addGateConnection] expected gate input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpGateConnection(expConnection.id, sourcePort, targetPort)
		this._connections.set(connection.id, connection)
	}

	public deleteConnection = (connectionId: Id) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('tried to delete non existent connection: ', connectionId)

		this._connections.delete(connectionId)

		connection.dispose()
	}

	public deleteAllConnections = () => {
		this._connections.forEach(x => this.deleteConnection(x.id))
	}

	public changeConnectionSource = (connectionId: Id, newSourceId: Id, newSourcePort: Id) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		switch (connection.type) {
			case 'audio': return this._changeAudioConnectionSource(connection, newSourceId, newSourcePort)
			case 'gate': return this._changeGateConnectionSource(connection, newSourceId, newSourcePort)
			default: return
		}
	}

	private readonly _changeAudioConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: Id) => {
		if (!isAudioConnection(connection)) {
			return logger.error(
				'[_changeAudioConnectionSource] connection not instanceof ExpNodeAudioConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		// Get node
		const source = this._nodes.get(newSourceId)
		if (!source) return logger.warn('uh oh: ', {source})

		// Get and connect ports
		const sourcePort = source.getPort(newSourcePort)
		if (!sourcePort) return logger.warn('[changeAudioConnectionSource] 404 port not found: ', {node: this, sourcePort})
		if (!isAudioOutputPort(sourcePort)) return logger.error('[changeAudioConnectionSource] expected audio output port: ', {node: this, sourcePort})

		// Disconnect old source
		connection.changeSource(sourcePort)
	}

	private readonly _changeGateConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: Id) => {
		if (!isGateConnection(connection)) {
			return logger.error(
				'[_changeGateConnectionSource] connection not instanceof ExpNodeGateConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		// Get node
		const source = this._nodes.get(newSourceId)
		if (!source) return logger.warn('uh oh: ', {source})

		// Get and connect ports
		const sourcePort = source.getPort(newSourcePort)
		if (!sourcePort) return logger.warn('[changeGateConnectionSource] 404 port not found: ', {node: this, sourcePort})
		if (!isGateOutputPort(sourcePort)) return logger.error('[changeGateConnectionSource] expected audio output port: ', {node: this, sourcePort})

		// Disconnect old source
		connection.changeSource(sourcePort)
	}

	public changeConnectionTarget = (connectionId: Id, newTargetId: Id, newTargetPort: Id) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		switch (connection.type) {
			case 'audio': return this._changeAudioConnectionTarget(connection, newTargetId, newTargetPort)
			case 'gate': return this._changeGateConnectionTarget(connection, newTargetId, newTargetPort)
			default: return
		}
	}

	private readonly _changeAudioConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: Id) => {
		if (!isAudioConnection(connection)) {
			return logger.error(
				'[changeAudioConnectionTarget] connection not instanceof ExpNodeAudioConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		// Get node
		const target = this._nodes.get(newTargetId)
		if (!target) return logger.warn('uh oh: ', {target})

		// Get and connect ports
		const targetPort = target.getPort(newTargetPort)
		if (!targetPort) return logger.warn('[changeAudioConnectionTarget] 404 port not found: ', {node: this, targetPort})
		if (!isAudioInputPort(targetPort)) return logger.error('[changeAudioConnectionTarget] expected audio input port: ', {node: this, targetPort})

		// Disconnect old target
		connection.changeTarget(targetPort)
	}

	private readonly _changeGateConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: Id) => {
		if (!isGateConnection(connection)) {
			return logger.error(
				'[changeGateConnectionTarget] connection not instanceof ExpNodeGateConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		// Get node
		const target = this._nodes.get(newTargetId)
		if (!target) return logger.warn('uh oh: ', {target})

		// Get and connect ports
		const targetPort = target.getPort(newTargetPort)
		if (!targetPort) return logger.warn('[changeGateConnectionTarget] 404 port not found: ', {node: this, targetPort})
		if (!isGateInputPort(targetPort)) return logger.error('[changeGateConnectionTarget] expected audio input port: ', {node: this, targetPort})

		// Disconnect old target
		connection.changeTarget(targetPort)
	}

	public cleanup = () => {
		this._nodes.forEach(node => node.dispose())
		this._nodes.clear()
		this._connections.clear()
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API

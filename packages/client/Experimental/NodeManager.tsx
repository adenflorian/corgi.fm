import React, {Fragment, useContext} from 'react'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection} from '@corgifm/common/redux'
import {ParamInputCentering} from '@corgifm/common/common-types'
import {NodeToNodeAction} from '@corgifm/common/server-constants'
import {logger} from '../client-logger'
import {SingletonContextImpl} from '../SingletonContext'
import {typeClassMap} from './Nodes/ExpNodes'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection, ExpNodeConnection, isAudioConnection,
	ExpMidiConnection, isMidiConnection,
} from './ExpConnections'
import {NumberParamChange, EnumParamChange} from './ExpParams'
import {
	isAudioOutputPort, isAudioInputPort, ExpPortType, isAudioParamInputPort,
} from './ExpPorts'
import {isMidiOutputPort, isMidiInputPort} from './ExpMidiPorts'

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
	private get _audioContext() {return this._singletonContext.getAudioContext()}
	private get _preMasterLimiter() {return this._singletonContext.getPreMasterLimiter()}

	public constructor(
		private readonly _singletonContext: SingletonContextImpl,
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
				get: (id: Id) => {
					const connection = this._connections.get(id)
					if (!connection) return logger.warn('[connections.get] 404 connection not found: ', {id, connections: this._connections})
					return connection
				},
			} as const,
			ports: {
				get: (nodeId: Id, portId: Id) => {
					const node = this._nodes.get(nodeId)
					if (!node) return // logger.warn('[ports.get] 404 node not found: ', {nodeId, portId})
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

	public onNodeToNode(action: NodeToNodeAction) {
		const node = this._nodes.get(action.nodeId)

		if (!node) return logger.warn('[onNodeToNode] 404 node not found: ', {action, node})

		node.onNodeToNode(action)
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

	public onCustomEnumParamChange = (paramChange: EnumParamChange) => {
		const node = this._nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onCustomEnumParamChange] 404 node not found: ', {paramChange})

		node.onCustomEnumParamChange(paramChange.paramId, paramChange.newValue)
	}

	public addNodes = (newNodes: immutable.Map<Id, ExpNodeState>) => {
		newNodes.forEach(this.addNode)
	}

	public addNode = (nodeState: ExpNodeState) => {
		const newNode = new typeClassMap[nodeState.type]({
			id: nodeState.id,
			ownerId: nodeState.ownerId,
			type: nodeState.type,
			audioContext: this._audioContext,
			preMasterLimiter: this._preMasterLimiter,
			singletonContext: this._singletonContext,
		})
		this._nodes.set(newNode.id, newNode)
		nodeState.audioParams.forEach((newValue, paramId) => newNode.onAudioParamChange(paramId, newValue))
		nodeState.customNumberParams.forEach((newValue, paramId) => newNode.onCustomNumberParamChange(paramId, newValue))
		nodeState.customEnumParams.forEach((newValue, paramId) => newNode.onCustomEnumParamChange(paramId, newValue))
		newNode.setEnabled(nodeState.enabled)
	}

	public deleteNode = (nodeId: Id) => {
		const node = this._nodes.get(nodeId)

		if (!node) return logger.warn('[deleteNode] 404 node not found: ', {nodeId})

		node.dispose()
		this._nodes.delete(nodeId)
	}

	public addConnections = (connections: immutable.Map<Id, IExpConnection>) => {
		connections.forEach(this.addConnection)
	}

	public addConnection = (expConnection: IExpConnection) => {
		switch (expConnection.type) {
			case 'audio': return this._addAudioConnection(expConnection)
			case 'midi': return this._addMidiConnection(expConnection)
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
		if (isAudioParamInputPort(targetPort)) {
			if (expConnection.audioParamInput.centering) {
				targetPort.setChainCentering(connection.id, expConnection.audioParamInput.centering)
			}
			if (expConnection.audioParamInput.gain) {
				targetPort.setChainGain(connection.id, expConnection.audioParamInput.gain)
			}
		}
	}

	private readonly _addMidiConnection = (expConnection: IExpConnection) => {
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
		if (!sourcePort || !targetPort) return logger.warn('[addMidiConnection] 404 port not found: ', {node: this, sourcePort, targetPort})
		if (!isMidiOutputPort(sourcePort)) return logger.error('[addMidiConnection] expected midi output port: ', {node: this, sourcePort, targetPort})
		if (!isMidiInputPort(targetPort)) return logger.error('[addMidiConnection] expected midi input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpMidiConnection(expConnection.id, sourcePort, targetPort)
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
			case 'midi': return this._changeMidiConnectionSource(connection, newSourceId, newSourcePort)
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

	private readonly _changeMidiConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: Id) => {
		if (!isMidiConnection(connection)) {
			return logger.error(
				'[_changeMidiConnectionSource] connection not instanceof ExpNodeMidiConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		// Get node
		const source = this._nodes.get(newSourceId)
		if (!source) return logger.warn('uh oh: ', {source})

		// Get and connect ports
		const sourcePort = source.getPort(newSourcePort)
		if (!sourcePort) return logger.warn('[changeMidiConnectionSource] 404 port not found: ', {node: this, sourcePort})
		if (!isMidiOutputPort(sourcePort)) return logger.error('[changeMidiConnectionSource] expected audio output port: ', {node: this, sourcePort})

		// Disconnect old source
		connection.changeSource(sourcePort)
	}

	public changeConnectionTarget = (connectionId: Id, newTargetId: Id, newTargetPort: Id) => {
		const connection = this._connections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		switch (connection.type) {
			case 'audio': return this._changeAudioConnectionTarget(connection, newTargetId, newTargetPort)
			case 'midi': return this._changeMidiConnectionTarget(connection, newTargetId, newTargetPort)
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

	private readonly _changeMidiConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: Id) => {
		if (!isMidiConnection(connection)) {
			return logger.error(
				'[_changeMidiConnectionTarget] connection not instanceof ExpNodeMidiConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		// Get node
		const target = this._nodes.get(newTargetId)
		if (!target) return logger.warn('uh oh: ', {target})

		// Get and connect ports
		const targetPort = target.getPort(newTargetPort)
		if (!targetPort) return logger.warn('[_changeMidiConnectionTarget] 404 port not found: ', {node: this, targetPort})
		if (!isMidiInputPort(targetPort)) return logger.error('[_changeMidiConnectionTarget] expected audio input port: ', {node: this, targetPort})

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

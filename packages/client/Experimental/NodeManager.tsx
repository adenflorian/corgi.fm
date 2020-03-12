import React, {Fragment, useContext, useLayoutEffect} from 'react'
import * as immutable from 'immutable'
import {ExpNodeState, IExpConnection, ExpGraph, ExpMidiPatternState} from '@corgifm/common/redux'
import {ParamInputCentering} from '@corgifm/common/common-types'
import {NodeToNodeAction} from '@corgifm/common/server-constants'
import {assertUnreachable} from '@corgifm/common/common-utils'
import {logger} from '../client-logger'
import {SingletonContextImpl} from '../SingletonContext'
import {typeClassMap} from './Nodes/ExpNodes'
import {CorgiNode} from './CorgiNode'
import {
	ExpNodeAudioConnection, ExpNodeConnection, isAudioConnection,
	ExpMidiConnection, isMidiConnection, ExpPolyphonicConnection,
	isPolyphonicConnection,
} from './ExpConnections'
import {NumberParamChange, EnumParamChange, StringParamChange} from './ExpParams'
import {
	isAudioOutputPort, isAudioInputPort, ExpPortType,
	isAudioParamInputPort, ExpPort,
} from './ExpPorts'
import {isMidiOutputPort, isMidiInputPort} from './ExpMidiPorts'
import {isPolyphonicOutputPort, isPolyphonicInputPort} from './ExpPolyphonicPorts'

export const NodeManagerContext = React.createContext<null | NodeManagerContextValue>(null)

export interface NodeManagerContextValue extends ReturnType<NodeManager['_makeContextValue']> {}

export function useNodeManagerContext() {
	const context = useContext(NodeManagerContext)

	if (!context) throw new Error(`missing node manager context, maybe there's no provider`)

	return context
}

class CorgiGraph {
	public readonly nodes = new Map<Id, CorgiNode>()
	public readonly connections = new Map<Id, ExpNodeConnection>()
}

export type NodeTickDelegate = (audioTime: number) => void

export function useExpNodeManagerTick(handler: NodeTickDelegate) {
	const nodeManagerContext = useNodeManagerContext()

	useLayoutEffect(() => {
		nodeManagerContext.subscribeToTick(handler)
		return () => nodeManagerContext.unsubscribeFromTick(handler)
	})
}

export class NodeManager {
	private readonly _mainGraph = new CorgiGraph()
	public readonly reactContext: NodeManagerContextValue
	private get _audioContext() {return this._singletonContext.getAudioContext()}
	private get _preMasterLimiter() {return this._singletonContext.getPreMasterLimiter()}
	private _tickSubscribers = new Set<NodeTickDelegate>()

	public constructor(
		private readonly _singletonContext: SingletonContextImpl,
	) {
		this.reactContext = this._makeContextValue()
	}

	private readonly _makeContextValue = () => {
		return {
			connections: {
				get: (id: Id) => {
					const connection = this._mainGraph.connections.get(id)
					if (!connection) return logger.warn('[connections.get] 404 connection not found: ', {id, connections: this._mainGraph.connections})
					return connection
				},
			} as const,
			ports: {
				get: (nodeId: Id, portId: Id) => {
					const node = this._mainGraph.nodes.get(nodeId)
					if (!node) return // logger.warn('[ports.get] 404 node not found: ', {nodeId, portId})
					const port = node.getPort(portId)
					if (!port) return logger.warn('[ports.get] 404 port not found: ', {nodeId, portId})
					return port
				},
			} as const,
			subscribeToTick: (delegate: NodeTickDelegate) => {
				this._tickSubscribers.add(delegate)
			},
			unsubscribeFromTick: (delegate: NodeTickDelegate) => {
				this._tickSubscribers.delete(delegate)
			},
		} as const
	}

	public renderNodeId = (nodeId: Id) => {
		const node = this._mainGraph.nodes.get(nodeId)

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
		const node = this._mainGraph.nodes.get(action.nodeId)

		if (!node) return logger.warn('[onNodeToNode] 404 node not found: ', {action, node})

		node.onNodeToNode(action)
	}

	public getPortType(nodeId: Id, portId: Id): readonly [ExpPortType, boolean] {
		const node = this._mainGraph.nodes.get(nodeId)
		if (!node) {
			logger.warn('[getPortType] 404 node not found: ', {nodeId, portId})
			return ['dummy', false]
		}
		const port = node.getPort(portId)
		if (!port) {
			logger.warn('[getPortType] 404 port not found: ', {nodeId, portId})
			return ['dummy', false]
		}
		return [port.type, port.isAudioParamInput]
	}

	public onTick() {
		const maxReadAhead = 0.1
		const time = this._audioContext.currentTime
		this._mainGraph.nodes.forEach(node => node.onTick(time, maxReadAhead))
		this._tickSubscribers.forEach(sub => sub(time))
	}

	public enableNode(id: Id, enabled: boolean) {
		const node = this._mainGraph.nodes.get(id)

		if (!node) return logger.warn('[enableNode] 404 node not found: ', {id})

		node.setEnabled(enabled)
	}

	public readonly onAudioParamChange = (paramChange: NumberParamChange) => {
		const node = this._mainGraph.nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onAudioParamChange] 404 node not found: ', {paramChange})

		node.onAudioParamChange(paramChange.paramId, paramChange.newValue)
	}

	public readonly onAudioParamInputGainChange = (connectionId: Id, newGain: number) => {
		const connection = this._mainGraph.connections.get(connectionId)

		if (!connection) return logger.warn('[onAudioParamInputGainChange] 404 connection not found: ', connectionId)

		const inputPort = connection.inputPort

		if (!isAudioParamInputPort(inputPort)) {
			return logger.error('[onAudioParamInputGainChange] !isAudioParamInputPort(inputPort): ', {connectionId, connection, inputPort})
		}

		inputPort.setChainGain(connectionId, newGain)
	}

	public readonly onAudioParamInputCenteringChange = (connectionId: Id, newCentering: ParamInputCentering) => {
		const connection = this._mainGraph.connections.get(connectionId)

		if (!connection) return logger.warn('[onAudioParamInputCenteringChange] 404 connection not found: ', connectionId)

		const inputPort = connection.inputPort

		if (!isAudioParamInputPort(inputPort)) {
			return logger.error('[onAudioParamInputCenteringChange] !isAudioParamInputPort(inputPort): ', {connectionId, connection, inputPort})
		}

		inputPort.setChainCentering(connectionId, newCentering)
	}

	public readonly onCustomNumberParamChange = (paramChange: NumberParamChange) => {
		const node = this._mainGraph.nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onCustomNumberParamChange] 404 node not found: ', {paramChange})

		node.onCustomNumberParamChange(paramChange.paramId, paramChange.newValue)
	}

	public readonly onCustomEnumParamChange = (paramChange: EnumParamChange) => {
		const node = this._mainGraph.nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onCustomEnumParamChange] 404 node not found: ', {paramChange})

		node.onCustomEnumParamChange(paramChange.paramId, paramChange.newValue)
	}

	public readonly onCustomStringParamChange = (paramChange: StringParamChange) => {
		const node = this._mainGraph.nodes.get(paramChange.nodeId)

		if (!node) return logger.warn('[onCustomStringParamChange] 404 node not found: ', {paramChange})

		node.onCustomStringParamChange(paramChange.paramId, paramChange.newValue)
	}

	public readonly loadMainGraph = (mainGraph: ExpGraph) => {
		this.addNodes(mainGraph.nodes)
		this.addConnections(mainGraph.connections.connections)
	}

	public readonly addNodes = (newNodes: immutable.Map<Id, ExpNodeState>) => {
		sortNodesWithParentsFirst(newNodes).forEach(this.addNode)
	}

	public readonly addNode = (nodeState: ExpNodeState) => {
		const newNode = new typeClassMap[nodeState.type]({
			id: nodeState.id,
			ownerId: nodeState.ownerId,
			type: nodeState.type,
			audioContext: this._audioContext,
			preMasterLimiter: this._preMasterLimiter,
			singletonContext: this._singletonContext,
			parentNode: this._getParentNode(nodeState),
			ports: nodeState.ports,
		})
		this._mainGraph.nodes.set(newNode.id, newNode)
		this._loadNodePreset(newNode, nodeState)
	}

	public readonly loadNodePreset = (nodeState: ExpNodeState) => {
		const node = this._mainGraph.nodes.get(nodeState.id)
		if (!node) return logger.warn('[loadNodePreset] 404 node not found: ', {nodeState: nodeState.toJS()})
		this._loadNodePreset(node, nodeState)
	}

	private readonly _loadNodePreset = (node: CorgiNode, nodeState: ExpNodeState) => {
		nodeState.audioParams.forEach((newValue, paramId) => node.onAudioParamChange(paramId, newValue))
		nodeState.customNumberParams.forEach((newValue, paramId) => node.onCustomNumberParamChange(paramId, newValue))
		nodeState.customEnumParams.forEach((newValue, paramId) => node.onCustomEnumParamChange(paramId, newValue))
		nodeState.customStringParams.forEach((newValue, paramId) => node.onCustomStringParamChange(paramId, newValue))
		node.setEnabled(nodeState.enabled)
	}

	private readonly _getParentNode = (nodeState: ExpNodeState): CorgiNode | undefined => {
		const parentNodeId = nodeState.groupId
		if (parentNodeId === 'top') return undefined

		const parentNode = this._mainGraph.nodes.get(parentNodeId)

		if (!parentNode) {
			logger.error('404 parentNode not found!', {parentNodeId, nodeState})
			return undefined
		}

		return parentNode
	}

	public readonly deleteNode = (nodeId: Id) => {
		const node = this._mainGraph.nodes.get(nodeId)

		if (!node) return logger.warn('[deleteNode] 404 node not found: ', {nodeId})

		node.dispose()
		this._mainGraph.nodes.delete(nodeId)
	}

	public readonly addConnections = (connections: immutable.Map<Id, IExpConnection>) => {
		connections.forEach(this.addConnection)
	}

	public readonly addConnection = (expConnection: IExpConnection): void => {
		// Get nodes
		const source = this._mainGraph.nodes.get(expConnection.sourceId)
		const target = this._mainGraph.nodes.get(expConnection.targetId)
		if (!source || !target) {
			logger.warn('uh oh: ', {source, target})
			return
		}

		// Get and connect ports
		const sourcePort = source.getPort(expConnection.sourcePort)
		const targetPort = target.getPort(expConnection.targetPort)
		if (!sourcePort || !targetPort) return logger.warn('[addConnection] 404 port not found: ', {node: this, sourcePort, targetPort})

		switch (expConnection.type) {
			case 'audio': return this._addAudioConnection(expConnection, sourcePort, targetPort)
			case 'midi': return this._addMidiConnection(expConnection, sourcePort, targetPort)
			case 'polyphonic': return this._addPolyConnection(expConnection, sourcePort, targetPort)
			case 'dummy': return logger.warn('was asked to add a dummy connection, how dum')
		}

		// return assertUnreachable(expConnection && expConnection.type)
	}

	private readonly _addAudioConnection = (expConnection: IExpConnection, sourcePort: ExpPort, targetPort: ExpPort) => {
		if (!isAudioOutputPort(sourcePort)) return logger.error('[addAudioConnection] expected audio output port: ', {node: this, sourcePort, targetPort})
		if (!isAudioInputPort(targetPort)) return logger.error('[addAudioConnection] expected audio input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpNodeAudioConnection(expConnection.id, sourcePort, targetPort)
		this._mainGraph.connections.set(connection.id, connection)
		if (isAudioParamInputPort(targetPort)) {
			if (expConnection.audioParamInput.centering) {
				targetPort.setChainCentering(connection.id, expConnection.audioParamInput.centering)
			}
			if (expConnection.audioParamInput.gain) {
				targetPort.setChainGain(connection.id, expConnection.audioParamInput.gain)
			}
		}
	}

	private readonly _addMidiConnection = (expConnection: IExpConnection, sourcePort: ExpPort, targetPort: ExpPort) => {
		if (!isMidiOutputPort(sourcePort)) return logger.error('[addMidiConnection] expected midi output port: ', {node: this, sourcePort, targetPort})
		if (!isMidiInputPort(targetPort)) return logger.error('[addMidiConnection] expected midi input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpMidiConnection(expConnection.id, sourcePort, targetPort)
		this._mainGraph.connections.set(connection.id, connection)
	}

	private readonly _addPolyConnection = (expConnection: IExpConnection, sourcePort: ExpPort, targetPort: ExpPort) => {
		if (!isPolyphonicOutputPort(sourcePort)) return logger.error('[addPolyConnection] expected poly output port: ', {node: this, sourcePort, targetPort})
		if (!isPolyphonicInputPort(targetPort)) return logger.error('[addPolyConnection] expected poly input port: ', {node: this, sourcePort, targetPort})

		// Create connection
		const connection = new ExpPolyphonicConnection(expConnection.id, sourcePort, targetPort)
		this._mainGraph.connections.set(connection.id, connection)
	}

	public readonly deleteConnection = (connectionId: Id) => {
		const connection = this._mainGraph.connections.get(connectionId)

		if (!connection) return logger.warn('tried to delete non existent connection: ', connectionId)

		this._mainGraph.connections.delete(connectionId)

		connection.dispose()
	}

	public readonly deleteAllConnections = () => {
		this._mainGraph.connections.forEach(x => this.deleteConnection(x.id))
	}

	public readonly changeConnectionSource = (connectionId: Id, newSourceId: Id, newSourcePortId: Id) => {
		const connection = this._mainGraph.connections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const source = this._mainGraph.nodes.get(newSourceId)
		if (!source) return logger.warn('[changeConnectionSource] uh oh missing source: ', {source, connection})

		// Get and connect ports
		const newSourcePort = source.getPort(newSourcePortId)
		if (!newSourcePort) return logger.warn('[changeConnectionSource] 404 port not found: ', {source, sourcePort: newSourcePort, connection})

		switch (connection.type) {
			case 'audio': return this._changeAudioConnectionSource(connection, newSourceId, newSourcePort)
			case 'midi': return this._changeMidiConnectionSource(connection, newSourceId, newSourcePort)
			case 'polyphonic': return this._changePolyConnectionSource(connection, newSourceId, newSourcePort)
			case 'dummy': return logger.warn('was asked to changeConnectionSource for a dummy connection, how dum')
		}

		// return assertUnreachable(connection && connection.type)
	}

	private readonly _changeAudioConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: ExpPort) => {
		if (!isAudioConnection(connection)) {
			return logger.error(
				'[_changeAudioConnectionSource] connection not instanceof ExpNodeAudioConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		if (!isAudioOutputPort(newSourcePort)) return logger.error('[changeAudioConnectionSource] expected audio output port: ', {node: this, newSourcePort})

		// Disconnect old source
		connection.changeSource(newSourcePort)
	}

	private readonly _changeMidiConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: ExpPort) => {
		if (!isMidiConnection(connection)) {
			return logger.error(
				'[_changeMidiConnectionSource] connection not instanceof ExpNodeMidiConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		if (!isMidiOutputPort(newSourcePort)) return logger.error('[changeMidiConnectionSource] expected midi output port: ', {node: this, newSourcePort})

		// Disconnect old source
		connection.changeSource(newSourcePort)
	}

	private readonly _changePolyConnectionSource = (connection: ExpNodeConnection, newSourceId: Id, newSourcePort: ExpPort) => {
		if (!isPolyphonicConnection(connection)) {
			return logger.error(
				'[_changePolyConnectionSource] connection not instanceof ExpNodePolyConnection: ',
				{connection, newSourceId, newSourcePort})
		}

		if (!isPolyphonicOutputPort(newSourcePort)) return logger.error('[changePolyConnectionSource] expected poly output port: ', {node: this, newSourcePort})

		// Disconnect old source
		connection.changeSource(newSourcePort)
	}

	public readonly changeConnectionTarget = (connectionId: Id, newTargetId: Id, newTargetPortId: Id) => {
		const connection = this._mainGraph.connections.get(connectionId)

		if (!connection) return logger.warn('404 connection not found: ', connectionId)

		// Get node
		const target = this._mainGraph.nodes.get(newTargetId)
		if (!target) return logger.warn('[changeConnectionTarget] uh oh target node not found: ', {target, connection})

		// Get and connect ports
		const newTargetPort = target.getPort(newTargetPortId)
		if (!newTargetPort) return logger.warn('[changeConnectionTarget] 404 port not found: ', {target, targetPort: newTargetPort, connection})

		switch (connection.type) {
			case 'audio': return this._changeAudioConnectionTarget(connection, newTargetId, newTargetPort)
			case 'midi': return this._changeMidiConnectionTarget(connection, newTargetId, newTargetPort)
			case 'polyphonic': return this._changePolyConnectionTarget(connection, newTargetId, newTargetPort)
			case 'dummy': return logger.warn('was asked to changeConnectionTarget for a dummy connection, how dum')
		}

		// return assertUnreachable(connection && connection.type)
	}

	private readonly _changeAudioConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: ExpPort) => {
		if (!isAudioConnection(connection)) {
			return logger.error(
				'[changeAudioConnectionTarget] connection not instanceof ExpNodeAudioConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		if (!isAudioInputPort(newTargetPort)) return logger.error('[changeAudioConnectionTarget] expected audio input port: ', {connection, newTargetPort})

		connection.changeTarget(newTargetPort)
	}

	private readonly _changeMidiConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: ExpPort) => {
		if (!isMidiConnection(connection)) {
			return logger.error(
				'[_changeMidiConnectionTarget] connection not instanceof ExpNodeMidiConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		if (!isMidiInputPort(newTargetPort)) return logger.error('[_changeMidiConnectionTarget] expected midi input port: ', {connection, newTargetPort})

		connection.changeTarget(newTargetPort)
	}

	private readonly _changePolyConnectionTarget = (connection: ExpNodeConnection, newTargetId: Id, newTargetPort: ExpPort) => {
		if (!isPolyphonicConnection(connection)) {
			return logger.error(
				'[_changePolyConnectionTarget] connection not instanceof ExpNodePolyConnection: ',
				{newTargetId, newTargetPort, connection})
		}

		if (!isPolyphonicInputPort(newTargetPort)) return logger.error('[_changePolyConnectionTarget] expected poly input port: ', {connection, newTargetPort})

		connection.changeTarget(newTargetPort)
	}

	public readonly onExtraAnimationsChange = (value: boolean) => {
		this._mainGraph.nodes.forEach(node => {
			node.getPorts().forEach(port => {
				if (isAudioParamInputPort(port)) {
					port.onExtraAnimationsChange(value)
				}
			})
		})
	}

	public readonly patternUpdated = (pattern: ExpMidiPatternState) => {
		// TODO
	}

	public readonly cleanup = () => {
		this._mainGraph.nodes.forEach(node => node.dispose())
		this._mainGraph.nodes.clear()
		this._mainGraph.nodes.forEach(connection => connection.dispose())
		this._mainGraph.connections.clear()
	}
}

function sortNodesWithParentsFirst(nodes: immutable.Map<Id, ExpNodeState>): readonly ExpNodeState[] {
	const sortedNodeIds: ExpNodeState[] = []
	const firstNode = nodes.first(null)
	if (!firstNode) return sortedNodeIds
	nodes.forEach(sortNode)

	return sortedNodeIds

	function sortNode(node: ExpNodeState) {
		if (sortedNodeIds.some(x => x.id === node.id)) {
			return
		} else if (node.groupId === 'top') {
			return sortedNodeIds.push(node)
		} else {
			const parent = nodes.find(x => x.id === node.groupId)
			if (parent) sortNode(parent)
			return sortedNodeIds.push(node)
		}
	}
}

// UI -> dispatch(action) -> redux -> reducers -> middleware -> NodeManager -> Node -> render/update web audio API

import {
	useLayoutEffect, useReducer, useRef,
} from 'react'
import {useNodeManagerContext} from '../NodeManager'
import {ExpNodeConnectionReact} from '../ExpConnections'

export function useConnection(connectionId: Id) {
	const nodeManagerContext = useNodeManagerContext()
	const [, forceRender] = useReducer(x => x + 1, 0)

	const value = useRef<ExpNodeConnectionReact | null>(null)

	useLayoutEffect(() => {
		function onNewValue(connection: ExpNodeConnectionReact) {
			value.current = connection
			forceRender(0)
		}

		nodeManagerContext.connections.register(connectionId, onNewValue)

		return () => nodeManagerContext.connections.unregister(connectionId, onNewValue)
	}, [nodeManagerContext, connectionId])

	return value.current
}

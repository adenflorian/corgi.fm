import {
	useLayoutEffect, useReducer, useRef,
} from 'react'
import {useNodeManagerContext} from '../NodeManager'
import {ExpPortReact} from '../ExpPorts'

export function usePort(nodeId: Id, portId: Id) {
	const nodeManagerContext = useNodeManagerContext()
	const [, forceRender] = useReducer(x => x + 1, 0)

	const value = useRef<ExpPortReact | null>(null)

	useLayoutEffect(() => {
		function onNewValue(port: ExpPortReact) {
			value.current = port
			forceRender(0)
		}

		nodeManagerContext.ports.register(nodeId, portId, onNewValue)

		return () => nodeManagerContext.ports.unregister(nodeId, portId, onNewValue)
	}, [nodeId, nodeManagerContext, portId])

	return value.current
}

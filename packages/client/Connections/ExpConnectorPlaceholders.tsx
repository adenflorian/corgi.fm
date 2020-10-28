import React, {Fragment} from 'react'
import {useSelector} from 'react-redux'
import {hot} from 'react-hot-loader'
import {
	ActiveGhostConnectorSourceOrTarget,
	createExpPositionSelector,
} from '@corgifm/common/redux'
import {useNodeContext} from '../Experimental/CorgiNode'
import {ExpConnectorPlaceholder} from './ExpConnectorPlaceholder'

export const ExpConnectorPlaceholders = hot(module)(React.memo(function _ExpConnectorPlaceholders() {
	const nodeContext = useNodeContext()
	const parentId = nodeContext.id
	const ports = [...nodeContext.getPorts()].map(x => x[1])
	const inPorts = ports.filter(x => x.side === 'in')
	const outPorts = ports.filter(x => x.side === 'out')
	const parentPosition = useSelector(createExpPositionSelector(parentId))

	return (
		<Fragment>
			{inPorts.map(port => {
				return (
					<ExpConnectorPlaceholder
						key={port.id as string}
						parentX={parentPosition.x}
						parentY={parentPosition.y}
						parentWidth={parentPosition.width}
						sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Source}
						nodeId={parentId}
						port={port}
					/>
				)
			})}
			{outPorts.map(port => {
				return (
					<ExpConnectorPlaceholder
						key={port.id as string}
						parentX={parentPosition.x}
						parentY={parentPosition.y}
						parentWidth={parentPosition.width}
						sourceOrTarget={ActiveGhostConnectorSourceOrTarget.Target}
						nodeId={parentId}
						port={port}
					/>
				)
			})}
		</Fragment>
	)
}))

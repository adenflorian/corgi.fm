import React from 'react'
import {ExpReferenceParam} from './ExpParams'
import {useObjectChangedEvent} from './hooks/useCorgiEvent'

interface Props {
	nodeId: Id
	referenceParam: ExpReferenceParam
}

export const ExpNodeDebugReferenceParamField = React.memo(function _ExpNodeDebugReferenceParamField({
	nodeId, referenceParam,
}: Props) {
	const value = useObjectChangedEvent(referenceParam.value)

	return (
		<div>
			ReferenceParamId: {referenceParam.id} Id: {value.id}
		</div>
	)
})

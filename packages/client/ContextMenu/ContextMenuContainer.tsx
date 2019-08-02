import React, {Fragment} from 'react'
import {ContextMenu} from 'react-contextmenu'
import {
	selectLocalClient, selectVirtualKeyboardsByOwner, shamuConnect,
} from '@corgifm/common/redux'
import {backgroundMenuId} from '../client-constants'
import './ContextMenu.less'
import {ConnectedNodeMenu} from './NodeMenu'
import {BackgroundMenuItems} from './BackgroundMenu'

interface ReduxProps {
	localClientId: Id
	localClientKeyboardCount: number
	localClientColor: string
}

type AllProps = ReduxProps

export function ContextMenuContainer(
	{localClientId, localClientKeyboardCount, localClientColor}: AllProps
) {
	return (
		<Fragment>
			<ContextMenu id={backgroundMenuId}>
				<BackgroundMenuItems
					localClientId={localClientId}
					localClientKeyboardCount={localClientKeyboardCount}
					localClientColor={localClientColor}
				/>
			</ContextMenu>
			<ConnectedNodeMenu />
		</Fragment>
	)
}

export const ConnectedContextMenuContainer = shamuConnect(
	(state): ReduxProps => {
		const localClient = selectLocalClient(state)
		return {
			localClientId: localClient.id,
			localClientKeyboardCount: selectVirtualKeyboardsByOwner(
				state.room, localClient.id).length,
			localClientColor: localClient.color,
		}
	},
)(ContextMenuContainer)

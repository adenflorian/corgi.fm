import React, {Fragment} from 'react'
import {ContextMenu} from 'react-contextmenu'
import {
	selectLocalClient, shamuConnect, selectVirtualKeyboardCountByOwner,
} from '@corgifm/common/redux'
import {backgroundMenuId} from '../client-constants'
import './ContextMenu.less'
import {ConnectedNodeMenu} from './NodeMenu'
import {BackgroundMenuItems} from './BackgroundMenu'
import {SamplePadMenu} from './SamplePadMenu'
import {ConnectedExpNodeMenu} from './ExpNodeMenu'
import {ConnectedExpBackgroundMenu} from './ExpBackgroundMenu'

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
			<ConnectedExpBackgroundMenu />
			<ConnectedNodeMenu />
			<ConnectedExpNodeMenu />
			<SamplePadMenu />
		</Fragment>
	)
}

export const ConnectedContextMenuContainer = shamuConnect(
	(state): ReduxProps => {
		const localClient = selectLocalClient(state)
		return {
			localClientId: localClient.id,
			localClientKeyboardCount: selectVirtualKeyboardCountByOwner(
				state.room, localClient.id),
			localClientColor: localClient.color,
		}
	},
)(ContextMenuContainer)

import React from 'react'
import {Dispatch} from 'redux'
import {GroupSequencer, groupSequencerActions, selectGroupSequencer, shamuConnect} from '../../common/redux'
import {Panel} from '../Panel/Panel'
import './GroupSequencer.less'

interface Props {
	id: string
	color: string
}

interface ReduxProps {
	groupSequencer: GroupSequencer
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export function GroupSequencerView(props: AllProps) {
	return (
		<Panel
			id={props.id}
			label={props.groupSequencer.name}
			className="groupSequencer"
			color={props.color}
		>
			{props.groupSequencer.groups.map((group, port) => {
				return (
					<div key={port} className="groupRow" style={{color: group.color}}>
						{group.events.map((event, i) => {
							return (
								<div
									key={i}
									className={`groupEvent ${event.on ? 'on' : 'off'}`}
									onClick={() => {
										props.dispatch(groupSequencerActions.setEnabled(props.id, port, i, !event.on))
									}}
								/>
							)
						})}
					</div>
				)
			}).toList()}
		</Panel>
	)
}

export const ConnectedGroupSequencerView = shamuConnect(
	(state, {id}: Props): ReduxProps => {
		return {
			groupSequencer: selectGroupSequencer(state.room, id),
		}
	},
)(GroupSequencerView)

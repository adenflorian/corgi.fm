import React, {Fragment, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {
	AppOptions, IClientAppState, LineType, ModalId,
	modalsAction, roomSettingsActions, selectLocalClientId, selectRoomSettings,
} from '@corgifm/common/redux'
import {Button} from '../Button/Button'
import {ModalContent} from '../Modal/ModalManager'
import {ConnectedOption} from '../Option'
import {ConnectedOptionCheckbox} from '../RoomSetting'
import './Options.less'

export function OptionsModalButton() {
	const dispatch = useDispatch()
	const showModal = useCallback(
		() => dispatch(modalsAction.set(ModalId.Options)),
		[dispatch],
	)

	return (
		<Button onClick={showModal}>
			Options
		</Button>
	)
}

const selectProps = (state: IClientAppState) => {
	const roomSettings = selectRoomSettings(state.room)

	return {
		isLocalClientRoomOwner:
			selectLocalClientId(state) === roomSettings.ownerId,
		onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
	}
}

export const OptionsModalContent: ModalContent = () => {
	const {isLocalClientRoomOwner, onlyOwnerCanDoStuff} =
		useSelector(selectProps)

	return (
		<Fragment>
			<div className="modalSection options localOptions">
				<div className="modalSectionLabel">Local Options</div>
				<div className="modalSectionSubLabel">{`won't affect anyone else`}</div>
				<div className="modalSectionContent">
					<ConnectedOption
						option={AppOptions.showNoteNamesOnKeyboard}
						label="show note names on keyboard"
					/>
					<ConnectedOption
						option={AppOptions.requireCtrlToScroll}
						label="require control key to zoom (might be needed by laptop users)"
					/>
					<ConnectedOption
						option={AppOptions.showNoteSchedulerDebug}
						label="note scheduler debug: enable"
					/>
					<ConnectedOption
						option={AppOptions.renderNoteSchedulerDebugWhileStopped}
						label="note scheduler debug: keep rendering even when song is stopped"
					/>
					<ConnectedOption
						option={AppOptions.graphicsFancyConnections}
						label="graphics: enable fancy connections"
					/>
					<ConnectedOption
						option={AppOptions.graphicsMultiColoredConnections}
						label="graphics: enable multi colored connections"
					/>
					<ConnectedOption
						option={AppOptions.graphicsECS}
						label="graphics: enable ECS animations (sequencer time marker thing)"
					/>
					<ConnectedOption
						option={AppOptions.graphicsExpensiveZoomPan}
						label="graphics: enable expensive/fancy zoom and pan (sharper render, but slower)"
					/>
				</div>
			</div>
			{!isLocalClientRoomOwner && onlyOwnerCanDoStuff ?
				<div className="modalSection options roomOptions">
					<div className="modalSectionLabel">Room Options</div>
					<div className="modalSectionSubLabel">the room owner has locked this room to where only the room owner can change room settings</div>
				</div>
				:
				<div className="modalSection options roomOptions">
					<div className="modalSectionLabel">Room Options</div>
					<div className="modalSectionSubLabel">other people in this room will see these changes</div>
					<div className="modalSectionContent">
						<ConnectedOptionCheckbox
							label="straight connection lines"
							onChange={dispatch => e =>
								dispatch(roomSettingsActions.changeLineType(e.target.checked
									? LineType.Straight
									: LineType.Curved,
								))}
							valueSelector={state =>
								selectRoomSettings(state.room).lineType === LineType.Straight
							}
						/>
						{isLocalClientRoomOwner &&
							<ConnectedOptionCheckbox
								label="only owner can do stuff"
								onChange={dispatch => e =>
									dispatch(roomSettingsActions.changeOnlyOwnerCanDoStuff(e.target.checked))}
								valueSelector={state => selectRoomSettings(state.room).onlyOwnerCanDoStuff}
							/>
						}
					</div>
				</div>
			}
		</Fragment>
	)
}

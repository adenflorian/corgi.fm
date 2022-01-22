/* eslint-disable react/no-array-index-key */
import {stripIndents} from 'common-tags'
import moment from 'moment'
import React from 'react'
import {FiChrome} from 'react-icons/fi'
import {useDispatch} from 'react-redux'
import {
	loadRoom, ModalId, SavedRoom, localActions,
	getRoomTypeFriendlyString,
} from '@corgifm/common/redux'
import {getOrCreateLocalSavesStorage} from '../local-middleware'
import {ModalButton} from '../Modal/ModalButton'
import {ModalContent} from '../Modal/ModalManager'
import './SavingAndLoading.less'
import {CssColor} from '@corgifm/common/shamu-color'
import {RoomType} from '@corgifm/common/common-types'

export function LoadRoomModalButton() {
	return (
		<ModalButton
			label="Load Room From Browser"
			modalId={ModalId.LoadRoom}
			icon={FiChrome}
		/>
	)
}

export const LoadRoomModalContent: ModalContent = ({hideModal}) => {
	const [saveStorage, setSaveStorage] = React.useState(getOrCreateLocalSavesStorage())
	const dispatch = useDispatch()

	const saves = saveStorage.all

	return (
		<div className="loadRoomUI modalSection localSaves">
			<div className="modalSectionLabel">Load Room</div>
			<div className="modalSectionSubLabel">
				select a saved room to load into a new room
				<br />
				will be able to load from a file soon...
			</div>
			<div className="modalSectionContent saves">
				{saves.count() === 0 &&
					<div className="noSaves">no saves found</div>
				}
				{saves.count() > 0 &&
					saves.sort(savedRoomComparator).map((saveData, saveId) => {
						const saveName = `${saveData.saveDateTime} - ${saveData.room} - v${saveData.saveClientVersion || '?'}`
						const version = saveData.saveClientVersion || '?'
						const date = moment(saveData.saveDateTime).calendar()
						const onClick = () => {
							dispatch(loadRoom(saveData))
							hideModal()
						}
						const type = saveData.roomType
						const isExp = type === RoomType.Experimental
						const typeString = getRoomTypeFriendlyString(type)
						return (
							<div key={saveId as string} className="localSave">
								<div className="load">
									<div className="room" title={`Load ${saveData.room}`} onClick={onClick}>{saveData.room}</div>
									<div className="date" title={date} onClick={onClick}>{date}</div>
									<div className="type" title={typeString} onClick={onClick} style={{color: isExp ? CssColor.orange : undefined}}>{typeString}</div>
									<div className="version" title={`Version ${version}`} onClick={onClick}>{version}</div>
								</div>
								<div
									className="delete"
									onClick={() => {
										if (window.confirm(stripIndents`Are you sure you want to delete this save?
											${saveName}
											This cannot be undone.`)
										) {
											dispatch(localActions.deleteSavedRoom(saveId))
											setSaveStorage(getOrCreateLocalSavesStorage())
										}
									}}
									title="This cannot be undone"
								>
									<span>Delete</span>
								</div>
							</div>
						)
					}).toList()
				}
			</div>
		</div>
	)
}

function savedRoomComparator(a: SavedRoom, b: SavedRoom): number {
	return -a.saveDateTime.localeCompare(b.saveDateTime)
}

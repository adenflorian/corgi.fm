/* eslint-disable react/no-array-index-key */
import {stripIndents} from 'common-tags'
import {Map} from 'immutable'
import moment from 'moment'
import React from 'react'
import {IoMdFolder} from 'react-icons/io'
import {useDispatch} from 'react-redux'
import {loadRoom, ModalId, SavedRoom} from '@corgifm/common/redux'
import {getOrCreateLocalSavesStorage, localActions} from '../local-middleware'
import {ModalButton} from '../Modal/ModalButton'
import {ModalContent} from '../Modal/ModalManager'
import './SavingAndLoading.less'

export function LoadRoomModalButton() {
	return (
		<ModalButton
			label="Load Room"
			modalId={ModalId.LoadRoom}
			icon={IoMdFolder}
		/>
	)
}

export const LoadRoomModalContent: ModalContent = () => {
	const [saveStorage, setSaveStorage] = React.useState(getOrCreateLocalSavesStorage())
	const dispatch = useDispatch()

	const saves = Map(saveStorage.all)

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
						const onClick = () => dispatch(loadRoom(saveData))
						return (
							<div key={saveId} className="localSave">
								<div className="load">
									<div className="room" title={`Load ${saveData.room}`} onClick={onClick}>{saveData.room}</div>
									<div className="date" title={date} onClick={onClick}>{date}</div>
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

import React, { useCallback } from 'react'
import { FiFile } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { loadRoom, SavedRoom } from '@corgifm/common/redux'
import { Button } from '../Button/Button'
import './SavingAndLoading.less'

export function LoadRoomFileButton() {
	const dispatch = useDispatch()
	const onClick = useCallback(
		() => {
			const input = document.createElement('input');
			input.type = 'file';

			input.onchange = async (e) => {
				if (e && e.target) {
					const target = e.target as HTMLInputElement
					if (target.files) {
						const file = target.files[0]
						const text = await file.text()
						const saveData = JSON.parse(text)
						dispatch(loadRoom(saveData as SavedRoom))
					}
				}
			}

			input.click();
		},
		[],
	);
	return (
		<Button
			onClick={onClick}
			background="medium"
			shadow={true}
		>
			<FiFile />
			Load Room From File
		</Button>
	)
}

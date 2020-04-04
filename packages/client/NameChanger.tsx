import React, {useState} from 'react'
import AutosizeInput from 'react-input-autosize'
import {useDispatch} from 'react-redux'
import {
	maxUsernameLength, selectLocalClient, setLocalClientName, shamuConnect,
} from '@corgifm/common/redux'
import {useBoolean} from './react-hooks'

interface Props {
	readonly showLabel?: boolean
}

interface ReduxProps {
	author: string
	authorColor: string
}

type AllProps = ReduxProps & Props

function NameChanger({author, authorColor, showLabel = false}: AllProps) {
	const dispatch = useDispatch()
	const [username, setUsername] = useState(author)
	const [isFocused, onFocus, onBlur] = useBoolean(false)
	const [inputRef, setInputRef] =
		useState<HTMLInputElement | null>(null)

	if (!isFocused && username !== author) {
		setUsername(author)
	}

	// Name
	const _onNameInputBlur = () => {
		setUsername(author)
		onBlur()
	}

	const _onNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
			.replace(/ +(?= )/g, '')
			.substring(0, maxUsernameLength)

		if (newValue === username) return

		setUsername(newValue)

		if (newValue === '' || newValue.length !== newValue.trim().length) return

		dispatch(setLocalClientName(newValue))
	}

	const _onSubmitNameChange = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (username === '') return

		setUsername(username.trim())

		dispatch(setLocalClientName(username))

		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur()
		}
	}

	return (
		<div className="blob">
			{showLabel &&
				<label htmlFor="usernameInput">Username</label>
			}
			<form
				className="nameForm blobDark"
				onSubmit={_onSubmitNameChange}
				title="Change your username here"
				style={{color: authorColor}}
			>
				<AutosizeInput
					name="nameAutosizeInput"
					className="author nameAutosizeInput"
					value={username}
					onChange={_onNameInputChange}
					autoComplete="off"
					onBlur={_onNameInputBlur}
					onFocus={handleFocus}
					inputRef={setInputRef}
				/>
			</form>
		</div>
	)

	function handleFocus() {
		onFocus()
		if (inputRef) {
			inputRef.select()
		}
	}
}

export const ConnectedNameChanger = shamuConnect(
	(state): ReduxProps => ({
		author: selectLocalClient(state).name,
		authorColor: selectLocalClient(state).color,
	}),
)(NameChanger)

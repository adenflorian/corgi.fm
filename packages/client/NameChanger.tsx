import React, {useState} from 'react'
import AutosizeInput from 'react-input-autosize'
import {useDispatch} from 'react-redux'
import {
	maxUsernameLength, selectLocalClient, setLocalClientName, shamuConnect,
} from '../common/redux'
import {useBoolean} from './react-hooks'

interface ReduxProps {
	author: string
	authorColor: string
}

type AllProps = ReduxProps

function NameChanger({author, authorColor}: AllProps) {
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

		{(document.activeElement as HTMLElement).blur()}
	}

	return (
		<form
			className="nameForm"
			onSubmit={_onSubmitNameChange}
			title="Change your username here"
		>
			<AutosizeInput
				name="nameAutosizeInput"
				className="author nameAutosizeInput"
				value={username}
				onChange={_onNameInputChange}
				autoComplete="off"
				style={{color: authorColor}}
				onBlur={_onNameInputBlur}
				onFocus={handleFocus}
				inputRef={setInputRef}
			/>
		</form>
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

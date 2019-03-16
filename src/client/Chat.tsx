import * as React from 'react'
import {Component} from 'react'
import AutosizeInput from 'react-input-autosize'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {
	maxUsernameLength, selectClientInfo, selectLocalClient, setClientName,
} from '../common/redux'
import {IClientAppState} from '../common/redux'
import {chatSubmit} from '../common/redux'
import './Chat.less'
import {ConnectedChatMessages} from './Chat/ChatMessages'
import {saveUsernameToLocalStorage} from './username'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
	username: string
}

interface ReduxProps {
	author: string
	authorColor: string
	authorId: string
	clientVersion: string
	serverVersion: string
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export class Chat extends Component<AllProps, IChatComponentState> {
	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
		username: '',
	}

	public chatInputRef: React.RefObject<HTMLInputElement>
	public chatRef: React.RefObject<HTMLDivElement>

	constructor(props: AllProps) {
		super(props)
		this.chatInputRef = React.createRef()
		this.chatRef = React.createRef()
		this.state.username = props.author
	}

	public componentDidMount = () => {
		window.addEventListener('keydown', this._onKeydown)
		saveUsernameToLocalStorage(this.props.author)
	}

	public componentWillUnmount = () => window.removeEventListener('keydown', this._onKeydown)

	public componentDidUpdate = () => saveUsernameToLocalStorage(this.props.author)

	public render() {
		const {authorColor} = this.props

		return (
			<div
				id="chat"
				ref={this.chatRef}
				className={this.state.isChatFocused ? 'focused' : ''}
				onFocus={this._onFocus}
				onBlur={this._onBlur}
			>
				<div
					className="chatOverlay"
				/>

				<ConnectedChatMessages />

				<div className="chatBottom" style={{textAlign: 'initial'}} tabIndex={-1}>
					<div className="inputWrapper" style={{color: authorColor}} tabIndex={-1}>
						<form className="nameForm" onSubmit={this._onSubmitNameChange}>
							<AutosizeInput
								name="nameAutosizeInput"
								className="author"
								value={this.state.username}
								onChange={this._onNameInputChange}
								autoComplete="off"
								style={{color: authorColor}}
								onBlur={this._onNameInputBlur}
							/>
						</form>
						<form className="chatMessageForm" onSubmit={this._onSubmitChat}>
							<input
								id="chatInput"
								type="text"
								ref={this.chatInputRef}
								onChange={this._onInputChange}
								value={this.state.chatMessage}
								autoComplete="off"
							/>
						</form>
						<BottomInfo
							clientVersion={this.props.clientVersion}
							serverVersion={this.props.serverVersion}
						/>
					</div>
				</div>
			</div>
		)
	}

	private readonly _onKeydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key === 'Enter' && this.state.isChatFocused === false && this.chatInputRef.current !== null) {
			this.chatInputRef.current.focus()
			e.preventDefault()
		}
		if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
	}

	private readonly _onBlur = () => this.setState({isChatFocused: false})

	private readonly _onFocus = () => this.setState({isChatFocused: true})

	// Name
	private readonly _onNameInputBlur = () => this.setState({username: this.props.author})

	private readonly _onNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
			.replace(/ +(?= )/g, '')
			.substring(0, maxUsernameLength)

		if (newValue === this.state.username) return

		this.setState({username: newValue})

		if (newValue === '' || newValue.length !== newValue.trim().length) return

		this.props.dispatch(setClientName(this.props.authorId, newValue))
	}

	private readonly _onSubmitNameChange = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.username === '') return

		this.setState({username: this.state.username.trim()})

		this.props.dispatch(setClientName(this.props.authorId, this.state.username))

		return (document.activeElement as HTMLElement).blur()
	}

	// Chat
	private readonly _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		this.setState({chatMessage: e.target.value})

	private readonly _onSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.chatMessage !== '') {
			this.props.dispatch(chatSubmit({
				authorName: this.props.author,
				text: this.state.chatMessage,
				color: this.props.authorColor,
			}))

			this.setState({chatMessage: ''})
		}

		return (document.activeElement as HTMLElement).blur()
	}
}

interface BottomInfoProps {
	clientVersion: string
	serverVersion: string
}

const BottomInfo = React.memo(function _BottomInfo(props: BottomInfoProps) {
	const isVersionMismatch = props.clientVersion !== props.serverVersion

	return (
		<div className="bottomInfo">
			{/* <div className="info-env">{getEnvDisplayName()}</div> */}
			<div
				className="info-milestone"
			>
				pre-alpha
							</div>
			<div
				className={`info-version ${isVersionMismatch ? 'info-versionMismatch' : ''}`}
				title={isVersionMismatch
					? `client is out of date, click to reload\nserver version: ${props.serverVersion}`
					: 'up to date!'
				}
				style={{
					cursor: isVersionMismatch ? 'pointer' : 'inherit',
				}}
				onClick={isVersionMismatch
					? () => location.reload()
					: undefined
				}
			>
				v{props.clientVersion}
			</div>
		</div>
	)
})

export const ConnectedChat = connect((state: IClientAppState): ReduxProps => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	authorId: selectLocalClient(state).id,
	clientVersion: selectClientInfo(state).clientVersion,
	serverVersion: selectClientInfo(state).serverVersion,
}))(Chat)

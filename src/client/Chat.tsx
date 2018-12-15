import * as React from 'react'
import {Component} from 'react'
import AutosizeInput from 'react-input-autosize'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {chatSubmit} from '../common/redux/chat-redux'
import {IAppState} from '../common/redux/client-store'
import {maxUsernameLength, selectLocalClient, setClientName} from '../common/redux/clients-redux'
import './Chat.less'
import {ConnectedChatMessages} from './Chat/ChatMessages'
import {saveUsernameToLocalStorage} from './username'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
	username: string
}

interface IChatProps {
	author?: string
	authorColor?: string
	authorId?: string
	dispatch?: Dispatch
}

export class Chat extends Component<IChatProps, IChatComponentState> {
	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
		username: '',
	}

	public chatInputRef: React.RefObject<HTMLInputElement>
	public chatRef: React.RefObject<HTMLDivElement>

	constructor(props: IChatProps) {
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
					id="chatVerticalGradient"
					className="chatGradient"
				/>
				<div
					id="chatHorizontalGradient"
					className="chatGradient"
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
					</div>
				</div>
			</div>
		)
	}

	private _onKeydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key === 'Enter' && this.state.isChatFocused === false) {
			this.chatInputRef.current.focus()
			e.preventDefault()
		}
		if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
	}

	private _onBlur = () => this.setState({isChatFocused: false})

	private _onFocus = () => this.setState({isChatFocused: true})

	// Name
	private _onNameInputBlur = () => this.setState({username: this.props.author})

	private _onNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
			.replace(/ +(?= )/g, '')
			.substring(0, maxUsernameLength)

		if (newValue === this.state.username) return

		this.setState({username: newValue})

		if (newValue === '' || newValue.length !== newValue.trim().length) return

		this.props.dispatch(setClientName(this.props.authorId, newValue))
	}

	private _onSubmitNameChange = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (this.state.username === '') return

		this.setState({username: this.state.username.trim()})

		this.props.dispatch(setClientName(this.props.authorId, this.state.username))

		return (document.activeElement as HTMLElement).blur()
	}

	// Chat
	private _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({chatMessage: e.target.value})

	private _onSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
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

export const ConnectedChat = connect((state: IAppState) => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	authorId: selectLocalClient(state).id,
}))(Chat)

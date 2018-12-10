import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {chatSubmit, IChatMessage, selectAllMessages} from '../common/redux/chat-redux'
import {selectLocalClient} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import './Chat.less'

interface IChatComponentState {
	chatMessage: string
	isChatFocused: boolean
}

interface IChatProps {
	author?: string
	authorColor?: string
	dispatch?: Dispatch
	messages?: IChatMessage[]
}

export const chatInputId = 'chatInput'

export class Chat extends Component<IChatProps, IChatComponentState> {
	public static defaultProps = {
		messages: [],
	}

	public state: IChatComponentState = {
		chatMessage: '',
		isChatFocused: false,
	}

	public render() {
		const {author, authorColor, messages} = this.props

		return (
			<div
				id="chat"
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
				<ul id="chatMessages">
					{messages.map((x, i) =>
						<li
							key={i}
						>
							<div className="selectable" tabIndex={-1}>
								<span className="author" style={{color: x.color}}>
									{x.authorName}
								</span>
								<span className="text" >
									{x.text}
								</span>
							</div>
						</li>,
					)}
				</ul>
				<form onSubmit={this._onSubmit} style={{textAlign: 'initial'}}>
					{/* <div className="isometricBoxShadow" color={authorColor} >
					</div> */}
					<div className="inputWrapper" style={{color: authorColor}}>
						<span className="author">
							{author}
						</span>
						<input
							id={chatInputId}
							type="text"
							onChange={this._onInputChange}
							value={this.state.chatMessage}
							autoComplete="off"
						/>
					</div>
				</form>
			</div>
		)
	}

	private _onBlur = e => {
		this.setState({isChatFocused: false})
	}

	private _onFocus = e => {
		this.setState({isChatFocused: true})
	}

	private _onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({chatMessage: e.target.value})

	private _onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		this.props.dispatch(chatSubmit({
			authorName: this.props.author,
			text: this.state.chatMessage,
			color: this.props.authorColor,
		}))
		this.setState({chatMessage: ''})
		e.preventDefault()
	}
}

export const ConnectedChat = connect((state: IAppState) => ({
	author: selectLocalClient(state).name,
	authorColor: selectLocalClient(state).color,
	messages: selectAllMessages(state),
}))(Chat)

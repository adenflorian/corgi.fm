import * as React from 'react'

interface IBasicSamplerProps {
	id: string
}

export class BasicSampler extends React.PureComponent<IBasicSamplerProps> {
	public render() {
		return (
			<div className="container basicSampler" id={this.props.id}>
				hello world, i am a basic sampler
			</div>
		)
	}
}

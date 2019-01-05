import * as React from 'react'
import {Panel} from '../Panel'
import './SimpleSequencer.less'

export const SimpleSequencer = () => (
	<div className="simpleSequencer">
		<Panel id={'fakeId'}>
			<div className="controls" style={{margin: 8}}>
				<div className="record">⬤</div>
			</div>
			<div className="display" style={{backgroundColor: '#31313d', width: 256}}></div>
		</Panel>
	</div>
)

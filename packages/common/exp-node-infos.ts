import {ExpNodeType} from './redux'

const defaultExpNodeInfo = {
	width: 300,
	height: 220,
}

type ExpNodeInfo = Readonly<typeof defaultExpNodeInfo>

const expNodeInfos = new Map<ExpNodeType, ExpNodeInfo>()

expNodeInfos.set('betterSequencer', {
	width: 800,
	height: 800,
})

expNodeInfos.set('oscillator', {
	width: 320,
	height: 320,
})

expNodeInfos.set('filter', {
	width: 320,
	height: 320,
})

export function getExpNodeInfo(type: ExpNodeType): ExpNodeInfo {
	return expNodeInfos.get(type) || defaultExpNodeInfo
}
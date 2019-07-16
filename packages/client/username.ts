import {maxUsernameLength} from '../common/redux'

export const saveUsernameToLocalStorage = (name: string) =>
	window.localStorage.setItem('username', name.substring(0, maxUsernameLength).trim())

export const getUsernameFromLocalStorage = (): string => {
	const username = window.localStorage.getItem('username')
	return username ? username.substring(0, maxUsernameLength).trim() : ''
}

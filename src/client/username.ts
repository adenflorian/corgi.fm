export const saveUsernameToLocalStorage = (name: string) => window.localStorage.setItem('username', name)

export const getUsernameFromLocalStorage = () => window.localStorage.getItem('username')

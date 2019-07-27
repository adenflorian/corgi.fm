import {Length, IsAlphanumeric, IsOptional, Matches} from 'class-validator'
import {multilineRegExp} from '../common-utils'
import {maxUsernameLength, minUsernameLength} from '../redux'

const colorRegex = multilineRegExp([
	/^/,
	/(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|hsl\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%\))/,
	/$/,
])

export class UserUpdate {
	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName: string = ''

	@Matches(colorRegex)
	public readonly color: string = ''
}

export class User extends UserUpdate {
	@IsOptional()
	@Length(28, 28)
	@IsAlphanumeric()
	/** Example: ca5Ck2RLp7TlwLzH4r2ivWTcu1C2 */
	public readonly uid: string = ''
}

export function makeUser(user: User) {
	return user
}

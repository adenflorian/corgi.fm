import {Length, IsAlphanumeric, IsOptional} from 'class-validator'
import {maxUsernameLength, minUsernameLength} from '../redux'

export class User {
	@IsOptional()
	@Length(28, 28)
	@IsAlphanumeric()
	/** Example: ca5Ck2RLp7TlwLzH4r2ivWTcu1C2 */
	public readonly uid: string = ''

	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName: string = ''
}

export class UserUpdate {
	@IsOptional()
	@Length(minUsernameLength, maxUsernameLength)
	public readonly displayName?: string
}

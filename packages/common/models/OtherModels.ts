import {Matches, Min, Max, Length, ValidateNested} from 'class-validator'
import {multilineRegExp} from '../common-utils'

const uploadPathRegex = multilineRegExp([
	// /^(dev|test|prod)\//,
	/^user\//,
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
	/\.[0-9a-zA-Z]{1,5}$/,
])

export class Upload {
	@Length(28, 28)
	public readonly ownerUid: Id = ''

	@Matches(uploadPathRegex)
	public readonly path: string = ''

	@Min(1)
	@Max(Number.MAX_SAFE_INTEGER)
	public readonly sizeBytes: number = 0
}

export class YourSamples {
	@ValidateNested()
	public readonly yourSamples: Upload[] = []
}

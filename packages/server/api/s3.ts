import * as S3 from 'aws-sdk/clients/s3'

// AWS credentials should be stored in a shared credentials file
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
const s3 = new S3({
	apiVersion: '2006-03-01',
	endpoint: 'https://nyc3.digitaloceanspaces.com',
})

export async function s3Upload(
	params: S3.PutObjectRequest,
): Promise<S3.ManagedUpload.SendData> {
	return s3.upload(params).promise()
}

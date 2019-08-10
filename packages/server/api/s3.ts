import * as S3 from 'aws-sdk/clients/s3'

const s3 = new S3({
	apiVersion: '2006-03-01',
	endpoint: 'https://nyc3.digitaloceanspaces.com',
})

export async function s3Upload(
	params: S3.PutObjectRequest,
): Promise<S3.ManagedUpload.SendData> {
	return s3.upload(params).promise()
}

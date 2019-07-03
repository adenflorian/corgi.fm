export function connectToLocalDB(dbName: string) {
	return Promise.resolve(`mongodb://127.0.0.1:27017/${dbName}`)
}

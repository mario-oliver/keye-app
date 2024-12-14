import { saveFileMetadata } from '@/app/actions/fileService'

export async function POST(req: Request) {
  const { userId, fileName, s3Bucket, s3Key, s3Url, contentType } = await req.json()
  try {
    const file = await saveFileMetadata(userId, fileName, s3Bucket, s3Key, s3Url, contentType)
    return new Response(JSON.stringify(file), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response('Failed to save file metadata', { status: 500 })
  }
}

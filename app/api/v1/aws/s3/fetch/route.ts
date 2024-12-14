import AWS from 'aws-sdk'
import { NextResponse } from 'next/server'

const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export async function GET(req: Request) {
  const urlParams = new URL(req.url).searchParams
  const fileKey = urlParams.get('key')

  if (!fileKey) {
    return NextResponse.json({ error: 'Missing file key' }, { status: 400 })
  }

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Expires: 60 // URL expiration time in seconds
    }

    const url = await s3.getSignedUrlPromise('getObject', params)

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Error generating signed URL:', err)
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }
}

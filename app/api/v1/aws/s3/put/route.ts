import AWS from 'aws-sdk'
import { NextResponse } from 'next/server'

const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

// Ensure you handle POST requests
export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType in request' }, { status: 400 })
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Expires: 60,
      ContentType: contentType
    }

    const url = await s3.getSignedUrlPromise('putObject', params)

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Error in S3 route:', err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

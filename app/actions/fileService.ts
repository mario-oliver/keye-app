'use server'
import { neon } from '@neondatabase/serverless'

export async function saveFileMetadata(
  userId: string,
  fileName: string,
  s3Bucket: string,
  s3Key: string,
  s3Url: string,
  contentType: string
) {
  const sql = neon(process.env.DATABASE_URL || '')

  const query = await sql`
    INSERT INTO files (
      user_id,
      file_name,
      s3_bucket,
      s3_key,
      s3_url,
      content_type,
      uploaded_at
    ) VALUES (
      ${userId},
      ${fileName},
      ${s3Bucket},
      ${s3Key},
      ${s3Url},
      ${contentType},
      NOW()
    )
    RETURNING *;
  `

  console.log('Inserted file metadata:', query)
  return query[0] // Return the inserted row
}

export async function getFiles() {
  const sql = neon(process.env.DATABASE_URL || '')
  const data = await sql`SELECT * FROM files;`
  return data
}

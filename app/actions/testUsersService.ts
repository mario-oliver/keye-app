'use server'
import { neon } from '@neondatabase/serverless'

export async function getData() {
  const sql = neon(process.env.DATABASE_URL || '')
  const data = await sql`SELECT * FROM users;`
  console.log('data', data)
  return data
}

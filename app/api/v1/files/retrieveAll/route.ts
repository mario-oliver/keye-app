import { getFiles } from '@/app/actions/fileService'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getFiles()
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return new Response('Failed to save file metadata', { status: 500 })
  }
}

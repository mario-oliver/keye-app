'use client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import FileUpload from './_components/FileUpload'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type File = {
  id: number
  user_id: number
  file_name: string
  s3_bucket: string
  s3_key: string
  s3_url: string
  content_type: string
  uploaded_at: number
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/v1/files/retrieveAll')
      const data = await response.json()
      setFiles(data)
    }
    fetchData()
  }, [])

  // Callback to handle newly uploaded file
  const handleFileUploaded = (newFile: File) => {
    setFiles(prevFiles => [...prevFiles, newFile])
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <Image className="rounded-full" src="/logo.png" alt="logo" height={100} width={100}></Image>
      <main className="flex flex-col gap-4 row-start-2 items-center">
        <FileUpload onFileUploaded={handleFileUploaded} />
        {files && <h1 className="text-2xl font-bold pt-12">Uploaded Files</h1>}
        {files.map(file => {
          return (
            <Link
              key={file.id + file.uploaded_at}
              href={{
                pathname: '/processed',
                query: {
                  file_name: file.file_name,
                  s3_url: file.s3_url,
                  s3_bucket: file.s3_bucket,
                  s3_key: file.s3_key
                }
              }}
            >
              <Button key={file.id + file.uploaded_at}>{file.file_name}</Button>
            </Link>
          )
        })}
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.mariooliver.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Me
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.planmyforever.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          PlanMyForever
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://youtu.be/kZNJqJ0W5x4"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          See My Book Chat App →
        </a>
      </footer>
    </div>
  )
}

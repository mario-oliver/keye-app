'use client'
import React, { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { File } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import axios from 'axios'

type S3File = {
  id: number
  user_id: number
  file_name: string
  s3_bucket: string
  s3_key: string
  s3_url: string
  content_type: string
  uploaded_at: number
}

type FileUploadProps = {
  onFileUploaded: (file: S3File) => void
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles])
  }, [])

  const uploadToS3 = async () => {
    setUploading(true)
    try {
      for (const file of files) {
        // Generate a unique name for the file
        const uniqueName = `${file.name.substring(0, file.name.lastIndexOf('.'))}-${Date.now()}.xlsx`

        // Get a pre-signed URL from the backend
        const { data } = await axios.post('/api/v1/aws/s3/put', {
          filename: uniqueName,
          contentType: file.type
        })

        // Upload the file to S3 using the pre-signed URL
        await axios.put(data.url, file, {
          headers: {
            'Content-Type': file.type
          }
        })

        // Notify the backend to store file metadata
        const metadataResponse = await axios.post('/api/v1/files', {
          userId: '123',
          fileName: uniqueName, // Use the unique name
          s3Bucket: 'chatbook-2023',
          s3Key: uniqueName, // Use the unique name
          s3Url: data.url.split('?')[0], // Remove query string for clean URL
          contentType: file.type
        })

        // Add the uploaded file to the state via the callback
        onFileUploaded(metadataResponse.data)
      }

      alert('Upload successful!')
      setFiles([]) // Clear files after upload
    } catch (err) {
      console.error('Error uploading files:', err)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    multiple: true // Allow multiple files
  })

  return (
    <div className="flex flex-col space-y-4 p-8 border-2 rounded-lg border-slate bg-black text-white">
      <div {...getRootProps()}>
        <input multiple accept=".xlsx" {...getInputProps()} />
        {/* <input type="file" multiple accept=".xlsx" onChange={handleFileSelect} /> */}

        <div className="flex flex-row justify-between">
          <h1 className="text-xl font-bold">Begin Due Diligence</h1>
          <File />
        </div>
        <p>Drag &apos;n&apos; drop or click to select files</p>
        <p>(Only .xlsx and .csv files are allowed)</p>

        <ul>
          {files.map(file => (
            <li key={file.name}>{file.name.length > 20 ? file.name.slice(0, 26) + '...' : file.name}</li>
          ))}
        </ul>
      </div>
      <Button variant="secondary" onClick={uploadToS3} disabled={uploading || (files && files.length === 0)}>
        Upload
      </Button>
    </div>
  )
}

export default FileUpload

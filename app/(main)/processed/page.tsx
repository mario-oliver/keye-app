'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'

export default function ProcessedPage() {
  const searchParams = useSearchParams()

  const fileName = searchParams.get('file_name')

  // Derive keys for metadata and content files
  const baseFileName = fileName?.substring(0, fileName.lastIndexOf('.')) || '' // Remove the extension
  const metadataKey = `processed/${baseFileName}_metadata.json`
  const contentKey = `processed/${baseFileName}.csv`

  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
      <h1 className="text-2xl font-bold">Processed File</h1>
      <p>File Name: {fileName}</p>
      {/* <p>S3 URL: {s3Url}</p> */}
      {/* <p>s3Key: {s3Key}</p>
      <p>s3Bucket: {s3Bucket}</p> */}
      <a
        href={`https://keye-output-files.s3.us-east-1.amazonaws.com/${metadataKey}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black p-3 text-white rounded-lg"
      >
        View/Download Metadata
      </a>

      <a
        href={`https://keye-output-files.s3.us-east-1.amazonaws.com/${contentKey}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black p-3 text-white rounded-lg"
      >
        View/Download Content
      </a>
      <h1 className="font-bold pt-12">Notes</h1>
      <p className="w-[35%] text-center">
        Processed Content File is in the form of sql-ready CSV file. To see the formatting, open in TextEditor instead
        of Excel/Sheets.
      </p>
      <p className="w-[35%] text-center">
        Processed Metadata File contains the headers with their derived pythonic types
      </p>
    </div>
  )
}

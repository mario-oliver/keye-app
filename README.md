This live app provides a **document ingestion and processing pipeline** that facilitates users' uploading of Excel files, processing them dynamically, and making the processed data available for further use.

Github Repo: https://github.com/mario-oliver/keye-app

Live App: https://keye-exkipfmxi-mo-liver.vercel.app/

Documentation: https://mo-films.notion.site/Keye-Ingestion-Pipeline-15cd3b069faa80c5841fdb7826d1570e?pvs=73

The following components and workflows outline the workflow:

![Keye Ingestion Diagram.drawio.svg](https://prod-files-secure.s3.us-west-2.amazonaws.com/86368b2a-751a-4b0d-9f26-81e6c9ede62a/8e42ed9a-cd46-4373-82ef-c2e06806b972/Keye_Ingestion_Diagram.drawio.svg)

### **Key Components**

1. **Frontend (Next.js, React, Javascript/Typescript)**
   - **File Upload UI**:
     - The UI allows users to upload multiple `.xlsx` or `.csv` files via a drag-and-drop interface using `react-dropzone`.
     - On file upload:
       - A unique filename is generated (e.g., appending timestamps).
       - Files are sent to an S3 bucket using a pre-signed URL.
       - Metadata for the uploaded file (e.g., file name, S3 location) is persisted in a local PostgreSQL database.
   - **Processed File UI**:
     - The app displays all uploaded files to the user dynamically.
     - Clicking on a file shows the processed results, including:
       - A **Metadata file** (`.json`) containing headers and column types.
       - A **Content file** (`.csv`) with cleaned and SQL-ready data.
2. **AWS Backend (Python)**
   - **S3 Buckets**:
     - A bucket (`chatbook-2023`) stores uploaded files.
     - A separate bucket (`keye-output-files`) stores processed files (`_metadata.json` and `.csv`).
   - **Lambda Function (Python)**:
     - Triggered when a file is uploaded to S3.
     - Processes the file:
       - **Handles irregular headers**, standardizing them.
       - **Cleans and validates data**, ensuring:
         - Headers are SQL-ready.
         - Columns are consistent in data types.
         - Dates are normalized.
       - Produces:
         - A metadata file (`_metadata.json`) capturing headers and inferred data types.
         - A content file (`.csv`) containing cleaned rows.
     - Stores these files in the `keye-output-files` bucket.
     - Updates the PostgreSQL database with the processed file details.
3. **Database (Neon PostgreSQL)**
   - Stores metadata about uploaded and processed files:
     - User ID
     - Original file name
     - Processed metadata and content file locations in S3
     - Content type and upload timestamp
4. **Notification System (Did not complete - Polling for Processed Files Instead)**
   - **Lambda-to-Next.js Notification**:
     - The Lambda function updates the PostgreSQL database when processing is complete.
     - The frontend fetches the updated list of files dynamically using API routes, ensuring users see the processed files.

### **Workflow**

### **1. File Upload**

- Users upload files via the frontend.
- Files are uploaded to S3 using pre-signed URLs.
- File metadata is persisted in the PostgreSQL database.

### **2. File Processing**

- The S3 upload triggers a Lambda function.
- The Lambda function processes the file:
  - Detects and cleans headers.
  - Infers column types.
  - Produces two files:
    1. **Metadata file**: Header names and their data types.
    2. **Content file**: Cleaned rows in a SQL-ready `.csv` format.
  - Stores processed files in `keye-output-files`.
  - Updates the database with processed file details.

### **3. User Interaction**

- The frontend fetches uploaded and processed file data dynamically from the PostgreSQL database.
- Processed files are displayed on the frontend with links to:
  - **View/Download Metadata**.
  - **View/Download Content**.

### **High-Level Technical Flow**

1. **Upload Pipeline**:
   - Frontend: Generates pre-signed URLs and uploads files to S3.
   - Backend: Updates database with uploaded file metadata.
2. **Processing Pipeline**:
   - S3 triggers Lambda to process files:
     - Handles irregularities, cleans data, and infers types.
     - Generates metadata and content files.
   - Stores processed files in a separate bucket.
   - Updates the database with processed file locations.
3. **Display Pipeline**:
   - Frontend fetches file details from the database using `/api/v1/files/retrieveAll`.
   - Processed files are rendered dynamically.
   - Users can view or download metadata and content files.

### **Notable Features**

1. **Dynamic File Handling**:
   - Works with various file structures.
   - Dynamically adjusts for irregular headers and mixed data types.
2. **Real-Time Updates**:
   - Frontend dynamically displays new uploads and processed results without refreshing.
3. **SQL-Ready Processing**:
   - Ensures processed files are ready for direct ingestion into a database.
4. **Scalable Design**:
   - Uses S3, Event Lifecycles, and Lambda for scalable storage and processing.
   - Supports high concurrency for uploads and processing.

### **Improvements & Future Enhancements**

1. **File Validation**:
   - Add checks during upload to validate file structure before S3 storage.
2. **File Types**:
   - Allow multiple file types - python code can process CSV’s but issues occur in the front end allowing multiple types.
3. **Processing Status**:
   - Show the progress of file processing on the frontend.
4. **Detailed Logs**:
   - Provide users with logs of processing steps and errors.
5. **User Notifications**:
   - Send email or in-app notifications when processing completes.
   - Right now we poll for processed files, adding overhead and possible errors when attempting to grab an incomplete file.

---

### Things to note:

- There’s a 512MB limit on the size of files that Lambda is processing. Theoretically, we are able to increase this for processing larger files that get stored in S3. However, the proof of concept was created testing small files.
- We only allow xlxs files at this moment.
- The ingestion functionality was built with Python and Pandas in Lambda functions. You can find the life code in [/lambda/file_ingestion_lambda_code.py](https://github.com/mario-oliver/keye-app/blob/main/lambda/file_ingestion_lambda_code.py)

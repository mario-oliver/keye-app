CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- Foreign key for associated user or entity
    file_name VARCHAR(255) NOT NULL, -- Original file name
    s3_bucket VARCHAR(255) NOT NULL, -- Bucket name
    s3_key VARCHAR(255) NOT NULL, -- Key in the S3 bucket
    s3_url VARCHAR(2048) NOT NULL, -- Full URL to the file
    content_type VARCHAR(255), -- MIME type of the file
    uploaded_at TIMESTAMP DEFAULT NOW() -- Upload timestamp
);

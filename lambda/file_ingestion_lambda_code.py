import boto3
import pandas as pd
import json

from io import BytesIO
from datetime import datetime

s3 = boto3.client("s3")

def lambda_handler(event, context):
    # Get bucket and key from S3 event
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]
    print("Grabbed bucket/file details from event: " + bucket +" "+  key)
    
    # Download file from S3
    response = s3.get_object(Bucket=bucket, Key=key)
    # response = s3.get_object(Bucket="chatbook-2023", Key="Deal.xslx")
    file_content = response["Body"].read()
    print("Grabbed s3 file")

    # Process file based on type
    if key.endswith(".xlsx"):
        df = pd.read_excel(BytesIO(file_content), engine="openpyxl", header=None)
    elif key.endswith(".csv"):
        df = pd.read_csv(BytesIO(file_content))
    else:
        raise ValueError("Unsupported file type")
    
    print("Read excel into bytes")

    # Validate and clean data
    print("Validate and clean data for file")
    df = process_data(df)

    # Save cleaned data back to S3 or DB
    output_key = f"processed/{key.split('/')[-1].replace('.xlsx', '.csv')}"
    output_buffer = BytesIO()
    df.to_csv(output_buffer, index=False)
    s3.put_object(Bucket="keye-output-files", Key=output_key, Body=output_buffer.getvalue())

    # SAve inferred column types to metdata as parallel file
    column_types = df.dtypes.apply(lambda x: str(x)).to_dict()
    print(column_types)
    metadata_key = f"processed/{key.split('/')[-1].replace('.xlsx', '_metadata.json')}"
    metadata_content = json.dumps(column_types)
    s3.put_object(Bucket="keye-output-files", Key=metadata_key, Body=metadata_content)
    
    return {
        "statusCode": 200,
        "body": {
            "output_key": output_key,
            "metadata_key": metadata_key
            }
        }


def detect_and_set_headers(df):
    print("Initial DataFrame preview (first 10 rows):")
    print(df.head(10))

    # Drop empty rows/cols
    df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
    print("DataFrame after removing empty rows and columns:")
    print(df.head(10))

    # If there's no data after cleaning, just return
    if df.empty:
        raise ValueError("No data left after cleaning.")

    # Heuristic: The header row should be the first row
    # that is mostly strings and not numeric or dates.
    header_row_position = None
    for idx, row in df.head(10).iterrows():
        values = row.values
        # Count how many are non-empty strings
        string_count = sum(isinstance(v, str) and v.strip() != '' for v in values)
        # Count numeric/datetime
        numeric_or_date_count = sum(
            pd.api.types.is_numeric_dtype(type(v)) or isinstance(v, pd.Timestamp)
            for v in values
        )
        # Simple heuristic: at least half the columns should be non-empty strings and fewer numeric/dates
        if string_count >= len(values) / 2 and numeric_or_date_count < len(values) / 2:
            header_row_position = idx
            break

    if header_row_position is None:
        # No suitable header row found, default to the first row
        header_row_position = df.index[0]

    # Set the detected row as header
    headers = df.loc[header_row_position].values
    df.columns = headers
    # Drop all rows above the header
    df = df.loc[df.index > header_row_position].reset_index(drop=True)

    # Clean column names
    df.columns = [
        str(col).strip().lower().replace(" ", "_").replace("__", "_").replace("(", "").replace(")", "")
        for col in df.columns
    ]

    print("Cleaned DataFrame preview (first 10 rows):")
    print(df.head(10))
    return df

def detect_and_set_headers_with_scoring(df):
    """
    Detects and sets headers for a DataFrame with irregular headers.
    """
    print("Initial DataFrame preview (first 10 rows):")
    print(df.head(10))

    # Pre-cleaning: Drop completely empty rows and columns
    df = df.dropna(how="all", axis=0).dropna(how="all", axis=1)
    print("DataFrame after removing empty rows and columns:")
    print(df.head(10))

    # Define a function to score rows based on their header-like quality
    def score_header_row(row):
        valid_header_count = row.apply(lambda x: isinstance(x, str) and len(x.strip()) > 0).sum()
        invalid_header_count = row.apply(lambda x: pd.api.types.is_numeric_dtype(type(x)) or isinstance(x, pd.Timestamp)).sum()
        return valid_header_count - invalid_header_count  # Prioritize rows with more valid header-like values

    # Analyze the first few rows (e.g., 10) to determine the header
    potential_header_rows = df.iloc[:10]
    scores = potential_header_rows.apply(score_header_row, axis=1)
    print(f"Header row scores: {scores}")

    # Ensure the index aligns with the DataFrame
    header_row_position = scores.idxmax()  # Row with the highest score
    print(f"Detected header row (position in DataFrame): {header_row_position}")

    # Extract headers using the actual positional index
    headers = df.iloc[header_row_position].values
    print(f"Extracted headers: {headers}")
    df.columns = headers

    # Drop rows above the detected header row
    df = df.iloc[header_row_position + 1:].reset_index(drop=True)

    # Standardize column names
    df.columns = [
        str(col).strip().lower().replace(" ", "_").replace("__", "_").replace("(", "").replace(")", "")
        for col in df.columns
    ]

    print("Cleaned DataFrame preview (first 10 rows):")
    print(df.head(10))

    return df



def process_data(df):
    print("Cleaning data hello...")

    # Detect headers and set them
    df = detect_and_set_headers(df)

    # Check initial data types
    print("Initial Data Types:")
    print(df.dtypes)

    # Attempt to dynamically infer column types
    for col in df.columns:
        col_data = df[col]

        # If column is all empty or NaN, treat as string with nulls
        if col_data.dropna().empty:
            df[col] = col_data.astype("string")
            continue

        # Try numeric conversion
        numeric_col = pd.to_numeric(col_data, errors='coerce')
        if numeric_col.notna().sum() > 0 and numeric_col.notna().sum() >= col_data.notna().sum() * 0.5:
            # If at least half are valid numbers, assume numeric
            df[col] = numeric_col
            continue

        # Try datetime conversion
        datetime_col = pd.to_datetime(col_data, errors='coerce', format="%Y-%m-%d")
        if datetime_col.notna().sum() > 0 and datetime_col.notna().sum() >= col_data.notna().sum() * 0.5:
            # If at least half are valid dates, assume datetime
            df[col] = datetime_col
            continue

        # Fallback to string dtype (allows pd.NA for nulls)
        df[col] = col_data.astype("string")

    # Check final data types
    print("Final Data Types:")
    print(df.dtypes)

    return df
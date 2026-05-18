import os
import hashlib
import requests
import pdfplumber
import re
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from ../.env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found in environment variables.")

client = MongoClient(MONGO_URI)
db = client.get_default_database()

# Collections
sources_col = db.authority_sources
raw_blocks_col = db.mlas_raw_blocks
parsed_stages_col = db.mlas_parsed_stages
mlas_master_col = db.mlas_master
logs_col = db.authority_ingestion_logs

PDF_URL = "https://kla.kar.nic.in/assembly/member/16membersaddress_eng.pdf"
PDF_FILENAME = "mla_directory_ingest.pdf"

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as afile:
        buf = afile.read()
        hasher.update(buf)
    return hasher.hexdigest()

def extract_tables():
    print(f"Downloading PDF from {PDF_URL}...")
    response = requests.get(PDF_URL, verify=False)
    with open(PDF_FILENAME, 'wb') as f:
        f.write(response.content)

    file_hash = get_file_hash(PDF_FILENAME)
    
    # 1. Source Discovery & Hashing
    source_record = sources_col.find_one({"source_url": PDF_URL})
    if source_record and source_record.get("source_snapshot_hash") == file_hash:
        print("Source has not changed. (Cache check disabled for testing)")
        # return False, None
    
    print("New or updated source detected. Updating source hash...")
    sources_col.update_one(
        {"source_url": PDF_URL},
        {"$set": {
            "source_domain": "kla.kar.nic.in",
            "source_type": "PDF",
            "authority_scope": "MLA",
            "source_snapshot_hash": file_hash,
            "last_seen": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    source_record = sources_col.find_one({"source_url": PDF_URL})
    source_id = source_record["_id"]

    parsed_rows = []
    
    print("Extracting tables using pdfplumber...")
    current_district = None
    with pdfplumber.open(PDF_FILENAME) as pdf:
        for i, page in enumerate(pdf.pages):
            # Skip first 8 pages (index and officers)
            if i < 8:
                continue
            
            table = page.extract_table()
            if not table:
                continue
                
            # 2. Extract -> Raw Block Staging
            raw_blocks_col.insert_one({
                "source_id": source_id,
                "raw_text": str(table),
                "page_number": i + 1,
                "extracted_at": datetime.now(timezone.utc)
            })

            for row in table:
                # 3. Parse -> Parsed Staging (identify structure)
                if not row or not any(row):
                    continue
                
                col0 = str(row[0]).strip() if row[0] else ""
                
                # Check for district header (e.g. "BELAGAVI DISTRICT")
                if "DISTRICT" in col0.upper() and (len(row) < 2 or not row[1]):
                    current_district = col0.replace(" DISTRICT", "").strip()
                    continue
                
                # Check if valid MLA row (col0 should be a number)
                if not col0.isdigit():
                    continue

                parsed_data = {
                    "sl_no": col0,
                    "raw_name": row[1] if len(row) > 1 else "",
                    "raw_constituency": row[2] if len(row) > 2 else "",
                    "raw_address": row[3] if len(row) > 3 else "",
                    "raw_party": row[4] if len(row) > 4 else "",
                    "raw_contact": row[5] if len(row) > 5 else "",
                    "district": current_district
                }
                
                parsed_stages_col.insert_one({
                    "source_id": source_id,
                    "parsed_data": parsed_data,
                    "parse_confidence": 0.9 if current_district else 0.5,
                    "parsed_at": datetime.now(timezone.utc)
                })
                
                parsed_rows.append((parsed_data, source_id))
                
    return True, parsed_rows

def normalize_and_upsert(parsed_rows):
    print("Normalizing and Upserting canonical records...")
    updated_count = 0
    failed_count = 0
    
    for row, source_id in parsed_rows:
        try:
            # Normalization Layer
            raw_name = str(row.get("raw_name", "")).replace("\n", " ").strip()
            
            # Constituency & Number (e.g., "Nippani (1)")
            raw_const = str(row.get("raw_constituency", "")).replace("\n", " ").strip()
            const_match = re.search(r"^(.*?)\s*\((\d+)\)$", raw_const)
            constituency_name = const_match.group(1).strip() if const_match else raw_const
            constituency_number = int(const_match.group(2)) if const_match else int(row.get("sl_no", 0))
            
            raw_party = str(row.get("raw_party", "")).replace("\n", "").strip()
            raw_address = str(row.get("raw_address", "")).strip()
            
            # Extract Phone and Email
            raw_contact = str(row.get("raw_contact", ""))
            phones = []
            landlines = []
            email = None
            
            for line in raw_contact.split("\n"):
                line = line.strip()
                if "@" in line:
                    email = line
                else:
                    # Look for digits
                    nums = re.findall(r"[\d\-\s/]+", line)
                    for n in nums:
                        clean_n = n.replace(" ", "").replace("/", "").strip()
                        if not clean_n: continue
                        if "-" in clean_n or clean_n.startswith("0"):
                            if clean_n not in landlines:
                                landlines.append(clean_n)
                        elif len(clean_n) >= 10:
                            if clean_n not in phones:
                                phones.append(clean_n)
            
            # Confidence Scoring
            confidence_score = 0.9
            if not email: confidence_score -= 0.1
            if not phones: confidence_score -= 0.2
            
            canonical_record = {
                "name": raw_name,
                "constituency": constituency_name,
                "constituency_number": constituency_number,
                "district": row.get("district", "Unknown").title(),
                "party": raw_party,
                "phone_numbers": phones,
                "landline_numbers": landlines,
                "email": email,
                "address": raw_address,
                "source_url": PDF_URL,
                "confidence_score": confidence_score,
                "verification_status": "Verified (Official PDF)",
                "last_verified_at": datetime.now(timezone.utc)
            }
            
            # Canonical Upsert
            mlas_master_col.update_one(
                {"constituency_number": constituency_number},
                {"$set": canonical_record},
                upsert=True
            )
            updated_count += 1
            
        except Exception as e:
            print(f"Failed to normalize row {row.get('sl_no')}: {e}")
            failed_count += 1
            
    # Logging
    logs_col.insert_one({
        "status": "Success" if failed_count == 0 else "Partial Success",
        "records_found": len(parsed_rows),
        "records_updated": updated_count,
        "records_failed": failed_count,
        "ingested_at": datetime.now(timezone.utc)
    })
    print(f"Ingestion complete. Updated: {updated_count}, Failed: {failed_count}")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings()
    
    proceed, rows = extract_tables()
    if proceed and rows:
        normalize_and_upsert(rows)

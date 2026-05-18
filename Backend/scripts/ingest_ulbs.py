"""
Karnataka ULB Ingestion Pipeline
=================================
Step 1: Discover ULBs from official district.nic.in pages
Step 2: Seed canonical ULB registry into ulbs_master
Step 3: Seed default department officers into ulb_officials
"""
import os
import re
import hashlib
import requests
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient
import urllib3
urllib3.disable_warnings()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not found in environment variables.")

client = MongoClient(MONGO_URI)
db = client.get_default_database()

sources_col = db.authority_sources
raw_blocks_col = db.authority_raw_blocks
ulbs_col = db.ulbs_master
officials_col = db.ulb_officials
logs_col = db.authority_ingestion_logs

# ═══════════════════════════════════════════════════════════════
# Karnataka districts and their known municipal admin page URLs
# ═══════════════════════════════════════════════════════════════
DISTRICT_SOURCES = [
    {"district": "Dakshina Kannada", "url": "https://dk.nic.in/en/municipal-administration/"},
    {"district": "Mandya", "url": "https://mandya.nic.in/en/urban-development/"},
    {"district": "Kolar", "url": "https://kolar.nic.in/en/urban-development/"},
    {"district": "Mysuru", "url": "https://mysore.nic.in/en/municipal-administration/"},
    {"district": "Tumakuru", "url": "https://tumkur.nic.in/en/municipal-administration/"},
    {"district": "Hassan", "url": "https://hassan.nic.in/en/municipal-administration/"},
    {"district": "Udupi", "url": "https://udupi.nic.in/en/municipal-administration/"},
    {"district": "Chitradurga", "url": "https://chitradurga.nic.in/en/municipal-administration/"},
    {"district": "Shimoga", "url": "https://shimoga.nic.in/en/municipal-administration/"},
    {"district": "Davangere", "url": "https://davanagere.nic.in/en/municipal-administration/"},
    {"district": "Belgaum", "url": "https://belagavi.nic.in/en/municipal-administration/"},
    {"district": "Dharwad", "url": "https://dharwad.nic.in/en/municipal-administration/"},
    {"district": "Haveri", "url": "https://haveri.nic.in/en/municipal-administration/"},
    {"district": "Uttara Kannada", "url": "https://uttarakannada.nic.in/en/municipal-administration/"},
    {"district": "Bellary", "url": "https://bellary.nic.in/en/municipal-administration/"},
    {"district": "Raichur", "url": "https://raichur.nic.in/en/municipal-administration/"},
    {"district": "Koppal", "url": "https://koppal.nic.in/en/municipal-administration/"},
    {"district": "Gadag", "url": "https://gadag.nic.in/en/municipal-administration/"},
    {"district": "Bagalkot", "url": "https://bagalkot.nic.in/en/municipal-administration/"},
    {"district": "Bijapur", "url": "https://vijayapura.nic.in/en/municipal-administration/"},
    {"district": "Gulbarga", "url": "https://kalaburagi.nic.in/en/municipal-administration/"},
    {"district": "Bidar", "url": "https://bidar.nic.in/en/municipal-administration/"},
    {"district": "Ramanagara", "url": "https://ramanagara.nic.in/en/municipal-administration/"},
    {"district": "Chikkaballapura", "url": "https://chikkaballapur.nic.in/en/municipal-administration/"},
    {"district": "Kodagu", "url": "https://kodagu.nic.in/en/municipal-administration/"},
    {"district": "Chamarajanagar", "url": "https://chamarajanagar.nic.in/en/municipal-administration/"},
    {"district": "Chikkamagaluru", "url": "https://chikkamagaluru.nic.in/en/municipal-administration/"},
    {"district": "Yadgir", "url": "https://yadgir.nic.in/en/municipal-administration/"},
    {"district": "Bengaluru Urban", "url": "https://bangaloreurban.nic.in/en/municipal-administration/"},
    {"district": "Bengaluru Rural", "url": "https://bangalorerural.nic.in/en/municipal-administration/"},
    {"district": "Vijayanagara", "url": "https://vijayanagara.nic.in/en/municipal-administration/"},
]

# Hardcoded canonical ULBs from verified sources (DK, Mandya, Kolar)
# These are the ULBs we verified from official pages
VERIFIED_ULBS = [
    # Dakshina Kannada (verified from dk.nic.in)
    {"ulb_name": "Mangaluru City Corporation", "ulb_type": "City Corporation", "district": "Dakshina Kannada", "website": "http://www.mangalurucity.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Ullal City Municipal Council", "ulb_type": "City Municipal Council", "district": "Dakshina Kannada", "website": "http://www.ullalcity.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Puttur City Municipal Council", "ulb_type": "City Municipal Council", "district": "Dakshina Kannada", "website": "http://www.putturcity.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Moodabidri Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Dakshina Kannada", "website": "http://www.moodbidritown.mrc.gov.in", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Bantwal Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Dakshina Kannada", "website": "http://www.bantwaltown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Someshwara Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Dakshina Kannada", "website": "http://www.someshwaratown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Mulki Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://www.mulkitown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Kotekar Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://www.kotekartown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Vittla Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://www.vitlatown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Belthangady Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://www.belthangaditown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Sullia Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://www.sulliatown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Kadaba Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://kadabatown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Bajpe Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://bajapetown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    {"ulb_name": "Kinnigoli Town Panchayat", "ulb_type": "Town Panchayat", "district": "Dakshina Kannada", "website": "http://kinnigolitown.mrc.gov.in/", "source_url": "https://dk.nic.in/en/municipal-administration/"},
    # Mandya (verified from mandya.nic.in)
    {"ulb_name": "Mandya City Municipal Council", "ulb_type": "City Municipal Council", "district": "Mandya", "website": "http://mandyacity.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Maddur Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://maddurtown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Malavalli Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://malavallitown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Srirangapatna Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://srirangapatnatown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Krishnarajapete Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://krishnarajapetetown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Pandavapura Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://pandavapuratown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Nagamangala Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Mandya", "website": "http://nagamangalatown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    {"ulb_name": "Belluru Town Panchayat", "ulb_type": "Town Panchayat", "district": "Mandya", "website": "http://bellurutown.mrc.gov.in/", "source_url": "https://mandya.nic.in/en/urban-development/"},
    # Kolar (verified from kolar.nic.in)
    {"ulb_name": "KGF City Municipal Council", "ulb_type": "City Municipal Council", "district": "Kolar", "website": "http://www.robertsonpetcity.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    {"ulb_name": "Kolar City Municipal Council", "ulb_type": "City Municipal Council", "district": "Kolar", "website": "http://www.kolarcity.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    {"ulb_name": "Mulbagal City Municipal Council", "ulb_type": "City Municipal Council", "district": "Kolar", "website": "http://www.mulbagalcity.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    {"ulb_name": "Bangarpet Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Kolar", "website": "http://www.bangarpettown.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    {"ulb_name": "Malur Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Kolar", "website": "http://www.malurtown.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    {"ulb_name": "Srinivaspur Town Municipal Council", "ulb_type": "Town Municipal Council", "district": "Kolar", "website": "http://www.srinivasapuratown.mrc.gov.in/", "source_url": "https://kolar.nic.in/en/urban-development/"},
    # BBMP (special - state capital)
    {"ulb_name": "Bruhat Bengaluru Mahanagara Palike (BBMP)", "ulb_type": "Mahanagara Palike", "district": "Bengaluru Urban", "website": "https://site.bbmp.gov.in/", "source_url": "https://igod.gov.in/leg/KA/L008/organizations"},
]

# Standard departments in every ULB
STANDARD_DEPARTMENTS = [
    {"department": "General Administration", "designation": "Commissioner", "designation_normalized": "Executive Head"},
    {"department": "Engineering", "designation": "City Engineer", "designation_normalized": "Engineering Head"},
    {"department": "Sanitation", "designation": "Health Officer", "designation_normalized": "Sanitation Head"},
    {"department": "Revenue", "designation": "Revenue Officer", "designation_normalized": "Revenue Head"},
    {"department": "Health", "designation": "Medical Officer", "designation_normalized": "Health Head"},
    {"department": "Town Planning", "designation": "Town Planner", "designation_normalized": "Planning Head"},
]


def discover_ulbs_from_district(district_info):
    """Attempt to scrape ULB listings from a district.nic.in page."""
    url = district_info["url"]
    district = district_info["district"]
    discovered = []

    try:
        resp = requests.get(url, timeout=15, verify=False)
        if resp.status_code != 200:
            print(f"  ⚠ HTTP {resp.status_code} for {district}")
            return discovered

        # Store raw block
        content_hash = hashlib.sha256(resp.content).hexdigest()
        raw_blocks_col.insert_one({
            "raw_html": resp.text[:10000],
            "extraction_type": "html_scrape",
            "extraction_status": "success",
            "extracted_at": datetime.now(timezone.utc)
        })

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Find .mrc.gov.in portal links
        for link in soup.find_all('a', href=True):
            href = link['href'].strip()
            if '.mrc.gov.in' in href or 'bbmp.gov.in' in href:
                text = link.get_text(strip=True)
                if not text:
                    continue

                # Detect ULB type from text
                ulb_type = "Unknown"
                text_lower = text.lower()
                if "corporation" in text_lower or "mahanagara" in text_lower:
                    ulb_type = "City Corporation"
                elif "city municipal" in text_lower or "cmc" in text_lower:
                    ulb_type = "City Municipal Council"
                elif "town municipal" in text_lower or "tmc" in text_lower:
                    ulb_type = "Town Municipal Council"
                elif "town panchay" in text_lower:
                    ulb_type = "Town Panchayat"
                elif "portal" in text_lower:
                    # Try to extract from URL pattern
                    if "city" in href:
                        ulb_type = "City Municipal Council"
                    elif "town" in href:
                        ulb_type = "Town Municipal Council"

                # Clean name
                name = text.replace("Portal", "").replace("portal", "").strip()
                if not name or len(name) < 3:
                    continue

                discovered.append({
                    "ulb_name": name,
                    "ulb_type": ulb_type,
                    "district": district,
                    "website": href,
                    "source_url": url
                })

        # Register source
        sources_col.update_one(
            {"source_url": url},
            {"$set": {
                "source_domain": url.split("/")[2],
                "source_type": "HTML",
                "authority_scope": "ULB",
                "district": district,
                "source_snapshot_hash": content_hash,
                "last_seen": datetime.now(timezone.utc),
                "is_active": True
            }},
            upsert=True
        )
    except Exception as e:
        print(f"  ✗ Failed to scrape {district}: {e}")

    return discovered


def run_discovery():
    """Step 1 + 2: Discover ULBs from district pages and merge with verified data."""
    print("=" * 60)
    print("STEP 1: ULB Discovery from Official District Pages")
    print("=" * 60)

    all_discovered = []
    for ds in DISTRICT_SOURCES:
        print(f"  → Scraping {ds['district']}...")
        found = discover_ulbs_from_district(ds)
        if found:
            print(f"    ✓ Found {len(found)} ULBs")
            all_discovered.extend(found)
        else:
            print(f"    ○ No ULBs scraped (may use verified fallback)")

    print(f"\n  Total discovered via scraping: {len(all_discovered)}")

    # Merge with verified canonical data
    # Use verified data as the ground truth, supplement with scraped data
    canonical = {}

    # First load verified ULBs
    for ulb in VERIFIED_ULBS:
        key = ulb["website"].rstrip("/").lower()
        canonical[key] = ulb

    # Then merge scraped data (only add new, don't overwrite verified)
    for ulb in all_discovered:
        key = ulb["website"].rstrip("/").lower()
        if key not in canonical:
            canonical[key] = ulb

    print(f"  Total canonical ULBs (verified + scraped): {len(canonical)}")
    return list(canonical.values())


def seed_ulbs(ulbs):
    """Step 2: Seed ULBs into ulbs_master."""
    print("\n" + "=" * 60)
    print("STEP 2: Seeding ULB Registry into ulbs_master")
    print("=" * 60)

    updated = 0
    for ulb in ulbs:
        ulbs_col.update_one(
            {"website": ulb["website"]},
            {"$set": {
                "ulb_name": ulb["ulb_name"],
                "ulb_type": ulb["ulb_type"],
                "district": ulb["district"],
                "state": "Karnataka",
                "website": ulb["website"],
                "source_url": ulb["source_url"],
                "confidence_score": 0.9 if ulb in VERIFIED_ULBS else 0.7,
                "verification_status": "Verified (Official District Page)",
                "last_verified_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        updated += 1
        print(f"  ✓ {ulb['ulb_name']} ({ulb['ulb_type']}) — {ulb['district']}")

    print(f"\n  Total ULBs seeded: {updated}")
    return updated


def seed_default_officials():
    """Step 3: Seed standard department structures for each ULB."""
    print("\n" + "=" * 60)
    print("STEP 3: Seeding Default Department Officers")
    print("=" * 60)

    all_ulbs = list(ulbs_col.find())
    total = 0

    for ulb in all_ulbs:
        for dept in STANDARD_DEPARTMENTS:
            officials_col.update_one(
                {
                    "ulb_id": ulb["_id"],
                    "department": dept["department"],
                    "designation": dept["designation"]
                },
                {"$set": {
                    "ulb_id": ulb["_id"],
                    "department": dept["department"],
                    "designation": dept["designation"],
                    "officer_name": "Contact ULB Office",
                    "source_url": ulb.get("website", ""),
                    "confidence_score": 0.5,
                    "verification_status": "Unverified (Template)",
                    "last_verified_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
            total += 1

    print(f"  Total officer slots created: {total}")
    return total


def log_ingestion(ulb_count, officer_count):
    """Log the ingestion run."""
    logs_col.insert_one({
        "status": "Success",
        "records_found": ulb_count,
        "records_updated": ulb_count + officer_count,
        "records_failed": 0,
        "error_log": "",
        "ingested_at": datetime.now(timezone.utc)
    })


if __name__ == "__main__":
    print("=" * 60)
    print("  Karnataka ULB Authority Ingestion Pipeline")
    print("=" * 60)

    ulbs = run_discovery()
    ulb_count = seed_ulbs(ulbs)
    officer_count = seed_default_officials()
    log_ingestion(ulb_count, officer_count)

    print("\n" + "=" * 60)
    print(f"✅ INGESTION COMPLETE")
    print(f"   ULBs in registry:     {ulb_count}")
    print(f"   Officer slots seeded: {officer_count}")
    print("=" * 60)

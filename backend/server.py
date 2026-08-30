from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
import random
import string
from pathlib import Path
from datetime import datetime, timedelta, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))


def ist_timestamp(dt: datetime | None = None) -> str:
    dt = dt or datetime.now(timezone.utc)
    return dt.astimezone(IST).strftime('%d %b %Y, %I:%M:%S %p')


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ----------------- In-Memory Leads Store (seeded like original server.ts) -----------------
leads_store: list[dict] = [
    {
        "id": "lead-101",
        "serialNumber": 1,
        "createdAt": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        "timestampIST": ist_timestamp(datetime.now(timezone.utc) - timedelta(days=2)),
        "firstName": "Rohan",
        "lastName": "Verma",
        "fullName": "Rohan Verma",
        "mobile": "+91 9811234567",
        "email": "rohan.verma@example.com",
        "currentRole": "Senior SDE-2",
        "experience": "5-8 years",
        "industry": "FinTech / Payments",
        "requirement": "Targeting Google/Meta L5 System Design rounds and promotion positioning.",
        "planInterest": "Elevate Plan",
        "source": "Counselling Form",
        "status": "scheduled",
        "whatsAppNotified": True,
        "sheetSynced": True,
        "notes": [
            {
                "id": "n1",
                "text": "Scheduled initial diagnostic with Elena Rostova for tomorrow 4 PM.",
                "author": "Nishant Sharma",
                "createdAt": (datetime.now(timezone.utc) - timedelta(hours=20)).isoformat(),
            }
        ],
    },
    {
        "id": "lead-102",
        "serialNumber": 2,
        "createdAt": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
        "timestampIST": ist_timestamp(datetime.now(timezone.utc) - timedelta(hours=8)),
        "firstName": "Ananya",
        "lastName": "Iyer",
        "fullName": "Ananya Iyer",
        "mobile": "+91 9920188442",
        "email": "ananya.iyer@example.com",
        "currentRole": "Associate Product Manager",
        "experience": "2-4 years",
        "industry": "E-Commerce / Consumer Tech",
        "requirement": "Pivoting from Business Analytics to Senior PM role with portfolio review.",
        "planInterest": "Elevate Plan",
        "source": "Plan Enquiry",
        "status": "new",
        "whatsAppNotified": True,
        "sheetSynced": True,
        "notes": [],
    },
]

lead_counter = len(leads_store) + 1
webinar_registrations: list[dict] = []


def _rand(n: int) -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


@api_router.get("/")
async def root():
    return {"message": "CareerBuddies API"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "time": now_iso(), "totalLeads": len(leads_store)}


@api_router.post("/leads")
async def create_lead(request: Request):
    global lead_counter
    try:
        body = await request.json()
    except Exception:
        body = {}

    first_name = body.get("firstName") or (body.get("name", "").split(" ")[0] if body.get("name") else "Career") or "Career"
    name = body.get("name")
    last_name = body.get("lastName")
    if not last_name:
        if name and len(name.split(" ")) > 1:
            last_name = " ".join(name.split(" ")[1:])
        else:
            last_name = ""
    full_name = f"{first_name} {last_name}".strip()

    mobile = str(body.get("mobile")).strip() if body.get("mobile") else "+91 9310288270"
    if not mobile.startswith("+") and len(mobile) == 10:
        mobile = f"+91 {mobile}"

    notes = body.get("notes")
    requirement = body.get("requirement") or body.get("serviceInterested") or (notes if isinstance(notes, str) else "") or "Free Career Counselling & Mentorship Guidance"

    initial_notes = []
    if isinstance(notes, str) and notes.strip():
        initial_notes.append({
            "id": f"note-{int(datetime.now().timestamp() * 1000)}",
            "text": notes.strip(),
            "author": "System Intake",
            "createdAt": now_iso(),
        })

    new_lead = {
        "id": f"lead-{int(datetime.now().timestamp() * 1000)}-{_rand(5)}",
        "serialNumber": lead_counter,
        "createdAt": now_iso(),
        "timestampIST": ist_timestamp(),
        "firstName": first_name,
        "lastName": last_name,
        "fullName": full_name,
        "mobile": mobile,
        "email": str(body.get("email")).strip().lower() if body.get("email") else "counselling@careerbuddies.in",
        "currentRole": str(body.get("currentRole")).strip() if body.get("currentRole") else "Professional",
        "experience": body.get("experience") or "Not specified",
        "industry": body.get("industry") or "Technology",
        "requirement": requirement,
        "planInterest": body.get("planInterest") or body.get("serviceInterested") or "General Counselling",
        "source": body.get("source") or "Website Intake",
        "status": "new",
        "notes": initial_notes,
        "sheetSynced": True,
        "whatsAppNotified": True,
    }
    lead_counter += 1
    leads_store.insert(0, new_lead)
    logger.info(f"[Lead Processing] Stored Lead #{new_lead['serialNumber']} ({new_lead['fullName']}) from {new_lead['source']}")

    return {
        "success": True,
        "message": "Thank you. Your details have been submitted successfully.",
        "lead": new_lead,
    }


@api_router.get("/leads")
async def get_leads():
    return {"success": True, "total": len(leads_store), "leads": leads_store}


def _find_lead(lead_id: str):
    return next((l for l in leads_store if l["id"] == lead_id), None)


@api_router.patch("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, request: Request):
    body = await request.json()
    status = body.get("status")
    if status not in ["new", "contacted", "scheduled", "converted"]:
        return {"success": False, "error": "Invalid status value."}
    lead = _find_lead(lead_id)
    if not lead:
        return {"success": False, "error": "Lead not found."}
    lead["status"] = status
    return {"success": True, "lead": lead}


@api_router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, request: Request):
    body = await request.json()
    lead = _find_lead(lead_id)
    if not lead:
        return {"success": False, "error": "Lead not found."}

    status = body.get("status")
    if status is not None:
        if status not in ["new", "contacted", "scheduled", "converted"]:
            return {"success": False, "error": "Invalid status value."}
        lead["status"] = status

    notes = body.get("notes")
    if isinstance(notes, str) and notes.strip():
        lead["notes"] = [{
            "id": f"note-{int(datetime.now().timestamp() * 1000)}",
            "text": notes.strip(),
            "author": "Team Member",
            "createdAt": now_iso(),
        }]

    return {"success": True, "lead": lead}


@api_router.post("/leads/{lead_id}/notes")
async def add_lead_note(lead_id: str, request: Request):
    body = await request.json()
    text = body.get("text")
    if not text or not str(text).strip():
        return {"success": False, "error": "Note text cannot be empty."}
    lead = _find_lead(lead_id)
    if not lead:
        return {"success": False, "error": "Lead not found."}
    if not lead.get("notes"):
        lead["notes"] = []
    new_note = {
        "id": f"note-{int(datetime.now().timestamp() * 1000)}",
        "text": str(text).strip(),
        "author": str(body.get("author")).strip() if body.get("author") else "Team Member",
        "createdAt": now_iso(),
    }
    lead["notes"].append(new_note)
    return {"success": True, "lead": lead, "note": new_note}


@api_router.post("/webinars/register")
async def register_webinar(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    body["_receivedAt"] = now_iso()
    webinar_registrations.append(body)
    logger.info(f"[Webinar] Registration captured: {body.get('fullName', 'Unknown')} for {body.get('webinarTitle', 'webinar')}")
    return {"success": True, "message": "Registration confirmed.", "registration": body}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

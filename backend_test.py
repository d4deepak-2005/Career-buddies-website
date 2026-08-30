#!/usr/bin/env python3
"""
Backend API Test Suite for CareerBuddies Lead Capture System
Tests all endpoints as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, Any

# Read backend URL from frontend/.env
BACKEND_URL = "https://buddy-deploy-preview.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(test_name: str):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST: {test_name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")

def print_pass(message: str):
    print(f"{Colors.GREEN}✓ PASS: {message}{Colors.RESET}")

def print_fail(message: str):
    print(f"{Colors.RED}✗ FAIL: {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ INFO: {message}{Colors.RESET}")

test_results = []

def test_health_endpoint():
    """Test 1: GET /api/health"""
    print_test("1. GET /api/health - Health check with totalLeads")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("Health endpoint", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        
        # Check required fields
        if "status" not in data:
            print_fail("Missing 'status' field")
            test_results.append(("Health endpoint", False, "Missing status field"))
            return False
        
        if data["status"] != "ok":
            print_fail(f"Expected status='ok', got '{data['status']}'")
            test_results.append(("Health endpoint", False, f"Status is {data['status']}"))
            return False
        
        if "totalLeads" not in data:
            print_fail("Missing 'totalLeads' field")
            test_results.append(("Health endpoint", False, "Missing totalLeads field"))
            return False
        
        if data["totalLeads"] < 2:
            print_fail(f"Expected totalLeads >= 2, got {data['totalLeads']}")
            test_results.append(("Health endpoint", False, f"totalLeads is {data['totalLeads']}"))
            return False
        
        if "time" not in data:
            print_fail("Missing 'time' field")
            test_results.append(("Health endpoint", False, "Missing time field"))
            return False
        
        print_pass(f"Health check passed: status=ok, totalLeads={data['totalLeads']}, time present")
        test_results.append(("Health endpoint", True, "All checks passed"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("Health endpoint", False, str(e)))
        return False

def test_get_leads():
    """Test 2: GET /api/leads - Fetch all leads"""
    print_test("2. GET /api/leads - Fetch all leads with seeded data")
    
    try:
        response = requests.get(f"{BACKEND_URL}/leads", timeout=10)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("GET /api/leads", False, f"Status {response.status_code}"))
            return False, None
        
        data = response.json()
        print_info(f"Response keys: {list(data.keys())}")
        
        # Check structure
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("GET /api/leads", False, "success is not true"))
            return False, None
        
        if "total" not in data:
            print_fail("Missing 'total' field")
            test_results.append(("GET /api/leads", False, "Missing total field"))
            return False, None
        
        if "leads" not in data:
            print_fail("Missing 'leads' field")
            test_results.append(("GET /api/leads", False, "Missing leads field"))
            return False, None
        
        leads = data["leads"]
        total = data["total"]
        
        print_info(f"Total leads: {total}")
        print_info(f"Leads array length: {len(leads)}")
        
        if total < 2:
            print_fail(f"Expected at least 2 leads, got {total}")
            test_results.append(("GET /api/leads", False, f"Only {total} leads"))
            return False, None
        
        # Check for seeded leads
        lead_names = [f"{l.get('firstName', '')} {l.get('lastName', '')}".strip() for l in leads]
        print_info(f"Lead names: {lead_names}")
        
        has_rohan = any("Rohan" in name and "Verma" in name for name in lead_names)
        has_ananya = any("Ananya" in name and "Iyer" in name for name in lead_names)
        
        if not has_rohan:
            print_fail("Seeded lead 'Rohan Verma' not found")
            test_results.append(("GET /api/leads", False, "Missing Rohan Verma"))
            return False, None
        
        if not has_ananya:
            print_fail("Seeded lead 'Ananya Iyer' not found")
            test_results.append(("GET /api/leads", False, "Missing Ananya Iyer"))
            return False, None
        
        print_pass(f"GET /api/leads passed: success=true, total={total}, seeded leads present")
        test_results.append(("GET /api/leads", True, f"{total} leads including seeded data"))
        return True, leads
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("GET /api/leads", False, str(e)))
        return False, None

def test_create_lead_full():
    """Test 3: POST /api/leads with full data"""
    print_test("3. POST /api/leads - Create lead with full data")
    
    payload = {
        "firstName": "Test",
        "lastName": "Candidate",
        "mobile": "9876543210",
        "email": "Test@Example.com",
        "currentRole": "SDE",
        "source": "Counselling Form"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/leads", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("POST /api/leads (full)", False, f"Status {response.status_code}"))
            return False, None
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("POST /api/leads (full)", False, "success is not true"))
            return False, None
        
        if "lead" not in data:
            print_fail("Missing 'lead' field in response")
            test_results.append(("POST /api/leads (full)", False, "Missing lead field"))
            return False, None
        
        lead = data["lead"]
        
        # Check serialNumber
        if "serialNumber" not in lead:
            print_fail("Missing 'serialNumber' in lead")
            test_results.append(("POST /api/leads (full)", False, "Missing serialNumber"))
            return False, None
        
        print_info(f"Lead serialNumber: {lead['serialNumber']}")
        
        # Check mobile normalization
        if "mobile" not in lead:
            print_fail("Missing 'mobile' in lead")
            test_results.append(("POST /api/leads (full)", False, "Missing mobile"))
            return False, None
        
        expected_mobile = "+91 9876543210"
        if lead["mobile"] != expected_mobile:
            print_fail(f"Expected mobile '{expected_mobile}', got '{lead['mobile']}'")
            test_results.append(("POST /api/leads (full)", False, f"Mobile is {lead['mobile']}"))
            return False, None
        
        print_info(f"Mobile normalized correctly: {lead['mobile']}")
        
        # Check email lowercasing
        if "email" not in lead:
            print_fail("Missing 'email' in lead")
            test_results.append(("POST /api/leads (full)", False, "Missing email"))
            return False, None
        
        expected_email = "test@example.com"
        if lead["email"] != expected_email:
            print_fail(f"Expected email '{expected_email}', got '{lead['email']}'")
            test_results.append(("POST /api/leads (full)", False, f"Email is {lead['email']}"))
            return False, None
        
        print_info(f"Email lowercased correctly: {lead['email']}")
        
        print_pass("POST /api/leads (full) passed: lead created with serialNumber, mobile normalized, email lowercased")
        test_results.append(("POST /api/leads (full)", True, "All validations passed"))
        return True, lead
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("POST /api/leads (full)", False, str(e)))
        return False, None

def test_create_lead_single_name():
    """Test 4: POST /api/leads with single name"""
    print_test("4. POST /api/leads - Create lead with single 'name' field")
    
    payload = {
        "name": "Single Name"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/leads", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("POST /api/leads (name)", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("POST /api/leads (name)", False, "success is not true"))
            return False
        
        if "lead" not in data:
            print_fail("Missing 'lead' field in response")
            test_results.append(("POST /api/leads (name)", False, "Missing lead field"))
            return False
        
        lead = data["lead"]
        
        # Check firstName/lastName resolution
        if "firstName" not in lead or "lastName" not in lead:
            print_fail("Missing firstName or lastName in lead")
            test_results.append(("POST /api/leads (name)", False, "Missing firstName/lastName"))
            return False
        
        print_info(f"firstName: '{lead['firstName']}', lastName: '{lead['lastName']}'")
        
        if lead["firstName"] != "Single":
            print_fail(f"Expected firstName='Single', got '{lead['firstName']}'")
            test_results.append(("POST /api/leads (name)", False, f"firstName is {lead['firstName']}"))
            return False
        
        if lead["lastName"] != "Name":
            print_fail(f"Expected lastName='Name', got '{lead['lastName']}'")
            test_results.append(("POST /api/leads (name)", False, f"lastName is {lead['lastName']}"))
            return False
        
        print_pass("POST /api/leads (name) passed: firstName/lastName resolved correctly")
        test_results.append(("POST /api/leads (name)", True, "Name parsing works"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("POST /api/leads (name)", False, str(e)))
        return False

def test_update_lead_status(lead_id: str):
    """Test 5: PATCH /api/leads/{id}/status"""
    print_test("5. PATCH /api/leads/{id}/status - Update lead status")
    
    # Test valid status
    payload = {"status": "contacted"}
    
    try:
        response = requests.patch(f"{BACKEND_URL}/leads/{lead_id}/status", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("PATCH status (valid)", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("PATCH status (valid)", False, "success is not true"))
            return False
        
        if "lead" not in data:
            print_fail("Missing 'lead' field in response")
            test_results.append(("PATCH status (valid)", False, "Missing lead field"))
            return False
        
        lead = data["lead"]
        
        if lead.get("status") != "contacted":
            print_fail(f"Expected status='contacted', got '{lead.get('status')}'")
            test_results.append(("PATCH status (valid)", False, f"Status is {lead.get('status')}"))
            return False
        
        print_pass("PATCH status (valid) passed: status updated to 'contacted'")
        
        # Test invalid status
        print_info("\nTesting invalid status...")
        invalid_payload = {"status": "invalid_status"}
        response2 = requests.patch(f"{BACKEND_URL}/leads/{lead_id}/status", json=invalid_payload, timeout=10)
        data2 = response2.json()
        print_info(f"Invalid status response: {json.dumps(data2, indent=2)}")
        
        if data2.get("success") != False:
            print_fail("Expected success=false for invalid status")
            test_results.append(("PATCH status (invalid)", False, "Invalid status accepted"))
            return False
        
        print_pass("PATCH status (invalid) passed: invalid status rejected")
        test_results.append(("PATCH status", True, "Valid status updated, invalid rejected"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("PATCH status", False, str(e)))
        return False

def test_update_lead_notes(lead_id: str):
    """Test 6: PATCH /api/leads/{id} with notes"""
    print_test("6. PATCH /api/leads/{id} - Update lead notes")
    
    payload = {"notes": "Called candidate"}
    
    try:
        response = requests.patch(f"{BACKEND_URL}/leads/{lead_id}", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("PATCH notes", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("PATCH notes", False, "success is not true"))
            return False
        
        if "lead" not in data:
            print_fail("Missing 'lead' field in response")
            test_results.append(("PATCH notes", False, "Missing lead field"))
            return False
        
        lead = data["lead"]
        
        if "notes" not in lead or not isinstance(lead["notes"], list):
            print_fail("Missing or invalid 'notes' field in lead")
            test_results.append(("PATCH notes", False, "Missing/invalid notes"))
            return False
        
        # Check if notes were updated
        if len(lead["notes"]) == 0:
            print_fail("Notes array is empty")
            test_results.append(("PATCH notes", False, "Notes not added"))
            return False
        
        # Check if the note text matches
        note_texts = [n.get("text", "") for n in lead["notes"]]
        if "Called candidate" not in note_texts:
            print_fail(f"Expected note 'Called candidate' not found in {note_texts}")
            test_results.append(("PATCH notes", False, "Note text not found"))
            return False
        
        print_pass("PATCH notes passed: notes updated successfully")
        test_results.append(("PATCH notes", True, "Notes updated"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("PATCH notes", False, str(e)))
        return False

def test_add_lead_note(lead_id: str):
    """Test 7: POST /api/leads/{id}/notes"""
    print_test("7. POST /api/leads/{id}/notes - Add note to lead")
    
    payload = {
        "text": "Follow up",
        "author": "Nishant"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/leads/{lead_id}/notes", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("POST note", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("POST note", False, "success is not true"))
            return False
        
        if "note" not in data:
            print_fail("Missing 'note' field in response")
            test_results.append(("POST note", False, "Missing note field"))
            return False
        
        note = data["note"]
        
        if note.get("text") != "Follow up":
            print_fail(f"Expected note text 'Follow up', got '{note.get('text')}'")
            test_results.append(("POST note", False, f"Note text is {note.get('text')}"))
            return False
        
        if note.get("author") != "Nishant":
            print_fail(f"Expected author 'Nishant', got '{note.get('author')}'")
            test_results.append(("POST note", False, f"Author is {note.get('author')}"))
            return False
        
        print_pass("POST note passed: note added with correct text and author")
        test_results.append(("POST note", True, "Note appended"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("POST note", False, str(e)))
        return False

def test_webinar_registration():
    """Test 8: POST /api/webinars/register"""
    print_test("8. POST /api/webinars/register - Register for webinar")
    
    payload = {
        "webinarTitle": "Test",
        "fullName": "X",
        "email": "x@y.com"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/webinars/register", json=payload, timeout=10)
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Payload sent: {json.dumps(payload, indent=2)}")
        
        if response.status_code != 200:
            print_fail(f"Expected status 200, got {response.status_code}")
            test_results.append(("POST webinar", False, f"Status {response.status_code}"))
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        if not data.get("success"):
            print_fail("Expected success=true")
            test_results.append(("POST webinar", False, "success is not true"))
            return False
        
        print_pass("POST webinar passed: registration successful")
        test_results.append(("POST webinar", True, "Registration confirmed"))
        return True
        
    except Exception as e:
        print_fail(f"Exception: {str(e)}")
        test_results.append(("POST webinar", False, str(e)))
        return False

def print_summary():
    """Print test summary"""
    print(f"\n\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    passed = sum(1 for _, result, _ in test_results if result)
    failed = len(test_results) - passed
    
    for test_name, result, details in test_results:
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if result else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}: {details}")
    
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"Total: {len(test_results)} | {Colors.GREEN}Passed: {passed}{Colors.RESET} | {Colors.RED}Failed: {failed}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    return failed == 0

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}CareerBuddies Backend API Test Suite{Colors.RESET}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    # Test 1: Health check
    test_health_endpoint()
    
    # Test 2: Get leads
    success, leads = test_get_leads()
    
    # Test 3: Create lead with full data
    success, created_lead = test_create_lead_full()
    
    # Test 4: Create lead with single name
    test_create_lead_single_name()
    
    # Get a lead ID for update tests
    lead_id = None
    if leads and len(leads) > 0:
        lead_id = leads[0].get("id")
        print_info(f"\nUsing lead ID for update tests: {lead_id}")
    
    if lead_id:
        # Test 5: Update lead status
        test_update_lead_status(lead_id)
        
        # Test 6: Update lead notes
        test_update_lead_notes(lead_id)
        
        # Test 7: Add lead note
        test_add_lead_note(lead_id)
    else:
        print_fail("No lead ID available for update tests")
        test_results.append(("Update tests", False, "No lead ID"))
    
    # Test 8: Webinar registration
    test_webinar_registration()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()

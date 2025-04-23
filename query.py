#!/usr/bin/env python3
import json
import re
import requests
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQA
import os
from dotenv import load_dotenv

load_dotenv()

# 1) Fetch data from GitHub Pages
DATA_URL = "https://masonarditi.github.io/calgpt-2025/course_results.json"
resp = requests.get(DATA_URL)
resp.raise_for_status()
courses = [e["node"] for e in resp.json()]

# 2) Load FAISS index & QA chain
emb = OpenAIEmbeddings()
db = FAISS.load_local(
    "faiss_index",
    emb,
    allow_dangerous_deserialization=True
)
qa = RetrievalQA.from_chain_type(
    llm=OpenAI(temperature=0),
    chain_type="stuff",
    retriever=db.as_retriever()
)

# Get all unique department abbreviations
dept_abbreviations = set(course["abbreviation"] for course in courses)
print(f"Loaded {len(courses)} courses with {len(dept_abbreviations)} departments")

# 3) Numeric handlers
def most_open_seats():
    c = max(courses, key=lambda c: c["openSeats"])
    result = json.dumps({
        "text": f"{c['abbreviation']} {c['courseNumber']} – {c['openSeats']} open seats",
        "courses": [c]
    })
    print(f"[DEBUG] most_open_seats returning: {result[:100]}...")
    return result

def avg_enrolled(dept=None):
    subset = [c for c in courses if not dept or c["abbreviation"] == dept]
    vals = [c["enrolledPercentage"] for c in subset]
    avg = sum(vals)/len(vals)
    result = json.dumps({
        "text": f"Average enrolled% = {avg:.2%}",
        "courses": subset[:5] if subset else []  # Return up to 5 example courses
    })
    print(f"[DEBUG] avg_enrolled returning: {result[:100]}...")
    return result

# Function to find courses by department
def find_courses_by_dept(dept_name):
    dept_courses = [course for course in courses if course["abbreviation"] == dept_name and course["openSeats"] > 0][:3]
    print(f"[DEBUG] Found {len(dept_courses)} courses for department {dept_name}")
    return dept_courses

# Function to find course by ID
def find_course_by_id(course_id):
    for course in courses:
        if course["id"] == course_id:
            print(f"[DEBUG] Found course for ID {course_id}: {course['abbreviation']} {course['courseNumber']}")
            return course
    print(f"[DEBUG] No course found for ID {course_id}")
    return None

# Process answer for course IDs and department names
def process_answer(answer):
    print(f"[DEBUG] Processing answer: {answer[:50]}...")
    
    # First check for course IDs in the format Q291cnNlVHlwZToxMjM0
    course_id_pattern = r'Q291cnNlVHlwZTo[A-Za-z0-9+/=]+'
    course_ids = re.findall(course_id_pattern, answer)
    print(f"[DEBUG] Found {len(course_ids)} course IDs in answer")
    
    found_courses = []
    
    # Add courses found by IDs
    for course_id in course_ids:
        course = find_course_by_id(course_id)
        if course:
            found_courses.append(course)
    
    # If no courses found by IDs, try to find department names
    if not found_courses:
        print("[DEBUG] No courses found by IDs, checking department names")
        # Look for department abbreviations in the answer
        for dept in dept_abbreviations:
            # Use word boundary to match whole abbreviations
            if re.search(r'\b' + re.escape(dept) + r'\b', answer):
                print(f"[DEBUG] Found department in answer: {dept}")
                # Add some sample courses from this department
                dept_courses = find_courses_by_dept(dept)
                found_courses.extend(dept_courses)
    
    # Always return as JSON
    result = json.dumps({
        "text": answer,
        "courses": found_courses
    })
    print(f"[DEBUG] process_answer returning {len(found_courses)} courses, JSON length: {len(result)}")
    return result

# 4) Simple router
def answer(q):
    print(f"[DEBUG] Processing question: {q}")
    q_low = q.lower()
    
    if re.search(r"\b(most|max)\b.*\bopen seats\b", q_low):
        print("[DEBUG] Matched pattern for most_open_seats")
        return most_open_seats()
    
    if re.search(r"\baverage\b.*\benrolled", q_low):
        print("[DEBUG] Matched pattern for avg_enrolled")
        m = re.search(r"(\w+)\s+courses", q_low)
        dept = m.group(1).upper() if m else None
        return avg_enrolled(dept)
    
    # Check if query is about open seats or available courses
    if re.search(r"\b(open|available|free|have)\b.*\b(seats|space|spots)\b", q_low) or \
       re.search(r"\bwhat\b.*\b(courses|classes)\b", q_low):
        print("[DEBUG] Matched pattern for courses/classes with open seats")
        # Get a generic answer from the QA system
        answer_text = qa.run(q)
        print(f"[DEBUG] QA returned: {answer_text[:50]}...")
        # Always process to JSON format
        return process_answer(answer_text)
    
    # Handle regular queries
    print("[DEBUG] No special patterns matched, using general QA")
    answer_text = qa.run(q)
    print(f"[DEBUG] QA returned: {answer_text[:50]}...")
    
    # Try to process, but if no courses are found, return the plain text
    processed = process_answer(answer_text)
    try:
        # If we processed but didn't find any courses, return the original text
        parsed = json.loads(processed)
        if not parsed.get("courses"):
            print("[DEBUG] No courses found after processing, returning plain text")
            return answer_text
    except Exception as e:
        print(f"[DEBUG] Error parsing processed answer: {e}")
    return processed

# 5) CLI entrypoint
if __name__ == "__main__":
    print(answer(input("Your question: ")))

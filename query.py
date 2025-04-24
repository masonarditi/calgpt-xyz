#!/usr/bin/env python3
import json
import re
import requests
import sys
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
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

# Creating a chat-aware QA system
llm = OpenAI(temperature=0)
qa = RetrievalQA.from_chain_type(
    llm=llm,
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

# Function to find courses by grade criteria
def find_courses_by_grade(min_grade, grade_format='letter', exact_match=False):
    print(f"[DEBUG] Finding courses with {'exact' if exact_match else 'minimum'} grade: {min_grade}, format: {grade_format}")
    
    grade_courses = []
    
    # Define grade thresholds and their numerical equivalents
    letter_to_number = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
    }
    
    # The reverse mapping for showing letter grades
    number_to_letter = {
        4.0: 'A', 3.7: 'A-',
        3.3: 'B+', 3.0: 'B', 2.7: 'B-',
        2.3: 'C+', 2.0: 'C', 1.7: 'C-',
        1.3: 'D+', 1.0: 'D', 0.7: 'D-',
        0.0: 'F'
    }
    
    # Convert letter grade to number if needed
    target_grade_value = 0
    if grade_format == 'letter':
        # Handle '+' and '-' variations
        min_grade = min_grade.upper().strip()
        if min_grade in letter_to_number:
            target_grade_value = letter_to_number[min_grade]
        elif len(min_grade) > 0 and min_grade[0] in letter_to_number:
            # If only the letter is given (e.g., "A" instead of "A-"), use the base value
            target_grade_value = letter_to_number[min_grade[0]]
    else:
        # Convert numeric string to float if needed
        try:
            target_grade_value = float(min_grade)
        except ValueError:
            print(f"[DEBUG] Could not convert {min_grade} to a number")
            return []
    
    print(f"[DEBUG] Target grade value: {target_grade_value}")
    
    # Filter courses by grade criteria
    for course in courses:
        # Skip courses without grade data or with null/None values
        if 'gradeAverage' not in course or course['gradeAverage'] is None or course['gradeAverage'] == -1:
            continue
            
        # Check if course meets the grade requirement (exact match or minimum)
        if exact_match:
            # For exact match, values should be equal
            if abs(course['gradeAverage'] - target_grade_value) < 0.05:  # Small tolerance for floating point
                grade_courses.append(course)
        else:
            # For "or better", course grade should be >= target
            if course['gradeAverage'] >= target_grade_value:
                grade_courses.append(course)
    
    # Sort courses by grade (highest first for "or better", closest to target for exact match)
    if exact_match:
        grade_courses.sort(key=lambda c: abs(c['gradeAverage'] - target_grade_value))
    else:
        grade_courses.sort(key=lambda c: c['gradeAverage'], reverse=True)
    
    print(f"[DEBUG] Found {len(grade_courses)} courses with grade {'=' if exact_match else '>='} {min_grade}")
    return grade_courses[:10]  # Limit to 10 courses

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
def process_answer(answer, question, requested_subject=None):
    print(f"[DEBUG] Processing answer: {answer[:50]}...")
    
    # If we have a specific requested subject, prioritize those courses
    if requested_subject:
        print(f"[DEBUG] Prioritizing courses from subject: {requested_subject}")
        subject_to_dept = {
            'math': ['MATH', 'STAT'],
            'computer science': ['COMPSCI', 'CS', 'DATA', 'INFO'],
            'engineering': ['ENGIN', 'EL ENG', 'MEC ENG', 'CIV ENG', 'BIO ENG', 'CHM ENG'],
            'physics': ['PHYSICS'],
            'chemistry': ['CHEM'],
            'classics': ['CLASSIC'],
            'biology': ['BIO', 'MCELLBI', 'INTEGBI'],
            'economics': ['ECON'],
            'history': ['HISTORY'],
            'english': ['ENGLISH'],
            'political science': ['POL SCI'],
        }
        
        if requested_subject in subject_to_dept:
            # Check if any courses from this subject are explicitly mentioned
            found_courses = []
            
            # First look for course codes in the answer text
            course_code_pattern = r'([A-Z]+)\s+(\d+[A-Za-z0-9]*)'
            course_codes = re.findall(course_code_pattern, answer)
            
            # Check if any mentioned courses match our subject departments
            target_depts = subject_to_dept[requested_subject]
            subject_courses_mentioned = False
            
            for dept, num in course_codes:
                if dept in target_depts:
                    subject_courses_mentioned = True
                    matching_courses = [c for c in courses 
                                      if c["abbreviation"] == dept and c["courseNumber"] == num]
                    for course in matching_courses:
                        if course not in found_courses:
                            found_courses.append(course)
            
            # If no courses from our subject were mentioned, get all open courses from that subject
            if not subject_courses_mentioned:
                for dept in target_depts:
                    dept_courses = find_courses_by_dept(dept)
                    for course in dept_courses:
                        if course not in found_courses:
                            found_courses.append(course)
            
            # If we found courses from the requested subject, return them
            if found_courses:
                result = json.dumps({
                    "text": answer,
                    "courses": found_courses[:5]  # Limit to 5 courses
                })
                print(f"[DEBUG] Returning {len(found_courses[:5])} courses based on requested subject")
                return result
    
    # Continue with regular course matching if no subject-specific courses were found
    # First look for course codes in the answer text (e.g., COMPSCI 70)
    course_code_pattern = r'([A-Z]+)\s+(\d+[A-Za-z0-9]*)'
    course_codes = re.findall(course_code_pattern, answer)
    print(f"[DEBUG] Found {len(course_codes)} course codes in answer")
    
    found_courses = []
    
    # Try to match courses by department and course number first
    for dept, num in course_codes:
        matching_courses = [c for c in courses 
                          if c["abbreviation"] == dept and c["courseNumber"] == num]
        if matching_courses:
            print(f"[DEBUG] Found exact match for {dept} {num}")
            # Add if not already in the list
            for course in matching_courses:
                if course not in found_courses:
                    found_courses.append(course)
    
    # If we found specific courses, return those
    if found_courses:
        print(f"[DEBUG] Found {len(found_courses)} exact course matches")
    else:
        # First check for course IDs in the format Q291cnNlVHlwZToxMjM0
        course_id_pattern = r'Q291cnNlVHlwZTo[A-Za-z0-9+/=]+'
        course_ids = re.findall(course_id_pattern, answer)
        print(f"[DEBUG] Found {len(course_ids)} course IDs in answer")
        
        # Add courses found by IDs
        for course_id in course_ids:
            course = find_course_by_id(course_id)
            if course and course not in found_courses:
                found_courses.append(course)
        
        # If no courses found by IDs or course codes, try to find department names
        if not found_courses:
            print("[DEBUG] No courses found by IDs, checking department names")
            
            # Extract subject areas from the answer (e.g., "math courses")
            subject_pattern = r'\b(math|computer science|engineering|physics|chemistry|biology|economics|history|english|political science|classics)\b.*\b(course|class)'
            subjects = re.findall(subject_pattern, answer.lower())
            
            # Map subjects to department abbreviations
            subject_to_dept = {
                'math': ['MATH', 'STAT'],
                'computer science': ['COMPSCI', 'CS', 'DATA', 'INFO'],
                'engineering': ['ENGIN', 'EL ENG', 'MEC ENG', 'CIV ENG', 'BIO ENG', 'CHM ENG'],
                'physics': ['PHYSICS'],
                'chemistry': ['CHEM'],
                'classics': ['CLASSIC'],
                'biology': ['BIO', 'MCELLBI', 'INTEGBI'],
                'economics': ['ECON'],
                'history': ['HISTORY'],
                'english': ['ENGLISH'],
                'political science': ['POL SCI'],
                # Add more mappings as needed
            }
            
            # Check for department names in the answer
            target_depts = []
            for subject, _ in subjects:
                if subject in subject_to_dept:
                    target_depts.extend(subject_to_dept[subject])
            
            # Special case for "math" - verify if we're really talking about math
            has_math_request = re.search(r'\b(math)\b', question.lower()) is not None
            if has_math_request and any(dept in answer for dept in ['MATH', 'STAT']):
                # If the query asks for math but math depts aren't in answer, check if any real math courses exist
                math_depts = ['MATH', 'STAT']
                available_math_courses = []
                for dept in math_depts:
                    available_math_courses.extend(find_courses_by_dept(dept))
                
                if available_math_courses:
                    print(f"[DEBUG] Found {len(available_math_courses)} math courses with open seats")
                    found_courses = available_math_courses[:5]  # Limit to 5 courses
                    return json.dumps({
                        "text": f"Available math courses with open seats: " + ", ".join([f"{c['abbreviation']} {c['courseNumber']}" for c in found_courses]),
                        "courses": found_courses
                    })
            
            # If we have target departments, prioritize them
            if target_depts:
                print(f"[DEBUG] Found subject areas: {target_depts}")
                for dept in target_depts:
                    dept_courses = find_courses_by_dept(dept)
                    for course in dept_courses:
                        if course not in found_courses:
                            found_courses.append(course)
                    # If we have enough courses, stop adding more
                    if len(found_courses) >= 5:
                        break
            else:
                # Look for department abbreviations in the answer
                for dept in dept_abbreviations:
                    # Use word boundary to match whole abbreviations
                    if re.search(r'\b' + re.escape(dept) + r'\b', answer):
                        print(f"[DEBUG] Found department in answer: {dept}")
                        # Add some sample courses from this department
                        dept_courses = find_courses_by_dept(dept)
                        for course in dept_courses:
                            if course not in found_courses:
                                found_courses.append(course)
        
        # If still no courses found, try to match by title
        if not found_courses:
            print("[DEBUG] Checking for course titles in the answer")
            # Look for course titles in the answer
            for course in courses:
                title = course["title"]
                # Only check titles with at least 5 characters to avoid too many false positives
                if len(title) >= 5 and title in answer:
                    print(f"[DEBUG] Found course by title: {course['abbreviation']} {course['courseNumber']} - {title}")
                    if course not in found_courses:
                        found_courses.append(course)
                    # Limit to 5 courses to avoid overwhelming the UI
                    if len(found_courses) >= 5:
                        break
            
            # If still no courses found, try a more flexible approach with quotes and course name patterns
            if not found_courses:
                # Look for text in quotes that might be course titles
                quoted_titles = re.findall(r'"([^"]+)"', answer)
                print(f"[DEBUG] Found {len(quoted_titles)} quoted potential course titles")
                
                for quoted_text in quoted_titles:
                    # Clean up the quoted text
                    clean_text = quoted_text.strip()
                    if len(clean_text) < 5:  # Skip very short titles
                        continue
                        
                    # Find the most similar course title
                    best_match = None
                    best_match_ratio = 0
                    
                    for course in courses:
                        title = course["title"]
                        # Simple substring match first
                        if clean_text in title or title in clean_text:
                            ratio = len(clean_text) / max(len(clean_text), len(title))
                            if ratio > best_match_ratio:
                                best_match = course
                                best_match_ratio = ratio
                    
                    # If we found a good match, add it
                    if best_match_ratio > 0.5:  # At least 50% similar
                        print(f"[DEBUG] Found course by quoted title: {best_match['abbreviation']} {best_match['courseNumber']} - {best_match['title']}")
                        if best_match not in found_courses:
                            found_courses.append(best_match)
                        if len(found_courses) >= 5:
                            break
    
    # Always return as JSON
    result = json.dumps({
        "text": answer,
        "courses": found_courses
    })
    print(f"[DEBUG] process_answer returning {len(found_courses)} courses, JSON length: {len(result)}")
    return result

# Function to build context from previous messages
def build_context_from_history(chat_history):
    if not chat_history or len(chat_history) == 0:
        return ""
    
    context = "Previous conversation:\n"
    for msg in chat_history:
        role = "User" if msg["role"] == "user" else "Assistant"
        context += f"{role}: {msg['content']}\n"
    
    return context

# Function to extract subject from question
def extract_subject_from_question(question):
    q_lower = question.lower()
    
    # Check for specific subject patterns
    subject_patterns = [
        (r'\b(math|mathematics)\b', 'math'),
        (r'\bcomp(uter)?\s*sci(ence)?\b', 'computer science'),
        (r'\bengin(eering)?\b', 'engineering'),
        (r'\bphysics\b', 'physics'),
        (r'\bchem(istry)?\b', 'chemistry'),
        (r'\bbio(logy)?\b', 'biology'),
        (r'\becon(omics)?\b', 'economics'),
        (r'\bhist(ory)?\b', 'history'),
        (r'\benglish\b', 'english'),
        (r'\bpol(itical)?\s*sci(ence)?\b', 'political science'),
        (r'\bclassic(s|al)?\b', 'classics')
    ]
    
    for pattern, subject in subject_patterns:
        if re.search(pattern, q_lower):
            print(f"[DEBUG] Detected subject area in question: {subject}")
            return subject
    
    return None

# 4) Simple router with chat history support
def answer_with_context(question, chat_history=None):
    print(f"[DEBUG] Processing question: {question}")
    if chat_history:
        print(f"[DEBUG] Chat history provided with {len(chat_history)} messages")
    
    # Extract subject from question to guide search
    requested_subject = extract_subject_from_question(question)
    print(f"[DEBUG] Requested subject: {requested_subject}")
    
    # Build context string from chat history
    context = build_context_from_history(chat_history)
    context_enhanced_question = question
    
    # Only add context if we have chat history
    if context:
        context_enhanced_question = f"{context}\nCurrent question: {question}\n\nAnswer the current question using the previous conversation for context."
        print(f"[DEBUG] Enhanced question with context: {context_enhanced_question[:100]}...")
    
    # Check for grade-related queries
    q_low = question.lower()
    
    # Check if the query is looking for exact grade matches
    is_exact_match = re.search(r'\b(exactly|precisely|equal\s+to|just)\b', q_low) is not None
    print(f"[DEBUG] Is exact match query: {is_exact_match}")
    
    # Improved grade patterns
    # First check for full pattern with grade and context
    grade_pattern = r'\b(?:classes|courses)\b.+?\b([abcdf][+\-]?)\b.+?\b(?:average|avg|grade)\b|\b(?:average|avg|grade)\b.+?\b([abcdf][+\-]?)\b|\b([abcdf][+\-]?)\b.+?\b(?:average|avg|grade)\b'
    
    # Check for patterns like "A average or higher" or "with an A average"
    grade_with_context_pattern = r'\b(?:with|has|having)\s+(?:an?|the)\s+([abcdf][+\-]?)\s+(?:average|avg|grade)'
    
    # Check for numeric patterns
    numeric_grade_pattern = r'\b(?:classes|courses)\b.+?\b(\d+\.?\d*)\b.+?\b(?:average|avg|grade)\b|\b(?:average|avg|grade)\b.+?\b(\d+\.?\d*)\b'
    
    grade_match = re.search(grade_pattern, q_low)
    grade_with_context_match = re.search(grade_with_context_pattern, q_low)
    numeric_match = re.search(numeric_grade_pattern, q_low)
    
    # Use the most appropriate pattern match
    letter_grade = None
    
    if grade_with_context_match:
        # This is the most reliable pattern for extracting grades with context
        letter_grade = grade_with_context_match.group(1).upper()
        print(f"[DEBUG] Found letter grade from context pattern: {letter_grade}")
    elif grade_match:
        # Extract letter grade from the standard match groups
        for group in grade_match.groups():
            if group and re.match(r'[abcdf][+\-]?', group.lower()):
                letter_grade = group.upper()
                print(f"[DEBUG] Found letter grade from standard pattern: {letter_grade}")
                break
    
    if letter_grade:
        print(f"[DEBUG] Final letter grade requirement: {letter_grade}")
        
        grade_courses = find_courses_by_grade(letter_grade, 'letter', exact_match=is_exact_match)
        
        if grade_courses:
            # Filter by subject if one was requested
            if requested_subject:
                subject_to_dept = {
                    'math': ['MATH', 'STAT'],
                    'computer science': ['COMPSCI', 'CS', 'DATA', 'INFO'],
                    'engineering': ['ENGIN', 'EL ENG', 'MEC ENG', 'CIV ENG', 'BIO ENG', 'CHM ENG'],
                    'physics': ['PHYSICS'],
                    'chemistry': ['CHEM'],
                    'classics': ['CLASSIC'],
                    'biology': ['BIO', 'MCELLBI', 'INTEGBI'],
                    'economics': ['ECON'],
                    'history': ['HISTORY'],
                    'english': ['ENGLISH'],
                    'political science': ['POL SCI'],
                }
                
                if requested_subject in subject_to_dept:
                    target_depts = subject_to_dept[requested_subject]
                    filtered_courses = [c for c in grade_courses if c["abbreviation"] in target_depts]
                    print(f"[DEBUG] Filtered from {len(grade_courses)} to {len(filtered_courses)} courses in {requested_subject}")
                    # Only use filtered courses if we found some, otherwise fall back to all courses
                    if filtered_courses:
                        grade_courses = filtered_courses
            
            # Limit the number of courses to return
            selected_courses = grade_courses[:5]
            
            if not selected_courses:
                if is_exact_match:
                    text_response = f"I couldn't find any courses with an average grade of exactly {letter_grade}."
                else:
                    text_response = f"I couldn't find any courses with an average grade of {letter_grade} or better."
            elif len(selected_courses) == 1:
                if is_exact_match:
                    text_response = f"I found one course with an average grade of exactly {letter_grade}: {selected_courses[0]['title']} ({selected_courses[0]['abbreviation']} {selected_courses[0]['courseNumber']}) with a grade average of {selected_courses[0]['letterAverage']} ({selected_courses[0]['gradeAverage']:.1f})."
                else:
                    text_response = f"I found one course with an average grade of {letter_grade} or better: {selected_courses[0]['title']} ({selected_courses[0]['abbreviation']} {selected_courses[0]['courseNumber']}) with a grade average of {selected_courses[0]['letterAverage']} ({selected_courses[0]['gradeAverage']:.1f})."
            else:
                grade_description = "exactly" if is_exact_match else "or better"
                course_descriptions = [f"{c['title']} ({c['abbreviation']} {c['courseNumber']}) with a grade average of {c['letterAverage']} ({c['gradeAverage']:.1f})" for c in selected_courses]
                text_response = f"Courses with an average grade of {letter_grade} {grade_description}: {', '.join(course_descriptions)}"
            
            result = json.dumps({
                "text": text_response,
                "courses": selected_courses
            })
            
            print(f"[DEBUG] Returning {len(selected_courses)} courses based on grade criteria")
            return result
        else:
            if is_exact_match:
                text_response = f"I couldn't find any courses with an average grade of exactly {letter_grade}."
            else:
                text_response = f"I couldn't find any courses with an average grade of {letter_grade} or better."
            return json.dumps({"text": text_response, "courses": []})
    
    elif numeric_match:
        # Extract numeric grade from the match groups
        for group in numeric_match.groups():
            if group and re.match(r'\d+\.?\d*', group):
                try:
                    min_grade = float(group)
                    print(f"[DEBUG] Found numeric grade requirement: {min_grade}")
                    
                    grade_courses = find_courses_by_grade(min_grade, 'numeric')
                    
                    if grade_courses:
                        # Apply subject filtering if requested
                        if requested_subject:
                            subject_to_dept = {
                                'math': ['MATH', 'STAT'],
                                'computer science': ['COMPSCI', 'CS', 'DATA', 'INFO'],
                                'engineering': ['ENGIN', 'EL ENG', 'MEC ENG', 'CIV ENG', 'BIO ENG', 'CHM ENG'],
                                'physics': ['PHYSICS'],
                                'chemistry': ['CHEM'],
                                'classics': ['CLASSIC'],
                                'biology': ['BIO', 'MCELLBI', 'INTEGBI'],
                                'economics': ['ECON'],
                                'history': ['HISTORY'],
                                'english': ['ENGLISH'],
                                'political science': ['POL SCI'],
                            }
                            
                            if requested_subject in subject_to_dept:
                                target_depts = subject_to_dept[requested_subject]
                                grade_courses = [c for c in grade_courses if c["abbreviation"] in target_depts]
                        
                        # Limit the number of courses to return
                        selected_courses = grade_courses[:5]
                        
                        if not selected_courses:
                            text_response = f"I couldn't find any courses with an average grade of {min_grade} or better."
                        elif len(selected_courses) == 1:
                            text_response = f"I found one course with an average grade of {min_grade} or better: {selected_courses[0]['title']} ({selected_courses[0]['abbreviation']} {selected_courses[0]['courseNumber']}) with a grade average of {selected_courses[0]['gradeAverage']:.1f}."
                        else:
                            course_descriptions = [f"{c['title']} ({c['abbreviation']} {c['courseNumber']}) with a grade average of {c['gradeAverage']:.1f}" for c in selected_courses]
                            text_response = f"Courses with an average grade of {min_grade} or better: {', '.join(course_descriptions)}"
                        
                        result = json.dumps({
                            "text": text_response,
                            "courses": selected_courses
                        })
                        
                        print(f"[DEBUG] Returning {len(selected_courses)} courses based on numeric grade criteria")
                        return result
                    else:
                        text_response = f"I couldn't find any courses with an average grade of {min_grade} or better."
                        return json.dumps({"text": text_response, "courses": []})
                except ValueError:
                    pass  # If we can't convert to a number, continue with normal processing
    
    # Check if query is about specific subject courses with open seats
    if requested_subject and re.search(r'\b(open|available|free|have)\b.*\b(seats|space|spots)\b', question.lower()):
        print(f"[DEBUG] Query is about {requested_subject} courses with open seats")
        subject_to_dept = {
            'math': ['MATH', 'STAT'],
            'computer science': ['COMPSCI', 'CS', 'DATA', 'INFO'],
            'engineering': ['ENGIN', 'EL ENG', 'MEC ENG', 'CIV ENG', 'BIO ENG', 'CHM ENG'],
            'physics': ['PHYSICS'],
            'chemistry': ['CHEM'],
            'classics': ['CLASSIC'],
            'biology': ['BIO', 'MCELLBI', 'INTEGBI'],
            'economics': ['ECON'],
            'history': ['HISTORY'],
            'english': ['ENGLISH'],
            'political science': ['POL SCI'],
        }
        
        if requested_subject in subject_to_dept:
            target_depts = subject_to_dept[requested_subject]
            available_courses = []
            
            for dept in target_depts:
                available_courses.extend(find_courses_by_dept(dept))
                
            if available_courses:
                print(f"[DEBUG] Found {len(available_courses)} courses in {requested_subject}")
                
                # Ensure we don't return too many courses
                selected_courses = available_courses[:5]
                
                # Create a nicely formatted text response
                if len(selected_courses) == 1:
                    text_response = f"The only {requested_subject} class with open seats is {selected_courses[0]['title']} ({selected_courses[0]['abbreviation']} {selected_courses[0]['courseNumber']}) with {selected_courses[0]['openSeats']} open seats."
                else:
                    course_descriptions = [f"{c['title']} ({c['abbreviation']} {c['courseNumber']}) with {c['openSeats']} open seats" for c in selected_courses]
                    text_response = f"Available {requested_subject} courses with open seats: {', '.join(course_descriptions)}"
                
                result = json.dumps({
                    "text": text_response,
                    "courses": selected_courses
                })
                
                print(f"[DEBUG] Returning {len(selected_courses)} courses based on subject")
                return result
            else:
                text_response = f"I couldn't find any {requested_subject} courses with open seats."
                print(f"[DEBUG] No available courses found for {requested_subject}")
                return json.dumps({"text": text_response, "courses": []})
    
    # Check for special patterns in the original question
    q_low = question.lower()
    
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
       re.search(r"\b(what|which|find|show|list|get|give|display)\b.*\b(courses|classes)\b", q_low) or \
       re.search(r"\b(courses|classes)\b.*\b(open|available|free|have)\b", q_low):
        print("[DEBUG] Matched pattern for courses/classes with open seats")
        # Get a generic answer from the QA system
        answer_text = qa.run(context_enhanced_question)
        print(f"[DEBUG] QA returned: {answer_text[:50]}...")
        # Always process to JSON format
        return process_answer(answer_text, question, requested_subject)
    
    # Handle regular queries
    print("[DEBUG] No special patterns matched, using general QA")
    answer_text = qa.run(context_enhanced_question)
    print(f"[DEBUG] QA returned: {answer_text[:50]}...")
    
    # Try to process, but if no courses are found, return the plain text
    processed = process_answer(answer_text, question, requested_subject)
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
    # Read input as JSON to get both question and chat history
    input_data = json.loads(sys.stdin.readline().strip())
    question = input_data.get("question", "")
    chat_history = input_data.get("chatHistory", [])
    
    print(answer_with_context(question, chat_history))

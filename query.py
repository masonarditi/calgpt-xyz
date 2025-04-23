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

# 3) Numeric handlers
def most_open_seats():
    c = max(courses, key=lambda c: c["openSeats"])
    return f"{c['abbreviation']} {c['courseNumber']} – {c['openSeats']} open seats"

def avg_enrolled(dept=None):
    subset = [c for c in courses if not dept or c["abbreviation"] == dept]
    vals = [c["enrolledPercentage"] for c in subset]
    return f"Average enrolled% = {sum(vals)/len(vals):.2%}"

# 4) Simple router
def answer(q):
    q_low = q.lower()
    if re.search(r"\b(most|max)\b.*\bopen seats\b", q_low):
        return most_open_seats()
    if re.search(r"\baverage\b.*\benrolled", q_low):
        m = re.search(r"(\w+)\s+courses", q_low)
        dept = m.group(1).upper() if m else None
        return avg_enrolled(dept)
    return qa.run(q)

# 5) CLI entrypoint
if __name__ == "__main__":
    print(answer(input("Your question: ")))

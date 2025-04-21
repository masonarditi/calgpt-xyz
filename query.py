#!/usr/bin/env python3
import json, re
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQA

# 1) Load data + QA chain
with open("course_results.json") as f:
    courses = [e["node"] for e in json.load(f)]

emb = OpenAIEmbeddings()
db = FAISS.load_local("faiss_index", emb, allow_dangerous_deserialization=True)
qa = RetrievalQA.from_chain_type(
    llm=OpenAI(temperature=0), chain_type="stuff", retriever=db.as_retriever()
)

# 2) Numeric handlers
def most_open_seats():
    c = max(courses, key=lambda c: c["openSeats"])
    return f"{c['abbreviation']} {c['courseNumber']} – {c['openSeats']} open seats"

def avg_enrolled(dept=None):
    subset = [c for c in courses if not dept or c["abbreviation"]==dept]
    vals = [c["enrolledPercentage"] for c in subset]
    return f"Average enrolled% = {sum(vals)/len(vals):.2%}"

# 3) Simple router
def answer(q):
    q_low = q.lower()
    if re.search(r"\b(most|max)\b.*\bopen seats\b", q_low):
        return most_open_seats()
    if re.search(r"\baverage\b.*\benrolled", q_low):
        m = re.search(r"(\w+)\s+courses", q_low)
        dept = m.group(1).upper() if m else None
        return avg_enrolled(dept)
    return qa.run(q)

# 4) CLI
if __name__=="__main__":
    print(answer(input("Your question: ")))

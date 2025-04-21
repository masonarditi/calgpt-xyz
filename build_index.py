#!/usr/bin/env python3
import json
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

def build_index():
    # 1. Load the raw JSON array of {"node": {...}} objects
    with open("course_results.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    # 2. Convert each node to a Document with string content
    docs = []
    for entry in raw:
        node = entry.get("node", entry)
        docs.append(
            Document(
                page_content=json.dumps(node, ensure_ascii=False),
                metadata={"id": node.get("id")}
            )
        )

    # 3. Split into text chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    # 4. Embed & build FAISS index
    embeddings = OpenAIEmbeddings()
    db = FAISS.from_documents(chunks, embeddings)

    # 5. Save index locally
    db.save_local("faiss_index")
    print(f"✅ Built index with {len(chunks)} chunks → saved to faiss_index/")

if __name__ == "__main__":
    build_index()

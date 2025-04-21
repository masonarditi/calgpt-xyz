#!/usr/bin/env python3
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQA

# load your local index (trusted)
embeddings = OpenAIEmbeddings()
db = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)

qa = RetrievalQA.from_chain_type(
    llm=OpenAI(temperature=0),
    chain_type="stuff",
    retriever=db.as_retriever()
)

print(qa.run(input("Your question: ")))

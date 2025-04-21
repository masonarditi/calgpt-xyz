#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

# load variables from .env in cwd
load_dotenv()

ENDPOINT = "https://berkeleytime.com/api/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "Cookie": os.getenv("BT_CSRFTOKEN")
}
PAYLOAD = {
    "operationName": "GetCoursesForFilter",
    "query": """
query GetCoursesForFilter($playlists: String!) {
  allCourses(inPlaylists: $playlists) {
    edges {
      node {
        id
        abbreviation
        courseNumber
        title
        openSeats
        enrolledPercentage
      }
    }
  }
}
""",
    "variables": { "playlists": "UGxheWxpc3RUeXBlOjMyNTY1" }
}

def fetch():
    resp = requests.post(ENDPOINT, headers=HEADERS, json=PAYLOAD)
    resp.raise_for_status()
    data = resp.json()["data"]["allCourses"]["edges"]
    print(data)  # replace with your storage logic

if __name__ == "__main__":
    fetch()

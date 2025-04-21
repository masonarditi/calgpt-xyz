#!/usr/bin/env python3
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()  # loads BT_CSRFTOKEN from .env

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
    "variables": {"playlists": "UGxheWxpc3RUeXBlOjMyNTY1"}
}

def fetch():
    resp = requests.post(ENDPOINT, headers=HEADERS, json=PAYLOAD)
    resp.raise_for_status()
    edges = resp.json()["data"]["allCourses"]["edges"]

    # persist to JSON file
    with open("course_results.json", "w") as f:
        json.dump(edges, f, indent=2)

    # print pretty JSON for logging
    print(json.dumps(edges, indent=2))

if __name__ == "__main__":
    fetch()

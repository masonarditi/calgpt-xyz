#!/usr/bin/env python3
import os, requests, sys

ENDPOINT = "https://berkeleytime.com/api/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "Cookie": os.getenv("BT_CSRFTOKEN")  # set this in your env
}
PAYLOAD = {
    "operationName": "GetCoursesForFilter",
    "query": """
query GetCoursesForFilter($playlists: String!) {
  allCourses(inPlaylists: $playlists) {
    edges { node { id abbreviation courseNumber title openSeats enrolledPercentage } }
  }
}
""",
    "variables": { "playlists": "UGxheWxpc3RUeXBlOjMyNTY1" }
}

def fetch():
    resp = requests.post(ENDPOINT, headers=HEADERS, json=PAYLOAD)
    resp.raise_for_status()
    data = resp.json()["data"]["allCourses"]["edges"]
    # replace next line with whatever you need (DB write, file dump…)
    print(data)

if __name__ == "__main__":
    fetch()

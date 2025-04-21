#!/usr/bin/env bash
cd /Users/user/Documents/GitHub/calgpt-2025
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
python fetch_courses.py >> fetch.log 2>&1

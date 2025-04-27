this is a next app to help make course scheduling easier at uc berkeley

built this in three days solo, if this is interesting to anyone email me (masonarditi@berkeley.edu) and we can chat or maybe make it for your school.

the website is live at www.calgpt.xyz

it is pretty glitchy right now with vague prompts, try to be specific when you ask questions. refer to the sample questions for ideas.

demo: https://tinyurl.com/calgpt-xyz

<img width="706" alt="Screenshot 2025-04-26 at 10 07 03 PM" src="https://github.com/user-attachments/assets/d9545e5c-6a42-4493-aba5-c6e65d43f169" />

if you wanna run this:
- clone repo
- setup .env with OPENAI_API_KEY
- set up a venv for your python file
- activate venv
- install requirements.txt
- cd frontend and install dependencies (npm install)
- npm run dev (while in frontend directory)
- cd ..
- run fetch_courses, should make a json file in your codebase (this is where the queries are referenced from)
- setup a github action or cron job to run fetch_courses as often as you'd like (i have a github action running hourly)
- should work from here. hmu if you need help. masonarditi@berkeley.edu

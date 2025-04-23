"use client"

import { useState } from "react"
import { motion } from "framer-motion"

export default function SemesterPicker() {
  const [semester, setSemester] = useState("Fall 2023")
  const semesters = ["Fall 2023", "Spring 2024", "Fall 2024"]
  
  return (
    <div className="relative">
      <select 
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-4 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
      >
        {semesters.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  )
} 
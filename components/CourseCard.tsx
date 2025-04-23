"use client"

import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type CourseData = {
  id: string
  abbreviation: string
  courseNumber: string
  title: string
  openSeats: number
  enrolledPercentage: number
}

export default function CourseCard({ course }: { course: CourseData }) {
  const enrolledPercent = (course.enrolledPercentage * 100).toFixed(1)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mb-1.5"
    >
      <Card className="overflow-hidden border-blue-100 shadow-sm">
        <div className="flex flex-row items-center">
          <div className="bg-blue-50 py-1.5 px-3 border-r border-blue-100 flex items-center justify-center min-w-24">
            <p className="text-sm font-semibold text-blue-800">{course.abbreviation} {course.courseNumber}</p>
          </div>
          
          <div className="px-3 py-1.5 flex-grow">
            <p className="text-xs text-blue-800 font-medium truncate max-w-[12rem]">{course.title}</p>
          </div>
          
          <div className="flex flex-row items-center gap-2 px-3 py-1.5 border-l border-blue-100 text-xs text-gray-600">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500">Seats</span>
              <span className="font-semibold">{course.openSeats}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500">Fill</span>
              <span className="font-semibold">{enrolledPercent}%</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
} 
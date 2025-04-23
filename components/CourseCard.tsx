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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mb-3"
    >
      <Card className="overflow-hidden border-blue-100">
        <CardHeader className="pb-2 bg-blue-50">
          <CardTitle className="text-lg text-blue-800">{course.abbreviation} {course.courseNumber}</CardTitle>
          <CardDescription className="text-blue-600 font-medium">{course.title}</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Open Seats</p>
              <p className="text-xl font-semibold">{course.openSeats}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Enrollment</p>
              <p className="text-xl font-semibold">{enrolledPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
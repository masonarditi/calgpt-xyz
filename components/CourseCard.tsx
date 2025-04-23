"use client"

import { motion } from "framer-motion"

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mb-1"
    >
      <div className="flex items-center gap-1.5 group">
        {/* Course code bubble */}
        <div className="bg-blue-100 text-blue-700 rounded-full py-1 px-2.5 text-xs font-semibold flex-shrink-0">
          {course.abbreviation} {course.courseNumber}
        </div>
        
        {/* Course title */}
        <div className="flex-grow">
          <p className="text-xs text-gray-800 font-medium truncate max-w-[14rem]">{course.title}</p>
        </div>
        
        {/* Course stats */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="bg-gray-100 text-gray-700 rounded-full py-0.5 px-2 flex items-center gap-0.5">
            <span className="text-[10px] text-gray-500 mr-0.5">Seats</span>
            <span className="font-semibold">{course.openSeats}</span>
          </div>
          <div className="bg-gray-100 text-gray-700 rounded-full py-0.5 px-2 flex items-center gap-0.5">
            <span className="text-[10px] text-gray-500 mr-0.5">Fill</span>
            <span className="font-semibold">{enrolledPercent}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
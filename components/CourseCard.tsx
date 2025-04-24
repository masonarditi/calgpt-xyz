"use client"

import { motion } from "framer-motion"

export type CourseData = {
  id: string
  abbreviation: string
  courseNumber: string
  title: string
  openSeats: number
  enrolledPercentage: number
  units?: string
  letterAverage?: string
  gradeAverage?: number
}

export default function CourseCard({ course }: { course: CourseData }) {
  const enrolledPercent = (course.enrolledPercentage * 100).toFixed(1)
  
  // Helper to determine grade difficulty color
  const getGradeColor = () => {
    if (!course.letterAverage && !course.gradeAverage) return '';
    
    // Use letter grade if available
    if (course.letterAverage) {
      const firstLetter = course.letterAverage.charAt(0);
      switch (firstLetter) {
        case 'A': return 'bg-green-100 text-green-700';
        case 'B': return 'bg-blue-100 text-blue-700';
        case 'C': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    }
    
    // Otherwise use numerical grade
    if (course.gradeAverage) {
      if (course.gradeAverage >= 3.7) return 'bg-green-100 text-green-700';
      if (course.gradeAverage >= 3.0) return 'bg-blue-100 text-blue-700';
      if (course.gradeAverage >= 2.0) return 'bg-yellow-100 text-yellow-700';
      return 'bg-red-100 text-red-700';
    }
    
    return '';
  };
  
  const gradeColorClass = getGradeColor();
  
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
          
          {/* Units and Grade info */}
          {(course.units || course.letterAverage || course.gradeAverage) && (
            <p className="text-[10px] text-gray-500 truncate max-w-[14rem]">
              {course.units && `${course.units} units`}
              {course.units && (course.letterAverage || course.gradeAverage) && ' • '}
              {(course.letterAverage || course.gradeAverage) && (
                <span className={`px-1 rounded ${gradeColorClass}`}>
                  {course.letterAverage || (course.gradeAverage ? course.gradeAverage.toFixed(2) : '')}
                </span>
              )}
            </p>
          )}
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
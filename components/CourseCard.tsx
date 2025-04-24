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
  // Helper to determine grade difficulty color
  const getGradeColor = () => {
    if (!course.letterAverage && !course.gradeAverage) return '';
    
    // Check for -1 values which mean N/A
    if ((course.letterAverage === '-1' || course.letterAverage === '-1.0') || 
        (course.gradeAverage && course.gradeAverage === -1)) {
      return 'bg-gray-100 text-gray-500';
    }
    
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
  
  // Function to format the grade display
  const getGradeDisplay = () => {
    // Check for -1 values which mean N/A
    if ((course.letterAverage === '-1' || course.letterAverage === '-1.0') || 
        (course.gradeAverage && course.gradeAverage === -1)) {
      return 'N/A';
    }
    
    return course.letterAverage || (course.gradeAverage ? course.gradeAverage.toFixed(1) : '');
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
      className="mb-3 hover:bg-white/50 rounded-xl p-2 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Course code */}
        <div className="bg-blue-100 text-blue-700 rounded-xl py-1 px-3 text-xs font-semibold flex-shrink-0">
          {course.abbreviation} {course.courseNumber}
        </div>
        
        {/* Course title */}
        <div className="flex-grow min-w-0 max-w-[50%]">
          <p className="text-xs text-gray-800 font-medium truncate">{course.title}</p>
        </div>
        
        {/* Course stats */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          {course.units && (
            <div className="bg-gray-100 text-gray-700 rounded-full py-1 px-2">
              <span className="font-medium">Units</span> {course.units}
            </div>
          )}
          
          <div className={`rounded-full py-1 px-2 ${gradeColorClass || 'bg-gray-100 text-gray-500'}`}>
            <span className="font-medium">Avg</span> {getGradeDisplay() || 'N/A'}
          </div>
          
          <div className="bg-gray-100 text-gray-700 rounded-full py-1 px-2">
            <span className="font-medium">Seats</span> {course.openSeats}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
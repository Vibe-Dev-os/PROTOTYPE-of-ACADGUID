"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getData } from "@/lib/data-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, FileText, GraduationCap, PlusCircle, Edit } from "lucide-react"

export default function InstructorDepartmentDetailPage() {
  const params = useParams()
  const departmentId = params.id as string

  const [department, setDepartment] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDepartmentData() {
      try {
        // Fetch department data
        const departmentsData = await getData("departments")
        const foundDepartment = departmentsData.find(
          (dept: any) => dept.id.toLowerCase() === departmentId.toLowerCase(),
        )

        if (foundDepartment) {
          setDepartment({
            ...foundDepartment,
            students: Math.floor(Math.random() * 100) + 50, // Mock data
            instructors: Math.floor(Math.random() * 10) + 5, // Mock data
          })
        }

        // Fetch related data
        const coursesData = await getData("courses")
        const departmentCourses = coursesData.filter(
          (course: any) => course.departmentId.toLowerCase() === departmentId.toLowerCase(),
        )
        setCourses(departmentCourses)

        const lessonsData = await getData("lessons")
        const departmentLessons = lessonsData.filter((lesson: any) =>
          departmentCourses.some((course: any) => course.id === lesson.courseId),
        )
        setLessons(departmentLessons)

        const eventsData = await getData("events")
        const departmentEvents = eventsData.filter(
          (event: any) => event.departmentId?.toLowerCase() === departmentId.toLowerCase(),
        )
        setEvents(departmentEvents)
      } catch (error) {
        console.error("Error fetching department data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartmentData()
  }, [departmentId])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">Department Not Found</h1>
        <p className="text-muted-foreground">The department you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/instructor/departments">Back to Departments</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{department.name}</h1>
            <Badge variant="outline">{department.code}</Badge>
          </div>
          <p className="text-muted-foreground">{department.description}</p>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Department
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Courses in this department</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.students}</div>
            <p className="text-xs text-muted-foreground">Enrolled in department courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.instructors}</div>
            <p className="text-xs text-muted-foreground">Teaching department courses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Department Courses</h2>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.length > 0 ? (
              courses.map((course) => (
                <Link href={`/dashboard/instructor/courses/${course.id}`} key={course.id}>
                  <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {lessons.filter((lesson) => lesson.courseId === course.id).length} Lessons
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <GraduationCap className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Courses Yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    This department doesn't have any courses yet. Add a course to get started.
                  </p>
                  <Button className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add First Course
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lessons">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Department Lessons</h2>
            <Button asChild>
              <Link href="/dashboard/instructor/lessons/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Lesson
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {lessons.length > 0 ? (
                <div className="divide-y">
                  {lessons.map((lesson) => {
                    const course = courses.find((c) => c.id === lesson.courseId)
                    return (
                      <Link href={`/dashboard/instructor/lessons/${lesson.id}`} key={lesson.id}>
                        <div className="flex items-start justify-between p-4 transition-colors hover:bg-accent">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <h3 className="font-medium">{lesson.title}</h3>
                            </div>
                            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{lesson.content}</p>
                          </div>
                          {course && (
                            <Badge variant="outline" className="ml-2">
                              {course.code}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Lessons Yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    There are no lessons for this department yet. Create a lesson to get started.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/instructor/lessons/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create First Lesson
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Department Events</h2>
            <Button asChild>
              <Link href="/dashboard/instructor/events/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {events.length > 0 ? (
                <div className="divide-y">
                  {events.map((event) => (
                    <Link href={`/dashboard/instructor/events/${event.id}`} key={event.id}>
                      <div className="flex items-start justify-between p-4 transition-colors hover:bg-accent">
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">{event.title}</h3>
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {new Date(event.date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Events Yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    There are no events for this department yet. Create an event to get started.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/instructor/events/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create First Event
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

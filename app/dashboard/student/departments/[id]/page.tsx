"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getData } from "@/lib/data-utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DepartmentPage({ params }: { params: { id: string } }) {
  const [department, setDepartment] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch department data
        const departmentsData = (await getData("departments")) as any[]
        const department = departmentsData.find((d) => d.id === params.id)
        setDepartment(department)

        // Fetch courses for this department
        const coursesData = (await getData("courses")) as any[]
        const departmentCourses = coursesData.filter((c) => c.departmentId === params.id)
        setCourses(departmentCourses)

        // Fetch events for this department
        const eventsData = (await getData("events")) as any[]
        const departmentEvents = eventsData.filter((e) => e.departmentId === params.id)
        setEvents(departmentEvents)
      } catch (error) {
        console.error("Error fetching department data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Department not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group courses by year and semester
  const coursesByYear = courses.reduce((acc: any, course) => {
    const year = course.year
    const semester = course.semester

    if (!acc[year]) {
      acc[year] = { 1: [], 2: [] }
    }

    acc[year][semester].push(course)
    return acc
  }, {})

  // Check if an event is upcoming
  const isUpcoming = (date: string) => {
    const eventDate = new Date(date)
    const today = new Date()
    return eventDate >= today
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/student/departments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Departments
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{department.name}</h1>
            <p className="text-muted-foreground">{department.code}</p>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">{department.description}</p>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="events">Department Events</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <div className="space-y-8">
            {Object.keys(coursesByYear).length > 0 ? (
              Object.keys(coursesByYear)
                .sort((a, b) => Number(a) - Number(b))
                .map((year) => (
                  <div key={year} className="space-y-4">
                    <h2 className="text-xl font-semibold">Year {year}</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-4 text-lg font-medium">1st Semester</h3>
                        <div className="space-y-4">
                          {coursesByYear[year][1].length > 0 ? (
                            coursesByYear[year][1].map((course: any) => (
                              <Card key={course.id}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{course.name}</CardTitle>
                                    <Badge variant="outline">{course.code}</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground">{course.description}</p>
                                  <div className="mt-4 flex justify-end">
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/student/courses/${course.id}`}>View Course</Link>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No courses for this semester</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-4 text-lg font-medium">2nd Semester</h3>
                        <div className="space-y-4">
                          {coursesByYear[year][2].length > 0 ? (
                            coursesByYear[year][2].map((course: any) => (
                              <Card key={course.id}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{course.name}</CardTitle>
                                    <Badge variant="outline">{course.code}</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground">{course.description}</p>
                                  <div className="mt-4 flex justify-end">
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/student/courses/${course.id}`}>View Course</Link>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No courses for this semester</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-muted-foreground">No courses available for this department</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="events">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? (
              events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => {
                  const upcoming = isUpcoming(event.date)

                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={upcoming ? "default" : "outline"}>
                            {upcoming ? "Upcoming" : "Past Event"}
                          </Badge>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        <CardTitle className="mt-2 text-lg">{event.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                        <Button asChild className="w-full">
                          <Link href={`/dashboard/student/events/${event.id}`}>View Details</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                No events available for this department
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getData } from "@/lib/data-utils"
import { Button } from "@/components/ui/button"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const departmentsData = (await getData("departments")) as any[]
        setDepartments(departmentsData)
      } catch (error) {
        console.error("Error fetching departments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Academic Departments</h1>
        <p className="text-muted-foreground">Browse all academic departments and their courses</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id} className="flex flex-col overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{department.code}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2 mt-1">{department.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-6">
              <p className="mb-4 text-sm text-muted-foreground">{department.description}</p>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button asChild className="w-full">
                <Link href={`/dashboard/student/departments/${department.id}`}>View Department</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

import {
  departments,
  generateSampleCourses,
  generateSampleEvents,
  generateSampleLessons,
  generateSampleQuizzes,
  generateSampleFlashcards,
} from "./sample-data"

// Initialize IndexedDB
export async function initializeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AcadGuideDB", 1)

    request.onerror = (event) => {
      console.error("IndexedDB error:", event)
      reject("Error opening database")
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores
      if (!db.objectStoreNames.contains("departments")) {
        db.createObjectStore("departments", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("courses")) {
        db.createObjectStore("courses", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("lessons")) {
        db.createObjectStore("lessons", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("flashcards")) {
        db.createObjectStore("flashcards", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("quizzes")) {
        db.createObjectStore("quizzes", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("notifications")) {
        db.createObjectStore("notifications", { keyPath: "id", autoIncrement: true })
      }

      if (!db.objectStoreNames.contains("updates")) {
        db.createObjectStore("updates", { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

// Store data in IndexedDB
export async function storeData(storeName: string, data: any[]) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    // Clear existing data
    const clearRequest = store.clear()

    clearRequest.onsuccess = () => {
      // Add new data
      data.forEach((item) => {
        store.add(item)
      })
    }

    transaction.oncomplete = () => {
      // Record update for real-time sync
      if (["lessons", "events", "flashcards", "quizzes"].includes(storeName)) {
        recordUpdate(storeName, "bulk", null)
      }
      resolve(true)
    }

    transaction.onerror = (event) => {
      console.error(`Error storing data in ${storeName}:`, event)
      reject(`Error storing data in ${storeName}`)
    }
  })
}

// Add a single item to a store
export async function addItem(storeName: string, item: any) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.add(item)

    request.onsuccess = () => {
      // Record update for real-time sync
      recordUpdate(storeName, "add", item)
      resolve(item)
    }

    request.onerror = (event) => {
      console.error(`Error adding item to ${storeName}:`, event)
      reject(`Error adding item to ${storeName}`)
    }
  })
}

// Update a single item in a store
export async function updateItem(storeName: string, item: any) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onsuccess = () => {
      // Record update for real-time sync
      recordUpdate(storeName, "update", item)
      resolve(item)
    }

    request.onerror = (event) => {
      console.error(`Error updating item in ${storeName}:`, event)
      reject(`Error updating item in ${storeName}`)
    }
  })
}

// Delete a single item from a store
export async function deleteItem(storeName: string, id: string) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => {
      // Record update for real-time sync
      recordUpdate(storeName, "delete", { id })
      resolve(true)
    }

    request.onerror = (event) => {
      console.error(`Error deleting item from ${storeName}:`, event)
      reject(`Error deleting item from ${storeName}`)
    }
  })
}

// Get data from IndexedDB
export async function getData(storeName: string) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = (event) => {
      console.error(`Error getting data from ${storeName}:`, event)
      reject(`Error getting data from ${storeName}`)
    }
  })
}

// Get a single item by ID
export async function getItemById(storeName: string, id: string) {
  const db = (await initializeDB()) as IDBDatabase
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = (event) => {
      console.error(`Error getting item from ${storeName}:`, event)
      reject(`Error getting item from ${storeName}`)
    }
  })
}

// Record an update for real-time sync
export async function recordUpdate(storeName: string, action: string, data: any) {
  try {
    const db = (await initializeDB()) as IDBDatabase
    const transaction = db.transaction("updates", "readwrite")
    const store = transaction.objectStore("updates")

    const update = {
      timestamp: new Date().toISOString(),
      storeName,
      action,
      data,
    }

    store.add(update)

    // Create a notification for certain updates
    if (
      (action === "add" || action === "update") &&
      ["lessons", "events", "flashcards", "quizzes"].includes(storeName)
    ) {
      createNotification(storeName, action, data)
    }

    // Dispatch an event for real-time updates
    if (typeof window !== "undefined") {
      const updateEvent = new CustomEvent("acadguide-update", { detail: update })
      window.dispatchEvent(updateEvent)
    }
  } catch (error) {
    console.error("Error recording update:", error)
  }
}

// Create a notification
export async function createNotification(storeName: string, action: string, data: any) {
  try {
    const db = (await initializeDB()) as IDBDatabase
    const transaction = db.transaction("notifications", "readwrite")
    const store = transaction.objectStore("notifications")

    let title = ""
    let message = ""

    if (action === "add") {
      if (storeName === "lessons") {
        title = "New Lesson Available"
        message = `A new lesson has been added to your ${data.courseId ? "course" : "courses"}.`
      } else if (storeName === "events") {
        title = "New Event Announced"
        message = `A new event "${data.title}" has been scheduled.`
      } else if (storeName === "flashcards") {
        title = "New Flashcard Set Available"
        message = `A new flashcard set has been added for your studies.`
      } else if (storeName === "quizzes") {
        title = "New Quiz Available"
        message = `A new quiz has been added to test your knowledge.`
      }
    } else if (action === "update") {
      if (storeName === "lessons") {
        title = "Lesson Updated"
        message = `A lesson in your courses has been updated with new content.`
      } else if (storeName === "events") {
        title = "Event Details Updated"
        message = `The details for event "${data.title}" have been updated.`
      } else if (storeName === "flashcards") {
        title = "Flashcard Set Updated"
        message = `A flashcard set has been updated with new content.`
      } else if (storeName === "quizzes") {
        title = "Quiz Updated"
        message = `A quiz has been updated with new questions or content.`
      }
    }

    const notification = {
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      relatedTo: {
        type: storeName,
        id: data?.id || "",
      },
    }

    store.add(notification)

    // Dispatch an event for real-time notification
    if (typeof window !== "undefined") {
      const notificationEvent = new CustomEvent("acadguide-notification", { detail: notification })
      window.dispatchEvent(notificationEvent)
    }
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

// Get all notifications
export async function getNotifications() {
  try {
    return (await getData("notifications")) as any[]
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

// Mark notification as read
export async function markNotificationAsRead(id: string) {
  try {
    const db = (await initializeDB()) as IDBDatabase
    const transaction = db.transaction("notifications", "readwrite")
    const store = transaction.objectStore("notifications")

    const request = store.get(id)

    request.onsuccess = () => {
      const notification = request.result
      if (notification) {
        notification.read = true
        store.put(notification)
      }
    }

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Initialize user data with sample data
export async function initializeUserData() {
  try {
    // Check if data is already initialized
    const isInitialized = localStorage.getItem("acadGuideInitialized")
    if (isInitialized === "true") {
      return
    }

    // Generate sample data
    const courses = generateSampleCourses()
    const events = generateSampleEvents()
    const lessons = generateSampleLessons(courses)
    const quizzes = generateSampleQuizzes(courses)
    const flashcards = generateSampleFlashcards()

    // Store data in IndexedDB
    await storeData("departments", departments)
    await storeData("courses", courses)
    await storeData("lessons", lessons)
    await storeData("events", events)
    await storeData("flashcards", flashcards)
    await storeData("quizzes", quizzes)

    // Generate sample bookmarks and store them in localStorage instead of IndexedDB
    generateSampleBookmarks(lessons, events, flashcards, quizzes)

    // Mark as initialized
    localStorage.setItem("acadGuideInitialized", "true")

    console.log("Sample data initialized successfully")
  } catch (error) {
    console.error("Error initializing sample data:", error)

    // Fallback to localStorage if IndexedDB fails
    try {
      localStorage.setItem("acadGuideDepartments", JSON.stringify(departments))
      localStorage.setItem("acadGuideCourses", JSON.stringify(generateSampleCourses()))
      localStorage.setItem("acadGuideLessons", JSON.stringify(generateSampleLessons(generateSampleCourses())))
      localStorage.setItem("acadGuideEvents", JSON.stringify(generateSampleEvents()))
      localStorage.setItem("acadGuideFlashcards", JSON.stringify(generateSampleFlashcards(generateSampleCourses())))
      localStorage.setItem("acadGuideQuizzes", JSON.stringify(generateSampleQuizzes(generateSampleCourses())))

      // Generate sample bookmarks
      generateSampleBookmarks(
        JSON.parse(localStorage.getItem("acadGuideLessons") || "[]"),
        JSON.parse(localStorage.getItem("acadGuideEvents") || "[]"),
        JSON.parse(localStorage.getItem("acadGuideFlashcards") || "[]"),
        JSON.parse(localStorage.getItem("acadGuideQuizzes") || "[]"),
      )

      localStorage.setItem("acadGuideInitialized", "true")

      console.log("Sample data initialized in localStorage as fallback")
    } catch (fallbackError) {
      console.error("Error initializing fallback data:", fallbackError)
    }
  }
}

// Get user from localStorage
export function getUser() {
  const userJson = localStorage.getItem("acadGuideUser")
  if (!userJson) return null

  try {
    return JSON.parse(userJson)
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

// Search functionality
export async function searchData(query: string) {
  if (!query) return []

  const lowerQuery = query.toLowerCase()

  try {
    // Get data from all stores
    const [departments, courses, lessons, events] = await Promise.all([
      getData("departments") as Promise<any[]>,
      getData("courses") as Promise<any[]>,
      getData("lessons") as Promise<any[]>,
      getData("events") as Promise<any[]>,
    ])

    // Search in departments
    const departmentResults = departments
      .filter((dept) => dept.name.toLowerCase().includes(lowerQuery) || dept.code.toLowerCase().includes(lowerQuery))
      .map((dept) => ({ ...dept, type: "department" }))

    // Search in courses
    const courseResults = courses
      .filter(
        (course) =>
          course.name.toLowerCase().includes(lowerQuery) ||
          course.code.toLowerCase().includes(lowerQuery) ||
          course.description?.toLowerCase().includes(lowerQuery),
      )
      .map((course) => ({ ...course, type: "course" }))

    // Search in lessons
    const lessonResults = lessons
      .filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(lowerQuery) || lesson.content.toLowerCase().includes(lowerQuery),
      )
      .map((lesson) => ({ ...lesson, type: "lesson" }))

    // Search in events
    const eventResults = events
      .filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) || event.description.toLowerCase().includes(lowerQuery),
      )
      .map((event) => ({ ...event, type: "event" }))

    // Combine and return results
    return [...departmentResults, ...courseResults, ...lessonResults, ...eventResults]
  } catch (error) {
    console.error("Error searching data:", error)
    return []
  }
}

// Get recent updates
export async function getRecentUpdates() {
  try {
    const db = (await initializeDB()) as IDBDatabase
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("updates", "readonly")
      const store = transaction.objectStore("updates")
      const request = store.getAll()

      request.onsuccess = () => {
        const updates = request.result as any[]
        const recentUpdates = updates
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
          .map((update) => {
            let title = ""
            let message = ""

            if (update.storeName === "lessons") {
              title = `New Lesson: ${update.data?.title || "Untitled"}`
              message = "A new lesson has been added."
            } else if (update.storeName === "events") {
              title = `New Event: ${update.data?.title || "Untitled"}`
              message = "A new event has been scheduled."
            } else if (update.storeName === "flashcards") {
              title = `New Flashcard Set: ${update.data?.title || "Untitled"}`
              message = "A new flashcard set has been created."
            } else if (update.storeName === "quizzes") {
              title = `New Quiz: ${update.data?.title || "Untitled"}`
              message = "A new quiz has been added."
            }

            return {
              id: update.id,
              title,
              message,
              timestamp: update.timestamp,
              type: "update",
            }
          })
        resolve(recentUpdates)
      }

      request.onerror = (event) => {
        console.error("Error getting recent updates:", event)
        reject("Error getting recent updates")
      }
    })
  } catch (error) {
    console.error("Error getting recent updates:", error)
    return []
  }
}

// Mark update as read
export async function markUpdateAsRead(id: string) {
  try {
    const db = (await initializeDB()) as IDBDatabase
    const transaction = db.transaction("updates", "readwrite")
    const store = transaction.objectStore("updates")

    const request = store.get(id)

    request.onsuccess = () => {
      const update = request.result
      if (update) {
        store.delete(id)
      }
    }

    return true
  } catch (error) {
    console.error("Error marking update as read:", error)
    return false
  }
}

// Subscribe to real-time updates
export function subscribeToUpdates(callback: (update: any) => void) {
  if (typeof window === "undefined") return () => {}

  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail)
  }

  window.addEventListener("acadguide-update", handleUpdate as EventListener)

  // Return unsubscribe function
  return () => {
    window.removeEventListener("acadguide-update", handleUpdate as EventListener)
  }
}

// Subscribe to notifications
export function subscribeToNotifications(callback: (notification: any) => void) {
  if (typeof window === "undefined") return () => {}

  const handleNotification = (event: CustomEvent) => {
    callback(event.detail)
  }

  window.addEventListener("acadguide-notification", handleNotification as EventListener)

  // Return unsubscribe function
  return () => {
    window.removeEventListener("acadguide-notification", handleNotification as EventListener)
  }
}

// Generate sample bookmarks
export function generateSampleBookmarks(
  lessons: any[] = [],
  events: any[] = [],
  flashcards: any[] = [],
  quizzes: any[] = [],
) {
  try {
    // Create sample bookmarks
    const bookmarks = [
      // Lesson bookmarks
      ...lessons.slice(0, 3).map((lesson) => ({
        id: lesson.id,
        type: "lesson",
        title: lesson.title,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      })),

      // Event bookmarks
      ...events.slice(0, 2).map((event) => ({
        id: event.id,
        type: "event",
        title: event.title,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      })),

      // Flashcard bookmarks
      ...flashcards.slice(0, 2).map((flashcard) => ({
        id: flashcard.id,
        type: "flashcard",
        title: flashcard.title,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      })),

      // Quiz bookmarks
      ...quizzes.slice(0, 2).map((quiz) => ({
        id: quiz.id,
        type: "quiz",
        title: quiz.title,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      })),
    ]

    // Store bookmarks in localStorage
    localStorage.setItem("acadGuide:bookmarks", JSON.stringify(bookmarks))

    return bookmarks
  } catch (error) {
    console.error("Error generating sample bookmarks:", error)
    return []
  }
}

// Get bookmarks
export function getBookmarks() {
  try {
    const bookmarksJson = localStorage.getItem("acadGuide:bookmarks")
    return bookmarksJson ? JSON.parse(bookmarksJson) : []
  } catch (error) {
    console.error("Error getting bookmarks:", error)
    return []
  }
}

// Add bookmark
export function addBookmark(id: string, type: string, title: string) {
  try {
    const bookmarks = getBookmarks()

    // Check if bookmark already exists
    const exists = bookmarks.some((b: any) => b.id === id && b.type === type)

    if (!exists) {
      bookmarks.push({
        id,
        type,
        title,
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem("acadGuide:bookmarks", JSON.stringify(bookmarks))
    }

    return true
  } catch (error) {
    console.error("Error adding bookmark:", error)
    return false
  }
}

// Remove bookmark
export function removeBookmark(id: string, type: string) {
  try {
    const bookmarks = getBookmarks()
    const updatedBookmarks = bookmarks.filter((b: any) => !(b.id === id && b.type === type))
    localStorage.setItem("acadGuide:bookmarks", JSON.stringify(updatedBookmarks))
    return true
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return false
  }
}

// Check if item is bookmarked
export function isBookmarked(id: string, type: string) {
  try {
    const bookmarks = getBookmarks()
    return bookmarks.some((b: any) => b.id === id && b.type === type)
  } catch (error) {
    console.error("Error checking bookmark:", error)
    return false
  }
}

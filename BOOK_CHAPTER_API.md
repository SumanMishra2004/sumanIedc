# Book Chapter API Integration Guide

## Overview
This guide covers how to use the Book Chapter API endpoints with the provided TypeScript API client.

## Installation
```bash
npm install axios
```

## Files Created

### 1. Type Definitions: `src/types/book-chapter.ts`
Contains all TypeScript interfaces for type safety

### 2. API Client: `src/lib/bookChapterApi.ts`
Axios-based API client with error handling

## API Functions

### 1. List Book Chapters
```typescript
import { getBookChapters } from '@/lib/bookChapterApi'

const response = await getBookChapters({
  page: 1,
  limit: 10,
  status: 'PUBLISHED',
  search: 'machine learning',
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

if (response.data) {
  const { bookChapters, pagination } = response.data
  console.log(`Found ${pagination.total} chapters`)
}
```

### 2. Get Single Chapter
```typescript
import { getBookChapterById } from '@/lib/bookChapterApi'

const response = await getBookChapterById('chapter-id')
if (response.data) {
  const chapter = response.data.bookChapter
}
```

### 3. Create Chapter
```typescript
import { createBookChapter } from '@/lib/bookChapterApi'

const response = await createBookChapter({
  title: 'My Research Chapter',
  abstract: 'Abstract text...',
  status: 'DRAFT',
  keywords: ['AI', 'Machine Learning'],
  studentAuthorIds: ['user1', 'user2'],
  facultyAuthorIds: ['user3']
})
```

### 4. Update Chapter
```typescript
import { updateBookChapter } from '@/lib/bookChapterApi'

const response = await updateBookChapter('chapter-id', {
  status: 'PUBLISHED',
  isPublic: true
})
```

### 5. Delete Chapter
```typescript
import { deleteBookChapter } from '@/lib/bookChapterApi'

const response = await deleteBookChapter('chapter-id')
```

### 6. Bulk Delete
```typescript
import { bulkDeleteBookChapters } from '@/lib/bookChapterApi'

const response = await bulkDeleteBookChapters([
  'id1', 'id2', 'id3'
])

if (response.data) {
  console.log(`Deleted ${response.data.count} chapters`)
}
```

### 7. Get Statistics
```typescript
import { getBookChapterStats } from '@/lib/bookChapterApi'

const response = await getBookChapterStats()
if (response.data) {
  const stats = response.data
  console.log(`Total: ${stats.total}`)
  console.log(`Public: ${stats.publicCount}`)
  console.log(`Total Fees: $${stats.financials.totalRegistrationFees}`)
}
```

### 8. Export to CSV
```typescript
import { exportBookChaptersToCSV } from '@/lib/bookChapterApi'

// This will automatically download the CSV file
await exportBookChaptersToCSV({
  status: 'PUBLISHED',
  createdFrom: '2024-01-01'
})
```

## Filters

Available filters for `getBookChapters()`:

```typescript
{
  // Pagination
  page?: number                    // Default: 1
  limit?: number                   // Default: 10
  
  // Sorting
  sortBy?: string                  // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'       // Default: 'desc'
  
  // Status filter
  status?: ResearchStatus          // DRAFT, SUBMITTED, PUBLISHED, etc.
  
  // Visibility
  isPublic?: boolean
  
  // Text search
  search?: string                  // Searches title, abstract, publisher, ISBN, DOI
  keyword?: string                 // Filter by keyword
  publisher?: string               // Filter by publisher
  
  // Date ranges
  createdFrom?: string             // ISO date string
  createdTo?: string
  publishedFrom?: string
  publishedTo?: string
  
  // Fee ranges
  minRegistrationFees?: number
  maxRegistrationFees?: number
  minReimbursement?: number
  maxReimbursement?: number
}
```

## React Component Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getBookChapters, deleteBookChapter } from '@/lib/bookChapterApi'
import { BookChapter } from '@/types/book-chapter'
import { toast } from 'sonner'

export default function BookChapterList() {
  const [chapters, setChapters] = useState<BookChapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchChapters = async () => {
    setIsLoading(true)
    const response = await getBookChapters({ page, limit: 10 })
    
    if (response.data) {
      setChapters(response.data.bookChapters)
      setTotalPages(response.data.pagination.totalPages)
    } else if (response.error) {
      toast.error('Failed to load chapters', {
        description: response.error
      })
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    fetchChapters()
  }, [page])

  const handleDelete = async (id: string) => {
    const response = await deleteBookChapter(id)
    
    if (response.data) {
      toast.success('Chapter deleted successfully')
      fetchChapters() // Refresh list
    } else if (response.error) {
      toast.error('Failed to delete', {
        description: response.error
      })
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {chapters.map(chapter => (
        <div key={chapter.id}>
          <h3>{chapter.title}</h3>
          <p>Status: {chapter.status}</p>
          <button onClick={() => handleDelete(chapter.id)}>
            Delete
          </button>
        </div>
      ))}
      
      <div>
        <button 
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

## Error Handling

All API functions return an `ApiResponse<T>` with either `data` or `error`:

```typescript
const response = await getBookChapters()

if (response.data) {
  // Success - use response.data
  console.log(response.data.bookChapters)
} else if (response.error) {
  // Error - show response.error message
  console.error(response.error)
}
```

## Access Control

- **Students & Guests**: Can only view public chapters
- **Faculty & Admin**: Can view all chapters, create, update, delete

The API automatically handles access control based on session.

## ResearchStatus Enum

```typescript
enum ResearchStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  REVISION
  APPROVED
  PUBLISHED
  REJECTED
}
```

## Convenience Functions

### Search
```typescript
import { searchBookChapters } from '@/lib/bookChapterApi'

const response = await searchBookChapters('machine learning', {
  page: 1,
  limit: 10
})
```

### Get Public Only
```typescript
import { getPublicBookChapters } from '@/lib/bookChapterApi'

const response = await getPublicBookChapters({ page: 1 })
```

### Get by Status
```typescript
import { getBookChaptersByStatus } from '@/lib/bookChapterApi'

const response = await getBookChaptersByStatus('PUBLISHED')
```

### Toggle Visibility
```typescript
import { toggleBookChapterVisibility } from '@/lib/bookChapterApi'

const response = await toggleBookChapterVisibility('chapter-id', true)
```

### Update Status
```typescript
import { updateBookChapterStatus } from '@/lib/bookChapterApi'

const response = await updateBookChapterStatus('chapter-id', 'PUBLISHED')
```

## Integration Example

Your book chapter dashboard at `src/app/dashboard/book-chapters/page.tsx` now:

1. ✅ Fetches real statistics from the API
2. ✅ Shows live data in pie chart (by status)
3. ✅ Displays total chapters, public/private counts
4. ✅ Shows financial summaries
5. ✅ Handles loading and error states
6. ✅ Uses toast notifications

The BookChaptersTable component can now be updated to use the same API functions for CRUD operations.

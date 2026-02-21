import { 
  GrantInStatus, 
  GrantInRole, 
  BillType, 
  BillStatus, 
  PublicationType 
} from "@prisma/client"

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
}

export interface GrantInTeacherAuthor {
  id: string
  grantInId: string
  userId: string
  role: GrantInRole
  user: User
}

export interface GrantInStudentAuthor {
  id: string
  grantInId: string
  userId: string
  user: User
}

export interface GrantInBill {
  id: string
  fileId: string
  fileUrl: string | null
  billType: BillType
  isMasterPdf: boolean
  billStatus: BillStatus
  billDate: Date
  amount: number | null
  userId: string
  grantInId: string
  user: User
  createdAt: Date
  updatedAt: Date
}

export interface GrantInMapping {
  id: string
  publicationType: PublicationType
  grantInId: string
  patentId: string | null
  journalId: string | null
  conferenceId: string | null
  bookChapterId: string | null
  copyrightId: string | null
  
  // Optional full objects if included
  patent?: any
  journal?: any
  conference?: any
  bookChapter?: any
  copyright?: any
  
  createdAt: Date
  updatedAt: Date
}

export interface GrantIn {
  id: string
  projectCode: string | null
  grantInStatus: GrantInStatus
  applicationDate: Date | null
  grantDate: Date | null
  durationOfProject: string | null
  amountGranted: number | null
  usedAmount: number | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date

  facultyAuthors: GrantInTeacherAuthor[]
  studentAuthors: GrantInStudentAuthor[]
  bills?: GrantInBill[]
  publicationMappings: GrantInMapping[]
}

// Request Data Types

export interface GrantInTeacherAuthorInput {
  teacherId: string;
  role: GrantInRole;
}

export interface GrantInStudentAuthorInput {
  studentId: string;
}

export interface GrantInPOSTRequestBodyData {
  projectCode?: string;
  applicationDate: string;
  grantDate?: string;
  durationOfProject?: string;
  amountGranted?: number;
  usedAmount?: number;
  isPublic?: boolean;

  facultyAuthors: GrantInTeacherAuthorInput[];
  studentAuthors: GrantInStudentAuthorInput[];
}

export interface GrantInPATCHTeacherAuthorInput {
  userId: string;
  role: GrantInRole;
}

export interface GrantInPATCHStudentAuthorInput {
  userId: string;
}

export interface GrantInPATCHRequestBodyData {
  projectCode?: string;
  grantInStatus?: GrantInStatus;
  applicationDate?: string;
  durationOfProject?: string;
  amountGranted?: number;
  usedAmount?: number;
  grantDate?: string;
  facultyAuthors?: GrantInPATCHTeacherAuthorInput[];
  studentAuthors?: GrantInPATCHStudentAuthorInput[];
}

export interface GrantInListResponse {
  grants: GrantIn[];
  // Pagination metadata is currently not returned by the API
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GrantInFilters {
  // Check backend GrantInGETQueryParams for reference
  projectCode?: string;
  facultyId?: string;
  studentId?: string;
  isPublic?: boolean;
  grantInStatus?: GrantInStatus;
  
  // Date Ranges
  applicationDateFrom?: string;
  applicationDateTo?: string;
  grantDateFrom?: string;
  grantDateTo?: string;
  
  // Duration
  projectDuration?: string;
  projectDurationFrom?: string;
  projectDurationTo?: string; // String comparison in backend

  // Amounts
  grantedAmountMin?: number;
  grantedAmountMax?: number;
  usedAmountMin?: number;
  usedAmountMax?: number;
}

export interface GrantStatsResponse {
  total: number
  publicCount: number
  privateCount: number
  grantStatusCounts: Array<{
    status: GrantInStatus
    count: number
  }>
  financials: {
    totalAmountGranted: number
    totalUsedAmount: number
    avgAmountGranted: number
    avgUsedAmount: number
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

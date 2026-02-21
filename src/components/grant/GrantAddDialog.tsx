"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { UserRole, GrantInRole } from "@prisma/client"
import { createGrantIn } from "@/lib/research/grant-in"
import { GrantInPOSTRequestBodyData } from "@/types/grant-in"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiSelectUsers } from "@/components/ui/multi-select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Separator } from "@/components/ui/separator"

interface GrantAddDialogProps {
  userRole: UserRole
}

type UserSelection = {
  id: string
  name: string
  email: string
  image?: string
}

export function GrantAddDialog({ userRole }: GrantAddDialogProps) {

  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Form State
  const [projectCode, setProjectCode] = React.useState("")
  const [applicationDate, setApplicationDate] = React.useState("")
  const [grantDate, setGrantDate] = React.useState("")
  const [duration, setDuration] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [used, setUsed] = React.useState("")
  const [isPublic, setIsPublic] = React.useState(false)

  // Authors State
  const [selectedFaculty, setSelectedFaculty] = React.useState<UserSelection[]>([])
  const [selectedStudents, setSelectedStudents] = React.useState<UserSelection[]>([])
  
  // Role Selection State
  const [step, setStep] = React.useState<'form' | 'pi-selection'>('form')
  const [piId, setPiId] = React.useState<string>("")
  const [hasCoPi, setHasCoPi] = React.useState(false) // Toggle for Co-PI section
  const [coPiIds, setCoPiIds] = React.useState<string[]>([])

  // Reset form on close
  React.useEffect(() => {
    if (!open) {
      setStep('form')
      setHasCoPi(false)
      setProjectCode("")
      setApplicationDate("")
      setGrantDate("")
      setDuration("")
      setAmount("")
      setUsed("")
      setIsPublic(false)
      setSelectedFaculty([])
      setPiId("")
      setCoPiIds([])
      setSelectedStudents([])
    }
  }, [open])

  const handleFacultyChange = (users: UserSelection[]) => {
    setSelectedFaculty(users)
    // Clear PI selection if the selected PI is removed
    if (piId && !users.find(u => u.id === piId)) {
      setPiId("")
    }
    // Remove removed users from coPiIds
    setCoPiIds(prev => prev.filter(id => users.find(u => u.id === id)))
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for Step 1
    if (!applicationDate) {
      toast.error("Application Date is required")
      return
    }

    if (selectedFaculty.length === 0) {
      toast.error("At least one faculty author is required")
      return
    }
    
    setStep('pi-selection')
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      if (!piId) {
        toast.error("You must assign a Principal Investigator (PI)")
        setLoading(false)
        return
      }

      // Construct Payload
      const payload: GrantInPOSTRequestBodyData = {
        projectCode: projectCode || undefined,
        applicationDate: new Date(applicationDate).toISOString(),
        grantDate: grantDate ? new Date(grantDate).toISOString() : undefined,
        durationOfProject: duration || undefined,
        amountGranted: amount ? parseFloat(amount) : undefined,
        usedAmount: used ? parseFloat(used) : undefined,
        isPublic,
        facultyAuthors: selectedFaculty.map(f => {
          let role: GrantInRole = GrantInRole.AUTHOR
          if (f.id === piId) role = GrantInRole.FACULTY_PI
          else if (coPiIds.includes(f.id)) role = GrantInRole.FACULTY_COPI
          
          return {
            teacherId: f.id,
            role
          }
        }),
        studentAuthors: selectedStudents.map(s => ({
          studentId: s.id
        }))
      }

      console.log("Grant Payload:", payload)

      const response = await createGrantIn(payload)

      if (response.error) {
        throw new Error(response.error)
      }

      toast.success("Grant created successfully!")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to create grant")
    } finally {
      setLoading(false)
    }
  }

  if (userRole === "STUDENT") return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Grant
        </Button>
      </DialogTrigger>
      {step === 'form' ? (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-gradient">
          <DialogHeader>
            <DialogTitle>Create New Grant-In-Aid Project</DialogTitle>
            <DialogDescription>
              Enter the details of the grant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNextStep} className="space-y-6 py-4">
            
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectCode">Project Code / Title</Label>
                <Input 
                  id="projectCode" 
                  placeholder="e.g. G-2024-XYZ" 
                  value={projectCode}
                  onChange={e => setProjectCode(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input 
                  id="duration" 
                  placeholder="e.g. 2 Years" 
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDate">Application Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="applicationDate" 
                  type="date" 
                  required
                  value={applicationDate}
                  onChange={e => setApplicationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grantDate">Grant Date (Optional)</Label>
                <Input 
                  id="grantDate" 
                  type="date" 
                  value={grantDate}
                  onChange={e => setGrantDate(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="amount">Amount Granted (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min="0"
                  step="1"
                  placeholder="0.00" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="used">Amount Used (₹)</Label>
                <Input 
                  id="used" 
                  type="number" 
                  min="0"
                  step="1"
                  placeholder="0.00" 
                  value={used}
                  onChange={e => setUsed(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPublic" 
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(!!checked)}
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Mark as Public (Visible to everyone)
              </Label>
            </div>

            <Separator />

            {/* Authors Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Faculty Team <span className="text-red-500">*</span></Label>
                <MultiSelectUsers 
                  isStudent={false}
                  value={selectedFaculty}
                  onChange={handleFacultyChange}
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Search and select faculty members involved in this grant.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Student Researchers (Optional)</Label>
                <MultiSelectUsers 
                  isStudent={true}
                  value={selectedStudents}
                  onChange={setSelectedStudents}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Next Step
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription>
              Assign a Principal Investigator (PI) and optional Co-Principal Investigators (Co-PI). Remaining members will be listed as authors.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Principal Investigator (PI) <span className="text-red-500">*</span></Label>
              <Select value={piId} onValueChange={(val) => {
                setPiId(val)
                setCoPiIds(prev => prev.filter(id => id !== val)) // Remove implementation if PI selected was previously Co-PI
              }}>
                <SelectTrigger className="h-auto py-2">
                  <SelectValue placeholder="Select a PI" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFaculty.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={faculty.image} alt={faculty.name} />
                          <AvatarFallback>{faculty.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{faculty.name}</span>
                          <span className="text-xs text-muted-foreground">{faculty.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFaculty.length > 1 && (
              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hasCoPi"
                        checked={hasCoPi}
                        onCheckedChange={(checked) => {
                            const isChecked = !!checked;
                            setHasCoPi(isChecked)
                            if (!isChecked) setCoPiIds([]) // Clear logic if disabled
                        }}
                    />
                    <Label htmlFor="hasCoPi" className="font-medium cursor-pointer">
                        Add Co-Principal Investigator (Optional)
                    </Label>
                </div>
                
                {hasCoPi && (
                  <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-muted-foreground mb-2">
                        Select Co-PI from the remaining team members:
                    </p>
                    <Select 
                      value={coPiIds[0] || ""} 
                      onValueChange={(val) => setCoPiIds([val])}
                    >
                      <SelectTrigger className="h-auto py-2">
                        <SelectValue placeholder="Select a Co-PI" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFaculty
                          .filter(f => f.id !== piId)
                          .map((faculty) => (
                            <SelectItem key={faculty.id} value={faculty.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={faculty.image} alt={faculty.name} />
                                  <AvatarFallback>{faculty.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{faculty.name}</span>
                                  <span className="text-xs text-muted-foreground">{faculty.email}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        {selectedFaculty.filter(f => f.id !== piId).length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                             No other faculty available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-muted/30 p-3 rounded text-sm text-muted-foreground border">
              <h4 className="font-medium mb-1">Team Summary</h4>
              <ul className="text-sm space-y-1">
                  <li>• <strong>Principal Investigator (PI):</strong> {piId ? selectedFaculty.find(f => f.id === piId)?.name : "Not selected"}</li>
                  <li>• <strong>Co-Principal Investigator(s):</strong> {coPiIds.length > 0 ? coPiIds.length : "None"}</li>
                  <li>• <strong>Project Members (Authors):</strong> {selectedFaculty.length - (piId ? 1 : 0) - coPiIds.length}</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" type="button" onClick={() => setStep('form')} disabled={loading}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !piId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Create Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}

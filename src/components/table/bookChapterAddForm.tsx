"use client"
import { Form, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useState } from "react"
import { createBookChapter } from "@/lib/bookChapterApi"
import { ResearchStatus } from "@prisma/client"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional(),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  status: z.nativeEnum(ResearchStatus),
  doi: z.string().optional(),
  isbnIssn: z.string().optional(),
  registrationFees: z.string().optional(),
  reimbursement: z.string().optional(),
  publisher: z.string().optional(),
  publicationDate: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  facultyAuthorIds: z.array(z.string()).optional(),
  studentAuthorIds: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

interface BookChapterAddFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookChapterAddForm({ onSuccess, onCancel }: BookChapterAddFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      abstract: "",
      imageUrl: "",
      documentUrl: "",
      status: ResearchStatus.DRAFT,
      doi: "",
      isbnIssn: "",
      registrationFees: "",
      reimbursement: "",
      publisher: "",
      publicationDate: "",
      keywords: [],
      facultyAuthorIds: [],
      studentAuthorIds: [],
      isPublic: false
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const data = {
        ...values,
        registrationFees: values.registrationFees ? parseFloat(values.registrationFees) : undefined,
        reimbursement: values.reimbursement ? parseFloat(values.reimbursement) : undefined,
      };

      const response = await createBookChapter(data);
      
      if (response.data) {
        toast.success("Book chapter created successfully!");
        form.reset();
        onSuccess?.();
      } else if (response.error) {
        toast.error("Failed to create book chapter", {
          description: response.error
        });
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        <Field>
          <FieldLabel htmlFor="title">Title*</FieldLabel>
          <Input 
            id="title" 
            placeholder="AI powered Book chapter"
            disabled={isSubmitting}
            {...form.register("title")}
          />
          <FieldError>{form.formState.errors.title?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="abstract">Abstract</FieldLabel>
          <Textarea 
            id="abstract" 
            placeholder="Please give your book chapter abstract"
            disabled={isSubmitting}
            {...form.register("abstract")}
          />
          <FieldDescription>You can give abstract of your book chapter. Min 50 Words Max 500 Words</FieldDescription>
          <FieldError>{form.formState.errors.abstract?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="imageUrl">Book chapter Image URL</FieldLabel>
          <Input 
            id="imageUrl" 
            placeholder="https://example.com/image.jpg"
            disabled={isSubmitting}
            {...form.register("imageUrl")}
          />
          <FieldError>{form.formState.errors.imageUrl?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="documentUrl">Book chapter Document URL</FieldLabel>
          <Input 
            id="documentUrl" 
            placeholder="https://example.com/document.pdf"
            disabled={isSubmitting}
            {...form.register("documentUrl")}
          />
          <FieldError>{form.formState.errors.documentUrl?.message}</FieldError>
        </Field>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <Field>
              <FieldLabel htmlFor="status">Status*</FieldLabel>
              <Select 
                disabled={isSubmitting}
                onValueChange={(value) => form.setValue("status", value as ResearchStatus)}
                defaultValue={form.getValues("status")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ResearchStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={ResearchStatus.SUBMITTED}>Submitted</SelectItem>
                  <SelectItem value={ResearchStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={ResearchStatus.REVISION}>Revision</SelectItem>
                  <SelectItem value={ResearchStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={ResearchStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={ResearchStatus.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>Add your book chapter status</FieldDescription>
              <FieldError>{form.formState.errors.status?.message}</FieldError>
            </Field>
          </div>
          
          <div className="col-span-6">
            <Field>
              <FieldLabel htmlFor="doi">DOI Link</FieldLabel>
              <Input 
                id="doi" 
                placeholder="10.1000/xyz123"
                disabled={isSubmitting}
                {...form.register("doi")}
              />
              <FieldDescription>Enter your DOI</FieldDescription>
              <FieldError>{form.formState.errors.doi?.message}</FieldError>
            </Field>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <Field>
              <FieldLabel htmlFor="isbnIssn">ISBN/ISSN Number</FieldLabel>
              <Input 
                id="isbnIssn" 
                placeholder="978-3-16-148410-0"
                disabled={isSubmitting}
                {...form.register("isbnIssn")}
              />
              <FieldDescription>Enter your ISBN/ISSN Number</FieldDescription>
              <FieldError>{form.formState.errors.isbnIssn?.message}</FieldError>
            </Field>
          </div>
          
          <div className="col-span-4">
            <Field>
              <FieldLabel htmlFor="registrationFees">Registration Fees</FieldLabel>
              <Input 
                id="registrationFees" 
                type="number"
                placeholder="10000"
                disabled={isSubmitting}
                {...form.register("registrationFees")}
              />
              <FieldError>{form.formState.errors.registrationFees?.message}</FieldError>
            </Field>
          </div>
          
          <div className="col-span-4">
            <Field>
              <FieldLabel htmlFor="reimbursement">Reimbursement Amount</FieldLabel>
              <Input 
                id="reimbursement" 
                type="number"
                placeholder="5000"
                disabled={isSubmitting}
                {...form.register("reimbursement")}
              />
              <FieldDescription>Enter the Reimbursement Amount that you got</FieldDescription>
              <FieldError>{form.formState.errors.reimbursement?.message}</FieldError>
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <Field>
              <FieldLabel htmlFor="publisher">Publisher</FieldLabel>
              <Input 
                id="publisher" 
                placeholder="Publisher name"
                disabled={isSubmitting}
                {...form.register("publisher")}
              />
              <FieldDescription>Enter the publisher name</FieldDescription>
              <FieldError>{form.formState.errors.publisher?.message}</FieldError>
            </Field>
          </div>
          
          <div className="col-span-6">
            <Field>
              <FieldLabel htmlFor="publicationDate">Publication Date</FieldLabel>
              <Input 
                id="publicationDate" 
                type="date"
                disabled={isSubmitting}
                {...form.register("publicationDate")}
              />
              <FieldDescription>Enter the publication date</FieldDescription>
              <FieldError>{form.formState.errors.publicationDate?.message}</FieldError>
            </Field>
          </div>
        </div>
        
        <Field className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FieldLabel htmlFor="isPublic" className="text-base">Public</FieldLabel>
            <FieldDescription>Make this book chapter visible to everyone</FieldDescription>
          </div>
          <Switch 
            id="isPublic"
            disabled={isSubmitting}
            checked={form.watch("isPublic")}
            onCheckedChange={(checked) => form.setValue("isPublic", checked)}
          />
          <FieldError>{form.formState.errors.isPublic?.message}</FieldError>
        </Field>

        <div className="flex gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Book Chapter"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
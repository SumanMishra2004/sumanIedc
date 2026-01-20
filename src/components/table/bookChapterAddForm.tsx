"use client"
import {
    Form,
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import {
  z
} from "zod"
import {
  toast
} from "sonner"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError
} from "@/components/ui/field"
import {
  Button
} from "@/components/ui/button"
import {
  Input
} from "@/components/ui/input"
import {
  Textarea
} from "@/components/ui/textarea"
import {
  Switch
} from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useState } from "react"

const formSchema = z.object({
  title_input: z.string().min(1),
  book_chapter: z.string(),
  book_chapter_image: z.string().optional(),
  document: z.string().optional(),
  status: z.string(),
  doi: z.string().min(1).optional(),
  Issn: z.string().min(1).optional(),
  registration: z.string().min(1).optional(),
  reimbursement: z.string().min(1).optional(),
  facultyAuthors: z.array(z.string()).min(1, {
    error: "Please select at least one item"
  }),
  students: z.array(z.string()).min(1, {
    error: "Please select at least one item"
  }),
  isPublic: z.boolean()
});

export default function MyForm() {

  const [files, setFiles] = useState < File[] | null > (null);

  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 4,
    multiple: true,
  };
  const form = useForm < z.infer < typeof formSchema >> ({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "facultyAuthors": ["React"],
      "students": ["React"]
    },
  })

  function onSubmit(values: z.infer < typeof formSchema > ) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        <Field>
  <FieldLabel htmlFor="title_input">Title </FieldLabel>
  <Input 
    id="title_input" 
    placeholder="AI powered Book chapter"
    
    {...form.register("title_input")}
  />
  
  <FieldError>{form.formState.errors.title_input?.message}</FieldError>
</Field>
        <Field>
  <FieldLabel htmlFor="book_chapter ">Abstract</FieldLabel>
  <Textarea 
    id="book_chapter " 
    placeholder="Please give your book chapter abstract"
    
    {...form.register("book_chapter")}
  />
  <FieldDescription>You can give abstract of your book chapter . Min 50 Words Max 100 Words</FieldDescription>
  <FieldError>{form.formState.errors.book_chapter?.message}</FieldError>
</Field>
        <Field>
  <FieldLabel htmlFor="book_chapter_image">Book chapter Image</FieldLabel>
  <Input 
    id="book_chapter_image" 
    placeholder="Placeholder"
    {...form.register("book_chapter_image")}
  />
  
  <FieldError>{form.formState.errors.book_chapter_image?.message}</FieldError>
</Field>
        <Field>
  <FieldLabel htmlFor="document ">Book chapter document</FieldLabel>
  <Input 
    id="document" 
    placeholder=""
    {...form.register("document")}
  />
  
  <FieldError>{form.formState.errors.document ?.message}</FieldError>
</Field>
        
        <div className="grid grid-cols-12 gap-4">
          
          <div className="col-span-6">
            <Field>
  <FieldLabel htmlFor="status">Status</FieldLabel>
  <Select 
    
    {...form.register("status")}
  >
    <SelectTrigger id="status">
      <SelectValue placeholder="Select an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option 1</SelectItem>
      <SelectItem value="option2">Option 2</SelectItem>
      <SelectItem value="option3">Option 3</SelectItem>
    </SelectContent>
  </Select>
  <FieldDescription>Add your book chapter status</FieldDescription>
  <FieldError>{form.formState.errors.status?.message}</FieldError>
</Field>
          </div>
          
          <div className="col-span-6">
            <Field>
  <FieldLabel htmlFor="doi">DoI Link</FieldLabel>
  <Input 
    id="doi" 
    placeholder=""
    
    {...form.register("doi")}
  />
  <FieldDescription>Enter your Doi</FieldDescription>
  <FieldError>{form.formState.errors.doi?.message}</FieldError>
</Field>
          </div>
          
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          
          <div className="col-span-4">
            <Field>
  <FieldLabel htmlFor="Issn">Bn/Issn Number</FieldLabel>
  <Input 
    id="Issn" 
    placeholder="ABCD-23545"
    
    {...form.register("Issn")}
  />
  <FieldDescription>Enter your Issn Number</FieldDescription>
  <FieldError>{form.formState.errors.Issn?.message}</FieldError>
</Field>
          </div>
          
          <div className="col-span-4">
            <Field>
  <FieldLabel htmlFor="registration">Registration Fees</FieldLabel>
  <Input 
    id="registration" 
    placeholder="10000"
    
    {...form.register("registration")}
  />
  
  <FieldError>{form.formState.errors.registration?.message}</FieldError>
</Field>
          </div>
          
          <div className="col-span-4">
            <Field>
  <FieldLabel htmlFor="reimbursement">Reimbursement Amount</FieldLabel>
  <Input 
    id="reimbursement" 
    placeholder="5000"
    
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
  <FieldLabel htmlFor="facultyAuthors">Faculty Authors</FieldLabel>
  <Input 
    id="facultyAuthors" 
    placeholder=""
    {...form.register("facultyAuthors")}
  />
  <FieldDescription>Select the Faculty Authors.</FieldDescription>
  <FieldError>{form.formState.errors.facultyAuthors?.message}</FieldError>
</Field>
          </div>
          
          <div className="col-span-6">
            <Field>
  <FieldLabel htmlFor="students">Student Contributors</FieldLabel>
  <Input 
    id="students" 
    placeholder=""
    {...form.register("students")}
  />
  <FieldDescription>Select the students.</FieldDescription>
  <FieldError>{form.formState.errors.students?.message}</FieldError>
</Field>
          </div>
          
        </div>
        <Field className="flex flex-row items-center justify-between rounded-lg border p-4">
  <div className="space-y-0.5">
    <FieldLabel htmlFor="isPublic" className="text-base">Public</FieldLabel>
    <FieldDescription>Select to make it Public or not.</FieldDescription>
  </div>
  <Switch 
    id="isPublic"
    
    {...form.register("isPublic")}
  />
  <FieldError>{form.formState.errors.isPublic?.message}</FieldError>
</Field>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
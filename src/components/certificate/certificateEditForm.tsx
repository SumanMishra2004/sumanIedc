
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/lib/appwrite";
import { updateCertificate, getCertificateById } from "@/lib/research/certificateApi";

const certificateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  keywords: z.array(z.string()).min(1, "At least 1 keyword is required").max(10, "No more than 10 keywords are allowed"),
  documentUrl: z.string().nullable().optional(),
  offeredBy: z.string().optional(),
  dateOfCompletion: z.string().min(1, "Date of completion is required"),
  remark: z.string().optional(),
  isPublic: z.boolean(),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

export default function CertificateEditForm({
  certificateId,
  open,
  onOpenChange,
  onSuccess,
}: {
  certificateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      documentUrl: "",
      offeredBy: "",
      dateOfCompletion: "",
      remark: "",
      isPublic: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!certificateId || !open) return;
      
      setIsLoading(true);
      try {
        const response = await getCertificateById(certificateId);
        if (response.data) {
          const cert = response.data;
          form.reset({
            title: cert.title,
            description: cert.description || "",
            keywords: cert.keywords || [],
            documentUrl: cert.documentUrl,
            offeredBy: cert.offeredBy || "",
            dateOfCompletion: cert.dateOfCompletion ? new Date(cert.dateOfCompletion).toISOString().split('T')[0] : "",
            remark: cert.remark || "",
            isPublic: cert.isPublic,
          });
        } else {
            toast.error(response.error || "Failed to fetch certificate details");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [certificateId, open, form]);

  const handleDocumentUpload = async (file: File) => {
    try {
      setUploadingDocument(true);
      const url = await uploadFile(file);
      form.setValue("documentUrl", url);
      setDocumentFile(file);
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const addKeyword = () => {
    const currentKeywords = form.getValues("keywords") || [];
    if (keywordInput.trim() && !currentKeywords.includes(keywordInput.trim())) {
      form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords") || [];
    form.setValue("keywords", currentKeywords.filter((k) => k !== keyword));
  };

  const onSubmit = async (values: CertificateFormValues) => {
    if (!certificateId) return;
    setIsSubmitting(true);
    try {
      const cleanedValues = {
        ...values,
        documentUrl: values.documentUrl || undefined,
      };
      const response = await updateCertificate(certificateId, cleanedValues);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Certificate updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Certificate</DialogTitle>
          <DialogDescription>
            Update your certificate details.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <>
            <ScrollArea className="flex-1 px-6 py-4">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="Certificate Course in Python" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="offeredBy"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Offered By</FormLabel>
                            <FormControl>
                                <Input placeholder="Coursera, Udemy, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dateOfCompletion"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Date of Completion <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>

                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Brief description of the certificate..." className="h-20" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <div className="flex gap-2">
                            <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Add keyword and press Enter"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                e.preventDefault();
                                addKeyword();
                                }
                            }}
                            />
                            <Button type="button" onClick={addKeyword} variant="secondary">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {field.value?.map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                                {keyword}
                                <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={() => removeKeyword(keyword)}
                                >
                                <X className="h-3 w-3" />
                                </button>
                            </Badge>
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any additional remarks..." className="h-20" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="documentUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Certificate Document</FormLabel>
                            <FormControl>
                                <div className="flex gap-2 items-center">
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDocumentUpload(file);
                                    }}
                                />
                                {uploadingDocument && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                            </FormControl>
                            {field.value && (
                                <FormDescription className="text-green-600 truncate max-w-[200px]">
                                {field.value}
                                </FormDescription>
                            )}
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <FormField
                        control={form.control}
                        name="isPublic"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Public Visibility</FormLabel>
                                <FormDescription>
                                Allow others to see this certificate
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="h-4"></div>
                </form>
                </Form>
            </ScrollArea>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || uploadingDocument}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Certificate
                </Button>
            </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

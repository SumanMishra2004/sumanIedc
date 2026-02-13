
"use client";

import { useState } from "react";
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
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { createFDP } from "@/lib/research/fdpApi";

const fdpSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  organizedBy: z.string().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  topic: z.string().optional(),
  duration: z.string().optional(),
  remark: z.string().optional(),
});

type FDPFormValues = z.infer<typeof fdpSchema>;

export default function FDPAddForm({
  onSuccess,
  trigger,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<FDPFormValues>({
    resolver: zodResolver(fdpSchema),
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      organizedBy: "",
      startDate: "",
      endDate: "",
      topic: "",
      duration: "",
      remark: "",
    },
  });

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

  const onSubmit = async (values: FDPFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await createFDP(values);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("FDP record created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add FDP Record</DialogTitle>
          <DialogDescription>
            Add a new Faculty Development Program record.
          </DialogDescription>
        </DialogHeader>
        
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
                        <Input placeholder="FDP on AI/ML" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organizedBy"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Organized By</FormLabel>
                        <FormControl>
                            <Input placeholder="IIT Bombay, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Topic / Theme</FormLabel>
                        <FormControl>
                            <Input placeholder="Artificial Intelligence" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />

                   <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration (e.g., 2 Weeks)</FormLabel>
                        <FormControl>
                            <Input placeholder="2 Weeks" {...field} />
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
                        <Textarea placeholder="Brief description of the FDP..." className="h-20" {...field} />
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

                <div className="h-4"></div>
            </form>
            </Form>
        </ScrollArea>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add FDP
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

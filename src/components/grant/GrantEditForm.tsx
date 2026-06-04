"use client";


import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Loader2, Link2, Users, GraduationCap } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useEffect } from "react";
import { GrantInRole, GrantInStatus, UserRole } from "@prisma/client";
import { getGrantInById } from "@/lib/research/grant-in";
import { MultiSelectUsers } from "@/components/ui/multi-select";
import { GrantOutputDialog } from "./GrantOutputDialog";
import type { GrantIn, GrantInMapping } from "@/types/grant-in";

const grantSchema = z.object({
  projectCode: z.string().optional(),
  grantInStatus: z.nativeEnum(GrantInStatus),
  applicationDate: z.string().min(1, "Application date is required"),
  grantDate: z.string().optional(),
  durationOfProject: z.string().optional(),
  amountGranted: z.number().min(0).optional(),
  isPublic: z.boolean(),
  hideFromAdmin: z.boolean().optional(),
});

type GrantFormValues = z.infer<typeof grantSchema>;

type UserSelection = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

export function GrantEditDialog({
  grantId,
  open,
  onOpenChange,
  onSuccess,
  userRole,
  currentUserId,
}: {
  grantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userRole?: UserRole;
  currentUserId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [loadedGrant, setLoadedGrant] = useState<GrantIn | null>(null);
  const [outputOpen, setOutputOpen] = useState(false);

  // Author state
  const [selectedFaculty, setSelectedFaculty] = useState<UserSelection[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserSelection[]>([]);
  const [piId, setPiId] = useState<string>("");
  const [hasCoPi, setHasCoPi] = useState(false);
  const [coPiIds, setCoPiIds] = useState<string[]>([]);

  const form = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: {
      grantInStatus: GrantInStatus.APPLIED,
      isPublic: false,
      hideFromAdmin: false,
    },
  });

  useEffect(() => {
    if (!open || !grantId) return;
    setLoadedGrant(null);
    setOutputOpen(false);

    const fetchGrant = async () => {
      setFetchLoading(true);
      try {
        const response = await getGrantInById(grantId);
        // FIX: API returns { grant } not { grantIn }
        if (response.data?.grant) {
          const g = response.data.grant;
          setLoadedGrant(g);

          form.reset({
            projectCode: g.projectCode || undefined,
            grantInStatus: g.grantInStatus,
            applicationDate: g.applicationDate
              ? new Date(g.applicationDate).toISOString().split("T")[0]
              : "",
            grantDate: g.grantDate
              ? new Date(g.grantDate).toISOString().split("T")[0]
              : undefined,
            durationOfProject: g.durationOfProject || undefined,
            amountGranted: g.amountGranted ?? undefined,
            isPublic: g.isPublic,
            hideFromAdmin: g.hideFromAdmin || false,
          });

          // Pre-populate author state from fetched grant
          const faculty: UserSelection[] = g.facultyAuthors.map((a) => ({
            id: a.userId,
            name: a.user?.name ?? "",
            email: a.user?.email ?? "",
            image: a.user?.image ?? undefined,
          }));
          setSelectedFaculty(faculty);

          const pi = g.facultyAuthors.find(
            (a) => a.role === GrantInRole.FACULTY_PI
          );
          const copis = g.facultyAuthors
            .filter((a) => a.role === GrantInRole.FACULTY_COPI)
            .map((a) => a.userId);

          setPiId(pi?.userId ?? "");
          setCoPiIds(copis);
          setHasCoPi(copis.length > 0);

          const students: UserSelection[] = g.studentAuthors.map((a) => ({
            id: a.userId,
            name: a.user?.name ?? "",
            email: a.user?.email ?? "",
            image: a.user?.image ?? undefined,
          }));
          setSelectedStudents(students);
        } else {
          toast.error(response.error ?? "Failed to fetch grant");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch grant details");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchGrant();
  }, [open, grantId, form]);

  const handleFacultyChange = (users: UserSelection[]) => {
    setSelectedFaculty(users);
    if (piId && !users.find((u) => u.id === piId)) setPiId("");
    setCoPiIds((prev) => prev.filter((id) => users.find((u) => u.id === id)));
  };

  const onSubmit = async (values: GrantFormValues) => {
    if (!grantId) return;
    if (!piId) {
      toast.error("A Principal Investigator (PI) must be assigned");
      return;
    }
    if (selectedFaculty.length === 0) {
      toast.error("At least one faculty member is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        applicationDate: values.applicationDate
          ? new Date(values.applicationDate).toISOString()
          : undefined,
        grantDate: values.grantDate
          ? new Date(values.grantDate).toISOString()
          : undefined,
        facultyAuthors: selectedFaculty.map((f) => ({
          userId: f.id,
          role:
            f.id === piId
              ? GrantInRole.FACULTY_PI
              : coPiIds.includes(f.id)
              ? GrantInRole.FACULTY_COPI
              : GrantInRole.AUTHOR,
        })),
        studentAuthors: selectedStudents.map((s) => ({ userId: s.id })),
      };

      await axios.patch(`/api/research/grant-in/${grantId}`, payload);
      toast.success("Grant updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update grant"
      );
    } finally {
      setLoading(false);
    }
  };

  const isPiOrCoPi = React.useMemo(
    () =>
      currentUserId
        ? (loadedGrant?.facultyAuthors ?? []).some(
            (a) =>
              a.userId === currentUserId &&
              (a.role === GrantInRole.FACULTY_PI ||
                a.role === GrantInRole.FACULTY_COPI)
          )
        : false,
    [loadedGrant, currentUserId]
  );

  const existingMappings: GrantInMapping[] =
    loadedGrant?.publicationMappings ?? [];

  const refreshMappings = async () => {
    if (!grantId) return;
    try {
      const res = await getGrantInById(grantId);
      if (res.data?.grant) setLoadedGrant(res.data.grant);
    } catch {
      /* silent refresh */
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Grant</DialogTitle>
            <DialogDescription>
              Update grant details, team members, and linked publications.
            </DialogDescription>
          </DialogHeader>

          {fetchLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-gradient">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 p-1"
                >
                  {/* â”€â”€ Basic Fields â”€â”€ */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter code"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(userRole === UserRole.ADMIN || isPiOrCoPi) && (
                      <FormField
                        control={form.control}
                        name="grantInStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(GrantInStatus).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="applicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grantDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grant Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                    <FormField
                      control={form.control}
                      name="amountGranted"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Granted (â‚¹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : e.target.valueAsNumber
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                 

                  <FormField
                    control={form.control}
                    name="durationOfProject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2 Years"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
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
                          <FormLabel className="text-base">
                            Public Visibility
                          </FormLabel>
                          <FormDescription>
                            Make this grant visible to all users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={userRole === UserRole.ADMIN && !loadedGrant?.isPublic}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {userRole !== UserRole.ADMIN && (
                    <FormField
                      control={form.control}
                      name="hideFromAdmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-destructive font-semibold">
                              Hide from Admin
                            </FormLabel>
                            <FormDescription>
                              Hide this grant and all associated expenses entirely from administrators.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const confirmMsg = "Warning: Hiding this grant from administrators means Admins will not be able to view, edit, or verify any claims for this project. Are you sure you want to proceed?";
                                  if (window.confirm(confirmMsg)) {
                                    field.onChange(true);
                                  }
                                } else {
                                  field.onChange(false);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  {/* â”€â”€ Faculty Team â”€â”€ */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Faculty Team</h4>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Faculty Members{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <MultiSelectUsers
                        isStudent={false}
                        value={selectedFaculty}
                        onChange={handleFacultyChange}
                      />
                    </div>

                    {selectedFaculty.length > 0 && (
                      <div className="space-y-3 rounded-md border p-4">
                        {/* PI Selection */}
                        <div className="space-y-2">
                          <Label>
                            Principal Investigator (PI){" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={piId}
                            onValueChange={(val) => {
                              setPiId(val);
                              setCoPiIds((prev) =>
                                prev.filter((id) => id !== val)
                              );
                            }}
                          >
                            <SelectTrigger className="h-auto py-2">
                              <SelectValue placeholder="Select a PI" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedFaculty.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={f.image} />
                                      <AvatarFallback>
                                        {f.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium">
                                        {f.name}
                                      </span>
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {f.email}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Co-PI Section */}
                        {selectedFaculty.length > 1 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="hasCoPiEdit"
                                checked={hasCoPi}
                                onCheckedChange={(checked) => {
                                  setHasCoPi(!!checked);
                                  if (!checked) setCoPiIds([]);
                                }}
                              />
                              <Label
                                htmlFor="hasCoPiEdit"
                                className="cursor-pointer text-sm"
                              >
                                Add Co-Principal Investigator (Optional)
                              </Label>
                            </div>
                            {hasCoPi && (
                              <Select
                                value={coPiIds[0] ?? ""}
                                onValueChange={(val) => setCoPiIds([val])}
                              >
                                <SelectTrigger className="h-auto py-2">
                                  <SelectValue placeholder="Select a Co-PI" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedFaculty
                                    .filter((f) => f.id !== piId)
                                    .map((f) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={f.image} />
                                            <AvatarFallback>
                                              {f.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <span className="font-medium">
                                              {f.name}
                                            </span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              {f.email}
                                            </span>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        {/* Role Summary */}
                        <div className="bg-muted/30 rounded p-2.5 text-xs text-muted-foreground space-y-0.5 border">
                          <p className="font-medium text-foreground mb-1">
                            Role Summary
                          </p>
                          <p>
                            <strong>PI:</strong>{" "}
                            {piId
                              ? selectedFaculty.find((f) => f.id === piId)
                                  ?.name
                              : "Not assigned"}
                          </p>
                          <p>
                            <strong>Co-PI:</strong>{" "}
                            {coPiIds.length > 0
                              ? coPiIds
                                  .map(
                                    (id) =>
                                      selectedFaculty.find((f) => f.id === id)
                                        ?.name
                                  )
                                  .filter(Boolean)
                                  .join(", ")
                              : "None"}
                          </p>
                          <p>
                            <strong>Authors:</strong>{" "}
                            {selectedFaculty.length -
                              (piId ? 1 : 0) -
                              coPiIds.length}{" "}
                            remaining
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* â”€â”€ Student Researchers â”€â”€ */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <Label>Student Researchers (Optional)</Label>
                    </div>
                    <MultiSelectUsers
                      isStudent={true}
                      value={selectedStudents}
                      onChange={setSelectedStudents}
                    />
                  </div>

                  <Separator />

                  {/* â”€â”€ Output Mapping â”€â”€ */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Research Output Mapping
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {existingMappings.length} publication
                        {existingMappings.length !== 1 ? "s" : ""} linked to
                        this grant
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOutputOpen(true)}
                      disabled={!loadedGrant}
                    >
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                      Manage Outputs
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Output Dialog â€” sibling portal, not nested inside main Dialog */}
      {grantId && (
        <GrantOutputDialog
          grantId={grantId}
          open={outputOpen}
          onOpenChange={setOutputOpen}
          existingMappings={existingMappings}
          canManage={true}
          canRemove={true}
          onSuccess={() => {
            refreshMappings();
            onSuccess();
          }}
        />
      )}
    </>
  );
}


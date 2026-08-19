"use client";

/**
 * ExternalAuthorList
 *
 * A self-contained UI for adding/removing unlisted (external) authors —
 * faculty or students who are not on the platform.
 *
 * Rules enforced here (UI-level):
 *  - Name and email are required; affiliation and department are optional.
 *  - No duplicate emails within the list.
 *  - For faculty: at least one platform author must already be selected
 *    (this is enforced by the parent; this component only shows a hint).
 */

import * as React from "react";
import { Plus, X, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ExternalAuthor {
  name: string;
  email: string;
  affiliation?: string | null;
  department?: string | null;
}

interface EntryState extends ExternalAuthor {
  /** local-only key so React keys stay stable */
  _key: string;
}

interface ExternalAuthorListProps {
  /** "faculty" or "student" — only affects labels and hints */
  kind: "faculty" | "student";
  value: ExternalAuthor[];
  onChange: (authors: ExternalAuthor[]) => void;
  /** Optional extra hint text shown below the section header */
  hint?: string;
  className?: string;
}

let _uid = 0;
function uid() {
  return `ext-${++_uid}`;
}

function emptyEntry(): EntryState {
  return { _key: uid(), name: "", email: "", affiliation: "", department: "" };
}

/** Inline form for one external author. */
function AuthorRow({
  entry,
  index,
  showOptional,
  onToggleOptional,
  onChange,
  onRemove,
  emailError,
}: {
  entry: EntryState;
  index: number;
  showOptional: boolean;
  onToggleOptional: () => void;
  onChange: (patch: Partial<EntryState>) => void;
  onRemove: () => void;
  emailError?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Author {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove author"
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Required fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground/80">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. Dr. Anita Sharma"
            className="h-9 text-sm rounded-lg"
            value={entry.name}
            onChange={(e) => onChange({ name: e.target.value })}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground/80">
            Email <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            placeholder="e.g. anita@university.edu"
            className={cn(
              "h-9 text-sm rounded-lg",
              emailError && "border-destructive focus-visible:ring-destructive"
            )}
            value={entry.email}
            onChange={(e) => onChange({ email: e.target.value })}
            autoComplete="off"
          />
          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}
        </div>
      </div>

      {/* Optional fields toggle */}
      <button
        type="button"
        onClick={onToggleOptional}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showOptional ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        {showOptional ? "Hide optional details" : "Add affiliation / department (optional)"}
      </button>

      {showOptional && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">
              Affiliation
            </label>
            <Input
              placeholder="e.g. IIT Delhi"
              className="h-9 text-sm rounded-lg"
              value={entry.affiliation ?? ""}
              onChange={(e) => onChange({ affiliation: e.target.value || null })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">
              Department
            </label>
            <Input
              placeholder="e.g. Computer Science"
              className="h-9 text-sm rounded-lg"
              value={entry.department ?? ""}
              onChange={(e) => onChange({ department: e.target.value || null })}
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact badge shown in the summary list when an author is confirmed. */
function AuthorBadge({
  author,
  onRemove,
}: {
  author: ExternalAuthor;
  onRemove: () => void;
}) {
  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-2 py-1.5 px-3 rounded-lg max-w-full"
    >
      <Avatar className="h-5 w-5 shrink-0">
        <AvatarFallback className="text-[9px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-semibold truncate">{author.name}</span>
        <span className="text-[10px] text-muted-foreground truncate">
          {author.email}
          {author.affiliation ? ` · ${author.affiliation}` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${author.name}`}
        className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors shrink-0"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </Badge>
  );
}

export function ExternalAuthorList({
  kind,
  value,
  onChange,
  hint,
  className,
}: ExternalAuthorListProps) {
  const label = kind === "faculty" ? "Faculty" : "Student";

  // Staged entries — being typed in but not yet "confirmed"
  const [staged, setStaged] = React.useState<EntryState[]>([]);
  // Which staged rows show optional fields
  const [showOptional, setShowOptional] = React.useState<
    Record<string, boolean>
  >({});
  // Per-staged-entry email errors
  const [emailErrors, setEmailErrors] = React.useState<
    Record<string, string>
  >({});

  /** Validate a single staged entry. Returns error string or "" */
  function validate(entry: EntryState): string {
    if (!entry.name.trim()) return "Name is required";
    if (!entry.email.trim()) return "Email is required";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(entry.email.trim())) return "Invalid email address";
    // Check duplicates within confirmed list
    const dup = value.some(
      (a) => a.email.toLowerCase() === entry.email.trim().toLowerCase()
    );
    if (dup) return "This email is already added";
    // Check duplicates within staged list
    const dupStaged = staged.filter(
      (s) =>
        s._key !== entry._key &&
        s.email.trim().toLowerCase() === entry.email.trim().toLowerCase()
    );
    if (dupStaged.length > 0) return "Duplicate email in list";
    return "";
  }

  function addStagedRow() {
    setStaged((prev) => [...prev, emptyEntry()]);
  }

  function updateStaged(key: string, patch: Partial<EntryState>) {
    setStaged((prev) =>
      prev.map((e) => (e._key === key ? { ...e, ...patch } : e))
    );
    // Clear error on change
    if (patch.email !== undefined) {
      setEmailErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  function removeStaged(key: string) {
    setStaged((prev) => prev.filter((e) => e._key !== key));
    setShowOptional((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setEmailErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Confirm all staged entries that are valid. */
  function confirmAll() {
    const newErrors: Record<string, string> = {};
    const valid: ExternalAuthor[] = [];
    const remaining: EntryState[] = [];

    for (const entry of staged) {
      const err = validate(entry);
      if (err) {
        newErrors[entry._key] = err;
        remaining.push(entry);
      } else {
        valid.push({
          name: entry.name.trim(),
          email: entry.email.trim().toLowerCase(),
          affiliation: entry.affiliation?.trim() || null,
          department: entry.department?.trim() || null,
        });
      }
    }

    setEmailErrors(newErrors);
    setStaged(remaining);

    if (valid.length > 0) {
      onChange([...value, ...valid]);
    }
  }

  function removeConfirmed(email: string) {
    onChange(value.filter((a) => a.email !== email));
  }

  const hasStagedRows = staged.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Confirmed author badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((author) => (
            <AuthorBadge
              key={author.email}
              author={author}
              onRemove={() => removeConfirmed(author.email)}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {/* Staged entry rows */}
      {hasStagedRows && (
        <div className="space-y-2.5">
          {staged.map((entry, i) => (
            <AuthorRow
              key={entry._key}
              entry={entry}
              index={i}
              showOptional={!!showOptional[entry._key]}
              onToggleOptional={() =>
                setShowOptional((prev) => ({
                  ...prev,
                  [entry._key]: !prev[entry._key],
                }))
              }
              onChange={(patch) => updateStaged(entry._key, patch)}
              onRemove={() => removeStaged(entry._key)}
              emailError={emailErrors[entry._key]}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-lg"
          onClick={addStagedRow}
        >
          <Plus className="w-3.5 h-3.5" />
          Add external {label.toLowerCase()}
        </Button>

        {hasStagedRows && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-lg"
            onClick={confirmAll}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Confirm {staged.length > 1 ? `${staged.length} entries` : "entry"}
          </Button>
        )}
      </div>
    </div>
  );
}

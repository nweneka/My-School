# My School — Data Model (Firestore)

## Core principle
Every piece of school-owned data lives **nested under** `schools/{schoolId}/...`.
Nothing school-specific ever lives at the top level except `users` (which links
an auth account to exactly one school + role) and `schools` itself. This makes
the security rules simple: "does this doc's schoolId match the requester's
schoolId?" is the only question that matters for isolation.

## Collections

### `schools/{schoolId}`
```
name: string
logoUrl: string
primaryColor: string
secondaryColor: string
language: "fr" | "en"
currentSession: string        // e.g. "2026/2027"
currentTerm: 1 | 2 | 3
subdomain: string | null
createdAt: timestamp
plan: "trial" | "active" | "suspended"
caWeight: number    // percentage, e.g. 40 — configurable per school
examWeight: number  // percentage, e.g. 60 — must sum to 100 with caWeight
```
Defaults to 40/60 (the common Nigerian/WAEC convention) when unset. Since
schools sold to will follow different conventions — French-influenced
"devoirs + composition" vs Nigerian-style CA/Exam — this is configurable
per school in Settings rather than hardcoded, and is the single source of
truth `computeAverage()` (src/lib/grading.ts) reads from.

### `users/{uid}`  (uid == Firebase Auth UID, top-level, one per login account)
```
schoolId: string
role: "superadmin" | "admin" | "teacher" | "student"
email: string
displayName: string
status: "active" | "disabled"
createdAt: timestamp

// role == "student" only:
admissionNo: string

// role == "teacher" only:
staffId: string
classIds: string[]        // kept in sync with roster_teachers; the security
                           // rules read this directly off the profile so a
                           // teacher's write access never needs a second
                           // lookup into roster_teachers
```
This is the ONLY doc a client reads right after login to know "who am I and
which school am I in." Everything else is fetched scoped to that schoolId.
Note: `admissionNo` / `classIds` are copied here from the roster at account-
creation time by the trusted Cloud Function — the security rules trust this
copy, so nothing else may ever write to it (see rules: role/schoolId locked
on update; the same lock applies to these fields).

### `schools/{schoolId}/roster_students/{admissionNo}`  (pre-loaded by admin, BEFORE signup)
```
admissionNo: string       // doc ID = admission number, easy lookup
fullName: string
dateOfBirth: string       // YYYY-MM-DD, used as the second factor at signup
classId: string
claimedByUid: string | null   // set once the student actually registers
```
Signup flow: student enters admissionNo + dateOfBirth → app looks up
`roster_students/{admissionNo}` in that school → if dateOfBirth matches and
`claimedByUid` is null → create the Auth account → set `claimedByUid` →
create `users/{uid}`. This is what stops fake account creation.

### `schools/{schoolId}/roster_teachers/{staffId}`  (same pattern as students)
```
staffId: string
fullName: string
subjectIds: string[]
classIds: string[]        // classes this teacher is assigned to
claimedByUid: string | null
approved: boolean          // admin must flip this before the teacher can log in
```

### `schools/{schoolId}/classes/{classId}`
```
name: string               // "3ème A", "Terminale D"
level: string               // "3ème", "Terminale"
```

### `schools/{schoolId}/subjects/{subjectId}`
```
name: string
coefficient: number
```

### `schools/{schoolId}/results/{resultId}`
```
studentAdmissionNo: string
classId: string
subjectId: string
session: string
term: 1 | 2 | 3
ca: number                  // continuous assessment score
exam: number
average: number             // computed, never trust client input for this
enteredByStaffId: string
status: "draft" | "submitted" | "published"
```
Only `status == "published"` results are ever visible to the student who
owns them. Averages/rankings are computed server-side (Cloud Function) at
publish time — never trust a client-submitted average.

### `schools/{schoolId}/announcements/{id}`
```
title: string
body: string
audience: "all" | "students" | "teachers" | classId
createdAt: timestamp
```

## Why roster-first, not open registration
A student or teacher can only ever create an account that matches a record
the school admin already entered. This is the whole answer to "how do we
know John is really enrolled at this school" from the ChatGPT conversation —
enforced in the data model, not just in app logic, so it's also enforced by
the security rules below.

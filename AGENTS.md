# AGENTS.md

## Project Overview

This repository contains a web application built with:

- Next.js for the frontend
- Rails API for the backend
- PostgreSQL for the database

The existing application is a calendar app.  
A new coffee record feature will be added as a separate page group under `/coffee`.

The coffee feature allows users to:

1. Take or upload a photo of a PostCoffee bean package
2. Extract package information using OCR / Vision AI
3. Confirm and edit the extracted information
4. Save the coffee bean information
5. Add tasting notes and brewing records
6. Browse past coffee records

The implementation should prioritize a stable MVP before adding advanced AI features.

---

## Important Development Policy

Do not implement the entire coffee feature at once.

Work in small, reviewable steps.

Recommended order:

1. Database models and API design
2. Basic Rails CRUD API
3. Next.js `/coffee` page structure
4. Image upload UI
5. Mock AI extraction response
6. Confirmation and edit screen
7. Coffee detail screen
8. Tasting notes
9. Replace mock extraction with real OCR / Vision AI
10. Search, filters, and preference analysis

When asked to implement a task, only implement the requested step unless explicitly instructed otherwise.

---

## Architecture Rules

### Frontend

Use Next.js for:

- Page rendering
- Coffee list page
- Coffee registration page
- Image upload UI
- Extraction result confirmation screen
- Coffee detail page
- Tasting note input UI

The coffee feature should live under:

```txt
/coffee
/coffee/new
/coffee/[id]
/coffee/[id]/edit

Do not mix coffee-specific UI into the calendar pages.

Backend

Use Rails API for:

Image upload handling
Coffee bean CRUD
Tasting note CRUD
Calling OCR / Vision AI services
Validating AI extraction results
Saving data to PostgreSQL

Do not access PostgreSQL directly from Next.js.

All persistent data changes should go through the Rails API.

Database

Use PostgreSQL.

The coffee feature should use at least these two main resources:

coffee_beans
tasting_notes

A coffee bean can have many tasting notes.

This relationship is important because the same coffee bean may be brewed multiple times with different recipes.

Coffee Bean Data Model

The coffee bean record should store information extracted from a PostCoffee package.

Expected fields:

user_id
image_url
brand
code
roast_level
name
country
name_ja
description_ja
flavor_notes
region
process
variety
elevation
farmer
farm
is_limited
raw_text

Notes:

flavor_notes should support multiple values.
Prefer JSONB or an array-like representation for flavor_notes.
Do not assume all fields can always be extracted.
Fields that cannot be read should be nullable.
Do not invent missing values.
Tasting Note Data Model

A tasting note should be associated with a coffee bean.

Expected fields:

coffee_bean_id
rating
acidity
bitterness
sweetness
aroma
body
memo
brew_method
grind_size
water_temp
coffee_grams
water_grams
brew_time

Tasting notes are user-authored records.
Do not generate tasting notes automatically unless explicitly requested.

API Design Guidelines

The Rails API should expose endpoints conceptually equivalent to:

GET    /api/coffee_beans
POST   /api/coffee_beans/analyze
GET    /api/coffee_beans/:id
PATCH  /api/coffee_beans/:id
DELETE /api/coffee_beans/:id

POST   /api/coffee_beans/:coffee_bean_id/tasting_notes
PATCH  /api/tasting_notes/:id
DELETE /api/tasting_notes/:id

The analyze endpoint should:

Receive an uploaded image
Save the image
Extract coffee package information
Save a draft coffee bean record
Return the created coffee bean data

During early development, the analyze endpoint should return a mock extraction result instead of calling a real AI service.

AI / OCR Policy

Do not connect real AI / OCR APIs until the basic upload, save, edit, and tasting note flow works with mock data.

The first implementation should use a mock extraction result based on this example:

{
  "brand": "PostCoffee",
  "code": "IND-0416",
  "roast_level": "LIGHTROAST",
  "name": "Frinsa Estate Natural Lactic",
  "country": "INDONESIA",
  "name_ja": "インドネシア フリンサエステート ナチュラルラクティック",
  "description_ja": "ブルーベリーヨーグルトのような乳酸感のある酸味とベリーの甘さ。",
  "flavor_notes": ["Blueberry", "Kiwi", "Raspberry", "Hibiscus"],
  "region": "Gunung Cupu, Pangalengan, Cikole, West Java",
  "process": "Natural Lactic",
  "variety": "Borbor",
  "elevation": "1,300m - 1,500m",
  "farmer": "Fikri Raihan Hakim",
  "farm": "Weninggalih",
  "is_limited": true,
  "raw_text": null
}

When real AI extraction is added, the AI should be instructed to:

Return JSON only
Use the expected schema
Use null for unreadable fields
Never guess or invent missing values
Preserve Japanese text when present
Extract flavor notes as an array
Ignore QR code contents unless specifically requested
PostCoffee Package Structure

PostCoffee package images usually follow a stable format.

Important visual regions:

Top left: product code
Top center: PostCoffee logo
Top right: roast level
Center top: coffee name
Center large text: country
Center lower area: Japanese coffee name and description
Below description: English flavor notes
Lower section: Region, Process, Variety, Elevation, Farmer, Farm
Right side: limited badge and QR code may appear

Use this structure to improve extraction reliability.

UX Requirements

The coffee registration flow should be:

/coffee/new
  Upload or take package photo
  Submit for analysis

/coffee/[id]/edit
  Show uploaded image
  Show extracted fields in editable form
  User confirms or fixes values
  Save

/coffee/[id]
  Show coffee bean details
  Allow user to add tasting notes

/coffee
  Show saved coffee bean records

Always include a confirmation/edit step after AI extraction.

Never silently save AI output as final user-confirmed data.

Validation and Safety

AI extraction results are not trusted.

Before saving or displaying data:

Validate expected fields
Allow nullable values
Avoid crashing when fields are missing
Treat flavor notes as an array
Do not assume image recognition is always correct
Allow users to manually correct all extracted values

Do not delete existing calendar functionality.

Do not change authentication behavior unless explicitly requested.

Do not introduce a new backend framework.

Do not bypass the Rails API for database writes.

Implementation Style

Prefer simple, readable implementation over clever abstractions.

For MVP:

Avoid over-engineering
Avoid premature background jobs
Avoid complex image pipelines
Avoid advanced analytics
Avoid real OCR until the basic flow is complete

Add comments only where the intent is not obvious.

Keep changes focused on the requested task.

Testing and Verification

After making changes, report:

What files were changed
What behavior was added
How to manually verify it
Any remaining TODOs
Any assumptions made

When possible, verify that:

The frontend builds
The Rails API boots
Database migrations are valid
Existing calendar pages are not broken
Coffee pages can be visited
API responses match the expected shape

If tests or commands cannot be run, explain why.

Completion Criteria for Coffee MVP

The MVP is complete when:

A user can open /coffee
A user can open /coffee/new
A user can upload a package image
The app creates a coffee bean using mock extraction data
The user can confirm and edit the extracted coffee information
The user can view a coffee bean detail page
The user can add tasting notes
The user can see past coffee records in a list

Real OCR / Vision AI is not required for MVP completion.


---
```

# Coffee OCR Improvement Log

## Purpose

PostCoffee package images are uploaded from `/coffee/new` and analyzed by the Rails API.

The main goal of this work was to improve OCR extraction accuracy without changing the existing coffee registration flow:

1. Upload or take a package photo.
2. Analyze the image.
3. Create a draft coffee bean.
4. Send the user to the confirmation/edit screen.
5. Let the user correct fields before saving final values.

The most important accuracy target was reading the coffee `name`, because previous OCR results often returned `null` or small noise such as `] i`.

## Problem Before Improvement

The original OCR flow treated the uploaded image as if the PostCoffee label occupied almost the whole image.

That assumption worked poorly for real package photos because the actual image usually contains the full coffee bag, with the label located in the center and occupying only part of the image.

Example problem:

```json
{
  "name": null,
  "code": "PER-0722",
  "country": "PERU",
  "flavor_notes": ["Mandarin Orange", "Loquat", "Prune", "Sweet"]
}
```

The parser could recover many structured fields from `raw_text`, but `name` was still missing because OCR was reading the wrong region of the full package image.

## Key Insight

The package format is stable:

- Top of label: code, PostCoffee logo, roast level
- Upper middle: coffee name
- Middle large text: country
- Lower middle: Japanese description and flavor notes
- Bottom: region, process, variety, elevation, farmer, farm

Therefore, the OCR pipeline should first focus on the label, not the full bag.

The improved flow is:

```txt
Uploaded full package image
-> crop central label area
-> resize and normalize label image
-> run Tesseract OCR on the label
-> run PostCoffee layout grouping
-> run parser cleanup and field extraction
```

## Backend Changes

### `backend/app/services/coffee_beans/image_preprocessor.rb`

Added a ruby-vips based preprocessing step.

Current responsibilities:

- Load the uploaded image with `Vips::Image`.
- Apply `autorot` when available.
- Crop the central label area from the full package image.
- Resize the label crop to a larger OCR-friendly width.
- Convert to grayscale.
- Apply light contrast adjustment.
- Write the OCR-ready image as PNG under:

```txt
backend/public/uploads/coffee_beans/preprocessed/
```

Important constants:

```rb
TARGET_WIDTH = 1_800
LABEL_TARGET_WIDTH = 1_400
LABEL_REGION = [0.31, 0.33, 0.69, 0.67].freeze
```

`LABEL_REGION` is a proportional crop box:

```txt
[left, top, right, bottom]
```

It is tuned for the current reference format where the PostCoffee label sits near the center of the full bag photo.

If preprocessing fails, `AnalyzeImage` falls back to the original image path so the API does not fail just because image preprocessing is unavailable.

### `backend/app/services/coffee_beans/analyze_image.rb`

The analysis flow now calls:

```rb
ImagePreprocessor.call(image_path: image_path)
```

The returned preprocessed image is passed to:

```rb
PostCoffeeLayoutExtractor.call(image_path: ocr_image_path)
```

Fallback behavior:

- If `ImagePreprocessor::Error` is raised, the original image is used.
- A warning is logged.
- The user flow continues.

### `backend/app/services/coffee_beans/post_coffee_layout_extractor.rb`

Several OCR improvements were added.

The main layout `name` region was widened:

```rb
name: [0.03, 0.10, 0.97, 0.35]
```

Dedicated name OCR was added using multiple candidate reads:

```rb
NAME_OCR_OPTIONS = [
  ["--oem", "1", "--psm", "7", "-c", "preserve_interword_spaces=1"],
  ["--oem", "1", "--psm", "11", "-c", "preserve_interword_spaces=1"]
].freeze
```

Two name crop regions are attempted:

```rb
NAME_REGIONS = [
  [0.02, 0.09, 0.98, 0.36],
  [0.32, 0.35, 0.68, 0.48]
].freeze
```

Two variants are attempted:

```rb
NAME_VARIANTS = %i[normal high_contrast].freeze
```

Candidate filtering rejects likely OCR noise:

- Too short
- Too long
- Too few letters
- Too many symbols
- Contains spec labels such as `Region`, `Process`, `Farmer`
- Contains package footer words such as `Brewed`, `Books`, `Movies`, `Cup`
- Contains too many short OCR fragments

The goal is to accept a real name like:

```txt
Carnaval
```

while rejecting noise such as:

```txt
iF NF oe ee me a Pree rinw
```

### `backend/app/services/coffee_beans/post_coffee_text_parser.rb`

The parser was strengthened to recover usable fields from noisy OCR.

Improvements include:

- Country fallback from code prefix.
- Name noise rejection.
- Flavor line selection across multiple regions.
- Spec extraction from both region text and `all` text.
- Special handling for `Region Process ...` text that is collapsed horizontally.
- Elevation range extraction.
- Farmer cleanup.
- Variety cleanup.
- Japanese OCR noise filtering.

Example country fallback:

```rb
COUNTRY_BY_CODE_PREFIX = {
  "IND" => "INDONESIA",
  "PER" => "PERU",
  "ETH" => "ETHIOPIA"
}
```

The parser intentionally leaves fields as `nil` when the OCR result is unreliable.

This is important because the app has a confirmation/edit step. It is safer to let the user fill missing fields than to save guessed values.

## Frontend Changes

The registration flow was not changed.

Minor related frontend updates were made earlier:

- Fixed mojibake in `/coffee`.
- Fixed mojibake in `/coffee/new`.
- Limited file picker accept types to:

```txt
image/jpeg,image/png,image/webp
```

The next planned frontend improvement is to add:

- Capture guide overlay
- Manual rotation
- Retake/change image affordance

Those changes are intentionally separate from this OCR backend work.

## Current Extraction Result

For the current reference Peru package image, the improved result is:

```json
{
  "name": "Carnaval",
  "code": "PER-0722",
  "country": "PERU",
  "flavor_notes": [
    "Mandarin Orange",
    "Loquat",
    "Prune",
    "Sweet"
  ],
  "region": "Cajamarca, Cutervo, Callayuc",
  "process": "Washed Long Fermentation (48h)",
  "variety": "Typica, Caturra, Bourbon",
  "elevation": "1,800m - 2,000m",
  "farmer": "Celso Juver Carrasco Diaz, Carlos & Osvaldo Vasquez",
  "farm": null
}
```

This is a significant improvement from the previous result where `name` was `null`.

## What Still Needs Work

### Japanese OCR

Japanese OCR is still unreliable with Tesseract for these package photos.

Observed issues:

- Japanese characters are split one by one.
- Some characters are misrecognized.
- English noise is mixed into Japanese description fields.

Current policy:

- Reject suspicious Japanese OCR.
- Store `name_ja` and `description_ja` as `nil` when confidence is poor.
- Let the user correct fields on the edit screen.

Future option:

- Use a Vision API for Japanese text extraction after the MVP flow is stable.

### Farm

`farm` is still often missing or noisy.

For some labels, farm is displayed as `-`, so `null` is acceptable.

### Label Crop Assumption

The current label crop is a fixed proportional crop:

```rb
LABEL_REGION = [0.31, 0.33, 0.69, 0.67]
```

This works for the current reference image format. If users upload images with very different framing, this may need:

- Manual crop UI
- Automatic label detection
- Multiple label crop candidates

## Verification Commands

Run Coffee-related backend tests:

```powershell
cd C:\Users\homur\Desktop\NextRailsV2\Calendar\backend

ruby bin\rails test test\services\coffee_beans\post_coffee_layout_extractor_test.rb test\services\coffee_beans\post_coffee_text_parser_test.rb test\services\coffee_beans\analyze_image_test.rb test\controllers\api\coffee_beans_controller_test.rb
```

Expected latest result:

```txt
22 runs, 126 assertions, 0 failures, 0 errors
```

Run frontend type check:

```powershell
cd C:\Users\homur\Desktop\NextRailsV2\Calendar\frontend

pnpm exec tsc --noEmit
```

Run a direct OCR check against an uploaded sample image:

```powershell
cd C:\Users\homur\Desktop\NextRailsV2\Calendar\backend

ruby bin\rails runner "result = CoffeeBeans::AnalyzeImage.call(image_path: Rails.root.join('public/uploads/coffee_beans/3d9b9b71-5f65-48c1-a988-c7ea1ded507b.png').to_s); p result.slice(:name, :code, :country, :flavor_notes, :region, :process, :variety, :elevation, :farmer, :farm)"
```

Expected output shape:

```rb
{
  name: "Carnaval",
  code: "PER-0722",
  country: "PERU",
  flavor_notes: ["Mandarin Orange", "Loquat", "Prune", "Sweet"],
  region: "Cajamarca, Cutervo, Callayuc",
  process: "Washed Long Fermentation (48h)",
  variety: "Typica, Caturra, Bourbon",
  elevation: "1,800m - 2,000m",
  farmer: "Celso Juver Carrasco Diaz, Carlos & Osvaldo Vasquez",
  farm: nil
}
```

## Runtime Notes

`ruby-vips` requires the OS-level `libvips` library.

The production Dockerfile already installs:

```txt
libvips
```

On the current Windows local environment, libvips is available, but optional loader DLL warnings appear for formats such as HEIF/JXL/Poppler. The app currently accepts JPEG, PNG, and WebP only, so this is not blocking the current flow.

## Current Safety Rules

- Do not trust OCR output as final data.
- Do not invent unreadable values.
- Save unreadable fields as `nil`.
- Always show confirmation/edit screen after extraction.
- Keep tasting notes user-authored only.
- Keep all persistent writes through the Rails API.

## Recommended Next Step

The next improvement should be UI-side capture quality:

1. Add a guide overlay to align the package label.
2. Add manual image rotation.
3. Add clear retake/change-image controls.
4. Keep the OCR backend as-is while testing with more package images.

This should improve input quality without making the OCR parser more brittle.

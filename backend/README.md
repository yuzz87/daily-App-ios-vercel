# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

## Tesseract OCR development setup

The coffee bean image analysis flow uses Tesseract OCR in the local Rails
development environment. This project currently assumes Windows development
with Tesseract installed directly on the host machine.

### Prerequisites

Install Tesseract OCR for Windows and make sure the executable can be found
from PowerShell.

Check the installed version:

```powershell
tesseract --version
```

Check available OCR languages:

```powershell
tesseract --list-langs
```

At the moment, the coffee OCR flow is tested with English only:

```text
eng
```

Japanese OCR (`jpn`) is not supported yet.

### Environment variables

Configure Tesseract in `backend/.env`:

```env
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_LANG=eng
TESSERACT_TIMEOUT=10
```

`TESSERACT_PATH` is optional if `tesseract` is already available on `PATH`.
`TESSERACT_LANG` should be `eng` for now.

### Manual verification

After starting Rails, upload an image to:

```text
POST /api/coffee_beans/analyze
```

The uploaded image is saved, Tesseract OCR is executed, and the OCR result is
stored in the returned coffee bean's `raw_text` field. If OCR fails, coffee bean
creation still continues with the mock extraction data and `raw_text` is `nil`.

You can also check Tesseract from Rails directly:

```powershell
ruby bin\rails runner "puts CoffeeBeans::Ocr::TesseractClient.call(image_path: 'sample.jpg')"
```

### Troubleshooting

#### `No such file or directory - tesseract`

Rails could not find the Tesseract executable.

Confirm this works in PowerShell:

```powershell
tesseract --version
```

If it does not work, add Tesseract to `PATH` or set the full executable path in
`backend/.env`:

```env
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
```

Restart Rails after changing `.env`.

#### `raw_text` is `nil`

`raw_text` becomes `nil` when OCR fails or when Tesseract returns an empty
result. Check the following:

- The uploaded file is a readable image.
- `TESSERACT_PATH` points to the correct executable.
- `TESSERACT_LANG=eng` is set.
- `tesseract --list-langs` includes `eng`.
- Rails was restarted after changing `.env`.

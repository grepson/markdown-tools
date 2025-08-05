# Pandoc Watcher Setup Guide

This setup adds a powerful pandoc service to your existing docker-compose stack that watches for markdown file changes and automatically converts them to various formats (PDF, HTML, DOCX, etc.) based on configurable rules and templates.

## Directory Structure

Create the following directory structure in your project:

```
containers/
└── pandoc/
    ├── Dockerfile
    ├── package.json
    ├── watcher.js
    └── config.json
templates/
├── daily-log.latex
├── daily-log.html
├── daily-log.css
├── meeting-notes.latex
├── meeting-notes.docx
├── report.latex
├── report.html
├── report.css
└── presentation.latex
notes/           # Your markdown files (will be watched)
output/          # Generated files will be placed here
```

## Environment Variables

Add these variables to your `.env` file:

```bash
# Pandoc Watcher Configuration
PANDOC_WATCH_DIR=./notes
PANDOC_OUTPUT_DIR=./output
PANDOC_TEMPLATES_DIR=./templates
```

## Configuration

The `config.json` file defines conversion rules. Each rule can match files using:

- **`pattern`**: Shell glob pattern for filenames (e.g., `*-daily-log.md`)
- **`glob`**: Recursive glob pattern for file paths (e.g., `reports/**/*.md`)

### Rule Structure

```json
{
  "name": "Rule Name",
  "pattern": "*-daily-log.md",  // OR "glob": "path/**/*.md"
  "outputs": [
    {
      "format": "pdf",
      "template": "template-file.latex",
      "suffix": "-formatted",
      "pandocOptions": ["--variable", "key=value"]
    }
  ],
  "pandocOptions": ["--global-option"]  // Applied to all outputs
}
```

### Supported Formats

- **PDF**: `pdf`, `beamer` (presentations)
- **HTML**: `html`, `revealjs` (presentations)
- **Word**: `docx`, `odt`
- **Others**: `epub`, `latex`, `pptx`, `rtf`

## Example Usage

### Daily Logs
Create files like `2024-01-15-daily-log.md` and they'll be automatically converted to PDF and HTML using the daily log templates.

### Meeting Notes  
Files matching `*-meeting-*.md` (e.g., `2024-01-15-meeting-standup.md`) will be converted to PDF and DOCX.

### Reports
Any `.md` file in the `reports/` directory will be converted to PDF and HTML with table of contents and section numbering.

### Presentations
Files ending with `-presentation.md` will be converted to both Beamer PDF and Reveal.js HTML presentations.

## Template Variables

Templates can use pandoc variables:

### LaTeX Templates
- `$body$` - The converted markdown content
- `$title$` - Document title
- `$author$` - Document author
- `$date$` - Document date
- Custom variables via `--variable key=value`

### HTML Templates
- `$body$` - The converted markdown content
- `$title$` - Document title
- `$date$` - Document date
- `$toc$` - Table of contents (if `--toc` is used)

## Starting the Service

1. Place all files in the correct directories
2. Add the pandoc service to your docker-compose.yml
3. Run: `docker-compose up -d pandoc-watcher`

## Logs and Monitoring

View logs: `docker-compose logs -f pandoc-watcher`

The watcher will:
- 🔍 Scan existing files on startup
- 👀 Watch for file changes in real-time
- 🔄 Process files when they're added or modified
- ✅ Show successful conversions
- ❌ Report any errors

## Advanced Configuration

### Custom Pandoc Options

You can add any pandoc option to the `pandocOptions` array:

```json
"pandocOptions": [
  "--toc",
  "--toc-depth=3",
  "--number-sections",
  "--variable", "geometry:margin=1in",
  "--variable", "fontsize=12pt",
  "--variable", "mainfont=Times New Roman",
  "--filter", "pandoc-crossref",
  "--bibliography", "/app/templates/references.bib",
  "--csl", "/app/templates/ieee.csl"
]
```

### Multiple Output Formats

Each rule can generate multiple outputs:

```json
{
  "name": "Comprehensive Documents",
  "pattern": "*-report.md",
  "outputs": [
    {
      "format": "pdf",
      "template": "report.latex",
      "suffix": "-print"
    },
    {
      "format": "html",
      "template": "report.html",
      "suffix": "-web"
    },
    {
      "format": "docx",
      "suffix": "-editable"
    },
    {
      "format": "epub",
      "suffix": "-ebook"
    }
  ]
}
```

### Conditional Processing

Use different rules for different directories:

```json
{
  "name": "Draft Documents",
  "glob": "drafts/**/*.md",
  "outputs": [
    {
      "format": "html",
      "pandocOptions": ["--css", "/app/templates/draft.css"]
    }
  ]
},
{
  "name": "Final Documents", 
  "glob": "final/**/*.md",
  "outputs": [
    {
      "format": "pdf",
      "template": "official.latex",
      "pandocOptions": ["--variable", "draft=false"]
    }
  ]
}
```

## Template Creation Tips

### LaTeX Templates
- Use `$body# Pandoc Watcher Setup Guide

This setup adds a powerful pandoc service to your existing docker-compose stack that watches for markdown file changes and automatically converts them to various formats (PDF, HTML, DOCX, etc.) based on configurable rules and templates.

## Directory Structure

Create the following directory structure in your project:

```
containers/
└── pandoc/
    ├── Dockerfile
    ├── package.json
    ├── watcher.js
    └── config.json
templates/
├── daily-log.latex
├── daily-log.html
├── daily-log.css
├── meeting-notes.latex
├── meeting-notes.docx
├── report.latex
├── report.html
├── report.css
└── presentation.latex
notes/           # Your markdown files (will be watched)
output/          # Generated files will be placed here
```

## Environment Variables

Add these variables to your `.env` file:

```bash
# Pandoc Watcher Configuration
PANDOC_WATCH_DIR=./notes
PANDOC_OUTPUT_DIR=./output
PANDOC_TEMPLATES_DIR=./templates
```

## Configuration

The `config.json` file defines conversion rules. Each rule can match files using:

- **`pattern`**: Shell glob pattern for filenames (e.g., `*-daily-log.md`)
- **`glob`**: Recursive glob pattern for file paths (e.g., `reports/**/*.md`)

### Rule Structure

```json
{
  "name": "Rule Name",
  "pattern": "*-daily-log.md",  // OR "glob": "path/**/*.md"
  "outputs": [
    {
      "format": "pdf",
      "template": "template-file.latex",
      "suffix": "-formatted",
      "pandocOptions": ["--variable", "key=value"]
    }
  ],
  "pandocOptions": ["--global-option"]  // Applied to all outputs
}
```

### Supported Formats

- **PDF**: `pdf`, `beamer` (presentations)
- **HTML**: `html`, `revealjs` (presentations)
- **Word**: `docx`, `odt`
- **Others**: `epub`, `latex`, `pptx`, `rtf`

## Example Usage

### Daily Logs
Create files like `2024-01-15-daily-log.md` and they'll be automatically converted to PDF and HTML using the daily log templates.

### Meeting Notes  
Files matching `*-meeting-*.md` (e.g., `2024-01-15-meeting-standup.md`) will be converted to PDF and DOCX.

### Reports
Any `.md` file in the `reports/` directory will be converted to PDF and HTML with table of contents and section numbering.

### Presentations
Files ending with `-presentation.md` will be converted to both Beamer PDF and Reveal.js HTML presentations.

## Template Variables

Templates can use pandoc variables:

### LaTeX Templates
- `$body$` - The converted markdown content
- `$title$` - Document title
- `$author$` - Document author
- `$date$` - Document date
- Custom variables via `--variable key=value`

### HTML Templates
- `$body$` - The converted markdown content
- `$title$` - Document title
- `$date$` - Document date
- `$toc$` - Table of contents (if `--toc` is used)

## Starting the Service

1. Place all files in the correct directories
2. Add the pandoc service to your docker-compose.yml
3. Run: `docker-compose up -d pandoc-watcher`

## Logs and Monitoring

View logs: `docker-compose logs -f pandoc-watcher`

 where the markdown content should appear
- Define custom environments for consistent styling
- Use `\usepackage{tcolorbox}` for styled boxes
- Include `\usepackage{hyperref}` for clickable links

### HTML Templates
- Use CSS custom properties for easy theming
- Include responsive design with media queries
- Add print styles for PDF generation via browser
- Use semantic HTML elements

### Creating New Templates

1. Start with a working pandoc template
2. Add your custom styling
3. Test with sample markdown files
4. Place in the `templates/` directory
5. Reference in your `config.json`

## Troubleshooting

### Common Issues

**Files not being processed:**
- Check file patterns in config.json
- Verify files are in the watched directory
- Check docker logs for errors

**LaTeX errors:**
- Ensure all required packages are installed
- Check template syntax
- Verify variable names match

**Permission errors:**
- Ensure output directory is writable
- Check docker volume mounts

**Template not found:**
- Verify template path in config
- Ensure template file exists in templates directory

### Debugging

Enable verbose logging by modifying the watcher:

```javascript
// Add to watcher.js for debugging
console.log('Debug: File path:', filePath);
console.log('Debug: Matching rule:', rule);
console.log('Debug: Pandoc command:', command);
```

## Integration with Other Services

### With Perlite
Place converted PDFs in Perlite's attachment directory for easy access.

### With Quartz
Generate HTML files that can be included in your Quartz site.

### With Version Control
Add `output/` to `.gitignore` since files are generated automatically.

## Performance Optimization

### For Large Repositories
- Use specific glob patterns instead of `**/*`
- Consider separate rules for frequently vs rarely changed files
- Use `ignoreInitial: true` for faster startup

### For Heavy Documents
- Enable incremental compilation where possible
- Use faster pandoc filters
- Consider parallel processing for multiple outputs

## Backup Strategy

The watcher only processes source files, so:
- Keep your markdown files in version control
- Templates should be versioned
- Generated outputs can be recreated anytime
- Consider backing up configuration files

## Security Considerations

- Templates can execute arbitrary LaTeX code
- Pandoc filters have system access
- Consider running in restricted environment for untrusted content
- Validate input files before processing

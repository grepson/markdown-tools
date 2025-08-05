# Markdown language tools

This repository consists of useful scripts and docker images / compose files enabling you to supercharge your .md experience.

## Installation

Make sure that you have docker installed along side of docker-compose.

* copy the example environment variables (example.env, perlite.example.env, flatnotes.example.env) by removing example keyword from them.
* run the provided `docker-compose.yml` by running `docker-compose up`
* kill docker compose after everything initalized and execute `copy_example_slidev.sh` to copy example slide to new directory enabling you to switch presentations
* uncomment volume for presentations, that way you can switch presentations in slidev:

``` dockerfile
      # Uncomment after first launch and default script migration if using demo!
      - ${SLIDEV_ROOT_DIR}/slides/${SLIDEV_SLIDE_DIR}/slides.md:/app/slidev/slides.md
      - ${SLIDEV_ROOT_DIR}/slides/${SLIDEV_SLIDE_DIR}/pages:/app/slidev/pages 
```

* set `SLIDEV_SLIDE_DIR` to `demo` if not set by default to link it.
* add all domains mentioned in `.env` file to your `/etc/hosts` if running traefik on port `80` (default scenario)

default domains:

``` markdown
127.0.0.1	perlite.home.arpa
127.0.0.1	quartz.home.arpa
127.0.0.1	slidev.home.arpa
127.0.0.1	flatnotes.home.arpa
```

## What's included

This entire stack includes:

* `perlite` - A web based markdown viewer optimized for Obsidian Notes, you can link your notes by attaching them to volume or use `git clone` manually
* `quartz` - a fast, batteries-included static-site generator that transforms Markdown content into fully functional websites. Also binded by volume, and added hot reload, so you can use it on the fly!
* `slidev` - Insane tool for creating presentations in .md files and not only! Slidev lives in root of the project as `slidev` catalogue. There is a functionality to switch presentations by re-mounting volume to one. As described above
* `flatnotes` - Simple web editor for md files. Really limited in functionality, so volume mounting is up to you :)
* `pandoc` - Insanely powerful engine to transform almost any format (MD here hehe) to any format. Comes with nodejs service for watching all catalogues and config file.
* `traefik` - Proxy compatible with docker, that way there is no configuration files for non SSL setup, since everything is handled by labels in `docker-compose`

## How to use

Get your favourite editor of choice after completing the setup and edit any .md files or in case of slidev even vue files and play around with everything. Default volume bindings are in `.gitignore` so if you wanna somehow sync them through git repo or something, probably you wanna bind volumes to some other dirs.

If you wanna switch presentation for slidev do following:

* make new folder inside `slides` directory following structure as `demo` catalogue (`slides.md` as entry and `pages` folder for pages)
* change environment variable inside `.env` file to point to your new slide
* restart slidev container and enjoy new presentation by keeping structure of folders clean!

## Tips

If your intention is to host all of this locally and later have github repo with configuration you can use directory variables for each container to for example point it to `~/Notes` and then initialize empty git repo there to sync it.

The base gitignore:

``` markdown
node_modules
.DS_Store
slidev/node_modules
```

## Pandoc - Exporting MD files to different formats

In the repository I added pandoc to automatically transform all your files from any directory to any directory. The wrapper for watch and compiling the assets is written in `node.js` and it's using `worker_threads` for faster execution.

#### Docker

Image for pandoc is Debian based image from `node` docker image repository. It consists all packages needed for pandoc plus extras. Utilized multi platform build so that on any code change we're not downloading system packages on every `docker build`

Environment variables:

 * PANDOC_WATCH_DIR - Directory for files to watch. This is the path where all your notes live on your system.
 * PANDOC_OUTPUT_DIR - Output directory for transpiled files. It respects folders structures, so it's nice to walk through outputs
 * PANDOC_TEMPLATES_DIR - Templates directory for pandoc to find all template files like `latex`, `html` etc.
 * PANDOC_ASSETS_DIR - Static assets directory. Handles images for all files.
 * PANDOC_FILTERS_DIR - All filters directory. You can put LUA filters and such to use within the templates.

#### Configuration

Pandoc orchestrator is running based on `config.json` file located in `containers/pandoc`. The file consists all `glob` definitions and templates to use along side of additional variables that you wanna pass to executing worker.

Example entry:

``` json
  "rules": [
    {
      "name": "Daily Logs",
      "pattern": "*-daily-log.md",
      "outputs": [
        {
          "format": "pdf",
          "template": "eisvogel.latex",
          "suffix": "-formatted"
        },
        {
          "format": "html",
          "template": "daily-log.html",
          "suffix": "-web",
          "pandocOptions": [
            "--css", "/app/templates/daily-log.css",
            "--toc",
            "--toc-depth=2"
          ]
        }
      ]
    },
    {
      "name": "Meeting Notes",
      "pattern": "*-meeting-*.md",
      "outputs": [
        {
          "format": "pdf",
          "template": "meeting-notes.tex",
          "pandocOptions": [
            "--variable", "geometry:margin=0.75in",
            "--variable", "fontsize=10pt"
          ]
        },
        {
          "format": "docx",
          "template": "meeting-notes.docx"
        }
      ]
    },
]
```

As you can see for every type of assets you can define:

  * Name of the rule
  * Suffix of the outputs
  * Pattern in `glob` for which assets to transform using this flow
  * Format of the export
  * Template to use, works with all pandoc options
  * Additional pandoc variables piped to exec

#### How to use

Define your templates and config, and launch the docker container! It will automatically listen for all things and return you results:

``` markdown
markdown-pandoc-orchestrator  | ✅ Successfully generated: 05.08.2025-daily-log-formatted.pdf
markdown-pandoc-orchestrator  | 🔍 Building pandoc args:
markdown-pandoc-orchestrator  |    Input path: /app/watch/Daily Logs/05.08.2025-daily-log.md
markdown-pandoc-orchestrator  |    Output path: /app/output/Daily Logs/05.08.2025-daily-log-web.html
markdown-pandoc-orchestrator  |    Format: html
markdown-pandoc-orchestrator  | 📋 Using template: daily-log.html
markdown-pandoc-orchestrator  | 📋 Template absolute path: /app/templates/daily-log.html
markdown-pandoc-orchestrator  | 📋 Template exists: true
markdown-pandoc-orchestrator  | ⚙️  Adding output pandoc options: --css /app/templates/daily-log.css --toc --toc-depth=2
markdown-pandoc-orchestrator  | 🎯 Final pandoc command: pandoc /app/watch/Daily Logs/05.08.2025-daily-log.md -o /app/output/Daily Logs/05.08.2025-daily-log-web.html -f markdown -t html --template /app/templates/daily-log.html --css /app/templates/daily-log.css --toc --toc-depth=2 --standalone --mathjax --highlight-style=espresso
markdown-pandoc-orchestrator  | 🔧 Executing pandoc command: pandoc /app/watch/Daily Logs/05.08.2025-daily-log.md -o /app/output/Daily Logs/05.08.2025-daily-log-web.html -f markdown -t html --template /app/templates/daily-log.html --css /app/templates/daily-log.css --toc --toc-depth=2 --standalone --mathjax --highlight-style=espresso
markdown-pandoc-orchestrator  | 📂 Input file: /app/watch/Daily Logs/05.08.2025-daily-log.md
markdown-pandoc-orchestrator  | 📄 Output file: /app/output/Daily Logs/05.08.2025-daily-log-web.html
markdown-pandoc-orchestrator  | 📋 Template: daily-log.html
markdown-pandoc-orchestrator  | 🚀 Starting pandoc process for: 05.08.2025-daily-log-web.html
markdown-pandoc-orchestrator  | 📊 Pandoc process finished with exit code: 0
markdown-pandoc-orchestrator  | ✅ Generated: Daily Logs/05.08.2025-daily-log-web.html
markdown-pandoc-orchestrator  | ✅ Successfully generated: 05.08.2025-daily-log-web.html
```

 

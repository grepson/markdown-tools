# Markdown language tools

This repository consists of useful scripts and docker images / compose files enabling you to supercharge your .md experience.

## Installation

Make sure that you have docker installed along side of docker-compose.

- copy the example environment variables (example.env, perlite.example.env, flatnotes.example.env) by removing example keyword from them.
- run the provided `docker-compose.yml` by running `docker-compose up`
- kill docker compose after everything initalized and execute `copy_example_slidev.sh` to copy example slide to new directory enabling you to switch presentations
- uncomment volume for presentations, that way you can switch presentations in slidev:

``` dockerfile
      # Uncomment after first launch and default script migration if using demo!
      - ./slides/${SLIDEV_SLIDE_DIR}/slides.md:/app/slidev/slides.md
      - ./slides/${SLIDEV_SLIDE_DIR}/pages:/app/slidev/pages
```

- set `SLIDEV_SLIDE_DIR` to `demo` if not set by default to link it.
- add all domains mentioned in `.env` file to your `/etc/hosts` if running traefik on port `80` (default scenario)

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
* `traefik` - Proxy compatible with docker, that way there is no configuration files for non SSL setup, since everything is handled by labels in `docker-compose`

## How to use

Get your favourite editor of choice after completing the setup and edit any .md files or in case of slidev even vue files and play around with everything. Default volume bindings are in `.gitignore` so if you wanna somehow sync them through git repo or something, probably you wanna bind volumes to some other dirs.

If you wanna switch presentation for slidev do following:

* make new folder inside `slides` directory following structure as `demo` catalogue (`slides.md` as entry and `pages` folder for pages)
* change environment variable inside `.env` file to point to your new slide
* restart slidev container and enjoy new presentation by keeping structure of folders clean!


#!/usr/bin/env sh

# SLIDEV_ROOT_DIR=$(grep SLIDEV_ROOT_DIR .env | cut -d '=' -f2)

SLIDEV_ROOT_DIR=$(eval echo $(grep SLIDEV_ROOT_DIR ${PWD}/.env | cut -d '=' -f2 | tr -d '"'))

echo "making necessary directories..."

mkdir -pv "$SLIDEV_ROOT_DIR/slides/demo"

echo "copying default slide to demo dir..."

cp "$SLIDEV_ROOT_DIR/slidev/slides.md" "$SLIDEV_ROOT_DIR/slides/demo/slides.md"
cp -r "$SLIDEV_ROOT_DIR/slidev/pages/" "$SLIDEV_ROOT_DIR/slides/demo/pages"

echo "copied default slide!"

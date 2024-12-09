#!/usr/bin/env sh

echo "making necessary directories..."

mkdir -pv slides/demo

echo "copying default slide to demo dir..."

cp notes/slidev/slides.md slides/demo/slides.md
cp -r notes/slidev/pages/ slides/demo/pages

echo "copied default slide!"

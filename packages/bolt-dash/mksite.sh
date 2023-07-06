#!/usr/bin/env bash
mkdir output

# build dashboard site first
# TODO: dash

cd docs
pip install -r requirements.txt
python -m mkdocs build
cp output ../output/docs

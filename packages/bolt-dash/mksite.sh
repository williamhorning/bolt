#!/usr/bin/env bash
mkdir ./output

cp -r ./site/* ./output

cd docs
pip install -r requirements.txt
python -m mkdocs build
cp -r output ../output/docs

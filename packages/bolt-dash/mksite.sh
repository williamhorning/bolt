#!/usr/bin/env bash
mkdir ./output

cp ./site/* ./output

cd docs
pip install -r requirements.txt
python -m mkdocs build
cp output ../output/docs

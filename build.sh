#!/bin/bash
# Vercel build script: install dependencies and collect static files

pip install -r requirements.txt
python manage.py collectstatic --noinput --clear

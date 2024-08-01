# Install Python dependencies, make and execute any migrations, and start the Django server on Unix OS.
# Requires front-end server to be running in a different terminal to see full Quill application. 
# 
# Prerequisites:
# - Postgres server is running.
#   You can verify that it is running with `$ pg_ctl status`
#   start it with `$ pg_ctl start` and stop it with `$ pg_ctl stop`
# - That you have a Python virtual environment named "quill" already created in the base 
#   repository directory
# See CONTRIBUTING.md for more information
source .quill-venv/bin/activate 
pip install -r requirements.txt
python3 manage.py makemigrations 
python3 manage.py migrate 
python3 manage.py runserver
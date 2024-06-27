# Run me to install python dependencies and start the Django server.
# This assumes that the postgres server is running.
# You can verify that it is running with `$ pg_ctl status`
# start it with `$ pg_ctl start` and stop it with `$ pg_ctl stop`
source .quill-venv/bin/activate 
pip install -r requirements.txt
python3 manage.py makemigrations 
python3 manage.py migrate 
python3 manage.py runserver
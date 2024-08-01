:: Run once to set up the database on Windows OS
workon quill-venv
pip install -r requirements.txt 
pg_ctl start 
chcp 1252 
cd dev-startup-scripts
psql -d postgres -a -f setup.sql 
py manage.py makemigrations 
py manage.py migrate
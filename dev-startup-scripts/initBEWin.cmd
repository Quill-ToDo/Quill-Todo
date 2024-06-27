:: Run me once to set you up for back-end work on Windows :)
workon quill-venv
pip install -r requirements.txt 
pg_ctl start 
chcp 1252 
cd dev-startup-scripts
psql -d postgres -a -f setup.sql 
cd ..
py manage.py makemigrations 
py manage.py migrate
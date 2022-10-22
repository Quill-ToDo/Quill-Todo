:: Run me once to set you up for back-end work on Windows :)
workon quill 
pip install -r requirements.txt 
pg_ctl start 
chcp 1252 
psql -d postgres -a -f setup.sql 
py manage.py makemigrations 
py manage.py migrate
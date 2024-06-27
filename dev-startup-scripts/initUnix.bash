# Run me once to set up the Database for Unix machines
source .quill-venv/bin/activate 
pip install -r requirements.txt 
pg_ctl start 
cd dev-startup-scripts
psql -d postgres -a -f setup.sql 
cd ..
python3 manage.py makemigrations 
python3 manage.py migrate
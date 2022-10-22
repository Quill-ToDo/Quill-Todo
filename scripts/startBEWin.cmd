@ECHO on 

call workon quill
cd ..

pg_ctl start
:startDb
if %errorlevel%==0 goto fin
pg_ctl stop
pg_ctl start -t 15
goto startDb

:fin
pip install -r ./requirements.txt
py manage.py makemigrations 
py manage.py migrate 
py manage.py runserver
cmd /k
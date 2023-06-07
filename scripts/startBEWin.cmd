@ECHO on 
call workon quill

:startDb
pg_ctl start
if %errorlevel%==0 goto fin
pg_ctl stop
goto startDb

:fin
cd ..
pip install -r requirements.txt
py manage.py makemigrations 
py manage.py migrate 
py manage.py runserver
cmd /k
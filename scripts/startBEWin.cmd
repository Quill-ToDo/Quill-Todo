@ECHO on 
call venv\Scripts\activate.bat

:startDb
echo:
echo    ^<3 Trying to start server...
echo:
call pg_ctl status
call pg_ctl start
if %errorlevel%==0 goto fin
echo:
echo    ^<3 Error. :/ Trying to stop server in ^powershell and then restart
echo:
call powershell.exe "pg_ctl stop"
call pg_ctl start
goto startDb

:fin
echo:
echo    ^<3 Success! Installing any new Python packages and applying migrations.
cd ..
pip install -r requirements.txt
py manage.py makemigrations 
py manage.py migrate 
py manage.py runserver
cmd /k
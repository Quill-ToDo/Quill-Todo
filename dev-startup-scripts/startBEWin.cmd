:: Attempts to start the Postgres database, install Python dependencies, 
:: make and execute any migrations, and start the Django server on Windows OS.
:: If the script gets stuck or fails, run each of the commands indicated by comments
:: below individually.
:: 
:: Prerequisites:
:: - That you have a Python virtual environment named "quill" already created in the base 
::   repository directory
:: See CONTRIBUTING.md for more information
::
:: vvv ignore
:startDb
:: ^^^
pg_ctl start
:: vvv ignore
if %errorlevel%==0 goto fin
:: ^^^
pg_ctl stop
:: vvv ignore
goto startDb
:fin
:: ^^^
call workon quill-venv
pip install -r requirements.txt
py manage.py makemigrations 
py manage.py migrate
py manage.py runserver
:: vvv ignore
cmd /k
:: ^^^
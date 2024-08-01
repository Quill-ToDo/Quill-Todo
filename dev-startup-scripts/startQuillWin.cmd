:: Run me to start the Quill development environment on Windows OS. Assuming Postgres server is running,
:: starts the back-end server (Django)and front-end development server (NextJS)
::
:: You can verify that the Postgres server is running using `$ pg_ctl status`.
:: start it with `$ pg_ctl start` and stop it with `$ pg_ctl stop`
:: (See CONTRIBUTING.md for more info)
::
:: Navigate to URL specified in front-end terminal to see development assets
::
:: Example console output and URL:
:: > quill-fe@0.1.0 dev
:: > next dev
::
::  ▲ Next.js 14.2.3
::  - Local:  --->  http://localhost:3000 <--- HERE
::
:: ✓ Starting...
:: ✓ Ready in 19.5s

start call dev-startup-scripts/startFEWin.cmd
start call dev-startup-scripts/startBEWin.cmd


# Run me to install python dependencies and start the Django server.
# This assumes that the postgres server is running.
# You can verify that it is running with `$ pg_ctl status`
# start it with `$ pg_ctl start` and stop it with `$ pg_ctl stop`
source .quill-venv/bin/activate 
source dev-startup-scripts/startBEUnix.bash &
source dev-startup-scripts/startFEUnix.bash
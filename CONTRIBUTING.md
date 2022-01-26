# Contributing

If there are any issues with these instructions or if anything is unclear, please let us know in Slack!

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Setting up the development environment](#setting-up-the-development-environment)
  - [Back-end](#back-end)
    - [Manual Back-End Init](#manual-back-end-init)
    - [Back-End Notes](#back-end-notes)
  - [Front-end](#front-end)
    - [FE Notes](#fe-notes)
- [Commits, Branches, and Pull Requests](#commits-branches-and-pull-requests)
  - [To work on a feature](#to-work-on-a-feature)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Setting up the development environment

### Back-end

1. Clone repo wherever you'd like

2. [Set up virtual development environment](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/development_environment) named "quill".

3. Install `nvm` (Node version manager)

    - [Windows](https://github.com/coreybutler/nvm-windows)
    - [MacOS/unix](https://github.com/nvm-sh/nvm)

    Verify installation with
  
    ```Bash
    nvm -v
    ```

4. Install and switch to Node v16.13.1.

    > **Note for Windows:** If access is denied on windows, try running commands in Command Prompt with elevated privileges. (Make sure to switch back into venv.)

    ```Bash
    nvm install v16.13.1 && nvm use 16.13.1
    ```

5. Add secret `.env` file to `App` dir. Ask in Slack for the file.

    **This file should never be pushed to GitHub!**

    - Add `.` if needed to the front of the file in the directory so it is invisible. (Filename should be: `.env`)
    - In [setup.sql](./setup.sql), change PASS_IN_ENV to the value of DB_PASSWORD in [.env](./.env). **❗Do not push this change, reset it after you init the database.**

6. Set up the database
    - Windows:
        - [Install PostgreSQL](https://www.postgresql.org/download/windows/) using installer. Leave configuration defaults as they are.
        - Set environment variables after install following [step 3 of this guide](https://medium.com/@aeadedoyin/getting-started-with-postgresql-on-windows-201906131300-ee75f066df78)
    - Mac/Unix:
        - [Install PostgreSQL](https://www.postgresql.org/download/macosx/) using homebrew
        - **Note:** After the initial set-up, if you installed via homebrew the server should start automatically when you boot your computer up. To check you can always run `$ pg_ctl status`.

7. Init back-end using npm scripts

    ---

    > 🐛 **Read if the scripts fail**:
    >
    > 1. Please let Lily know via Slack or submit a bug report so I can fix them! I am new to scripting and am not working on a Mac so I might have missed something.
    > 2. Look in [./package.json](./package.json) under "scripts". The script you ran is a bunch of commands separated by `&&`. You can try running each of these commands individually in a terminal and modifying them as needed (ex: if the python command I'm using is different for you).
    > 3. If all else fails, continue with [Manual Back-End Init](#manual-back-end-init) to set it up manually with more detailed instructions.

    ---

    - **Windows:**
        - **📝 Note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/) for your virtual environment, it will not work with powershell.
        - Create database and user for Quill

            ```Bash
            npm run init-be-win
            ```

    - **Mac/Unix:**
        - Start database server for the first time

            ```Bash
            brew services start postgresql
            ```

        - Create database and user for Quill

            ```Bash
            npm run init-be-mac
            ```

8. Verify success
    - Start psql (used to view and manipulate PostgreSQL databases and data)

        ```Bash
        psql quill_db
        ```

    - In psql (indicated by `$ quill_db=# `), list users under quill_db database

        ```psql
        \du
        ```

    - Make sure that you see quill_user
    - Enter `\q` to quit psql

        > **Useful psql commands:**
        >
        > - `\q` Quit
        > - `\l` List databases
        > - `\du` List roles

    - ✅ If everything looks good:
        - **Windows:** run `npm run start-be-win` to start the database and server.
        - **Mac:** run `npm run start-be-mac` to start the database and server.
        - **❗Remove the db password you added from [setup.sql](./setup.sql).**
        - You're done! Read [Back-End Notes](#back-end-notes)
    - ❌ If it says the database doesn't exist or you don't see quill_user:
        - If your computer did not recognize py for Python, try copying the script from package.json and replacing py with python3.
        - Read note at the top of step 7.

#### Manual Back-End Init

1. switch to virtual environment following instructions of whichever virtual environment you're using
  
    > **Note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/), it will not work with powershell.
    - Start psql

        ```bash
        psql postgres
        ```

    - Run all SQL commands in [setup.sql](./setup.sql), replacing PASS_IN_ENV with the password provided in .ENV (Eventually we will automate this process). When you're done, quit psql with `\q`.

    ❗**Make sure you don't commit setup.sql with the password in it in git.**

2. Install dependencies:  
  
    ```Bash
    pip install -r requirements.txt
    ```

3. Ensure postgres server is running

    ```Bash 
    pg_ctl status
    ```

    If it says no server is running:
    - Windows:

        ```Bash
        pg_ctl start
        ```

    - Mac:

        ```Bash
        brew services start postgresql
        ```

4. Make and apply migrations:

    > **Note:** If these commands do not work prefixed with `py`, also try `python3` and `python`.

    ```Bash
    py manage.py makemigrations 
    py manage.py migrate
    ```

5. Start server:

    ```Bash
    py manage.py runserver
    ```

#### Back-End Notes

- After this initial setup, you can use the appropriate start-be npm script located in [package.json](./package.json)
  - `npm run start-be-win`
  - `npm run start-be-mac`

  to start the back-end server and database.
- If you follow the url the server is running on you will get an error until you build the front-end app for production. To do that, follow the instructions in front-end and run `npm build`.
- To access the API navigate to localhost:[port number]/api/tasks/ in a browser.
- > **Important:** If you install more Python dependencies during development, please run `pip3 freeze > requirements.txt` to keep dependencies up to date for everyone else

### Front-end

1. Follow steps for back-end to get database and Django server running

2. **In a second terminal (so that you can leave the server running):**
    Start dev server with `npm run start-fe`. If that fails or does not launch a new window, proceed with step 3.

3. Change to virtual environment (same as step 7 for back-end)

4. Install dependencies:

    ```Bash
    cd tasks-fe && npm install
    ```

- To launch in development mode:

    ```Bash
    npm start
    ```

    It will open the browser window for you.

- To build for production:

    ```bash
    npm build
    ```

    Navigate to the url that the back-end server is running at and it should serve the built app.

#### FE Notes

- > **Important:** If you install more npm packages during development, make sure to add the `--save` flag to the install command to automatically update `package.json`.

## Commits, Branches, and Pull Requests

### To work on a feature

1. Assign yourself to the appropriate issue.

2. Pull on main branch.

    ```Bash
    git pull
    ```

3. Create a branch for the feature if there is not one already.

    ```Bash
    git checkout -b  <feature branch name>
    ```

    Otherwise, if one already exists, switch to it.

    ```bash
    git checkout <feature branch name>
    ```

4. If others will also be working on the feature, make a working branch for **your** code based off of the feature branch.

    ```Bash
    git checkout -b  <working branch name>
    ```

5. Code on the working branch.

6. Commit your changes.

    ```Bash
    git add -A
    git commit -m "<your commit message. include a # issue number to link it>"
    ```

7. Merge your working with the feature branch.

    ```Bash
    git checkout <feature branch name>
    git merge <working branch name>
    ```

   If there are merge conflicts, manually change the files listed under "merge" and commit changes.

8. When the feature is done, merge it with main.

   Make sure main is up to date.

    ```Bash
    git checkout main
    git pull
    ```

   Merge main with your feature branch.

    ```Bash
    git checkout <feature branch name>
    git pull
    git merge main
    ```

    Resolve any merge conflicts. Make sure tests pass before submitting a PR.

9. Push local feature branch to remote.

    ```Bash
    git checkout <feature branch name>
    git push origin <feature branch name>
    ```

10. To merge to main, on GitHub, click pull request button on code page and submit a pull request.

    Link the issue to the PR so that when the PR is closed, the issue is as well.

11. Monitor the PR and make any changes necessary! Thank you for helping!! ✨

# Contributing

If there are any issues with these instructions or if anything is unclear, please let us know in Slack!

<!-- START doctoc -->
<!-- END doctoc -->

## Setting up the development environment

### Back-end

1. Clone repo wherever you'd like

2. [Set up virtual development environment](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/development_environment)

3. Switch to virtual environment following instructions of whichever virtual environment you're using
  
    > **Note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/), it will not work with powershell.

4. Add secret `.env` file to `App` dir. Ask in Slack for the file. Add `.` to the front of the file in the directory so it is invisible. (Filename should be: `.env`) **This should never be pushed to GitHub!**

5. Set up the database:
    - [Install PostgreSQL](https://www.postgresql.org/download/)
    - (Windows) Set environment variables after install following [step 3 of this guide](https://medium.com/@aeadedoyin/getting-started-with-postgresql-on-windows-201906131300-ee75f066df78)
    - Start the server:

        Run `pg_ctl status` to see if the server is already running. If not, run `pg_ctl start`

        > **Note:** After the initial set-up, if you installed via homebrew the server should start automatically when you boot your computer up. To check you can always run `pg_ctl status`.

    - Start psql

        ```bash
        psql postgres
        ```

        > Useful psql commands:
        >
        > - `\q` Quit
        > - `\l` List databases
        > - `\du` List roles

    - Run all SQL commands in [setup.sql](./setup.sql), replacing PASS_IN_ENV with the password provided in .ENV (Eventually we will automate this process). When you're done, quit psql with `\q`.

        ❗**Make sure you don't commit setup.sql with the password in it in git.**

6. Install dependencies:  
  
    ```Bash
    pip install -r requirements.txt
    ```

7. Make and apply migrations:

    > **Note:** If these commands do not work prefixed with `py`, also try `python3` and `python`.

    ```Bash
    py manage.py makemigrations 
    py manage.py migrate
    ```

8. Start server:

    ```Bash
    py manage.py runserver
    ```

#### Back-end Notes

- If you follow the url the server is running on you will get an error until you build the front-end app for production. To do that, follow the instructions in front-end.
- To access the API navigate to localhost:[port number]/api/tasks/ in a browser.

> **Important:** If you install more Python dependencies during development, please run `pip3 freeze > requirements.txt` to keep dependencies up to date for everyone else

### Front-end

0. Follow steps for back-end to get server running

**In a second terminal (so that you can leave the server running):**

1. Install `nvm` (Node version manager)

    - [Windows](https://github.com/coreybutler/nvm-windows)
    - [MacOS/unix](https://github.com/nvm-sh/nvm)

    Verify installation with
  
    ```Bash
    nvm -v
    ```

2. Change to virtual environment (same as step 3 for back-end)

3. Install and switch to Node v16.13.1.

    > **Note for Windows:** If access is denied on windows, try running commands in Command Prompt with elevated privileges. (Make sure to switch back into venv.)

    ```Bash
    nvm install v16.13.1
    nvm use 16.13.1
    ```

4. Install dependencies:

    ```Bash
    cd tasks-fe
    npm install
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

> **Important:** If you install more npm packages during development, make sure to add the `--save` flag to the install command to automatically update `package.json`.

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
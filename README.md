# Quill-ToDo

Creating a better to-do app. A Python adaptation of a [ROR project](https://github.com/lilyosah/COSC415-ToDo)

## Getting Started

If there are any issues with these instructions or if anything is unclear, please let us know in Slack!

### Starting the Development Server

#### Back-end

1. Clone repo wherever you'd like

2. [Set up virtual development environment](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/development_environment)

3. Switch to virtual environment following instructions of whichever virtual environment you're using
  
    > **Note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/), it will not work with powershell.

4. Add secret `.env` file to `App` dir. Ask in Slack for the file. Add `.` to the front of the file in the directory so it is invisible. (Filename should be: `.env`) **This should never be pushed to GitHub!**

5. Set up the database:
    - [Install PostgreSQL](https://www.postgresql.org/download/)
    - (Windows) Set environment variables after install following [step 3 of this guide](https://medium.com/@aeadedoyin/getting-started-with-postgresql-on-windows-201906131300-ee75f066df78)
    - Start server and start psql

        ```bash
        pg_ctl start
        psql postgres
        ```

    - Run all SQL commands in [setup.sql](./setup.sql), replacing PASS_IN_ENV with the password provided in .ENV. (Eventually we will automate this process)  

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

##### Back-end Notes

- To access the API navigate to localhost:[port number]/api/tasks/ in a browser.

> **Important:** If you install more Python dependencies during development, please run `pip3 freeze > requirements.txt` to keep dependencies up to date for everyone else

#### Front-end

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

4. Start React FE:

    ```Bash
    cd tasks-fe
    npm install
    npm start
    ```

##### FE Notes

- If you install more npm packages during development, make sure to add the `--save` flag to the install command to automatically update `package.json`

## Commits, Branches, and Pull Requests

### To work on a feature

1. Assign yourself to the appropriate issue

2. Pull

    ```Bash
    git pull
    ```

3. Create a branch for the feature if there is not one already

    ```Bash
    git branch  [feature branch name]
    git checkout [feature branch name]
    ```

4. Make a working branch for your code based off of the feature branch

    ```Bash
    git branch  [working branch name]
    git checkout [working branch name]
    ```

5. Code on the working branch

6. Commit your changes

    ```Bash
    git add -A
    git commit -m "[your commit message. include a # issue number to link it]"
    ```

7. Merge your working with the feature branch

    ```Bash
    git checkout [feature branch name]
    git merge [working branch name]
    ```

   If there are merge conflicts, manually change the files listed under "merge" and commit changes

8. When the feature is done, merge it with main.

   Make sure main is up to date.

    ```Bash
    git checkout main
    git pull
    ```

   Merge main with your feature branch.

    ```Bash
    git checkout [feature branch name]
    git pull
    git merge main
    ```

    Resolve any merge conflicts. Make sure tests pass (Once we have tests!) before submitting a PR.

9. Push local feature branch to remote.

    ```Bash
    git checkout [feature branch name]
    git push origin [feature branch name]
    ```

10. To merge to main, on GitHub, click pull request button on code page and submit a pull request.

    Link the issue to the PR so that when the PR is closed, the issue is as well.

11. Monitor the PR and make any changes necessary! Thank you for helping!! ✨

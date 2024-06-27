# Contributing

If there are any issues with these instructions or if anything is unclear, please let us know in Slack!

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Setting up the development environment](#setting-up-the-development-environment)
  - [Back-End](#back-end)
    - [Manual Back-End Init](#manual-back-end-init)
    - [Back-End Notes](#back-end-notes)
  - [Front-end](#front-end)
    - [Front-End Notes](#front-end-notes)
  - [Testing](#testing)
    - [Front-end Testing](#front-end-testing)
      - [Running Tests](#running-tests)
      - [Writing Tests](#writing-tests)
        - [Mocking Network Calls](#mocking-network-calls)
        - [Mocking time](#mocking-time)
        - [Useful testing resources](#useful-testing-resources)
    - [Back-End Testing](#back-end-testing)
- [Commits, Branches, and Pull Requests](#commits-branches-and-pull-requests)
  - [To work on a feature](#to-work-on-a-feature)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Setting up the development environment

After the initial set-up instructions are followed to set everything up, you can start the backebnd server and front-end with: 

**Windows:**
```cmd
$ dev-startup-scripts\startQuilDevEnv.cmd
```

**Mac/Unix:**
```bash
$ source dev-startup-scripts/startQuillUnix.bash
```

### Back-End

> **Note:** If Python commands do not work prefixed with `py`, also try `python3` and `python`. It works differently across operating systems.

1. Clone this repo

2. Install [Python](https://www.python.org/downloads/) 

3. [Set up a Python virtual environment](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/#create-and-use-virtual-environments) 
    named "quill-venv" within the "quill-todo" directory 
    for Python dependencies. It MUST be named quill-venv if you 
    want to use any of the shortcut dev-startup-scripts we have.

    Create the environment

    ```Bash
    py -m venv .quill-venv
    ```

    Use the environment 
    
    ```Bash
    .quill-venv/bin/activate
    ```

    You can tell it's active because the environment name will prefix the command line surrounded by parentheses 
    similar to the following:

    ```Bash
    (.quill-venv) lily@Lilys-Laptop Quill-Todo % 
    ```

4. Add a file called `.env` file to the base project directory

    > **This file should never be pushed to GitHub!**
    
    Add the following values to the file:

    ```
    SECRET_KEY=<your secret key>
    DB_PASSWORD=<your db password>
    ```

    - I believe the key and password values can be anything you want, so replace \<your secret key> and 
    \<your db password> with anything you want. 
    - Add `.` if needed to the front of the file in the directory so it is invisible. (Filename should be: `.env`)
    - In [setup.sql](./dev-startup-scripts/setup.sql), change PASS_IN_ENV to the value of DB_PASSWORD in [.env](./.env). 
        - > **❗Do not push this change, reset it after you init the database.**
    - This allows Django to access the database by reading this password.

5. Install PostgreSQL for our database
    - **Windows:**
        - [Install PostgreSQL](https://www.postgresql.org/download/windows/) using installer. Leave configuration defaults as they are.
        - Set environment variables after install following [step 3 of this guide](https://medium.com/@aeadedoyin/getting-started-with-postgresql-on-windows-201906131300-ee75f066df78)
    - **Mac/Unix:**
        - [Install PostgreSQL](https://www.postgresql.org/download/macosx/) using [homebrew](https://brew.sh/)
            - Pay attention to the directory where it inititlizes the the cluster.
        - Add postgresql installation to your terminal profile. Copy the directory where the cluster was started and then run 
            ```Bash
             echo "export PGDATA='<YOUR PATH HERE>'" >> ~/.zshrc
            ```
            replacing \<YOUR PATH HERE> with the cluster dir.
            - If you are not using ZSH then replace ~/.zshrc in the command above with ~/.bashrc or ~/.profile.
            - This should let you use pg_ctl commands after you close and re-open the terminal.
        - **Note:** After the initial set-up, if you installed via homebrew the server should start automatically when you boot your computer up. 
    - Verify that `pg_ctl status` command can run. 
        - If you see sonething about a server running or not running, you are good, 
        - if it does not recognize pg_ctl as a command you have set the path variables or terminal profile incorrectly.

6. Init the database and server for the first time using dev-startup-scripts

    ---

    > 🐛 **Read if the scripts fail**:
    >
    > 1. Please let Lily know or submit a bug report so I can fix them! I am new to scripting and am not working on Unix so I might have missed something.
    > 3. If all else fails, continue with [Manual Back-End Init](#manual-back-end-init) to set it up manually with more detailed instructions.

    ---

    - **Windows:**
        > **📝 Important note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/) for your virtual environment, it will not work with powershell.
        - Open a terminal
        - Create database and user for Quill

            ```cmd
            dev-startup-scripts\initBEWin.cmd
            ```

    - **Mac/Unix:**
        - Start database server for the first time

            ```Bash
            brew services start postgresql
            ```

        - Create database and user for Quill

            ```Bash
            source dev-startup-scripts/initUnix.bash
            ```

8. Verify success
    - Start psql (used to view and manipulate PostgreSQL databases and data)

        ```cmd
        psql quill_db
        ```

    - In psql (indicated by `$ quill_db=# `), list users under quill_db database

        ```psql
        quill_db=# \du
        ```

        - 🔍 Verify that you see quill_user
        - If it is there, enter `\q` to quit psql

            > **Other useful psql commands:**
            >
            > - `\q` Quit
            > - `\l` List databases
            > - `\du` List roles

    - ✅ If everything looks good:
        > **❗IMPORTANT NOTE: Remove the db password you added from [setup.sql](./setup.sql).**
        - You're done! Read [Back-End Notes](#back-end-notes)

    #### Debugging Tips

    - ❌ Read note at the top of step 7.
    - ❌ If it says the server could not start:
        - Try starting and stopping the server manually and the re-run the command to start the database and server from the last step.
            - Run `$ pg_ctl status`. 
            - If it says a server is running, run `$ pg_ctl stop & pg_ctl start & pg_ctl stop`
            - If no server is running, run `$ pg_ctl start & pg_ctl stop`
            - Rerun the command to start the database and server from the last step.
        - If that does not work, continue with debugging steps below

#### Manual Back-End Init

1. Switch to virtual environment following instructions of whichever virtual environment you're using (something like `$ source .quill-venv/bin/activate`)
  
    > **Note for Windows:** You must use Command Prompt if you are using [`virtualenvwrapper-win`](https://pypi.org/project/virtualenvwrapper-win/), it will not work with powershell.
    - Start psql

        ```cmd
        $ psql postgres
        ```

    - Run all SQL commands in [setup.sql](./setup.sql), replacing PASS_IN_ENV with the same password you wrote in .ENV (Eventually we will automate this process). When you're done, quit psql with `\q`.

    ❗**Make sure you don't commit setup.sql with the password in it in git.**

2. Install dependencies:  

    Make sure your Python virtual environment is activated, and then run:
  
    ```cmd
    $ pip install -r requirements.txt
    ```

3. Ensure postgres server is running

    ```cmd
    $ pg_ctl status
    ```

    If it says no server is running:
    - **Windows:**

        ```cmd
        $ pg_ctl start
        ```

    - **Mac/Unix:**

        ```cmd
        $ brew services start postgresql
        ```

4. Make and apply migrations:

    ```Bash
    $ py manage.py makemigrations && py manage.py migrate
    ```

#### Back-End Notes

- After this initial setup, you can use the appropriate script for your OS to start the database and server
  - **Windows:** You can use `$ dev-startup-scripts\startBEWin.cmd` to just start the API, or `$ dev-startup-scripts\startQuilDevEnv.cmd` to start the FE and BE at once
  - **Mac/Unix**: `$ npm run start-be-unix`
  - Or just run `$ pg_ctl start` to start the database and `$ py manage.py runserver` to start the server (make sure your virtual environment is active)

- If you follow the url the server is running on you will get an error until you build the front-end app for production. To do that, follow the instructions in front-end and run `npm build`.
- To access the API navigate to [http://localhost:[server port number]/api/tasks/]() in a browser. It will say the port it's running on in the terminal the sever is running in.
You may consider install PgAdmin to make working with databases easier.
- > **Important:** If you install more Python dependencies during development, please run `pip3 freeze > requirements.txt` and commit any changes to this file to keep dependencies up to date for everyone else

### Front-end

1. Follow steps for back-end to get database and Django server running

2. Install `nvm` (Node version manager)

    - [Windows](https://github.com/coreybutler/nvm-windows)
    - [MacOS/unix](https://github.com/nvm-sh/nvm)

    Verify installation with
  
    ```Bash
    nvm -v
    ```

3. Install Node

    > **Note for Windows:** If access is denied on windows, try running commands in Command Prompt with elevated privileges. (Make sure to switch back into venv in Command Prompt.)

    ```Bash
    nvm install v22.2.0 && nvm use 22.2.0
    ```

    You may need to restart your computer for the installation to take effect.


4. Start dev server with `$ npm run start-fe`. If that fails or does not launch a new window, proceed with step 3.

5. Install dependencies:

    ```cmd
    $ cd quill-fe && npm install
    ```

- To launch in development mode:

    ```cmd
    $ npm start
    ```

    It will open the browser window for you.

- To build for production:

    ```cmd
    $ npm build
    ```

    Navigate to the url that the back-end server is running at and it should serve the built app.

#### Front-End Notes

- > **Important:** If you install more npm packages during development, make sure to add the `--save` flag to the install command to automatically update `package.json` and commit any changes to this file. ex: `npm i sass --save`

### Testing

#### Front-end Testing

The test files are stored near the code they test, for most components, in [quill-fe/src/components/__tests__/](./quill-fe/src/components/__tests__/).

##### Running Tests

To run existing tests, from the main directory after switching into your virtual environment (see step 7 in back-end), run `npm run fe-tests`. Alternatively, run the commands manually: After `cd`ing into `quill-fe`, run all tests with `npm test a` or run tests for files that have changed since your last commit with `npm test`.

The tests should re-run automatically every time you save.
Notice that in watch mode, you can press `w` to show options to filter the tests that you run.
You can also isolate the execution of tests to a single test by adding `only` after the test.

**Ex:**
```JS
it.only("should load tasks in the list", async () => {
    render(<App />);
    expect(screen.getByRole("region", {name: "Task list"}))
    .toContainElement(await screen.findByLabelText("Overdue incomplete"));
})
```

Additionally, you can mark a test as not yet implemented by adding `todo`.

**Ex:** `it.quill-be-proj("should do something cool");`

##### Writing Tests
###### Mocking Network Calls

We mock all of our calls to the back-end using declarative statements using [Mock Service Worker](https://mswjs.io/docs/). If you don't need to test any special cases (i.e. making sure things behave appropriately if the server returns and error code), feel free to import a default mock server configuration with some dummy tasks from [mockHandlers.js](./quill-fe/src/API/mockHandlers.js). Pay special attention to the optional setup methods. If you want to override one of the mock handlers, I believe it's as simple as adding your function to the beginning of the `mocks` array and marking it as [only needing to be run once](https://mswjs.io/docs/api/response/once).

An example of the default server being used can be seen in [the tests for the list feature](./quill-fe/src/components/__tests__/list.js#L18).

###### Mocking time

Helpfully, [Luxon](https://moment.github.io/luxon/api-docs/index.html#settings) exposes a settings module that lets you set the output of `DateTime.now()` ([Example](./quill-fe/src/components/__tests__/list.js#L19-L31)). Mocking any other methods not mentioned in their setting will require using Jest mocks/spies.  

###### Useful testing resources

- [Create React App testing basics](https://create-react-app.dev/docs/running-tests/)
- Matchers
  - [Built-in Jest expect matchers](https://jestjs.io/docs/expect)
  - [jest-dom matchers to test the state of DOM elements](https://github.com/testing-library/jest-dom)
- Queries / Selecting elements
  - [Testing library about queries](https://testing-library.com/docs/queries/about)
  - Role-based matching (helps ensure accessibility, try to use this as much as you can)
    - [Testing library helper to display node roles](https://testing-library.com/docs/dom-testing-library/api-debugging#logroles)
    - [Implicit ARIA role table (if the HTML tag is not used as a role and one is not specified, it may be using one of these)](https://www.w3.org/TR/html-aria/#docconformance-attr)
- Network Calls
  - [Mock Service Worker for mocking network calls](https://mswjs.io/docs/getting-started/mocks/rest-api)

#### Back-End Testing

*To-do!*

## Commits, Branches, and Pull Requests

### To work on a feature

1. Assign yourself to the appropriate issue

2. Pull

    ```cmd
    $ git pull
    ```

3. Create a branch for the feature if there is not one already

    ```cmd
    $ git branch  [feature branch name]
    $ git checkout [feature branch name]
    ```

4. Make a working branch for your code based off of the feature branch

    ```cmd
    $ git branch  [working branch name]
    $ git checkout [working branch name]
    ```

5. Code on the working branch

6. Commit your changes

    ```cmd
    $ git add -A
    $ git commit -m "[your commit message. include a # issue $ number to link it]"
    ```

7. Merge your working with the feature branch

    ```cmd
    $ git checkout [feature branch name]
    $ git merge [working branch name]
    ```

   If there are merge conflicts, manually change the files listed under "merge" and commit changes

8. When the feature is done, merge it with main.

   Make sure main is up to date.

    ```cmd
    $ git checkout main
    $ git pull
    ```

   Merge main with your feature branch.

    ```cmd
    $ git checkout [feature branch name]
    $ git pull
    $ git merge main
    ```

    Resolve any merge conflicts. Make sure tests pass before submitting a PR.

9. Push local feature branch to remote.

    ```cmd
    $ git checkout [feature branch name]
    $ git push origin [feature branch name]
    ```

10. To merge to main, on GitHub, click pull request button on code page and submit a pull request.

    Link the issue to the PR so that when the PR is closed, the issue is as well.

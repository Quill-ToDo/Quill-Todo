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

5. Install dependencies:  
  
    ```Bash
    pip install -r requirements.txt
    ```

6. Make and apply migrations if needed:

    > **Note:** If these commands do not work prefixed with `py`, also try `python3` and `python`.

    ```Bash
    py manage.py makemigrations 
    py manage.py migrate
    ```

7. Start server:

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

## Testing

### Front-end Testing

The test files are store near the code they test, for most components, in [tasks-fe/src/components/__tests__/](./tasks-fe/src/components/__tests__/).

After `cd`ing into `tasks-fe`, run all tests with `npm test a` or run tests for files that have changed since your last commit with `npm test`. The tests should re-run automatically every time you save.
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

**Ex:** `it.todo("should do something cool);`

#### Mocking Network Calls

We mock all of our calls to the back-end using declarative statements using [Mock Service Worker](https://mswjs.io/docs/). If you don't need to test any special cases (i.e. making sure things behave appropriately if the server returns and error code), feel free to import a default mock server configuration with some dummy tasks from [MockTaskApiHandler.js](./tasks-fe/src/API/MockTaskApiHandler.js). Pay special attention to the optional setup methods. If you want to override one of the mock handlers, see [alerts.js](./tasks-fe/src/components/__tests__/alerts.js) for examples.

#### Mocking time

Helpfully, [Luxon](https://moment.github.io/luxon/api-docs/index.html#settings) exposes a settings module that lets you set the output of `DateTime.now()` ([Example](./tasks-fe/src/components/__tests__/list.js#L29)). Mocking any other methods not mentioned in their setting will require using Jest mocks/spies I believe.

#### Useful testing resources

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

### Back-end Testing

*To-do!*

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

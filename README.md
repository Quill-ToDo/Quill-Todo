# Quill-ToDo

Creating a better to-do app. A Python adaptation of a [ROR project](https://github.com/lilyosah/COSC415-ToDo)

## Getting Started

### Starting the Development Server

#### Back-end

1. Clone repo wherever you'd like

2. [Set up virtual development environment](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/development_environment)

3. Switch to virtual environment following instructions of whichever virtual environment you're using

**Note:** If these commands do not work prefixed with `py`, also try `python3` and `python`.

4. Install dependencies:  
  
    ```Bash
    pip install -r requirements.txt
    ```

5. Make and apply migrations if needed:

    ```Bash
    py manage.py makemigrations 
    py manage.py migrate
    ```

6. Start server:

    ```Bash
    py manage.py runserver
    ```

##### Back-end Notes

- The homepage is currently broken for some reason, to access the API navigate to localhost:[port number]/api/tasks/
- If you install more Python dependencies during development, please run `pip3 freeze > requirements.txt` to keep this file updated

#### Front-end

0. Follow steps for back-end to get server running

**In a second terminal (so that you can leave the server running):**

1. Change to virtual environment (same as step 3)

2. Start React FE:

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

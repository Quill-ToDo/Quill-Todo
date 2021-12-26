# Quill-ToDo

Creating a better to-do app. A Python adaptation of a [ROR project](https://github.com/lilyosah/COSC415-ToDo)

## Getting Started

### Starting the Development Server

#### Back-end

1. Clone repo wherever you'd like

2. [Set up virtual development environment](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/development_environment)

3. Switch to virtual environment following instructions of whichever virtual environment you're using

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

#### Front-end

0. Follow steps for back-end to get server running

**In a second terminal (so that you can leave the server running):**

1. Change to virtual environment (same as step 3)

2. Start React FE:

    ```Bash
    cd tasks-fe
    npm start
    ```

 > Note: If you install more dependencies during development, please run `pip3 freeze > requirements.txt` to keep this file updated

## Commits, Branches, and Pull Requests   

### To work on a feature

1. Pull

    ```Bash
    git pull
    ```

2. Create a branch for the feature if there is not one already

    ```Bash
    git branch  [feature branch name]
    git checkout [feature branch name]
    ```

3. Make a working branch for your code based off of the feature branch

    ```Bash
    git branch  [working branch name]
    git checkout [working branch name]
    ```

4. Code on the working branch

5. Commit your changes

    ```Bash
    git add -A
    git commit -m "[your commit message. include a # issue number to link it]"
    ```

6. Merge your working with the feature branch

    ```Bash
    git checkout [feature branch name]
    git merge [working branch name]
    ```

   If there are merge conflicts, manually change the files listed under "merge" and commit changes

7. When the feature is done, merge it with main.

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

8. Push local feature branch to remote.

    ```Bash
    git checkout [feature branch name]
    git push origin [feature branch name]
    ```

9. To merge to main, on GitHub, click pull request button on code page and submit a pull request.

    Link the issue to the PR so that when the PR is closed, the issue is as well.

10. Monitor the PR and make any changes necessary! Thank you for helping!! ✨

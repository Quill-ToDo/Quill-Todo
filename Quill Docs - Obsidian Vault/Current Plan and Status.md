# Updated 6.7.2023
Status of tasks can be seen [in Projects tab under Migration](https://github.com/orgs/Quill-ToDo/projects/1/views/1) 

## Overview
- Architecture changes:
	- Rails → Django back-end (BE)
	- Templates/Views → React front-end (FE)
	- Back-end is doing a lot less work 
- Moved repos, now in [Quill-ToDo](https://github.com/Quill-ToDo)
- Most of the work is in the FE - React
- Going to implement our own calendar
- Scope increase 😨 mainly due to a million new ideas but also now handling the calendar

## Architecture Changes
[[Architecture Diagrams#Overall Architecture and Data Flow]]
High level:
- Front-end has state management and HTML + JS
	- Now planning on implementing our own calendar
- Back-end is pretty simple, just serving and updating data in DB

## Back-End
Overall, the back-end is doing a lot less work.

### Getting around - Important files and Dirs
- `./` - base dir
- `./todo` - for Django project files
- `./tasks` - For task module
- Start the back-end and manage a lot of Django stuff using `./manage.py` ie. `python manage.py`
- Settings are in `./todo/settings`
- Project endpoints are in `./todo/urls`
- API endpoints are in `./tasks/urls`
- Task model is in `./tasks/models`
- View methods are in `./tasks/views`

[[Back-End Concepts]]

### Status
#### Done
- Basic task model without validations
- Basic serializer using [Django Rest Framework](https://www.django-rest-framework.org/) (helps to access and define end-points) which is built using task model
- In task view:
	- Serving FE landing page after FE is built (`$ npm run build`)
	- Getting all tasks
	- Getting a task (id)
	- Patching (updating) a task (id)
	- Deleting a task (id)
	- Posting a task (model validations are needed here)
- Postgres DB set up

#### Needed for Migration
Not as much work for the app back-end as there was in Rails, but there are still things to do
- Model validations (making sure we only save data that’s formatted correctly, etc)
	- This is needed because the task serializer for our rest endpoints uses model validations to make sure the request is valid
- Change some queries to only allow requests to access/modify certain allowed fields. Ex: Shouldn’t be able to change task ID
- User model and related associations to tasks
- Back-end testing. Not through a server, basically just unit tests. 
- [All BE migration issues](https://github.com/Quill-ToDo/App/issues?q=is%3Aopen+is%3Aissue+project%3AQuill-ToDo%2FApp%2F1+label%3A%22%F0%9F%A7%AE+back-end%22)

#### Future
- Figuring out a more efficient way to leverage the BE. Searching through tasks is much faster in the BE but right now we query for all tasks to use in the FE and use linear searching to go through those and get the ones we want.
- Filling out a nice API for launch with documentation. If we have an API exposed on launch so that people can query for their tasks, and manipulate them through code however they want this would set us apart
	- Adding end-points that won’t necessarily be needed for FE but may be useful for users
	- This will require a lot of work for security, validations, etc. to make sure they can’t break things
- Adding support for "widget" idea [[📥Unorganized Ideas (dump stuff here)#Widgets]], don't even know what this will really require lol.
	- Any BE changes for supporting calendar
- [All BE future issues](https://github.com/Quill-ToDo/App/issues?q=is%3Aopen+is%3Aissue+project%3AQuill-ToDo%2FApp%2F2+label%3A%22%F0%9F%A7%AE+back-end%22)

## Front-End
The front-end is a lot more complicated now. A lot of conditional rendering logic and event handling is done in the front-end. It’s not just templating (inserting data into HTML), FE also has a state management system now. It can get a little confusing, so hopefully this diagram will be helpful to keep in mind how everything is interacting. 

FE [[Architecture Diagrams#Front End Components with MobX|UML Diagram]]

### Getting around: Important Files and Dirs
- `./tasks-fe/` - Front-end app
- .`/tasks-fe/package.json` - FE dependencies
- `./tasks-fe/src/App.js` - Component at the tippy top of the component tree
- `./tasks-fe/src/components/` - Where other components are
- `./tasks-fe/src/store/` - Where the stores are
- `./tasks-fe/src/API/` - Where the API to query the BE is as well as the mock API for tests

Check out [[Front-End Concepts We Use]] for some learninf


### Status
#### Done
- Basic list view
- Completing and uncompleting task updates MobX task store which updates BE
- Task show on click
- Alert system
	- Less urgent alerts (notice or success types) will scroll out and remove themselves without user interaction, more urgent (failure type) require dismissal
- Improved accessibility a bit which is really helpful for testing and is important in general
- Basic testing for list view at 95% coverage for FE
- Task creation popup
- Uses time-picker for time with the expectation that clicking on a date in the calendar should fill out that date in the selected creation field
- Has basic FE validations, still needed in BE

#### Needed for Migration
- Need to completely start over on the Calendar because I don't think it's a good idea to rely on Fullcalendar and we'll need a lot more flexibility
- Figuring out what’s wrong the the tests I had to skip
- At least 1 or two integration tests

#### Future
[So much. See all issues.](https://github.com/Quill-ToDo/App/issues?q=is%3Aopen+is%3Aissue+project%3AQuill-ToDo%2FApp%2F2+label%3A%22%F0%9F%8E%A8+front-end%22)
- Just has a lot of ideas for addinf more components than the List or Calendar and making Quill more flexible, so a lot of work will need to do be done to make it a cohesive ecosystem

## Going forward
- Not needed for migration but can begin working on it: Need people to look into the best way to package the task parser script for use in the app. I’m thinking NPM, that was we could call it from FE, but that may only be for Javascript. 
	- This also needs more work but I think it’s good enough for now that we can begin to figure out how to integrate it into the app!
- Design (functionality) questions I’d like to go over with at least someone else to get ideas
  
## Getting started with contributing
Steps:
1.  Poke through [issues on Github](https://github.com/Quill-ToDo/App/projects/1). They are labeled by what they are expected to involve. Some of them have more detailed descriptions than others. If there are any questions at all, reach out and I’ll explain more and can give guidance on where to look for things, how to get started, etc.
2.  If you find an issue you want to take, read CONTRIBUTING.md for how to get started. I’ve tried to make it as detailed as I can but if anything doesn’t work or isn’t clear, please reach out, I may have forgotten to include something or there may be an OS difference. I’ve made changes that make it easier to get up and running but we need PRs to get the changes into main.

# Ideas

## Increasing Usability for Neurodivergency 
- Removing free-will from all users ;)
	- Do the planning part for you
	- Don't make the user have to look at a task in the future and have to decide on days to work on it
	- Appeal to the widest audience first by applying automation, etc. by default
		- Maybe on first occurence, pop-up asking if you want this, sliding scale of automation maybe? Or choose which things to automate?
		- Current task and task on deck
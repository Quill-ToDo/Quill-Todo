# Updated 10.30.2022
Status of tasks can be seen [in Projects tab under Migration](https://github.com/orgs/Quill-ToDo/projects/1/views/1) 

## Overview
- Architecture changes:
	- Rails → Django back-end (BE)
	- Templates/Views → React front-end (FE)
	- Back-end is doing a lot less work 
- Moved repos, now in [Quill-ToDo](https://github.com/Quill-ToDo)
- Most of the work is in the FE - React
- Going to implement our own calendar
- Scope increase 😨

## Architecture Changes
[[Architecture Diagrams#Overall Architecture and Data Flow]]
High level:
- Front-end has state management and HTML + JS
	- Now planning on implementing our own calendar
- Back-end is pretty simple, just serving and updating data in DB

## Back-End
Overall, the back-end is doing a lot less work.

### Getting around - Important files and Dirs
- ./ - base dir
- ./todo - for Django project files
- ./tasks - For task module
- Start the back-end and manage a lot of Django stuff using ./manage.py
- Settings are in ./todo/settings
- Project endpoints are in ./todo/urls
- API endpoints are in ./tasks/urls
- Task model is in ./tasks/models
- View methods are in ./tasks/views

### Rails → Django
- From MVC (model-controller-view) to MVT (model-view-template)
	- Same idea, the names are just changed
 > Note: We are not using templates at all, our entire front-end is React

#### Admin Site
Django comes with a nice admin site to edit data: access by going to `<port number server is running on>/admin` in a browser.

#### API
Django also comes with a nice little API viewer to make easy queries. Access by going to `<port number server is running on>/API/tasks` in a browser. Look in the tasks url file for the endpoints.

### Postgres Database
We are using a PostgreSQL database for both development and production. This requires a little additional setup but it’s covered in contributing.md. Basically just need to install the DB and initialize a database in a certain way - we have a script that does this on windows at least and on Mac the script might work, the alternative is just recreating what the script does. Our tasks will not be synced between us. 

### Status
#### Done
- Basic task model without validations
- Basic serializer using [Django Rest Framework](https://www.django-rest-framework.org/) (helps to access and define end-points) which is built using task model
- In task view:
	- Serving FE landing page after FE is built ($ npm run build)
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
- [All BE future issues](https://github.com/Quill-ToDo/App/issues?q=is%3Aopen+is%3Aissue+project%3AQuill-ToDo%2FApp%2F2+label%3A%22%F0%9F%A7%AE+back-end%22)

## Front-End
The front-end is a lot more complicated now. A lot of conditional rendering logic and event handling is done in the front-end. It’s not just templating (inserting data into HTML), FE also has a state management system now. It can get a little confusing, so hopefully this diagram will be helpful to keep in mind how everything is interacting. 

FE [[Architecture Diagrams#Front End Components with MobX|UML Diagram]]

### Getting around: Important Files and Dirs
- ./tasks-fe/ - Front-end app
- ./tasks-fe/package.json - FE dependencies
- ./tasks-fe/src/App.js - Component at the tippy top of the component tree
- ./tasks-fe/src/components/ - Where other components are
- ./tasks-fe/src/store/ - Where the stores are
- ./tasks-fe/src/API/ - Where the API to query the BE is as well as the mock API for tests

### React
React is Javascript but much, much better. It’s much more ideal for a single-page app. The toolchain I’m using is [Create React App.](https://create-react-app.dev/) React uses composition (bigger pieces/components are made up of smaller components). It’s mostly a top-down hierarchy where data is passed from the bigger components to the smaller components which compose them, but the task store can be accessed at any level. 

React components can have their own methods and state and have one return method which returns the templated HTML. If something in their state (or the task store) changes, the components is re-rendered to show the updated changes. A nice thing is that only the parts of the component that actually change are re-rendered in the DOM.

### MobX State Management
- [More details here](https://mobx.js.org/defining-data-stores.html)

*Located in ./tasks-fe/src/store*

MobX provides state management beyond what React can. Our MobX store is basically a replica of the data we have in the database. The stores are made up of vanilla JS objects with some special MobX methods that listen for and changes and determine when to update other listening components.

#### Benefits
###### Faster 
Updates can be made from the FE to the task store instead of the back-end. This change will then percolate to the rest of the component tree and re-render any affected components immediately. While this is done, behind the scenes the actual network call to update the DB which takes a comparatively long time is made. If this request fails for any reason, we catch the failure response, notify the user of a failure, and revert the change in the FE.

##### Simple  
Using the store in a component requires one method call and [wrapping the component in an observer call](https://mobx.js.org/react-integration.html). 

##### Global
We don’t have to use a complex series of callbacks to access state way higher up in the component tree, we can access it at any level using React [context](https://reactjs.org/docs/context.html).

#### Responsibilities of a Store
##### Handle all network requests
For simplicity, the only place the API to access the back-end (./tasks-fe/src/API/TaskApi.js) should be called is in the MobX stores. 

- **Ex process:**
	- A user completes a task. 
	- In the show task component, a JS event listener is fired when the user clicks the check-box. 
	- The component holds a reference to the task object instance its pulling data from. 
	- The event handler accesses the task object and changes its completion status to true.
	- The MobX task object “hears” this change. It sends a PATCH request to the back-end to update this task in the DB.
	- As that request is going through, almost immediately the list component (rendered at the same time show task is) “hears” that the task store has changed, and re-renders the task in the list with the new completion status, rendering a check-mark and strike-through. 
	- Some time later the database receives the request. If it was successful, it succeeds silently and the user is none the wiser. If it fails, we listen for and catch the failure response in the task object. We revert the change that was made in the task object (immediately changing the UI visuals back) and render an alert to let the user know that something went wrong.

##### Keep the server up to date 
As soon as a task is changed in the FE, update the DB.

##### Hold accurate data  
Populate the store based on the DB data on init.

##### Make any computations that can be made immediately 
As soon as it has the data to make computations, it does so behind the scenes. That way, when we make a request to the store (Ex: call a method to return tasks sorted by competition status) if it has already computed that data the result is almost instantaneous. 


#### Task Store
Our task store holds a list of tasks and methods to change and interact with them. Each task is a Javascript object holding data relevant to the task and some methods to handle changes and interact with the task. This task object is different from the task component - the task object only holds data and has methods to change data, the task component is responsible for rendering this data into HTML.

For more detail, see [[Architecture Diagrams|FE UML diagram]]

#### Alert Store
We also have a store for alerts but that is less important than the task store. It basically allows us to render an alert from any component or anywhere we want.

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
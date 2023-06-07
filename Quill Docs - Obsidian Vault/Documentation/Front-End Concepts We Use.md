
### React
The toolchain I’m using is [Create React App.](https://create-react-app.dev/) React uses composition (bigger pieces/components are made up of smaller components). It’s mostly a top-down hierarchy where data is passed from the bigger components to the smaller components which compose them, but the task store can be accessed at any level. 

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
For simplicity, the only place the API to access the back-end (`./tasks-fe/src/API/TaskApi.js`) should be called is in the MobX stores. 

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

# Calendar

Calendar for tasks, by default vizualized like a monthly gant chart. Tasks are represented by lines spanning several days, with a hard check box for the due date and round check boxes for subtasks on different days.

# %% %%

## Features
### Task Addition Via Calendar
Click and drag or click to add task, will pull up task addition box with start and end dates already populated

### Different Time Views
- Default: Monthly
	- Tasks are vizualized like items in gant chart, as described in the intro
- Weekly / Custom Days
- Daily like time span

### Reschedule Tasks By Dragging End, Start, or Body of Task
Drag start of task to reschedule start, same for end, drag body of task to reschedule same number of days. 

 ---
 
## Ideas
### Timeblock for Subtasks
Or Subtasks or Subtasks? Shoul dnot timeblock for tasks bc they just have start and end



## Calendar Architecture




- Will need a way to drop onto a day and have it change something about that task
- Start with month view and displaying tasks
- Do I want to build the calenadr as an object in local cache? Or save in Mobx and then save in local storage?
- As an object in cache:
	- Will need to re-load data every open anyways so this wouldn't be as helpful Idt
- Object just haved in component
	- Maybe save as dictionary values? 
		- Date : data about that date
			- Ids of tasks on that date


### Idea: Calendar and day objects
#needsDesigning 

- Can JS objects be extendable? - Yes!
	- Idea: Have some base Calendar class with Date classes and the Date classes are extendable for each component. So might just have datetime and methods to get tasks out of the date or remote a task from a date sor something. 
		- But then calendar might add cusotm ordering fields. Can that be done in JS? 
		- #todo Should also make tasks extendable per component if this is the case.
	- Will extend tasks on an as-needed basis by putting needed tasks through a pipeline to generate new fields and data for them
		- Ex: All tasks in task store start with basic fields. You add a clock component. No task data updates yet(?). If you drag a task to the clock component, clock pipeline will be run on it and add the fields for clock.
		- Ex 2: Add a caendar component, at first it just shows the tasks for the current month, so tasks in the first month have the caldnar pipeline run on them. Once the fields are added, be very sparing about getting rid of them. These added fields will now show in the task description box. Whuch should also be eidtiable
- Calendar object. This will store info about dates and which tasks are associated with them. Should be able to grab info about each day from components and access them.

```
Calendar: {
	Dict<DateTime : Day>
	GetByMonth () 
	// Should only be called by task DB, not component devs so you don't have to make two calls to change for task bd and calendar
	priv RescheduleTask
	priv DeleteTask
	priv add task
	.. etc.
	
}

Day: {
	date: DateTime
	Dict<tasks>: { 
		int id : Task 
	}
}
```
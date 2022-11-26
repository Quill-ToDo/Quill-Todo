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
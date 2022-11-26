# Quill
#needsEdit 
- [GitHub](https://github.com/Quill-ToDo/App)

Quill is a productivity and task management app that allows users to create, visualize, organize, plan, distribute, and complete tasks throughout use of different components. 

**Core [[Components]]:**
- [[List]]
- [[Calendar]]
- [[Habit Tracker]]
- [[Clock]]
- [[Note]]

*Concept*
![[ListAndCalendarConcept.png]]
*V.1 in Rails App![[QuillV1.png]]*
![[QuillV1.png]]

# Other Features

- [[Tasks|Task]] features
	- Different [[Groups]]/projects/categories for tasks
	- Different priorities for each [[Tasks|task]]
	- Optional [[Reminders]]/alerts for tasks
	- Adding descriptions/more detail in markdown to each [[Tasks|task]] in an individual task view
- Quick-add [[Task Creation]] using NLP
- [[Work Distribution]] system to encourage users to not overwhelm themselves with work and plan work well
- [[Calendar Sync]]hronization with other calendar apps so that you can see how many events you have for each day and add tasks accordingly
- [[Reward System]]s to encourage users to use the app and complete tasks and goals
- Optional [[Local Mode]] where tasks are saved as text notes in markdown and do not have to be connected to cloud 
- [[Modding System]] so users can create components
- 

## Table of Contents

- [[Quill|Quill (here)]] 
- [[Grid Dashboard]]
- [[Tasks]]
- [[Components]]
	- [[List]]
	- [[Calendar]]
	- [[Habit Tracker]]
	- [[Clock]]
	- [[Note]]
- Features
	- [[Calendar Sync]]
	- [[Reward System]]
	- [[Work Distribution]]
	- [[Task Creation]]
		- [[NLP Task Creation Alg]]

## Core Values

- Sliding payment scale
- Open-source
- Privacy-minded
- Accessibility consdered first
- Collaboration tools will not be paywalled

## How it works

- You make tasks, entering fields, clicking on dates on a calendar, list, or by using natural language processing.
	- NLP Ex: "walk the dog every thursday eve" becomes a task called 
	  "Walk the dog" which repeats every Thursday at 5 pm (configurable)
- Tasks have an optional start date and required end/due date, so that you can plan when you should be working on it. 
- Tasks can have subtasks/work dates. These could be thought of the days you plan to work on the task.
- These two features allow you to vizualize when you get the task, when it's due, and plan and distribute days you want to work on it appropriately, among your other tasks.
	- Surprisingly, this is a hard to come by feature in most to-do apps.
- The apps dashboard is a grid.
- You can add components to the grid and change their dimensions.
- Tasks are synced across the components and can be visualized and interacted with in different ways in different components, and different components will interact with eachother in different ways.
	- For example, dragging a task from the list to the calendar will change it's due date.
- Configurable system will encourage you to distribute work on tasks across the span you are working on it more evenly if you are doing too many tasks for one or more days 

### Ex
- A user has a list and calendar component on their dashboard.
- The user clickt the add new task button and types “Start SWE project this Tuesday and complete by next Tuesday” in the title box
- The task is translated and the fields are auto-populated
- The user looks it over and submits the task
    - On the list view: A task is added with a round checkbox by this Tuesday with the title “Start SWE project”. Next tuesday where there is a square check box. The title next to this box reads “Complete SWE project”.
    - On the calendar view: A line of the same color on the list view is added to the calendar view with the same round start check box and square end box, spanning from this Tuesday to next, horizontally.
- The user renames the title of the due date task to be “Turn in”
- The user decides they want to work on this project on Wednesday, so they click on the line in the calendar where it passes the Wednesday section in the calendar view. A round checkbox appears.
- They decide to add the title “Implement ideas” to this new subtask.
- As they progress through the week, each day they see a daily to-do list of the tasks they need to complete. On Tuesday, they see “Start SWE project”. On Wednesday, they see “Implement ideas”
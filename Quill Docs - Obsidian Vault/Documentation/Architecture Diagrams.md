
# Overall Architecture and Data Flow

<div style="width: 800px; height: 480px; margin: 10px; position: relative;"><iframe allowfullscreen frameborder="0" style="width:640px; height:480px" src="https://lucid.app/documents/embedded/7e73cb90-55ec-42f0-bec9-12f2b1a3316f" id="rF74TrPhvELv"></iframe></div>

# Front End Components with MobX

<div style="width: 640px; height: 480px; margin: 10px; position: relative;"><iframe allowfullscreen frameborder="0" style="width:640px; height:480px" src="https://lucid.app/documents/embedded/335b0e31-7f5d-4a45-b30e-3fec6f71b69e" id="KM74xWQh-WxA"></iframe></div>

### Timeline Store
*To be added to diagram above #📌*

#### Ideas to think through more
- Adding mroe dates as you scroll further? Do you need to load in everything at once? Just dates that tasks are in? Can find the tasks that have starts and ends within a certain range like 3 months or a month
- Eventually need a way to order tasks within the calendar component. To be added as a pipeline component. The kind of alg that I just gave up on learning, will be a good opportunity for me to relearn. 
- Just having a reference to task and extendung task to add more fields and methods, etc

####  Plan
New MobX store Timeline that holds a central timeline with all the tasks and important fields about them. Components that are active will add parts to a pipeline that processes the timeline and adds fields for each component
	*This will work well for JS where you can add fields as you want, but how will I store this in the DB? Dynamic columns? Could make new tables for each fields for those components? Is there a way to link dynamic types if tables together like that?*
- Timeline is Observable. Kept up to date with state of tasks because:
	- Changing a property on task:
		- That tasks change whatever method will see which dates are affected, parse through them on the timeline and make needed changes to the tasks. 
		- MobX *might* also just take care of it, need to research this #📌 
	RT of going through all dates between change is linear, can we do better...
```JS
Timeline = 
{
		DateTime <Luxon, immutable> : 
		{
			date : DateTime,
			tasks : 
			 {
				id : Task,
				order : 0, /* Default ordering */
				type : WORK/START/DUE, /* what does the task have on this date */
				componentFields : 
				{
					calendarOrdering : 2, /* Custom added from the calendar component */
					listORdering : 5,
				}
			} 
		},
}


Timeline = 
{
		DateTime <Luxon, immutable> : 
		{
			date : DateTime,
			tasks : 
			 {
				id : Task,
				id : Task,
			} 
		},
}

```

Alter


#### Notes
- Actual divs in calendar can just store id of task if my store is a map or we have a map of id : task. This would be a good change to make for sure if it's not like that. #📌 
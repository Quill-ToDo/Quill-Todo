import React, { 
    Fragment, 
    useEffect, 
    useRef, 
    useState
} from "react";
import { observer } from "mobx-react-lite";
import { DateTime } from "luxon";
import { DEFAULT_DUE_DATETIME, DEFAULT_START_DATETIME, TaskDateFields, TaskModel } from "@/store/tasks/TaskModel";
import { 
    Checkbox, 
    TaskTitle, 
    TaskWrapper, 
    TaskDueDate, 
    TaskBeingDragged
} from "@/widgets/TaskDetail/TaskComponents";
import { DATETIME_FORMATS, timeOccursBetweenNowAndEOD } from "@util/DateTimeHelper";
import './list.css'
import "@/widgets/TaskDetail/tasks.css";
import TaskStore from "@/store/tasks/TaskStore";
import { ERROR_ALERT, addAlert } from "@/alerts/alertEvent";
import { 
    ALIGNED_CLASS, 
    CENTERED_CLASS, 
    DARK_SECTION_CLASS, 
    ICONS, 
    MID_SECTION_CLASS, 
    SUBTLE_CLASS 
} from "@/app/@util/constants";
import { getWidgetSessionStorageData, PlaceableWidget, setWidgetSessionStorageData } from "@/widgets/generic-widgets/Widget";
import { Draggable, Droppable } from "@/app/@util/Draggable";
import { useTaskStore } from "@/store/StoreProvider";
import { TASK_DRAG_TYPE, TaskDragData } from "@/app/@util/DraggableTypes";

const SECTION_TOGGLE_DURATION = 100;
export const OVERDUE = "Overdue";
export const TODAY = "Today";
export const UPCOMING = "Upcoming";
export const UNDATED = "Undated";
export const DONE = "Done";
export const LIST_WIDGET_NAME = "List";

const saveSessionStorageItem = (key: any, value: any) => setWidgetSessionStorageData({widgetName: LIST_WIDGET_NAME, itemKey: key, value: value});
const getSessionStorageItem = (key: any) => getWidgetSessionStorageData({widgetName: LIST_WIDGET_NAME, itemKey: key});

//#region List 
/**
 * The list view for tasks.
 */
export const ListWidget = observer(({passedStore}: {passedStore?: TaskStore}={}) => {
    const taskStore: TaskStore = passedStore ? passedStore : useTaskStore();
    // All possible views for the list
    const possibleListFormats = {
        "by-status": <ByStatusThreeSection store={taskStore}/>
    };
    const listFormat = "by-status";

    // Before content is loaded show placeholder
    return (
        <PlaceableWidget 
            widgetName={LIST_WIDGET_NAME}
            icon={ICONS.LIST} 
            doneLoading={taskStore &&taskStore.isLoaded}    
        >
            { possibleListFormats[listFormat] }
        </PlaceableWidget>
    );
});

/**
 * A list format where tasks are separated into overdue, today, and upcoming sections.
 */ 
const ByStatusThreeSection = observer(({store}: {store: TaskStore}) => {  
    const tasks : Set<TaskModel> = new Set(store.tasksInRange({startTime: DateTime.now().minus({years:10}), endTime: DateTime.now().plus({years:10})}));
    const now = DateTime.now();
    const sorted = (taskList : TaskModel[]) => {
        return taskList.toSorted((a, b) => { 
            if (a.complete === b.complete) {
                if (a.due && b.due) {
                    return a.due < b.due ? -1 : 1;
                }
                else if (a.due) {
                    return 1
                }
                else if (b.due) {
                    return -1;
                }
                else {
                    if (a.start && b.start) {
                        return a.start < b.start ? -1 : 1;
                    }
                    else if (a.start) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                }
            } 
            return a.complete ? 1 : -1; 
        })
    };
    let complete : TaskModel[] = [];
    let undated : TaskModel[] = [];
    let overdue  : TaskModel[] = [];
    let todayDue  : TaskModel[] = [];
    let todayWork : TaskModel[] = [];
    let upcoming : TaskModel[] = [];
    tasks.forEach(task => {
        let array = undated;
        if (task.complete) {
            array = complete;
        }
        else if (task.due == null && task.start == null) {
            array = undated;
        } else if (task.due && task.due <= now) {
            array = overdue;
        }
        else if (task.due && timeOccursBetweenNowAndEOD(task.due)) {
            array = todayDue;
        }
        else if (task.start && task.start <= now) {
            array = todayWork;
        }
        else {
            array = upcoming;
        }
        array.push(task);
    })

    complete = sorted(complete);
    undated = sorted(undated);
    overdue = sorted(overdue);
    todayDue = sorted(todayDue);
    todayWork = sorted(todayWork);
    upcoming = sorted(upcoming);

    const sectionData: {title: string, sectionId: number, content: SubSectionContent[]}[] = [
        {
            title: OVERDUE,
            sectionId: 0,
            content: [{
                "tasks": overdue,
                "type": "due",
                "emptyText": "No overdue tasks",
                taskDropInSectionCallback: (task) => {
                    // If not already overdue, 
                    // Change task due date to this morning
                    if (!task.overdue) {
                        task.due = DEFAULT_START_DATETIME()
                        if (task.start && task.start > task.due) {
                            task.start = null;
                        }
                    }
                }
            }],
        },
        {
            title: TODAY,
            sectionId: 1,
            content: [
                {
                    "title": "Due",
                    "tasks": todayDue,
                    "type": "due",
                    "emptyText": "No tasks due today",
                    taskDropInSectionCallback: (task) => {
                        // If not already due today, change due date to this date
                        if (!task.due) {
                            task.due = DEFAULT_DUE_DATETIME();
                            return;
                        }
                        // Keep the existing time if the due date is already set
                        if (!task.due.hasSame(now, "day")) {
                            task.due.set({year: now.year, month: now.month, day: now.day});
                        }
                        if (task.overdue) {
                            task.due = DEFAULT_DUE_DATETIME();
                        }
                        if (task.start && task.start > task.due) {
                            task.start = null;
                        }
                    }
                },
                {
                    "title": "In Progress",
                    "tasks": todayWork,
                    "type": "scheduled",
                    "emptyText": "No tasks to work on today",
                    taskDropInSectionCallback: (task) => {
                        // Change task due date to tomorrow and start date to this morning if unset
                        // If not already in progress,
                        
                    }
                }
            ]
        },
        {
            title: UPCOMING,
            sectionId: 2,
            content: [{
                "tasks": upcoming,
                "type": "due",
                "emptyText": "No upcoming tasks",
                taskDropInSectionCallback: (task) => {
                    // If not already upcoming,
                    // Change task start date to tomorrow
                    if (task) {
                        // TODO it ends in error sometime here
                        // If there is a due or start date behind current time, move it forward a day
                        // If there is no start or due time, set due to tomorrow
                        if (task.start && task.start < now) {
                            task.start = DEFAULT_START_DATETIME().plus({day: 1});
                        } 
                        if (task.due && task.due < now) {
                            task.due = DEFAULT_DUE_DATETIME().plus({day: 1});
                        }
                        if (!task.due && !task.start) {
                            task.due = DEFAULT_DUE_DATETIME().plus({day: 1});
                        }
                    }
                },
            }]
        },
        {
            title: UNDATED,
            sectionId: 3,
            content: [{
                "tasks": undated,
                "type": "due",
                "emptyText": "No undated tasks",
                taskDropInSectionCallback: (task) => {
                    // If not already undated
                    // Remove task start and due date
                    if (task && (task.start || task.due)) {
                        task.start = null;
                        task.due = null;
                    }
                },
            }]
        },
        {
            title: DONE,
            sectionId: 4,
            content: [{
                "tasks": complete,
                "type": "due",
                "emptyText": "No undated tasks",
                taskDropInSectionCallback: (task) => {
                    // If not already complete
                    // Mark task complete
                    if (task && !task.complete) {
                        task.complete = true;
                    }
                },
            }]
        },
    ]

    if (!sectionData.some(section => section.content.some(subsection => subsection.tasks.length > 0))) {
        return (
            <section>
                <div className={MID_SECTION_CLASS}>
                    <p className={`${CENTERED_CLASS} ${ALIGNED_CLASS}"`}>You have no tasks to work on. Try adding one!</p>
                </div>
            </section>
            );
    }

    return (
        <Fragment>
            {sectionData.map(section => {
                return section.content.some(subsection => subsection.tasks.length > 0) ? <Section 
                    key={section.sectionId}
                    title={section.title}
                    sectionId={section.sectionId}
                    content={section.content}
                /> : undefined;
            })}
        </Fragment>
    )
});
//#region Section 
/**
 * A section of tasks within a list. May be divided into subsections.
 */
const Section = observer(({
    title, 
    sectionId, 
    content, 
    classNames,
}: {
    title: string, 
    sectionId: number, 
    content: SubSectionContent[], 
    classNames?: string,
}) => {
    const sessionStorageKey = `section-${sectionId}-collapsed`;
    const [sectionOpen, setSectionOpen] = useState(true);
    
    var collapseToolTip = sectionOpen ? `Collapse ${title.toLowerCase()} section` : `Expand ${title.toLowerCase()} section`;
    
    useEffect(() => {
        const alreadyCollapsed = getSessionStorageItem(sessionStorageKey); 
        if (alreadyCollapsed !== undefined) {
            setSectionOpen(!alreadyCollapsed);
            if (alreadyCollapsed) {
                handleSectionToggle(sectionId);
            }
        }
    }, []);
    useEffect(() => {
        if (!sectionOpen) {
            saveSessionStorageItem(sessionStorageKey, !sectionOpen);
        }
    }, [sectionOpen]);
    
    return (
        <section id={getSectionId(sectionId)} aria-labelledby={`section-${sectionId}-title`} >
            <div 
                className={`${MID_SECTION_CLASS}${classNames ? " " + classNames : ""}`}
                role="none"
                >
                <header className="header-container collapsible">
                    <button 
                        className="btn small square" 
                        title={collapseToolTip} 
                        aria-expanded={sectionOpen}
                        onClick={(e) => {
                            setSectionOpen(!sectionOpen);
                            handleSectionToggle(sectionId);
                        }}
                    >
                        { ICONS.DOWN }
                    </button>
                    <h2 
                        id={`section-${sectionId}-title`}
                    >
                        {title}
                    </h2>
                </header>
                <div className="section-collapsible" role="none">
                    <SubSection
                        sectionContent={content}
                    />
                </div>
            </div>
        </section>
    );
})

function getSectionId(sectionId: number) {
    return "task-section-" + sectionId;
}

interface SubSectionContent {
    title?: string, 
    tasks: TaskModel[], 
    type: TaskDateFields | "scheduled", 
    emptyText: string,
    taskDropInSectionCallback: (task: TaskModel) => void
};
/**
 * The contents of a subsection with a list section serparated out for performance
 */
const SubSection = observer(({
    sectionContent,
    ...props
}: {
    sectionContent: SubSectionContent[]
}) => {
    return sectionContent.map((section) => {
        return ( 
            <TaskSectionContent 
                content={section}
                key={`${section.emptyText}`}
            />
            )
        })
})
//#region Task list

/**
 * The tasks within a subsection.
 */
const TaskSectionContent = observer(({content}: {content: SubSectionContent}) => {
    const taskStore = useTaskStore();
    const sectionTitleId = `${DARK_SECTION_CLASS}-title-${content.title}`;
    return (
        <Droppable
            collisionPriority={30}
            itemData={
                {
                    type: "list section",
                    accepts: [TASK_DRAG_TYPE],
                }
            }
            callbacksForAcceptedDragTypes={{
                [TASK_DRAG_TYPE]: {
                    setDataWhenDragOver({drag}) {
                        // set dragged task as being edited and then do the thing
                        if (drag) {
                            const task = taskStore.getTaskById(drag.id);
                            if (task) {
                                task.startEditing();
                                content.taskDropInSectionCallback(task);
                            }
                        }
                    },
                    saveDataWhenDragEnds({drag}) {
                        // Save task edits, set as done editing
                        if (drag) {
                            const task = taskStore.getTaskById(drag.id);
                            if (task) {
                                content.taskDropInSectionCallback(task);
                                task.saveEdits();
                            }
                        }
                    },
                    resetDataWhenDragOff({ drag, drop, e }) {
                        // Reset task edits
                        if (drag) {
                            const task = taskStore.getTaskById(drag.id);
                            if (task) {
                                task.abortEdits();
                            }
                        }
                    },
                }}
            }
        >
            <section 
                aria-labelledby={content.title ? sectionTitleId : ""} 
            >
                {content.title && <h3 
                    id={sectionTitleId} 
                    className={CENTERED_CLASS}
                    >
                        {content.title}
                    </h3>}
                <div className={DARK_SECTION_CLASS}>
                    {content.tasks.length ? 
                    <TaskList 
                        tasks={content.tasks} 
                        type={content.type}    
                    /> :
                    <p className={`${SUBTLE_CLASS} ${CENTERED_CLASS}`}>{content.emptyText}</p>
                    }
                </div>
            </section>
        </Droppable>
    )
})

/**
 * The list of tasks, separated to a different method for performance
 */
const TaskList = observer(({
    tasks, 
    type
}: {
    tasks: TaskModel[], 
    type: TaskDateFields | "scheduled",
}) => {
    const listRef = useRef(null);
    return <ul 
            role="group" 
            ref={listRef}
        >
        { tasks.map((task) => {
            return ( 
                <Draggable <TaskDragData>
                    mayBeDropped={true}
                    itemData={{
                        showDropPreview: true,
                        type: TASK_DRAG_TYPE,
                        id: task.id,
                    }}
                    actionTitle="Move task"
                    key={`task-li-${task.id}`}
                    draggedPresentation={<TaskBeingDragged 
                        task={task} 
                        type={type ==="scheduled" ? "start" : type} 
                    />}
                >
                    <li 
                        className={"task"}
                    >
                        <ListViewTask
                            task={task}
                            type={type}
                            />
                    </li> 
                </Draggable>
            )
        })}
    </ul>
})

/**
 * One task within the list
 */
const ListViewTask = observer(({
    task, 
    type,
}: {
    task: TaskModel, 
    type: TaskDateFields | "scheduled",
}) => {
    const id = `task-${task.id}`;
    const checkboxId = `list-checkbox-${task.id}`;
    const dateForm = DateTime.DATE_SHORT;

    const taskWrapper = <TaskWrapper 
                task={task}
                {...{
                    id: id,
                    className: "inline"
                }}
            >
                <Checkbox
                    type={type === "scheduled" ? "start" : type}
                    checkboxId={checkboxId}
                />
                <div 
                    className="title-date-wrapper"
                >
                    <label 
                        htmlFor={checkboxId} 
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <TaskTitle editAllowed={false} />
                    </label>
                    <TaskDueDate format={DATETIME_FORMATS.D_t} editable={false}/>
                </div>
            </TaskWrapper>;
    return taskWrapper;
})

//#endregion Task list
//#region Section toggle
/**
 * Collapse/expand sections when the toggle symbol is clicked.
 * 
 * @param {sectionId} The number of the section to toggle visibility of.
 */
function handleSectionToggle (sectionId: number) {
    const taskSection = document.getElementById(getSectionId(sectionId));
    if (!taskSection) {
        addAlert(document.querySelector("#list"), ERROR_ALERT, "Could not toggle section :(");
        return;
    }
    const outer_section: HTMLElement = taskSection.querySelector(`.${MID_SECTION_CLASS}`) as HTMLElement;
    const inner_section: HTMLElement = taskSection.getElementsByClassName("section-collapsible")[0] as HTMLElement;
    inner_section.style.transition = `transform ${SECTION_TOGGLE_DURATION * .98}ms ease-in-out 0s`;
    outer_section.style.transition = `height ${SECTION_TOGGLE_DURATION}ms ease-in-out 0s`;
    outer_section.style.height = "fit-content";
    toggleSection(taskSection);
    flipkarat(taskSection);
}

/**
 * Toggle a section opened or closed.
 * 
 */
function toggleSection(taskSectionToToggle: HTMLElement) {
    var outerSection = taskSectionToToggle.querySelector(`.${MID_SECTION_CLASS}`) as HTMLElement;
    var innerContent = taskSectionToToggle.querySelector(".section-collapsible") as HTMLElement;
    if (!outerSection || !innerContent) {
        addAlert(taskSectionToToggle, ERROR_ALERT, "Could not toggle section :(");
        return;
    }
    
    toggleInlineHeightAttribute(outerSection);
    const header = taskSectionToToggle.querySelector(".header-container.collapsible");
    const sectionHeaderHeight = header ? parseFloat(window.getComputedStyle(header).getPropertyValue('height')) : 0;

    if (innerContent.style.display === "none") {
        // Expand
        innerContent.style.display = "block";
        const sectionContentHeight = parseFloat(window.getComputedStyle(innerContent).getPropertyValue('height'));
        setTimeout(() => {
            // For some reason it needs a timeout after switching to block display before transforming. Don't know why.
            outerSection.style.height = (sectionHeaderHeight + sectionContentHeight) + "px";
            innerContent.style.transform = "scaleY(1)";
        }, SECTION_TOGGLE_DURATION/100)
    } else {
        // Collapse
        innerContent.style.transform = "scaleY(.01)";
        var collapsedHeight = sectionHeaderHeight + "px";
        outerSection.style.height = collapsedHeight;
        setTimeout(() => {
            innerContent.style.display = "none";
        }, SECTION_TOGGLE_DURATION)
    }

    setTimeout(() => {
        toggleInlineHeightAttribute(outerSection);
    }, SECTION_TOGGLE_DURATION+10)
}

/**
 * Add an inline height attribute to the passed DOM element equal to its current calculated height. Doing this because 
 * if I don't then the height transition animation wont work the first time it's collapsed.
 * 
 * @param {*} outerSection The DOM element to add the attribute to
 */
function toggleInlineHeightAttribute (outerSection: HTMLElement) {
    if (outerSection.style.height === "fit-content") {
        // Set inline height attribute
        const outerHeight = parseFloat(window.getComputedStyle(outerSection).getPropertyValue('height'));
        outerSection.style.height = outerHeight + "px";
    }
    else {
        // Remove inline height attribute (after animation is done so that the section will respond properly to window resizes)
        outerSection.style.height = "fit-content";
    }
}

/**
 * Flip the karat indicating if the section is opened or closed within a section.
 */
function flipkarat (taskSectionWithKarat: HTMLElement) {
    let symbol: HTMLElement = taskSectionWithKarat.querySelector(".expand-symbol") as HTMLElement;
    if (!symbol) {
        addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "Could not toggle section :(");
        return;
    }
    const start = "rotate(180deg)";
    const end = "rotate(0deg)";
    symbol.style.transition = `transform ${SECTION_TOGGLE_DURATION}ms ease-in-out 0s`;
    if (
        // symbol.style._webkit_transform === start || 
        // symbol.style._ms_transform === start || 
        symbol.style.transform === start) {
        // symbol.style._webkit_transform = end;
        // symbol.style._ms_transform = end;
        symbol.style.transform = end;
        } else {
        // symbol.style._webkit_transform = start;
        // symbol.style._ms_transform = start;
        symbol.style.transform = start;
    }
}

//#endregion Section Toggle
//#endregion Section
//#endregion List 
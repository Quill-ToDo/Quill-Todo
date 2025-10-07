import React, { 
    ForwardedRef,
    Fragment, 
    useEffect, 
    useRef, 
    useState
} from "react";
import { observer } from "mobx-react-lite";
import { DateTime } from "luxon";
import { TASK_DRAG_TYPE, TaskModel } from "@/store/tasks/TaskModel";
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
import { ICONS } from "@/app/@util/constants";
import { combineClassNamePropAndString } from '@util/jsTools';
import { getWidgetSessionStorageData, PlaceableWidget, setWidgetSessionStorageData } from "@/widgets/generic-widgets/Widget";
import { Draggable } from "@/app/@util/Draggable";
import { useTaskStore } from "@/store/StoreProvider";

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
                "emptyText": "No overdue tasks"
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
                },
                {
                    "title": "In Progress",
                    "tasks": todayWork,
                    "type": "scheduled",
                    "emptyText": "No tasks to work on today",
                }
            ]
        },
        {
            title: UPCOMING,
            sectionId: 2,
            content: [{
                "tasks": upcoming,
                "type": "due",
                "emptyText": "No upcoming tasks"
            }]
        },
        {
            title: UNDATED,
            sectionId: 3,
            content: [{
                "tasks": undated,
                "type": "due",
                "emptyText": "No undated tasks"
            }]
        },
        {
            title: DONE,
            sectionId: 4,
            content: [{
                "tasks": complete,
                "type": "due",
                "emptyText": "No undated tasks"
            }]
        },

    ]

    if (!sectionData.some(section => section.content.some(subsection => subsection.tasks.length > 0))) {
        return (
            <section>
                <div className="mid-section">
                    <p className="centered aligned">You have no tasks to work on. Try adding one!</p>
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
                className={`mid-section${classNames ? " " + classNames : ""}`}
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
    type: typeof TaskModel.checkboxStyles, 
    emptyText: string,
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
    const sectionTitleId = `dark-section-title-${content.title}`;
    return (
        <section 
            aria-labelledby={content.title ? sectionTitleId : ""} 
        >
            {content.title && <h3 
                id={sectionTitleId} 
                className="centered"
                >
                    {content.title}
                </h3>}
            <div className="dark-section">
                {content.tasks.length ? 
                <TaskList 
                    tasks={content.tasks} 
                    type={content.type}    
                /> :
                <p className="subtle centered">{content.emptyText}</p>
                }
            </div>
        </section>
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
    type: typeof TaskModel.checkboxStyles,
}) => {
    const listRef = useRef(null);
    return <ul 
            role="group" 
            ref={listRef}
        >
        { tasks.map((task) => {
            return ( 
                <Draggable
                    droppable={true}
                    itemType={TASK_DRAG_TYPE}
                    itemData={{id: task.id}}
                    actionTitle="Move task"
                    key={`task-li-${task.id}`}
                    renderDraggableItem={(props, ref) => <li 
                            {...props}
                            ref={ref}
                            className={combineClassNamePropAndString("task", props)}
                        >
                            <ListViewTask
                                task={task}
                                type={type}
                                />
                        </li>}
                    renderItemBeingDraggedIfDifferent={(props, ref) => <TaskBeingDragged 
                        {...props}
                        ref={ref}
                        task={task} 
                        type={type} 
                    />}
                > 
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
    type: typeof TaskModel.checkboxStyles,
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
                    type={type}
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
    const outer_section: HTMLElement = taskSection.querySelector(".mid-section") as HTMLElement;
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
    var outerSection = taskSectionToToggle.querySelector(".mid-section") as HTMLElement;
    var innerContent = taskSectionToToggle.querySelector(".section-collapsible") as HTMLElement;
    if (!outerSection || !innerContent) {
        addAlert(taskSectionToToggle, ERROR_ALERT, "Could not toggle section :(");
        return;
    }
    
    toggleInlineHeightAttribute(outerSection);

    const sectionHeaderHeight = parseFloat(window.getComputedStyle(taskSectionToToggle.querySelector(".header-container.collapsible")).getPropertyValue('height'));

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
    if (symbol.style._webkit_transform === start || 
        symbol.style._ms_transform === start || 
        symbol.style.transform === start) {
        symbol.style._webkit_transform = end;
        symbol.style._ms_transform = end;
        symbol.style.transform = end;
        } else {
        symbol.style._webkit_transform = start;
        symbol.style._ms_transform = start;
        symbol.style.transform = start;
    }
}

//#endregion Section Toggle
//#endregion Section
//#endregion List 
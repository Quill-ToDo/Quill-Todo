import React, { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { DateTime } from "luxon";
import { TaskModel } from "@/store/tasks/TaskModel";
import { DateTimeWrapper, Checkbox, TaskTitle, TaskWrapper } from "@/widgets/TaskDetail/TaskComponents";
import { timeOccursBeforeEOD, timeOccursBetweenNowAndEOD } from "@/app/@util/DateTimeHelper";
import './list.css'
import "@/widgets/TaskDetail/tasks.css";
import TaskStore from "@/store/tasks/TaskStore";
import { ERROR_ALERT, addAlert } from "@/alerts/alertEvent";

const SECTION_TOGGLE_DURATION = 100;

//#region List 
/**
 * The list view for tasks.
 */
export const ListWidget = observer(({taskStore}: {taskStore: TaskStore}) => {
    // How long sections should take to collapse in millis

    // All possible views for the list
    const possibleListFormats = {
        "by-status": <ByStatusThreeSection store={taskStore}/>
    };

    const listFormat = "by-status";
    const loading = 
        <div className="loading-wrapper take-full-space">
            <div>
                <i className="fas fa-list-alt loading-icon fa-4x"></i>
                <p className="">Loading list...</p>
            </div>
        </div>;

    // Before content is loaded show placeholder
    return (
        <section id="list-wrapper" aria-label="Task list">
            {taskStore.isLoaded ? possibleListFormats[listFormat] : loading}
        </section>
    );
});

/**
 * A list format where tasks are separated into overdue, today, and upcoming sections.
 */ 
const ByStatusThreeSection = observer(({store}: {store: TaskStore}) => {
    const tasks : TaskModel[] = store.tasksInRange({startTime: DateTime.now().minus({years:10}), endTime: DateTime.now().plus({years:10})});
    const now = DateTime.now();
    const sorted = (taskList : TaskModel[]) => {
        return taskList.toSorted((a, b) => { 
            if (a.complete === b.complete) {
                return a.due < b.due ? -1 : 1;
            } 
            return a.complete ? 1 : -1; 
        })
    };
    const overdue = sorted(tasks.filter(task => task.due <= now));
    const todayDue = sorted(tasks.filter(task => timeOccursBetweenNowAndEOD(task.due)));
    const todayWork = sorted(tasks.filter(task => 
        (task.start && task.start <= now) 
        && (now < task.due)
        && !(timeOccursBetweenNowAndEOD(task.due))
        ));
    const upcoming = sorted(tasks.filter(task => 
        (!task.start || now <= task.start) && !(timeOccursBeforeEOD(task.due))
        ));


    if (!(overdue.length || todayDue.length || todayWork.length || upcoming.length)) {
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
            <Section 
                title="Overdue"
                sectionNum={0}
                content={
                    [{
                        "tasks": overdue,
                        "type": "due",
                        "emptyText": "No overdue tasks"
                    }]
                }
            />
            <Section 
                title="Today"
                sectionNum={1}
                content={
                    [
                        {
                            "title": "Due",
                            "tasks": todayDue,
                            "type": "due",
                            "emptyText": "No tasks due today",
                        },
                        {
                            "title": "Work",
                            "tasks": todayWork,
                            "type": "work",
                            "emptyText": "No tasks to work on today",
                        }
                    ]
                }
            />
            <Section 
                title="Upcoming"
                sectionNum={2}
                content={
                    [{
                        "tasks": upcoming,
                        "type": "due",
                        "emptyText": "No upcoming tasks"
                    }]
                }
            />
        </Fragment>
    )
});
//#region Section 
/**
 * A section of tasks within a list. May be divided into subsections.
 */
const Section = observer(({title, sectionNum, content, classNames}: {title: string, sectionNum: number, content: SubSectionContent[], classNames?: string}) => {
    const [sectionOpen, setSectionOpen] = useState(true);

    var collapseToolTip = sectionOpen ? `Collapse ${title.toLowerCase()} tasks` : `Expand ${title.toLowerCase()} tasks`;

    
    return (
        <section id={getSectionId(sectionNum)} aria-labelledby={`section-${sectionNum}-title`} >
            <div className={`${classNames ? classNames : ""} mid-section`}>
                <div className="header-container collapsible">
                    <button 
                        className="btn small square" 
                        title={collapseToolTip} 
                        aria-expanded={sectionOpen}
                        onClick={(e) => {
                            setSectionOpen(!sectionOpen);
                            handleSectionToggle(sectionNum);
                        }}
                    >
                        <i 
                        className="fas fa-chevron-down expand-symbol fa-fw fa-lg"
                        ></i>
                    </button>
                    <h2 id={`section-${sectionNum}-title`}>{title}</h2>
                </div>
                <div className="section-collapsible">
                    <SubSection 
                        sectionContent={content}
                    />
                </div>
            </div>
        </section>
    );
})

function getSectionId(sectionNum: number) {
    return "task-section-" + sectionNum;
}

type SubSectionContent = {title?: string, tasks: TaskModel[], type: TaskModel.VisualStyles, emptyText: string};
/**
 * The contents of a subsection with a list section serparated out for performance
 */
const SubSection = observer(({sectionContent}: {sectionContent: SubSectionContent[]}) => {
    return sectionContent.map((section) => {
        return ( 
            <TaskSectionContent 
                content={section}
                key={`${section.title}-${section.type}`}
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
        <section aria-labelledby={content.title ? sectionTitleId : ""} key={`${content.title}-${content.type}`}>
            {content.title && <h3 id={sectionTitleId} className="centered">{content.title}</h3>}
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
const TaskList = observer(({tasks, type}: {tasks: TaskModel[], type: TaskModel.VisualStyles}) => {
    return <ul role="group">
        { tasks.map((task) => {
            return ( 
                <li className="task" key={`task-li-${task.id}`}>
                    <ListViewTask
                        task={task}
                        type={type}
                        />
                </li>
            )
        })}
    </ul>
})

/**
 * One task within the list
 */
const ListViewTask = observer(({task, type}: {task: TaskModel, type: TaskModel.VisualStyles }) => {
    const id = `task-${task.id}`;
    const checkboxId = `list-checkbox-${task.id}`;
    const dateForm = DateTime.DATE_SHORT;

    const taskWrapper = (
    <TaskWrapper 
        task={task}
        properties={{id: id}}
    >
        <Checkbox
            task={task}
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
                <TaskTitle task={task} />
            </label>
            <DateTimeWrapper 
                task={task} 
                type="due" 
                dateFormat={dateForm} 
            />
        </div>
    </TaskWrapper>
    );

    return taskWrapper;
})

//#endregion Task list
//#region Section toggle
/**
 * Collapse/expand sections when the toggle symbol is clicked.
 * 
 * @param {sectionNum} The number of the section to toggle visibility of.
 */
function handleSectionToggle (sectionNum: number) {
    const taskSection = document.getElementById(getSectionId(sectionNum));
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
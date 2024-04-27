import React, { useState } from "react";
import Task from './taskViews/Task';
import { observer } from "mobx-react-lite";


/**
 * The list of tasks, separated for performance.
 * 
 * ---
 * 
 * *Required props:*
 * 
 *  - **tasks** : Task[] - The list of tasks
 *  - **type** : string - The type of tasks - "work" or "due"
 */
const TaskList = observer((props) => {
    return <ul role="group">
        { props.tasks.map((task) => {
            return ( 
                <li className="task" key={"task-li-"+task.id}>
                    <Task
                        data={task}
                        basicVersion={true}
                        type={props.type}
                        />
                </li>
            )
        })}
    </ul>
})

/**
 * The tasks within a subsection.
 * 
 * ---
 * 
 * *Required props:*
 *  - **tasks** : Task[] - A list of tasks within this subsection
 *  - **type** : string - The type of tasks within this subsection - "work" or "due" 
 */
const TaskSectionContent = observer((props) => {
    const sectionTitleId = "dark-section-title-"+props.title;
    return (
        <section aria-labelledby={props.title !== undefined ? "dark-section-title-"+props.title : null}>
            {props.title !== undefined ? <h3 id={sectionTitleId} className="centered">{props.title}</h3> : null}
            <div className="dark-section">
                {props.tasks.length === 0 ? 
                <p className="subtle centered">{props.emptyText}</p>
                :
                <TaskList 
                    tasks={props.tasks} 
                    type={props.type}    
                />
                }
            </div>
        </section>
    )
})

function getSectionId(sectionNum) {
    return "task-section-" + sectionNum;
}

/**
 * Collapse/expand sections when the toggle symbol is clicked.
 * 
 * @param {event} event Click event
 * @param {sectionNum} The number of the section to toggle visibility of.
 */
function handleSectionToggle (event, sectionNum, duration) {
    const taskSection = document.getElementById(getSectionId(sectionNum))
    const outer_section = taskSection.querySelector(".mid-section");
    const inner_section = taskSection.getElementsByClassName("section-collapsible")[0];
    inner_section.style.transition = `transform ${duration * .98}ms ease-in-out 0s`;
    outer_section.style.transition = `height ${duration}ms ease-in-out 0s`;
    outer_section.style.height = "fit-content";
    toggleSection(taskSection, duration);
    flipkarat(taskSection, duration);
}

/**
 * Add an inline height attribute to the passed DOM element equal to its current calculated height. Doing this because 
 * if I don't then the height transition animation wont work the first time its collapsed.
 * 
 * @param {*} outerSection The DOM element to add the attribute to
 */
function toggleInlineHeightAttribute (outerSection) {
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
 * @param {node} taskSection The DOM element to find the karat symbol within
 * @param {int} duration How long the toggle animation should take in millis
 */
function flipkarat (taskSection, duration) {
    let symbol = taskSection.querySelector(".expand-symbol");
    const start = "rotate(180deg)";
    const end = "rotate(0deg)";
    symbol.style.transition = `transform ${duration}ms ease-in-out 0s`;
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


/**
 * Toggle a section opened or closed.
 * 
 * @param {node} taskSection The DOM section element to toggle
 * @param {int} duration How long the toggle animation should take in millis
 */
function toggleSection(taskSection, duration) {
    var outerSection = taskSection.querySelector(".mid-section");
    var innerContent = taskSection.querySelector(".section-collapsible");
    
    toggleInlineHeightAttribute(outerSection);

    const sectionHeaderHeight = parseFloat(window.getComputedStyle(taskSection.querySelector(".expandable-section-header")).getPropertyValue('height'));

    if (innerContent.style.display === "none") {
        // Expand
        innerContent.style.display = "block";
        const sectionContentHeight = parseFloat(window.getComputedStyle(innerContent).getPropertyValue('height'));
        setTimeout(() => {
            // For some reason it needs a timeout after switching to block display before transforming. Don't know why.
            outerSection.style.height = (sectionHeaderHeight + sectionContentHeight) + "px";
            innerContent.style.transform = "scaleY(1)";
        }, duration/100)
    } else {
        // Collapse
        innerContent.style.transform = "scaleY(.01)";
        var collapsedHeight = sectionHeaderHeight + "px";
        outerSection.style.height = collapsedHeight;
        setTimeout(() => {
            innerContent.style.display = "none";
        }, duration)
    }

    setTimeout(() => {
        toggleInlineHeightAttribute(outerSection);
    }, duration+10)
}

/**
 * The contents of a subsection with a list section.
 * 
 * ---
 * 
 * *Required props:*
 *  - **sectionContent** : object - The actual content of the subsection. Structured as follows:
 *  
 * ```
 *{
 *    optional_title= "Subsection", // The title of the sub-section. Optional
 *    tasks= [], // List of Task objects that go within this section
 *    type= "due", // The type of tasks - due or work 
 *    emptyText= "This section is empty :(" // Text that appears when there are no tasks in the section 
 * }
 * ```
 *  
 * @param {*} props 
 * @returns 
 */
const SubSectionContents = (props) => {
    return props.sectionContent.map((section) => {
        return ( 
            <TaskSectionContent 
            key={"sec-"+props.sectionNum+"-cont-"+section.optionalTitle}
            title={section.optionalTitle}
            tasks={section.tasks}
            type={section.type}
            emptyText={section.emptyText}
            />
            )
        })
}

/**
 * A section of tasks within a list. May be divided into subsections.
 * 
 * ---
 * 
 * *Required props:*
 *  - **title** : string - The h2 title of the section
 *  - **sectionNum** : int - The number of the section within the list, used in its ID to make queries for the element easier.
 *  - **toggleDuration** : int - How long the section collapse animation should take in millis
 *  - **sectionContent** : list[object] - The actual content of the section. Structured as follows:
 *  
 * ```
 * [
 *  {
 *      optional_title= "First subsection", // The title of the sub-section. Optional
 *      tasks= [{}], // List of Task objects that go within this section
 *      type= "due", // The type of tasks - due or work 
 *      emptyText= "The first section is empty" // Text that appears when there are no tasks in the section 
 *   },
 *  {
 *      optional_title= "Second subsection",
 *      tasks= [{}],
 *      type= "work", // The type of tasks - due or work 
 *      emptyText= "The second section is empty"
 *  }
 * ]
 * ```
 * 
 * @param {*} props 
 * @returns 
 */
const TaskSection = (props) => {
    const [sectionOpen, setSectionOpen] = useState(true);

    var collapseToolTip = sectionOpen ? "Collapse " + props.title.toLowerCase() + " tasks" : "Expand " + props.title.toLowerCase() + " tasks";
    
    return (
        <section id={getSectionId(props.sectionNum)} aria-labelledby={"section-"+props.sectionNum+"-title"} >
            <div className={(props.className !== undefined ? props.className + " " : "") + "mid-section"}>
                <div className="expandable-section-header">
                    <button 
                        className="btn" 
                        title={collapseToolTip} 
                        aria-expanded={sectionOpen}
                        onClick={(e) => {
                            handleSectionToggle(e, props.sectionNum, props.toggleDuration);
                            setSectionOpen(!sectionOpen);
                        }}
                    >
                        <i 
                        className="fas fa-chevron-down expand-symbol fa-fw fa-lg"
                        ></i>
                    </button>
                    <h2 id={"section-"+props.sectionNum+"-title"}>{props.title}</h2>
                </div>
                <div className="section-collapsible">
                    <SubSectionContents 
                        sectionContent={props.sectionContent}
                        sectionNum={props.sectionNum}
                    />
                </div>
            </div>
        </section>
    );
}

export default TaskSection;
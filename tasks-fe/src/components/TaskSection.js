import React, { useState } from "react";
import Task from './Task'

const TaskSectionContent = (props) => {
    const sectionTitleId = "dark-section-title-"+props.title;
    return (
        <section aria-labelledby={props.title !== undefined ? "dark-section-title-"+props.title : null}>
            {props.title !== undefined ? <h3 id={sectionTitleId}>{props.title}</h3> : null}
            <div className="dark-section">
                {props.tasks.length === 0 ? 
                <p className="subtle centered">{props.emptyText}</p>
                :
                // Don't show in TOC
                <ul role="group">
                    { props.tasks.map((task) => {
                        return ( 
                            <li className="task" key={"task-li-"+task.pk}>
                                <Task
                                    data={task}
                                    basicVersion={true}
                                    type={props.type}
                                    />
                            </li>
                        )
                    })}
                </ul>}
            </div>
        </section>
    )
}

function getSectionId(sectionNum) {
    return "task-section-" + sectionNum;
}

function handleSectionToggle (event, sectionNum, duration) {
    // Collapse/expand sections on click 
    const taskSection = document.getElementById(getSectionId(sectionNum))
    const outer_section = taskSection.querySelector(".mid-section");
    const inner_section = taskSection.getElementsByClassName("section-collapsible")[0];
    inner_section.style.transition = `transform ${duration * .98}ms ease-in-out 0s`;
    outer_section.style.transition = `height ${duration}ms ease-in-out 0s`;
    outer_section.style.height = "fit-content";
    toggleSection(taskSection, duration);
    flipKarat(taskSection, duration);
}

function toggleInlineHeightAttribute (outerSection) {
    // Add an inline height attribute equal to the original height
    // If I don't do this (add the computed inline height attribute) then the height transition animation 
    // wont work the first time you click the section title to collapse it.
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

function flipKarat (taskSection, duration) {
    // Flip karat
    var symbol = taskSection.querySelector(".expand-symbol");
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
            // For some reason it needs a timeout after switching to block display before transforming
            // Works when theres a breakpoint after....
            outerSection.style.height = (sectionHeaderHeight + sectionContentHeight) + "px";
            innerContent.style.transform = "scaleY(1)";
        }, duration/100)
    } else {
        // Hide
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

const TaskSection = (props) => {
    const [sectionOpen, setSectionOpen] = useState(true);
    // props.title;
    // The title of the section

    // props.sectionNum;
    // The number this section appears at in the list of sections, used in it's id. 
    // Makes queries for this element easier
    
    // props.toggleDuration
    // How long the section collapse animation should be  

    // props.sectionContent;
    // The actual content of this section. If there are several content sections (ex: "Due" and "Work"), include several 
    // dictionaries in the list.
    // Format as a list of dictionary elements with keys:
    // {
    //     optional_title= "",  // A subtitle that can appear before the content section
    //     tasks<dict?>= [],
        // emptyText= ""  // Text that appears in the content section if there are no tasks
    // }

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
                    { props.sectionContent.map((section, i) => {
                        return ( 
                            <TaskSectionContent 
                            key={"sec-"+props.sectionNum+"-cont-"+i}
                            title={section.optionalTitle}
                            tasks={section.tasks}
                            type={section.type}
                            emptyText={section.emptyText}
                            />
                            )
                        })}
                </div>
            </div>
        </section>
    );
}

export default TaskSection;
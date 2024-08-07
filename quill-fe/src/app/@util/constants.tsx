import { ComponentPropsWithoutRef } from "react";

// URLs
export const API_URL = "http://localhost:8000/api/tasks/";
// Date and time -- more in DateTimeHelper.ts
export const START_OF_WEEK_WEEKDAY = "Monday";
export const END_OF_WEEK_WEEKDAY = "Sunday";
// ID and Classes
export const UNSET_TASK_TITLE_PLACEHOLDER = "title";
// SVG Icons
export const ICONS = {
    PLUS:   
        <i>
            <svg viewBox="0 0 22 22" width="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 11H20"/>
                <path d="M11 20L11 2"/>
            </svg>
        </i>,
    LIST: 
        <i className="fas fa-list-alt loading-icon fa-4x" title="List"></i>,
    CALENDAR:
        <i className="fa-solid fa-calendar loading-icon fa-4x" title="Calendar"></i>,
    X: 
        <i
        >
            <svg role="img" viewBox="0 0 30 30" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L25 25"/>
            <path d="M4 25L25 4"/>
            </svg>
        </i>,
    LOG_OUT: 
        <i className="fas fa-power-off fa-fw"></i>,
    TRASH:
        <i className="fa-regular fa-trash-can"></i>,
    JUMP_TO_DAY: 
        <i className="fa-solid fa-calendar-day"></i>,
    NEXT: 
        <i className="fa-solid fa-chevron-right"></i>,
    PREVIOUS: 
        <i className="fa-solid fa-chevron-left"></i>,
    DOWN: 
        <i 
            className="fas fa-chevron-down expand-symbol fa-fw fa-lg"
        ></i>,
    SETTINGS: <i className="fa-solid fa-gear"></i>,
    DESCRIPTION: <i className="fa-solid fa-align-left"></i>,
    PRIORITY: <i className="fa-solid fa-flag"></i>,
    MENU: <i className="fa-solid fa-ellipsis-vertical"></i>,
} 

/**
 * 
 * @returns a string of the passed className and any className from the passed props
 */
export const combineClassNamePropAndString = ({className, props}: {className: string, props: ComponentPropsWithoutRef<any>}): string => {
    return `${className}${props && props.className ? " " + props.className : ""}`;
}


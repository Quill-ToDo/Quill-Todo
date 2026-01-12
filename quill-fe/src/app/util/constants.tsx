export const DRAGGABLE_HANDLE_CLASS = "draggable-handle";
export const DRAGGABLE_CONTAINER_CLASS = "draggable";
export const HOME_ID = "home-wrapper";

// URLs
export const API_URL = "http://localhost:8000/api/tasks/";
// Date and time -- more in DateTimeHelper.ts
export const START_OF_WEEK_WEEKDAY = "Monday";
export const END_OF_WEEK_WEEKDAY = "Sunday";
// ID and Classes
export const UNSET_TASK_TITLE_PLACEHOLDER = "title";
export const POPUP_POSITIONER_CLASS = "positioner";
export const LOADING_CLASS = "loading";
// Styling
export const ALIGNED_CLASS = "aligned";
export const BUTTON_CLASS = "btn";
export const BUTTON_OR_ICON_X_SMALL = "x-small";
export const BUTTON_OR_ICON_SMALL = "small";
export const BUTTON_OR_ICON_MEDIUM = "med";
export const BUTTON_OR_ICON_LARGE = "large";
export const CENTERED_CLASS = "centered";
export const COLUMNS_CLASS = "cols";
export const DARK_SECTION_CLASS = "dark-section";
export const DATE_CLASS = "date";
export const GRID_CLASS = "grid";
export const HIDDEN_CLASS = "hidden";
export const ICON_CLASS = "icon";
export const LIGHT_SECTION_CLASS = "light-section";
export const MIN_WIDTH_CLASS = "take-min-width";
export const MID_SECTION_CLASS = "mid-section";
export const PADDING_CLASS = "padding";
export const POPUP_SMALL_CLASS = "small-popup";
export const RELATIVE_CLASS = "relatve";
export const ROUND_CORNERS_CLASS = "round-corners";
export const ROWS_CLASS = "rows";
export const ROWS_OR_COLS_WITH_GAP_CLASS = "gap";
export const ROWS_OR_COLS_WITH_SPACE_BETWEEN_CLASS = "space-between";
export const SUBGRID_CLASS = "subgrid";
export const SUBTLE_CLASS = "subtle";
export const TAKE_FULL_SPACE_CLASS = "take-full-space";
export const TAKE_FULL_WIDTH_CLASS = "full-width";
export const TAKE_FULL_HEIGHT_CLASS = "full-height";
export const TAKE_MIN_SPACE_CLASS = "take-min-space";
export const TIME_CLASS = "time";
export const TRANSPARENT_CLASS = "transparent";
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
    DRAG: <i className={`fa-solid fa-up-down-left-right ${DRAGGABLE_HANDLE_CLASS}`}></i>,
} 
export const BTN_APPEAR_ON_HOVER_CLASS = "appear-on-hover";
export const BTN_APPEAR_TARGET_CLASS = "btn-hover-target";


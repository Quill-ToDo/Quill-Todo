import { observer } from "mobx-react-lite";
import { START_OF_DAY } from "@/app/@util/DateTimeHelper";
import { DateTime } from "luxon";
import { 
    END_OF_WEEK_WEEKDAY, 
    ICONS, 
    START_OF_WEEK_WEEKDAY 
} from "@/util/constants";
import { combineClassNamePropAndString } from '@util/jsTools';
import './Calendar.css';
import TaskStore, { TaskDataOnDay } from "@/store/tasks/TaskStore";
import { Checkbox, TaskBeingDragged, TaskTitle, TaskWrapper } from "@/widgets/TaskDetail/TaskComponents";
import { 
    ComponentProps, 
    ForwardedRef, 
    MutableRefObject,
    useEffect, 
    useRef, 
    useState
} from "react";
import { PlaceableWidget } from "../generic-widgets/Widget";
import { useTaskStore } from "@/store/StoreProvider";
import { Draggable } from "@/app/@util/Draggable";
import { TASK_DRAG_TYPE } from "@/store/tasks/TaskModel";

const NUM_MONTHS_LOOKAHEAD = 6;
const NUM_MONTHS_LOOKBEHIND = 3;
const NUM_MONTHS_TRIGGER_INFINITE_SCROLL = 3;
const NUM_WEEKDAYS = 7;
export const CALENDAR_WIDGET_NAME = "Calendar";

type MonthData =
    {
        monthName: string;
        year: string;
        key: string,
        weeks: WeekData[];
        closeToBeginningOfDataRange: boolean;
        closeToEndOfDataRange: boolean;
    };
type WeekData =
    {
        key: string,
        days: DayData[];
    };
type DayData =
    {
        key: string,
        date: DateTime;
        tasksToday: TaskDataOnDay | undefined;
        props: ComponentProps<"div">;
    };

const getCalendarData = ({start, end, taskStore}: {start: DateTime, end: DateTime, taskStore: TaskStore}) => {
    let actualStart = start,
        actualEnd = end,
        itIsTheFirstOfTheMonth: boolean, 
        itIsANewWeekday: boolean, 
        borderPaintingCountdownFromSeven: number = NUM_WEEKDAYS,
        paintingMonthVisualSeparatorLine: boolean = false,
        mostRecentMonthLoaded: MonthData, 
        previousMonthLoaded: MonthData,
        mostRecentWeekLoaded: WeekData;
    // Make start and end range start at the beginning of the week and end at the end of the week
    while (actualStart.weekdayLong !== START_OF_WEEK_WEEKDAY) {
        actualStart = actualStart.minus({days:1})
    }
    while (actualEnd.weekdayLong !== END_OF_WEEK_WEEKDAY) {
        actualEnd = actualEnd.plus({days:1})
    }
    // Define month data structure
    const allLoadedMonthData: MonthData[] = [],
          monthNearBeginning: DateTime = actualStart.plus({months: NUM_MONTHS_TRIGGER_INFINITE_SCROLL}),
          monthNearEnd: DateTime = actualEnd.minus({months: NUM_MONTHS_TRIGGER_INFINITE_SCROLL}),
          today : DateTime = START_OF_DAY();

    for (let day: DateTime = actualStart; day <= actualEnd; day = day.plus({days:1})) {
        itIsTheFirstOfTheMonth = day.day === 1;
        itIsANewWeekday = day.weekdayLong === START_OF_WEEK_WEEKDAY;
        if (itIsTheFirstOfTheMonth || !allLoadedMonthData.length) {
            borderPaintingCountdownFromSeven = NUM_WEEKDAYS;
            // Add a new MonthData
            allLoadedMonthData.push({
                key: day.toLocaleString({year: "2-digit", month: "2-digit"}),
                monthName: day.monthLong as string, 
                year: day.year as string, 
                weeks: [],
                closeToBeginningOfDataRange: monthNearBeginning.hasSame(day, "month") || day < monthNearBeginning,
                closeToEndOfDataRange: monthNearEnd.hasSame(day, "month") || day > monthNearEnd,
            });
        }
        mostRecentMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-1];
        if (itIsANewWeekday) {
            // Add a new WeekData to MonthData
            mostRecentMonthLoaded.weeks.push({days: [], key: day.toISOWeekDate() as string});
        }
        previousMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-2];
        mostRecentWeekLoaded = mostRecentMonthLoaded.weeks.length ? mostRecentMonthLoaded.weeks[mostRecentMonthLoaded.weeks.length-1] : previousMonthLoaded.weeks[previousMonthLoaded.weeks.length-1];
        paintingMonthVisualSeparatorLine = borderPaintingCountdownFromSeven > 0;
        const newDay = {
            date: day,
            tasksToday: taskStore.taskTimeline.get(day.toLocaleString(DateTime.DATE_SHORT)),
            key: day.toISODate(),
            props: {
                    className: [
                        "day-container",
                        day < today ? "past" : undefined,
                        today.hasSame(day, 'day') ? "current" : undefined,
                        paintingMonthVisualSeparatorLine ? "border-top" : undefined,
                        paintingMonthVisualSeparatorLine && itIsTheFirstOfTheMonth && !itIsANewWeekday ? "border-left" : undefined,
                    ].join(" "),
            },
        };
        // Add a day object for each day
        if (paintingMonthVisualSeparatorLine) {borderPaintingCountdownFromSeven--};
        mostRecentWeekLoaded.days.push(newDay);
    }
    return allLoadedMonthData;
}
    
export const CalendarWidget = observer(({passedStore}: {passedStore?: TaskStore}={}) => {
    const taskStore: TaskStore = passedStore ? passedStore : useTaskStore();
    const thisCalendarRef = useRef(null);
    const thisCalendarHeaderRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const today = useRef(START_OF_DAY());
    const defaultStart = today.current.startOf('month').startOf('day').minus({months: NUM_MONTHS_LOOKBEHIND});
    const defaultEnd = today.current.endOf('month').startOf('day').plus({months: NUM_MONTHS_LOOKAHEAD});
    const currentDayRef = useRef(null);
    const [start, setStart] = useState(defaultStart);
    const earlyMonthRef = useRef(null);
    const lateMonthRef = useRef(null);
    const [end, setEnd] = useState(defaultEnd);
    const [scrollTo, setScrollTo] = useState<number | null>(null);
    const monthRefs = useRef<MutableRefObject<HTMLElement>[]>([]);

    const allLoadedMonthData = getCalendarData({start, end, taskStore});

    const scrollToEle = (toScroll: HTMLElement) => {
            if (!thisCalendarRef.current || !toScroll) {
                console.error("Could not scroll to", toScroll);
                return;
            }
            const calendarHeader = thisCalendarHeaderRef.current;
            const yOffset = toScroll.getBoundingClientRect().y - (calendarHeader.getBoundingClientRect().y + calendarHeader.getBoundingClientRect().height);
            scrollContainerRef.current && scrollContainerRef.current.scrollBy({behavior: "smooth", top: yOffset, left: 0 });
    }

    const scrollToMonth = (index: number) => {
        if (index+1 <= NUM_MONTHS_TRIGGER_INFINITE_SCROLL) {
            setStart(start.minus({months: NUM_MONTHS_LOOKBEHIND}));
        }
        if (index+1 >= monthRefs.current.length - NUM_MONTHS_TRIGGER_INFINITE_SCROLL) {
            setEnd(end.minus({months: NUM_MONTHS_LOOKAHEAD}));
        }
        setScrollTo(index);
        scrollToEle(monthRefs.current[index]);
        setTimeout(() => {
            setScrollTo(null);
        }, 400);
    }

    const getMonthIntersectingWithTopOfCalendar = () => {
        const calendarHeaderClientRect = thisCalendarHeaderRef.current && thisCalendarHeaderRef.current.getBoundingClientRect(); 
        const calendarTop = calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1;
        return monthRefs.current.findIndex((month) => {                  
            const monthRect = month.getBoundingClientRect();
            if (monthRect.y > calendarTop) {
                return true;
            }
            return monthRect.y < calendarTop && monthRect.bottom > calendarTop;
        })
    }

    useEffect(() => {
        // Scroll to the current day only on first load
        currentDayRef.current && scrollToEle(currentDayRef.current);
    }, [thisCalendarRef.current]);
    useEffect(() => {
        const options = {
            root: scrollContainerRef.current,
            rootMargin: "0px",
            threshold: .2,
        };
        // Load in previous months as you scroll to an earlier month in the container
        const earlyMonthAppearsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setStart(start.minus({months: NUM_MONTHS_LOOKBEHIND}))
            }
        }, options);
        // Load in future months as you scroll down to a later month in the container
        const laterMonthAppearsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setEnd(end.plus({months: NUM_MONTHS_LOOKAHEAD}))
            }
        }, options);

        if (scrollContainerRef.current) {
            for (let i=0; i < scrollContainerRef.current.children.length; i++) {
                const child = scrollContainerRef.current.children[i];
                if (i < NUM_MONTHS_TRIGGER_INFINITE_SCROLL-1) {
                    // Observe months early in array
                    earlyMonthAppearsObserver.observe(child);
                }
                if (i > scrollContainerRef.current.children.length - NUM_MONTHS_TRIGGER_INFINITE_SCROLL-1) {
                    // And late in the array
                    laterMonthAppearsObserver.observe(child);
                }
            }
        }
        return () => {
            if (scrollContainerRef.current) {
                for (const child of scrollContainerRef.current.children) {
                    earlyMonthAppearsObserver.unobserve(child);
                    laterMonthAppearsObserver.unobserve(child);
                }
            }
        };
    }, [allLoadedMonthData]);


    return <PlaceableWidget 
                widgetName={CALENDAR_WIDGET_NAME} 
                icon={ICONS.CALENDAR} 
                doneLoading={taskStore.isLoaded && allLoadedMonthData != undefined}
            >
            <div className="calendar-body mid-section" ref={thisCalendarRef}>
                <header 
                    ref={thisCalendarHeaderRef}
                    title="Calendar header"
                    >
                    <nav className="aligned">
                        <button className="btn small bg square"
                            title="Previous month"
                            onClick={(e) => {
                                    if (scrollTo !== null && scrollTo > 0) {
                                        // Already in the process of scrolling somewhere
                                        scrollToMonth(scrollTo - 1);
                                        return;
                                    }
                                    // Calculate the month intersecting with the top of the calendar
                                    const monthOnTop = getMonthIntersectingWithTopOfCalendar();
                                    const calendarHeaderClientRect = thisCalendarHeaderRef.current && thisCalendarHeaderRef.current.getBoundingClientRect(); 
                                    const calendarTop = calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1;

                                    if (monthOnTop >= 0) {
                                        if (monthOnTop > 0 && Math.abs(monthRefs.current[monthOnTop].getBoundingClientRect().y - calendarTop) < 10) {
                                            // If the first visible month is at the very top of the calendar then scroll to the month before that instead
                                            scrollToMonth(monthOnTop-1);
                                        } 
                                        else {
                                            scrollToMonth(monthOnTop);
                                        }
                                    }
                            }}
                        >
                            { ICONS.PREVIOUS }
                        </button>
                        <button className="btn small bg square"
                            title="Jump to today"
                            onClick={(e) => {
                                setStart(defaultStart);
                                setEnd(defaultEnd);
                                currentDayRef.current && scrollToEle(currentDayRef.current);
                            }}
                        >
                            { ICONS.JUMP_TO_DAY }
                        </button>
                        <button className="btn small bg square"
                            title="Next month"
                            onClick={(e) => {
                                if (scrollTo !== null && scrollTo < monthRefs.current.length-1) {
                                    // Already in the process of scrolling somewhere
                                    scrollToMonth(scrollTo + 1);
                                    return;
                                }
                                const monthOnTop = getMonthIntersectingWithTopOfCalendar();
                                if (monthOnTop >= 0 && monthOnTop < monthRefs.current.length-1) {
                                    scrollToMonth(monthOnTop+1);
                                }
                            }}
                        >
                            { ICONS.NEXT }
                        </button>
                    </nav>
                    <div className="week-days-header">
                        <h3 title="Monday">M</h3>
                        <h3 title="Tuesday">T</h3>
                        <h3 title="Wednesday">W</h3>
                        <h3 title="Thursday">R</h3>
                        <h3 title="Friday">F</h3>
                        <h3 title="Saturday">S</h3>
                        <h3 title="Sunday">U</h3>
                    </div>
                </header>
                <div 
                    className="calendar-month-infinite-scroll-wrapper" 
                    ref={scrollContainerRef}
                    title="Calendar body"
                    >
                    { allLoadedMonthData.map((monthData, index) => 
                        <div 
                            className="month-container" 
                            key={monthData.key} 
                            aria-labelledby={`${monthData.key}-header`} 
                            ref={(node) => {
                                if (monthData.closeToBeginningOfDataRange) {
                                    earlyMonthRef.current = node;
                                }
                                if (monthData.closeToEndOfDataRange) {
                                    lateMonthRef.current = node;
                                }
                                monthRefs.current[index] = node;
                            }}    
                        >
                            <div className="month-title" id={`${monthData.key}-header`}> 
                                <h2>{monthData.monthName}</h2>
                                <h3>{monthData.year}</h3>
                            </div>
                            <div className="day-grid"> 
                                { monthData.weeks.map((weekData, i) =>
                                    <div key={weekData.key} className={"week-container"}>
                                        { weekData.days.map(day =>  
                                        <div 
                                            ref={today.current.hasSame(day.date, 'day') ? currentDayRef : undefined}
                                            key={day.key}
                                            aria-labelledby={`${day.key}-header`}
                                            title={`${day.date.toLocaleString({ weekday: 'short', month: 'short', day: 'numeric'})}`}
                                            suppressHydrationWarning
                                            {...day.props}
                                            >
                                            <h4 
                                                id={`${day.key}-header`}
                                            >
                                                <time dateTime={day.date.toISODate()}>{day.date.day}</time>
                                            </h4>
                                            <div className="dark-section">
                                                { day.tasksToday && day.tasksToday.map((taskData) => {
                                                    const taskWrapperProps = {
                                                        task: taskData.task,
                                                        keyOverride: `${day.key}-${taskData.task.id}`,
                                                        ...{className: "inline"}
                                                    }
                                                    return <Draggable
                                                        droppable={true}
                                                        itemType={TASK_DRAG_TYPE}
                                                        itemData={{id: taskWrapperProps.task.id}}
                                                        actionTitle="Move task"
                                                        key={taskWrapperProps.keyOverride}
                                                        onDragStart={() => {
                                                            console.log("drag")
                                                        }}
                                                        draggedPresentation={
                                                            <TaskBeingDragged 
                                                                task={taskData.task} 
                                                                type={taskData.type} 
                                                            />
                                                    }
                                                    >
                                                        <TaskWrapper 
                                                                {...taskWrapperProps}
                                                                {...{className: taskWrapperProps.className}}
                                                            >
                                                                <Checkbox type={taskData.type} checkboxId={`calendar-checkbox-${taskData.task.id}`}></Checkbox>
                                                                <TaskTitle />
                                                            </TaskWrapper>
                                                    </Draggable>
                                                })}
                                            </div>
                                        </div>    
                                    )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PlaceableWidget>
});

export const ShowSelectableCalendarDays = () => {};
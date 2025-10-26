import { observer } from "mobx-react-lite";
import { DraggableDroppableDate, START_OF_DAY } from "@/app/@util/DateTimeHelper";
import { DateTime } from "luxon";
import { 
    ALIGNED_CLASS,
    DARK_SECTION_CLASS,
    END_OF_WEEK_WEEKDAY,
    ICONS, 
    MID_SECTION_CLASS, 
    ROUND_CORNERS_CLASS,
    START_OF_WEEK_WEEKDAY, 
    SUBGRID_CLASS, 
} from "@/util/constants";
import './Calendar.css';
import TaskStore from "@/store/tasks/TaskStore";
import { TaskGantLine, TaskWrapper } from "@/widgets/TaskDetail/TaskComponents";
import { 
    ComponentProps, 
    forwardRef, 
    MutableRefObject, 
    useEffect, 
    useRef, 
    useState
} from "react";
import { PlaceableWidget } from "../generic-widgets/Widget";
import { useTaskStore } from "@/store/StoreProvider";
import { Rect } from "@floating-ui/react";
import { TaskModel } from "../../_globalStore/tasks/TaskModel";
import { combineClassNamePropAndString } from "@/app/@util/jsTools";

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
        props: ComponentProps<"div">;
    };

const getCalendarData = ({start, end}: {start: DateTime, end: DateTime}) => {
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
                monthName: day.monthLong ? day.monthLong : "Unknown", 
                year: `${day.year}`, 
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
            key: `${day.toISODate()}`,
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
    
export const CalendarWidget = observer(() => {
    const taskStore: TaskStore = useTaskStore();
    const thisCalendarRef = useRef<null | HTMLDivElement>(null);
    const thisCalendarHeaderRef = useRef<null | HTMLHeadElement>(null);
    const scrollContainerRef = useRef<null | HTMLDivElement>(null);
    const today = useRef<DateTime<boolean>>(START_OF_DAY());
    const currentDayRef = useRef<null | HTMLDivElement>(null);
    const defaultStart: DateTime<boolean> = today.current.startOf('month').startOf('day').minus({months: NUM_MONTHS_LOOKBEHIND});
    const defaultEnd: DateTime<boolean> = today.current.endOf('month').startOf('day').plus({months: NUM_MONTHS_LOOKAHEAD});
    const [start, setStart] = useState<DateTime<boolean>>(defaultStart);
    const earlyMonthRef = useRef<null | HTMLDivElement>(null);
    const lateMonthRef = useRef<null | HTMLDivElement>(null);
    const [end, setEnd] = useState<DateTime<boolean>>(defaultEnd);
    const [scrollTo, setScrollTo] = useState<number | null>(null);

    const monthRefs = useRef<(HTMLElement | null)[]>([]);

    const calendarDataWithoutTasks: MonthData[] = getCalendarData({start, end});

    const scrollToEle = (toScroll: HTMLElement | null) => {
            if (!thisCalendarRef.current || !toScroll) {
                console.error("Could not scroll to", toScroll);
                return;
            }
            const calendarHeader = thisCalendarHeaderRef.current;
            const yOffset = toScroll.getBoundingClientRect().y - (calendarHeader ? calendarHeader.getBoundingClientRect().y + calendarHeader.getBoundingClientRect().height : 0);
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
        const calendarHeaderClientRect: Rect | null = thisCalendarHeaderRef.current && thisCalendarHeaderRef.current.getBoundingClientRect(); 
        const calendarTop = calendarHeaderClientRect ? calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1 : 0;
        return monthRefs.current.findIndex((month) => {    
            if (!month) {
                return false;
            }              
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
                for (let i=0; i < scrollContainerRef.current.children.length; i++) {
                    const child = scrollContainerRef.current.children[i];
                    earlyMonthAppearsObserver.unobserve(child);
                    laterMonthAppearsObserver.unobserve(child);
                }
            }
        };
    }, [calendarDataWithoutTasks]);


    return <PlaceableWidget 
                widgetName={CALENDAR_WIDGET_NAME} 
                icon={ICONS.CALENDAR} 
                doneLoading={taskStore.isLoaded && calendarDataWithoutTasks != undefined}
            >
            <div className={`calendar-body ${MID_SECTION_CLASS}`} ref={thisCalendarRef}>
                <header 
                    ref={thisCalendarHeaderRef}
                    title="Calendar header"
                    >
                    <nav className={ALIGNED_CLASS}>
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
                                    const calendarTop = calendarHeaderClientRect ? calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1 : 0;

                                    if (monthOnTop >= 0) {
                                        if (monthOnTop > 0 && monthRefs.current[monthOnTop] && Math.abs(monthRefs.current[monthOnTop].getBoundingClientRect().y - calendarTop) < 10) {
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
                    { calendarDataWithoutTasks.map((monthData, index) => 
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
                                const refs = monthRefs.current 
                                refs[index] = node;
                            }}    
                        >
                            <div className="month-title" id={`${monthData.key}-header`}> 
                                <h2>{monthData.monthName}</h2>
                                <h3>{monthData.year}</h3>
                            </div>
                            <div className="day-grid"> 
                                { monthData.weeks.map((weekData, i) =>
                                    <CalendarWeek 
                                        {...weekData} 
                                        today={today}
                                        ref={currentDayRef} 
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PlaceableWidget>
});

const CalendarWeek = observer(forwardRef<any, WeekData & {today: MutableRefObject<DateTime<boolean>>}>(({key, days, today}, currentDayRef) => {
    const taskStore: TaskStore = useTaskStore();
    const firstDay = days.at(0);
    const lastDay = days.at(days.length-1);
    if (!firstDay || !lastDay) {
        return;
    }
    const tasksInWeek = taskStore.tasksInRange({startTime: firstDay.date.startOf("day"), endTime: lastDay.date.endOf("day")});
    
    return <div key={key} className={`week-container ${SUBGRID_CLASS}`}>
        { days.map(day =>  
            <CalendarDay 
                {...day}
                ref={today.current.hasSame(day.date, 'day') ? currentDayRef : null}
            />
    )}
        <TasksMap tasks={tasksInWeek} key={key} firstDay={firstDay.date}/>
    </div>
}))

const CalendarDay = observer(forwardRef<any, DayData & {tasks: TaskModel[]}>(({date, key, props, tasks}, ref) => {
    return <DraggableDroppableDate
                mayBeDropped={true}
                actionTitle={"Assign date"}
                useDragHandle={false}
                date={date} 
            >
                <div 
                    ref={ref}
                    key={key}
                    aria-labelledby={`${key}-header`}
                    title={`${date.toLocaleString({ weekday: 'short', month: 'short', day: 'numeric'})}`}
                    suppressHydrationWarning
                    {...props}
                    className={combineClassNamePropAndString(SUBGRID_CLASS, props)}
                    >
                    <h4 
                        id={`${key}-header`}
                    >
                        <time dateTime={`${date.toISODate()}`}>{date.day}</time>
                    </h4>
                    <div className={`tasks ${DARK_SECTION_CLASS} ${SUBGRID_CLASS}`}>
                         {/* {tasks ? <TasksMap tasks={tasks} key={key} date={date}/> : null} */}
                    </div>
                </div>    
            </DraggableDroppableDate>
}))

const TasksMap = observer(({tasks, key, firstDay}: {tasks: TaskModel[], key: string, firstDay: DateTime<boolean>}) => {
    return (
    <div className={`${SUBGRID_CLASS} task-container`}>
        { tasks.map((task) => {
            const taskWrapperProps = {
                task: task,
                keyOverride: `${key}-${task.id}`,
            }
            // Grid column index starts at 1, and an item spanning the first grid column (one day) would be like
            // grid columns: 1 / 2. 
            // By default the task spans the entire week (for tasks that are in progress and appear in the
            // passed array of task models for this week to be shown)
            let taskStartIndex = 1; 
            let taskDueIndex = 8; 
            // If the due date happens sometime this week, adjust the ending index to reflect this
            const taskDueThisWeek = !!(task.due && task.due < firstDay.plus({days: 7})); 
            if ( task.due && taskDueThisWeek) {
                taskDueIndex = taskStartIndex + task.due.startOf("day").diff(firstDay, "days").days;
            }
            // If the task starts sometime this week, change the start index to reflect this 
            const taskStartsThisWeek = !!(task.start && task.start > firstDay); 
            if (task.start && taskStartsThisWeek) {
                taskStartIndex += task.start.startOf("day").diff(firstDay, "days").days;
            }
            else if (!task.start) {
                taskStartIndex = taskDueIndex;
            }
            // The start of the task might be before the end of the task if it's in error but the first grid column 
            // number of the grid item always needs to be smaller, so switch these if needed.
            const colStart = Math.min(taskDueIndex, taskStartIndex);
            const colEnd = Math.max(taskDueIndex, taskStartIndex);

            const taskStartEndSpanStyling = {
                gridColumnStart: colStart ? colStart : undefined,
                gridColumnEnd: colEnd ? colEnd + 1 : undefined,
            }

            return <TaskWrapper 
                    key={taskWrapperProps.keyOverride}
                    {...taskWrapperProps}
                    className={`${ROUND_CORNERS_CLASS} calendar-task`}
                    style={taskStartEndSpanStyling}
                    >
                        <TaskGantLine task={task} showStart={taskStartsThisWeek} showDue={taskDueThisWeek}/>
                    </TaskWrapper>  
        })}
    </div>
    )
})

export const ShowSelectableCalendarDays = () => {};
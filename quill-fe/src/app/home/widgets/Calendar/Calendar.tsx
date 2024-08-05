import { observer } from "mobx-react-lite";
import { START_OF_DAY } from "@/app/@util/DateTimeHelper";
import { DateTime } from "luxon";
import { END_OF_WEEK_WEEKDAY, ICONS, START_OF_WEEK_WEEKDAY } from "@/util/constants";
import './Calendar.css';
import TaskStore, { TaskDataOnDay } from "@/store/tasks/TaskStore";
import { Checkbox, TaskTitle, TaskWrapper } from "../TaskDetail/TaskComponents";
import { Fragment, PropsWithRef, useEffect, useRef, useState } from "react";

const NUM_MONTHS_LOOKAHEAD = 6;
const NUM_MONTHS_LOOKBEHIND = 3;
const NUM_MONTHS_TRIGGER_INFINITE_SCROLL = 2;
const NUM_WEEKDAYS = 7;

type MonthData =
    {
        monthName: string;
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
        props: PropsWithRef<"div">;
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
                monthName: day.monthLong, 
                weeks: [],
                closeToBeginningOfDataRange: monthNearBeginning.hasSame(day, "month") || day < monthNearBeginning,
                closeToEndOfDataRange: monthNearEnd.hasSame(day, "month") || day > monthNearEnd,
            });
        }
        mostRecentMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-1];
        if (itIsANewWeekday) {
            // Add a new WeekData to MonthData
            mostRecentMonthLoaded.weeks.push({days: [], key: day.toISOWeekDate});
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
                ariaLabel: day.toISODate(),
            },
        };
        // Add a day object for each day
        if (paintingMonthVisualSeparatorLine) {borderPaintingCountdownFromSeven--};
        mostRecentWeekLoaded.days.push(newDay);
    }
    return allLoadedMonthData;
}
    
export const Calendar = observer(({taskStore}: {taskStore: TaskStore}) => {
    const thisCalendarRef = useRef(null);
    const thisCalendarHeaderRef = useRef(null);
    const currentDayRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const earlyMonthRef = useRef(null);
    const lateMonthRef = useRef(null);
    const today = useRef(START_OF_DAY());
    const [start, setStart] = useState(today.current.startOf('month').startOf('day').minus({months: NUM_MONTHS_LOOKBEHIND}));
    const [end, setEnd] = useState(today.current.endOf('month').startOf('day').plus({months: NUM_MONTHS_LOOKAHEAD}));

    const allLoadedMonthData = getCalendarData({start, end, taskStore});

    const scrollToEle = (toScroll: HTMLElement) => {
        if (!thisCalendarRef.current || !toScroll) {
            console.error("Could not scroll to", toScroll);
            return;
        }
        const calendarHeader = thisCalendarHeaderRef.current;
        const yOffset = toScroll.getBoundingClientRect().y - (calendarHeader.getBoundingClientRect().y + calendarHeader.getBoundingClientRect().height);
        toScroll && scrollContainerRef.current && scrollContainerRef.current.scrollBy({behavior: "smooth", top: yOffset, left: 0 })
    }

    useEffect(() => {
        // scrollToEle(currentDayRef.current);
        const options = {
            root: scrollContainerRef.current,
            rootMargin: "0px",
            threshold: .2,
        };
        const earlyMonthAppearsObserver = new IntersectionObserver((entries) => {
            //Load earlier months
            if (entries[0].intersectionRatio > .3) {
                setStart(start.minus({months: NUM_MONTHS_LOOKBEHIND}))
            }
        }, options);
        if (earlyMonthRef.current) {
            earlyMonthAppearsObserver.observe(earlyMonthRef.current);
        }
        const laterMonthAppearsObserver = new IntersectionObserver((entries) => {
            //Load later months
            if (entries[0].intersectionRatio > .3) {
                setEnd(end.plus({months: NUM_MONTHS_LOOKAHEAD}))
            }
        }, options);
        if (lateMonthRef.current) {
            laterMonthAppearsObserver.observe(lateMonthRef.current);
        }
        return () => {
            if (earlyMonthRef.current) {
                earlyMonthAppearsObserver.unobserve(earlyMonthRef.current);
            }
            if (lateMonthRef.current) {
                laterMonthAppearsObserver.unobserve(lateMonthRef.current);
            }
        };
    })

    const getMonthsInView = () => {
        const calendarClientRect = thisCalendarRef.current && thisCalendarRef.current.getBoundingClientRect(); 
        const calendarHeaderClientRect = thisCalendarHeaderRef.current && thisCalendarHeaderRef.current.getBoundingClientRect(); 
        const calendarTop = calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1;
        const calendarBottom = calendarTop + calendarClientRect.height;
        return [...thisCalendarRef.current.querySelectorAll(".month-container")].filter((entry) => {
            let monthRect = entry.getBoundingClientRect(); 
            return (monthRect.y < calendarBottom) && (monthRect.y + monthRect.height > calendarTop)
        }); 
    }
    }
 
    return <PlaceableWidget widgetName="calendar" icon={ICONS.CALENDAR} doneLoading={allLoadedMonthData != undefined}>
            <div className="calendar-body mid-section" ref={thisCalendarRef}>
                <div className="header" ref={thisCalendarHeaderRef}>
                    <nav className="aligned">
                        <button className="btn small bg square"
                            title="Previous month"
                            onClick={(e) => {
                                const firstMonth = getMonthsInView()[0];
                                const calendarHeaderClientRect = thisCalendarHeaderRef.current && thisCalendarHeaderRef.current.getBoundingClientRect(); 
                                const calendarTop = calendarHeaderClientRect.y + calendarHeaderClientRect.height + 1;
                                // If the first visible month is at the very top of the calendar then scroll to the month before that instead
                                if (Math.abs(firstMonth.getBoundingClientRect().y - calendarTop) < 10) {
                                    scrollToEle(firstMonth.previousSibling);
                                }
                                else {
                                    scrollToEle(firstMonth);
                                }
                            }}
                        >
                            { ICONS.PREVIOUS }
                        </button>
                        <button className="btn small bg square"
                            title="Jump to today"
                            onClick={(e) => {
                                
                                scrollToEle(currentDayRef.current);
                            }}
                        >
                            { ICONS.JUMP_TO_DAY }
                        </button>
                        <button className="btn small bg square"
                            title="Next month"
                            onClick={(e) => {
                                const monthsVisible = getMonthsInView(); 
                                const nextMonth = monthsVisible.length >= 2 ? monthsVisible[1] : monthsVisible[0].nextSibling;
                                // If the next month not visible at the very top of the calendar then scroll to the month after that instead
                                scrollToEle(nextMonth);
                            }}
                        >
                            { ICONS.NEXT }
                        </button>
                    </nav>
                    <div className="week-days-header">
                        <h3>M</h3>
                        <h3>T</h3>
                        <h3>W</h3>
                        <h3>R</h3>
                        <h3>F</h3>
                        <h3>S</h3>
                        <h3>U</h3>
                    </div>
                </div>
                <div className="calendar-month-infinite-scroll-wrapper" ref={scrollContainerRef}>
                    { allLoadedMonthData.map(monthData => 
                        <div 
                            className="month-container" 
                            key={monthData.key} 
                            aria-label={monthData.key} 
                            ref={monthData.closeToBeginningOfDataRange ? earlyMonthRef : (monthData.closeToEndOfDataRange ? lateMonthRef : undefined)}    
                        >
                            <div className="month-title"> 
                            <h2>{monthData.monthName}</h2>
                                <h3>{monthData.year}</h3>
                            </div>
                            <div className="day-grid"> 
                                { monthData.weeks.map((weekData, i) =>
                                    <Fragment key={weekData.key}>
                                        { weekData.days.map(day =>  
                                        <div 
                                            ref={today.current.hasSame(day.date, 'day') ? currentDayRef : undefined}
                                            suppressHydrationWarning
                                            {...day.props}
                                            >
                                            <p><time dateTime={day.date.toISODate()}>{day.date.day}</time></p>
                                            <div className="dark-section">
                                                { day.tasksToday &&  day.tasksToday.scheduled && day.tasksToday.scheduled.map((task) => {
                                                    return <TaskWrapper task={task} keyOverride={`${day.key}-${task.id}`}>
                                                            <Checkbox task={task} type={'work'} checkboxId={`calendar-checkbox-${task.id}`}></Checkbox>
                                                            <TaskTitle task={task} />
                                                        </TaskWrapper>
                                                    })
                                                }
                                                { day.tasksToday && day.tasksToday.due && day.tasksToday.due.map((task) => {
                                                    return <TaskWrapper 
                                                        task={task}
                                                        keyOverride={`${day.date}-${task.id}`}
                                                        >
                                                        <Checkbox task={task} type={'due'} checkboxId={`calendar-checkbox-${task.id}`}></Checkbox>
                                                        <TaskTitle task={task} />
                                                    </TaskWrapper>
                                                })}
                                            </div>
                                        </div>    
                                    )}
                                    </Fragment>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PlaceableWidget>;
});

export const ShowSelectableCalendarDays = () => {};
import { observer } from "mobx-react-lite";
import { START_OF_DAY } from "@/app/@util/DateTimeHelper";
import { DateTime } from "luxon";
import { END_OF_WEEK_WEEKDAY, START_OF_WEEK_WEEKDAY } from "@/util/constants";
import './Calendar.css';
import TaskStore, { TaskDataOnDay } from "@/store/tasks/TaskStore";
import { Checkbox, TaskTitle, TaskWrapper } from "../TaskDetail/TaskComponents";
import { Fragment, LegacyRef, useEffect, useLayoutEffect, useRef } from "react";

const NUM_MONTHS_LOOKAHEAD = 6;
const NUM_MONTHS_LOOKBEHIND = 3;
const NUM_WEEKDAYS = 7;

type MonthData =
    {
        monthName: string;
        weeks: WeekData[];
    };
type WeekData =
    {
        weekNum: number,
        days: DayData[];
    };
type DayData =
    {
        date: DateTime;
        tasksToday: TaskDataOnDay | undefined;
        dayBorder: number[];
        classNames: string[];
    };
    
export const Calendar = observer(({taskStore}: {taskStore: TaskStore}) => {
    const dayBorderClassNames = [
        "border-top",
        "border-right",
        "border-left",
        "border-bottom",
    ];
    const currentDayEle = useRef(null);

    const today : DateTime = START_OF_DAY();
    let start = today.startOf('month').startOf('day').minus({months: NUM_MONTHS_LOOKBEHIND});
    while (start.weekdayLong !== START_OF_WEEK_WEEKDAY) {
        start = start.minus({days:1})
    }
    let end = today.endOf('month').startOf('day').plus({months: NUM_MONTHS_LOOKAHEAD});
    while (end.weekdayLong !== END_OF_WEEK_WEEKDAY) {
        end = end.plus({days:1})
    }
    
    // Define month data structure
    const allLoadedMonthData: MonthData[] = [];
    let itIsTheFirstOfTheMonth: boolean, 
        itIsANewWeekday: boolean, 
        borderPaintingCountdownFromSeven: number = NUM_WEEKDAYS,
        paintingMonthVisualSeparatorLine: boolean = false,
        mostRecentMonthLoaded: MonthData, 
        previousMonthLoaded: MonthData,
        mostRecentWeekLoaded: WeekData;

    for (let day: DateTime = start; day <= end; day = day.plus({days:1})) {
        let dayKey = day.toLocaleString(DateTime.DATE_SHORT);
        itIsTheFirstOfTheMonth = day.day === 1;
        itIsANewWeekday = day.weekdayLong === START_OF_WEEK_WEEKDAY;
        if (itIsTheFirstOfTheMonth || !allLoadedMonthData.length) {
            borderPaintingCountdownFromSeven = NUM_WEEKDAYS;
            // Add a new MonthData
            allLoadedMonthData.push({monthName: day.monthLong, weeks: []});
        }
        mostRecentMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-1];
        if (itIsANewWeekday) {
            // Add a new WeekData to MonthData
            mostRecentMonthLoaded.weeks.push({days: [], weekNum: day.weekNumber});
        }
        previousMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-2];
        mostRecentWeekLoaded = mostRecentMonthLoaded.weeks.length ? mostRecentMonthLoaded.weeks[mostRecentMonthLoaded.weeks.length-1] : previousMonthLoaded.weeks[previousMonthLoaded.weeks.length-1];
        paintingMonthVisualSeparatorLine = borderPaintingCountdownFromSeven > 0;
        const newDay = {
            date: day,
            tasksToday: taskStore.taskTimeline.get(dayKey),
            dayBorder: [paintingMonthVisualSeparatorLine ? 1 : 0, 0, paintingMonthVisualSeparatorLine && itIsTheFirstOfTheMonth && !itIsANewWeekday ? 1 : 0, 0],
            classNames: [ day < today ? "past" : ""]
        };
        // Add a day object for each day
        if (paintingMonthVisualSeparatorLine) {borderPaintingCountdownFromSeven--};
        mostRecentWeekLoaded.days.push(newDay);
    }

    useEffect(() => {
        currentDayEle.current && currentDayEle.current.scroll();
    })
    
    const loading = 
        <div className="loading-wrapper take-full-space">
            <div>
                <i className="fa-solid fa-calendar loading-icon fa-4x"></i>
                <p>Loading calendar...</p>
            </div>
        </div>;

    const content = 
            <div className="calendar-body mid-section">
                <nav className="aligned">
                    <button className="btn">
                        <i className="fa-solid fa-square-caret-left"></i>
                    </button>
                    <button className="btn"
                        onClick={() => {currentDayEle.current && currentDayEle.current.scroll()}}
                    >
                        <i className="fa-solid fa-calendar-day"></i>
                    </button>
                    <button className="btn">
                        <i className="fa-solid fa-square-caret-right"></i>
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
                <div className="calendar-month-infinite-scroll-wrapper">
                    { allLoadedMonthData.map(monthData => 
                        <div className="month-container" key={`month-${monthData.monthName}`}>
                            <h2>{monthData.monthName}</h2>
                            <div className="day-grid"> 
                                { monthData.weeks.map((weekData, i) =>
                                    <Fragment key={`${weekData.weekNum}`}>
                                        { weekData.days.map(day =>  
                                        <div 
                                            className={`day-container ${day.dayBorder.reduce((accumulator, currentValue, currentIndex) => 
                                                accumulator + (!!currentValue ? " " + dayBorderClassNames[currentIndex] : ""), " ")} ${day.classNames.join(" ")} ${today.hasSame(day.date, 'day') ? "current" : undefined}`}
                                            key={`day-${monthData.monthName}-${day.date}`}
                                            ref={today.hasSame(day.date, 'day') ? currentDayEle : undefined}
                                            suppressHydrationWarning
                                            >
                                            <p>{day.date.day}</p>
                                            <div className=" dark-section">
                                                { day.tasksToday &&  day.tasksToday.scheduled && day.tasksToday.scheduled.map((task) => {
                                                    return <TaskWrapper task={task} properties={{key: `${day.date}-${task.id}`}}>
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
            </div>;

    return <section className="calendar-wrapper">
        {taskStore.isLoaded ? content : loading}
    </section>;
});

export const ShowSelectableCalendarDays = () => {};
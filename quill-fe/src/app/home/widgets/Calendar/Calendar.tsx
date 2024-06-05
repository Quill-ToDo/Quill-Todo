import { observer } from "mobx-react-lite";
import { START_OF_DAY } from "@/app/@util/DateTimeHelper";
import { DateTime } from "luxon";
import { END_OF_WEEK_WEEKDAY, START_OF_WEEK_WEEKDAY } from "@/util/constants";
import TaskModel from "@/app/home/_globalStore/tasks/TaskModel";
import './Calendar.css';

const NUM_MONTHS_LOOKAHEAD = 6;
const NUM_WEEKDAYS = 7;

const GetDateData = () => {
    // Find start and end date of iteration 
    const today : DateTime = START_OF_DAY();
    let start = today.startOf('month').startOf('day');
    while (start.weekdayLong !== START_OF_WEEK_WEEKDAY) {
        start = start.minus({days:1})
    }
    let end = today.endOf('month').startOf('day').plus({months: NUM_MONTHS_LOOKAHEAD});
    while (end.weekdayLong !== END_OF_WEEK_WEEKDAY) {
        end = end.plus({days:1})
    }
    // Define month data structure
    type MonthData =
        {
            monthName: string;
            weeks: WeekData[];
        };
    type WeekData =
        {
            days: DayData[];
        };
    type DayData =
        {
            date: DateTime;
            tasksToday: TaskModel[];
            monthBorder: number[];
        };

    const allLoadedMonthData: MonthData[] = [];
    let itIsTheFirstOfTheMonth: boolean, 
        itIsANewWeekday: boolean, 
        borderPaintingCountdownFromSeven: number = NUM_WEEKDAYS,
        paintingMonthVisualSeparatorLine: boolean = false,
        mostRecentMonthLoaded: MonthData, 
        previousMonthLoaded: MonthData,
        mostRecentWeekLoaded: WeekData;
    for (let day = start; day <= end; day = day.plus({days:1})) {
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
            mostRecentMonthLoaded.weeks.push({days: []});
        }
        previousMonthLoaded = allLoadedMonthData[allLoadedMonthData.length-2];
        mostRecentWeekLoaded = mostRecentMonthLoaded.weeks.length ? mostRecentMonthLoaded.weeks[mostRecentMonthLoaded.weeks.length-1] : previousMonthLoaded.weeks[previousMonthLoaded.weeks.length-1];
        paintingMonthVisualSeparatorLine = borderPaintingCountdownFromSeven > 0;
        const newDay = {
            date: day,
            tasksToday: [],
            monthBorder: [paintingMonthVisualSeparatorLine ? 1 : 0, 0, paintingMonthVisualSeparatorLine && itIsTheFirstOfTheMonth && !itIsANewWeekday ? 1 : 0, 0],
        };
        // Add a day object for each day
        if (paintingMonthVisualSeparatorLine) {borderPaintingCountdownFromSeven--};
        mostRecentWeekLoaded.days.push(newDay);
    }
    return allLoadedMonthData;
}
/**
 * A form to create a new task. It works by editing the fields of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const Calendar = observer((props) => {
    /**
     * @param {string} name Name of DOM element
     * @param {string} type DOM element type
     * @returns A selector string for an element with #new-wrapper with type type and name name.
     */

    const monthBorderIndexToClassName = new Map<number, string>();
    monthBorderIndexToClassName.set(0, "border-top");
    monthBorderIndexToClassName.set(1, "border-right");
    monthBorderIndexToClassName.set(2, "border-left");
    monthBorderIndexToClassName.set(3, "border-bottom");

    const dateData = GetDateData();
    
    return (
        <section className="calendar-wrapper">
            <div className="calendar-body mid-section">
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
                {
                    dateData.map(monthData => 
                        <div className="month-container" key={`month-${monthData.monthName}`}>
                            <h2>{monthData.monthName}</h2>
                            <div className="day-grid"> 
                                { monthData.weeks.map((weekData, i) =>
                                        weekData.days.map(day =>  
                                        <button 
                                            className={"day-container" + day.monthBorder.reduce((accumulator, currentValue, currentIndex) => 
                                                accumulator + (currentValue ? " " + monthBorderIndexToClassName.get(currentIndex) : ""), " ")}
                                            key={`day-${monthData.monthName}-${day.date}`}
                                        >
                                            <p>{day.date.day}</p>
                                            <div className=" dark-section">
                                            </div>
                                        </button>    
                                    )
                                )}
                            </div>
                        </div>)
                }
                </div>
            </div>
        </section>
        )
})

export default Calendar;
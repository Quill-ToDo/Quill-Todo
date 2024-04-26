import { observer } from "mobx-react-lite";
import { START_OF_DAY } from "@/app/@utilities/DateTimeHelper";
import { DateTime } from "luxon";
import { END_OF_WEEK_WEEKDAY, START_OF_WEEK_WEEKDAY } from "@/app/constants";
import TaskModel from "@/app/home/_globalStore/tasks/TaskModel";
import './Calendar.css';
import { Fragment } from "react";

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

    const today : DateTime = START_OF_DAY();
    let start = today.startOf('month').startOf('day');
    while (start.weekdayLong !== START_OF_WEEK_WEEKDAY) {
        start = start.minus({days:1})
    }
    let end = today.endOf('month').startOf('day').plus({months: 3});
    while (end.weekdayLong !== END_OF_WEEK_WEEKDAY) {
        end = end.plus({days:1})
    }
    type MonthData =
    {
        monthName: string,
        weeks: WeekData[],
    };
    type WeekData =
        {
            days: DayData[],
        };
    type DayData =
        {
            date: DateTime,
            tasks: TaskModel[],
        };

    let dateData : MonthData[] = [];
    
    for (let day = start; day <= end; day = day.plus({days:1})) {
        if (day.day === 1) {
            dateData.push({monthName: day.monthLong, weeks: []});
        }
        const mostRecentMonth = dateData[dateData.length-1];
        const prevMonth = dateData[dateData.length-2];
        if (day.weekdayLong === START_OF_WEEK_WEEKDAY) {
            mostRecentMonth.weeks.push({days: []});
        }
        const mostRecentWeek = mostRecentMonth.weeks.length ? mostRecentMonth.weeks[mostRecentMonth.weeks.length-1] : prevMonth.weeks[prevMonth.weeks.length-1];
        mostRecentWeek.days.push({
            date: day,
            tasks: [],
        });
    }
    
    return (
        <section id="calendar-wrapper">
            <div className="calendar-body mid-section">
                <div className="header">
                    <div></div>
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
                        <div className="month-container">
                            <h2 className="month-name">{monthData.monthName}</h2>
                            <div className="month-days"> 
                                {
                                    monthData.weeks.map(weekData => weekData.days.map(day => 
                                            <button className="day-container">
                                                <p>{day.date.day}</p>
                                                <div className=" dark-section">
                                                </div>
                                            </button>
                                        )
                                    )
                                }
                            </div>
                        </div>)
                }
                </div>
            </div>
        </section>
        )
})

export default Calendar;
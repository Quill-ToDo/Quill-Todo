import React, { useState, useEffect, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../../../globalStore/StoreContext";
import { DateTime, Interval } from "luxon";

const MonthlyCalendar = observer((props) => {
    const data = props.data;
    const today = props.today;
    const startDayOfWeek = 1; // 1 = monday
    
    const CalDay = observer((props) => {
        const day = props.date;
        return (
            <td>
            <p>{day.day}</p>
            <p>{day.tasks.size} tasks</p>
        </td>)
    })
    
    const getFirstMonday = ((dateInMonth) => {
        let day = dateInMonth.startOf('month');
        while (day.weekday !== startDayOfWeek) {
            day = day.plus({days:1});
        }
        return day;
    })
    
    const firstDateOnCalendar = getFirstMonday(today);

    
    // Load surrounding 3 months or something
    // Populate this data in calendar
    let dayNum = 0;

    return (
        <Fragment>
            <h2>{today.monthLong}</h2>
            <table>
                {data.forEach(() => console.log("hello"))}
            </table>
        </Fragment>
    )
}) 

const Calendar = observer(() => {
    const taskStore = useTaskStore();
    const timeline = taskStore.rootStore.timeline;
    const [dateToday, setDateToday] = useState(DateTime.now());
    // Get three month interval
    const [shownRange, setShownRange] = useState(Interval.fromDateTimes(dateToday.startOf("day").minus({ months: 1}), dateToday.endOf("day").plus({ months: 2})));

    return ( 
        <section id="calendar-wrapper">
            <div className="mid-section">
                <MonthlyCalendar data={timeline.getDaysInInterval(shownRange)} today={dateToday}/>
            </div>
        </section>
    );
})

export default Calendar;

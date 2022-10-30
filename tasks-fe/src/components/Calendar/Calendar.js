import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../../store/StoreContext";
import { DateTime } from "luxon";

const Calendar = observer(() => {
    const startDayOfWeek = 1; // 1 = monday
    const taskStore = useTaskStore();
    const [dateToday, setDateToday] = useState(DateTime.now());
    const endOfMonth = dateToday.endOf('month');
    const daysInMonth = dateToday.daysInMonth;

    const CalDay = observer((props) => {
        const day = props.date;
        return (
        <td>
            <p>{day.day}</p>
        </td>)
    })

    const getFirstMonday = ((dateInMonth) => {
        let day = dateInMonth.startOf('month');
        while (day.weekday !== startDayOfWeek) {
            day = day.plus({days:1});
        }
        return day;
    })
    
    // Make this monday-based eventually. Or configurable day of the week based

    const firstDateOnCalendar = getFirstMonday(dateToday);

    return ( 
        <section id="calendar-wrapper">
            <div className="mid-section">
                <h2>{dateToday.monthLong}</h2>
                <table>
                    {}
                    <tr>
                        <CalDay date={day}/>
                    </tr>
                </table>
            </div>
        </section>
    );
})

export default Calendar;

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../../store/StoreContext";
import { DateTime } from "luxon";

const Calendar = observer(() => {
    const taskStore = useTaskStore();
    const [calendarDate, setCalendarDate] = useState(DateTime.now());

    const CalDay = observer(() => {

        return (
        <td>
        </td>)
    })
    

    return ( 
        <section id="calendar-wrapper">
            <div className="mid-section">
                <h2>{calendarDate.monthLong}</h2>
                <table>
                    <tr>
                        <CalDay />
                    </tr>
                </table>
            </div>
        </section>
    );
})

export default Calendar;

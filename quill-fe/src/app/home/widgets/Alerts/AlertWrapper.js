import { useCallback, useEffect, useRef, useState } from 'react';
import { ERROR_ALERT, NOTICE_ALERT, SUCCESS_ALERT } from '@/alerts/alertEvent';
import './alerts.css'
import { ICONS } from '@/util/constants';

/**
 * One Alert.
 * @param {*} props Should pass in the alert
 * @returns
 */
const Alert = (props) => {
    const alert = props.alert.detail;
    const previouslyFocused = useRef(null);
    const descId = alert.id + "-desc";
    const labelId = alert.id + "-label";
    const btnId = alert.id + "-close";
    
    var closeBtnClass = "no-shadow btn small square";
    if (alert.type === SUCCESS_ALERT) {
        closeBtnClass += " btn-green";
    }
    else if (alert.type === ERROR_ALERT) {
        closeBtnClass += " btn-red";
    }
    else if (alert.type === NOTICE_ALERT) {
        closeBtnClass += " btn-light-grey";
    }

    const closeBtn = 
        <button 
            className={closeBtnClass} 
            id={btnId} 
            title="Close" 
            onClick={ () => {
                props.removeCallback();
            }}
        >
            { ICONS.X }
        </button>

    useEffect(() => {
        const alertInPage = document.getElementById(alert.id);
        const closeBtnInPage = document.getElementById(btnId);

        // On close button focus, save previously focused element to return focus to on alert dismount. 
        closeBtnInPage.addEventListener("focus", (e) => {
            previouslyFocused.current = e.relatedTarget;
            // Also, stop animation on focus.
            if (alert.type === NOTICE_ALERT || alert.type === SUCCESS_ALERT) {
                alertInPage.classList.remove("slide-out");
                props.animationStop();
                closeBtnInPage.addEventListener("blur", () => {
                    alertInPage.classList.add("slide-out");
                })
            }
        })
        
        if (alert.type !== ERROR_ALERT) {
            alertInPage.addEventListener('animationend', () => {
                props.animationStop();
                props.removeCallback();
            }, false);
            alertInPage.addEventListener('animationstart', () => {
                props.animationStart();
            })
        }
        // Focus on error message close button on render
        else if (alert.type === ERROR_ALERT) {
            closeBtnInPage.focus();
        }
        
        return () => {
            // Focus on the element user was focused on before the alert popped up
            if (previouslyFocused.current !== null) {
                previouslyFocused.current.focus();
            }
        }
    })

    if (alert.type === ERROR_ALERT) {
        return (
            <li 
                id={alert.id}
                key={`alert-${alert.id}`}
                role="alertdialog"
                open=""
                aria-live='assertive'
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up " + alert.type}>
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>Aw snap :(</h3>
                    <p id={descId}>{alert.body}</p>
                </div>
                {closeBtn}
            </li>
        )   
    }
    else {
        return (
            <li 
                id = {alert.id}
                key={`alert-${alert.id}`}
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up slide-out " + alert.type}>
                <div className='alert-cont-wrapper'>
                    <p id={descId}>{alert.body}</p>
                </div>
                {closeBtn}
            </li>
        )  
    }
}

/**
 * A list to render alerts, separated from the rest of the components for performance.
 * Adds any alert that has not already been removed to the list.
 * @param {*} props Should include array of alert objects.
 * @returns 
 */
const AlertList = (props) => {
    return (
        <ul>
            {props.alerts.map((alert) => {
                if (!alert.detail.removed) {
                    return <Alert 
                        alert={alert}
                        key={alert.detail.id}
                        animationStart={() => props.animationStart(alert)}
                        animationStop={() => props.animationStop(alert)}
                        removeCallback={() => props.removeCallback(alert)}
                    />
                }   
                return null;
            })}
        </ul>
    );
}

/**
 * Outermost alert box wrapper. Expects a removeCallback that removes alerts from the array passed in.
 * 
 * As some alerts slide out, it will hide alerts that have finished their animations so that it appears they are removed,
 * but they are not actually removed from their list until there are no other ongoing animation cycles. This prevents interrupting 
 * other alert animations when an alert is removed, which would start them all over. 
 * @param {*} props 
 * @returns 
 */
const AlertBox = (props) => {
    // Ids of elements currently being animated
    const ongoingAnimations = useRef(new Set());
    // Ids of elements who's animation cycles have finished and can be removed
    const toRemove = useRef(new Set());
    
    const removeCallback = props.removeCallback;
    
    const animationStop = (alert) => {
        toRemove.current.add(alert);
        alert.detail.removed = true;
        const alertInPage = document.getElementById(alert.detail.id);
        if (alertInPage) {
            alertInPage.style.display = "none";
        }
        ongoingAnimations.current.delete(alert);
    }
    
    const animationStart = (alert) => {
        ongoingAnimations.current.add(alert);
    }

    const dismissAlert = useCallback(
        (alert) => {
            // If there are no animations currently happening then remove every task that has finished its animation cycle

            const alertInPage = document.getElementById(alert.detail.id);
            if (alertInPage) {
                animationStop(alert);
            }
            if (!ongoingAnimations.current.size) {
                removeCallback(toRemove.current);
                toRemove.current.clear();
            }
        },
        [removeCallback],
    )

    return (
        <section 
            id="alert-wrapper" 
            data-testid="alert-wrapper" 
            role="log" 
            aria-atomic="false"
            aria-label='Alerts'
        >
            {props.alerts.length ?
                <AlertList 
                    alerts={props.alerts}
                    animationStop={(alert) => animationStop(alert)}
                    animationStart={(alert) => animationStart(alert)}
                    removeCallback={(alert) => dismissAlert(alert)}
                />
                :
                null
            }
        </section>
    )
}

const AlertWrapper = (props) => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Add listener for when you add a new alert
        const wrapper = document.getElementById("alert-capture");
        wrapper.addEventListener("alert", (event) => setAlerts(alerts.concat([event])));
        return () => {
            wrapper.removeEventListener("alert",  (event) => setAlerts(alerts.concat([event])));
        }
    }, [alerts])


    return (         
        <div id="alert-capture">
            <AlertBox 
                alerts={alerts} 
                removeCallback={(alertsToRemove) => {
                    setAlerts(alerts.filter(a => !alertsToRemove.has(a)));
                }} 
            />
            {props.children}
        </div>
    );
}

export default AlertWrapper;
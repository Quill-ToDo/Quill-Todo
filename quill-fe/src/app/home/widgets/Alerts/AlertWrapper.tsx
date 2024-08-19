import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AlertEvent, ERROR_ALERT, NOTICE_ALERT, SUCCESS_ALERT } from '@/alerts/alertEvent';
import './alerts.css'
import { ICONS } from '@/app/@util/constants';

/**
 * One Alert.
 * @param {*} props Should pass in the alert
 * @returns
 */
const Alert = ({
    ...props 
}: {
    alert: AlertEvent,
    removeSelf: () => void,
    animationStop: () => void,
    animationStart: () => void,
}) => {
    const alert = props.alert;
    const previouslyFocused = useRef(null);
    const descId = alert.detail.id + "-desc";
    const labelId = alert.detail.id + "-label";
    const btnRef = useRef(null);
    const alertRef = useRef(null);
    
    var closeBtnClass = "no-shadow btn small square";   

    const alertSlidesOut = alert.type === NOTICE_ALERT || alert.type === SUCCESS_ALERT;
    
    const commonBtnProperties = {
        className: closeBtnClass, 
        title: "Close", 
        onClick: () => {
            props.removeSelf();
        }
    }

    const closeBtn = alertSlidesOut ? 
        <button 
            onFocus={(e) => {
                previouslyFocused.current = e.relatedTarget;
                // Stop slide out animation on focus.
                alertRef.current.classList.remove("slide-out");
                props.animationStop();

            }}
            onBlur={() => {
                // Add slide out animation on leave
                alertRef.current.classList.add("slide-out");

            }}
            ref={btnRef}
            {...commonBtnProperties}
        >
            { ICONS.X }
        </button> 
        : <button 
            onFocus={(e) => {
                previouslyFocused.current = e.relatedTarget;
            }}
            ref={btnRef}
            {...commonBtnProperties}
        >
            { ICONS.X }
        </button>

    useEffect(() => {
        // Focus on error message close button on render
        if (alert.type === ERROR_ALERT) {
            btnRef.current.focus();
        }
        
        return () => {
            // Focus on the element user was focused on before the alert popped up
            if (previouslyFocused.current !== null) {
                previouslyFocused.current.focus();
            }
        }
    })

    const commonAlertProps = {
        id: alert.detail.id,
        ref: alertRef,
        "aria-describedby": descId,
        "aria-labelledby": labelId,
    }

    if (alert.detail.type === ERROR_ALERT) {
        return (
            <li 
                {...commonAlertProps}
                role="alertdialog"
                key={`li-${alert.detail.id}`}
                aria-live='assertive'
                className={alert.detail.type}            
            >
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>Aw snap :(</h3>
                    <p id={descId}>{alert.detail.body}</p>
                </div>
                {closeBtn}
            </li>
        )   
    }
    return (
        <li 
            className={"slide-out " + alert.detail.type}
            onAnimationEnd={() => {
                props.animationStop();
                props.removeSelf();
            }}
            onAnimationStart={() => { props.animationStart(); }}
            key={`li-${alert.detail.id}`}
            {...commonAlertProps}
        >
            <div className='alert-cont-wrapper'>
                <p id={descId}>{alert.detail.body}</p>
            </div>
            {closeBtn}
        </li>
    )   
}

/**
 * A list to render alerts, separated from the rest of the components for performance.
 * Adds any alert that has not already been removed to the list.
 * @param {*} props Should include array of alert objects.
 * @returns 
 */
const AlertList = ({...props}: {
    alerts: AlertEvent[],
    removeCallback: (alertsToRemove: AlertEvent) => void,
    animationStart: (alert: AlertEvent) => void,
    animationStop: (alert: AlertEvent) => void,
}) => {
    return (
        <ul>
            {props.alerts.map((alert) => {
                if (!alert.detail.removed) {
                    return <Alert 
                        alert={alert}
                        key={`alertlist-${alert.detail.id}`}
                        animationStart={() => props.animationStart(alert)}
                        animationStop={() => props.animationStop(alert)}
                        removeSelf={() => props.removeCallback(alert)}
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
const AlertBox = ({...props} :
    {
        alerts: AlertEvent[],
        removeCallback: (alertIdsToRemove: Set<string>) => void,
    }
) => {
    // Ids of elements currently being animated
    const ongoingAnimations = useRef(new Set<string>());
    // Ids of elements who's animation cycles have finished and can be removed
    const toRemove = useRef(new Set<string>());

    const animationStop = (alert: AlertEvent) => {
        toRemove.current.add(alert.detail.id);
        alert.detail.removed = true;
        const alertInPage = document.getElementById(alert.detail.id);
        if (alertInPage) {
            alertInPage.style.display = "none";
        }
        ongoingAnimations.current.delete(alert.detail.id);
    }
    
    const animationStart = (alert: AlertEvent) => {
        ongoingAnimations.current.add(alert.detail.id);
    }

    const dismissAlert = useCallback(
        (alert: AlertEvent) => {
            // If there are no animations currently happening then remove every task that has finished its animation cycle
            const alertInPage = document.getElementById(alert.detail.id);
            if (alertInPage) {
                animationStop(alert);
            }
            if (!ongoingAnimations.current.size) {
                props.removeCallback(toRemove.current);
                toRemove.current.clear();
            }
        },
        [props.removeCallback],
    )

    return props.alerts.length ? 
        <section 
            id="alert-wrapper"
            data-testid="alert-wrapper" 
            role="log" 
            aria-atomic="false"
            aria-label='Alerts'
            className='alert-pop-up'
        >
                <AlertList 
                    alerts={props.alerts}
                    animationStop={(alert: AlertEvent) => animationStop(alert)}
                    animationStart={(alert: AlertEvent) => animationStart(alert)}
                    removeCallback={(alert: AlertEvent) => dismissAlert(alert)}
                />
        </section> : null;
}

export const AlertWrapperContext = createContext(null);

const AlertWrapper = ({...props}: {
    children: ReactNode,
}) => {
    const [alerts, setAlerts] = useState([]);
    const thisWrapperRef = useRef(null);

    useEffect(() => {
        // Add listener for when you add a new alert
        const alert = (event: CustomEvent<AlertEvent>) => setAlerts(alerts.concat([event]));
        if (thisWrapperRef.current) {
            thisWrapperRef.current.addEventListener("alert", alert, {once: true});
        }
        return () => {
            if (thisWrapperRef.current) {
                thisWrapperRef.current.removeEventListener("alert",  alert);
            }
        }
    }, [alerts])


    return (         
        <div 
            ref={thisWrapperRef}
        >
            <AlertWrapperContext.Provider value={thisWrapperRef}>
                <AlertBox 
                    alerts={alerts} 
                    removeCallback={(alertIdsToRemove: Set<string>) => {
                        setAlerts(alerts.filter(alert => !alertIdsToRemove.has(alert)));
                    }} 
                />
                {props.children}
            </AlertWrapperContext.Provider>
        </div>
    );
}

export default AlertWrapper;
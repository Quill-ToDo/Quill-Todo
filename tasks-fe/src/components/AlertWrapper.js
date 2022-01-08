import { useEffect, useRef } from 'react';
import { useAlertStore } from '../store/StoreContext';
import { observer } from 'mobx-react-lite';

const Alert = (props) => {
    const descId = props.id + "-desc";
    const labelId = props.id + "-label";
    const btnId = props.id + "-close";
    const colorMapping = {"success": "btn-green", "failure": "btn-red", "notice": "btn-light-grey"}
    const closeBtn = <button className={"btn " + colorMapping[props.type] } id={btnId} title="Close" onClick={props.removeCallback}>
                        <i className="fas fa-times fa-fw fa-2x"></i>
                    </button>

    useEffect(() => {
        if (props.type === "failure") {
            document.getElementById(btnId).focus();
        }
    })

    if (props.type === "failure") {
        return (
            <dialog 
                id={props.id}
                role="alertdialog"
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up " + props.type}>
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>Error:</h3>
                    <p id={descId}>{props.body}</p>
                </div>
                {closeBtn}
            </dialog>
        )   
    }
    else {
        return (
            <dialog 
                id = {props.id}
                aria-live= "polite"
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up slide-out " + props.type}>
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>{props.type === "notice" ? "Notice:" : "Success!"}</h3>
                    <p id={descId}>{props.body}</p>
                </div>
                {closeBtn}
            </dialog>
        )  
    }
}

const AlertBox = observer((props) => {
    const alertStore = useAlertStore();
    // Ids of elements currently being animated
    const ongoingAnimations = useRef(new Set());
    // Ids of elements who's animation cycles have finished and can be removed
    const toRemove = useRef(new Set());
    // Ids of elements that should be animated
    var animateIds = [];

    const dismissAlert = (id) => {
        // When an event finishes its animation cycle, if there are no other animations currently happening 
        // then remove every task that has also finished its animation cycle
        ongoingAnimations.current.delete(id)
        toRemove.current.add(id);
        if (!ongoingAnimations.size) {
            for (const el of toRemove.current) {
                alertStore.remove(el);
                toRemove.current.delete(el);
            }
        }
    }

    useEffect(() => {
        // Every time the component re-renders, re-start the animation process for every alert 
        // that isn't of type "failure"
        animateIds.forEach((id) => {
            const alert = document.getElementById(id);
            ongoingAnimations.current.add(id)
            alert.addEventListener('animationend', () => {
                dismissAlert(id)
            }, false);
        });
    })


    if (alertStore.alerts.length){
        return (
            <div id="alert-wrapper">
                {alertStore.alerts.map((alert) => {
                    const id = "alert-"+alert.id; 
                    if (alert.type !== "failure") {
                        animateIds.push(id)
                    }
                    return <Alert 
                        id={id}
                        key={id}
                        body={alert.body} 
                        type={alert.type}
                        removeCallback={()=>dismissAlert(id)}
                        />
                    })}
            </div>
        )
    }
    else { return null }
})

export default AlertBox;
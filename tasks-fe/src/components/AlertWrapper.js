import { useEffect, useRef } from 'react';
import close from '../static/images/close.png';
import { useAlertStore } from '../store/StoreContext';
import { observer } from 'mobx-react-lite';

const Alert = (props) => {
    return (
        < dialog id = {
            props.id
        }
        className = {
            "alert-pop-up " + props.type + (props.type !== "failure" ? " slide-out" : "")
        } >
            <p>{props.body}</p>
            <img src={close} alt="An x to close" onClick={props.removeCallback}></img>
        </dialog>
    )
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
        try {
            document.getElementById(id).style.display = "none";
        }
        catch (e) {
            // This happens sometimes when the element has been removed before the animation finishes.
            // It finishes and then tries to do this again.
            if (!(e instanceof TypeError)) {
                throw e;
            }
        }

        console.log(ongoingAnimations.current.size)
        if (!ongoingAnimations.size) {
            for (const el of toRemove.current) {
                alertStore.remove(el);
                toRemove.current.delete(el);
            }
        }
    }

    // Manipulate animations and counter for number of animations in progress
    // const incAnimations = () => {
    //     ongoingAnimations.current += 1;
    //     console.log("inc")
    // };
    // const decAnimations = () => {
    //     ongoingAnimations.current -= 1;
    //     console.log("dec")
    // };
    // const playAnimation = (animation) => {incAnimations(); animation.play()}
    // const stopAnimation = (animation) => {decAnimations(); animation.cancel()}

    // const slideOutAnimation = [
    //     {right: 0},
    //     {right: 0, opacity: .5, offset: .6, easing: "ease-in"},
    //     {right: "-100%", opacity: 0}
    // ]

    useEffect(() => {
        // Every time the component re-renders, re-start the animation process for every alert 
        // that isn't of type "failure"
        animateIds.forEach((id) => {
            const alert = document.getElementById(id);
            ongoingAnimations.current.add(id)
            // alert.addEventListener('animationstart', () => {incAnimations()}, false);
            // alert.addEventListener('animationcancel', () => {decAnimations()}, false);
            alert.addEventListener('animationend', () => {dismissAlert(id)}, false);

            // alert.playAnimation()
            // var animation = new Animation(new KeyframeEffect(alert, slideOutAnimation, {"duration": 3000, "delay": 3000}),);
            // playAnimation(animation);
            // animation.onfinish = () => {decAnimations(); dismissAlert(id)};
            // alert.onmouseenter = () => {stopAnimation(animation)};
            // alert.onmouseleave = () => {playAnimation(animation)};
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
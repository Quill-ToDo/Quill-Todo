import { FloatingPortal, offset, Placement, ReferenceElement, shift, UseDismissProps, UseFloatingOptions, UseFloatingReturn } from "@floating-ui/react";
import { observer } from "mobx-react-lite";
import { cloneElement, ComponentPropsWithRef, Dispatch, ReactElement, RefObject, SetStateAction, useEffect, useRef, useState } from "react";
import { PositionedPopupAndReferenceElement } from "./FloatingUiHelpers";
import { combineClassNamePropAndString, ICONS } from "./constants";
import { AnyNode } from "postcss";
import { makeDraggable } from "./Draggable";

/**
 * Popup helper to serve as an interface between Quill and 
 * 3rd party libraries. Quill devs should ideally not have 
 * to touch third party APIs very often, just once to set up the interface.
 * Given a render prop, the item to popup, 
 * and Floating UI configuration options, return
 * the anchor ref element to be rendered. Subscribe to
 * wider popup context and show popup when the state
 * value specified in UseFloatingOptions is called.
 * 
 * If draggable=true, at least one element should have a ".draggable-handle" class
 * To apply header styling, make the first element in the renderPopUpContent 
 * a header element
 * 
 * @returns the rendered anchor element for the popup
 */
export const PopupOnClick = observer((
    {   
        renderPopupContent,
        renderElementToClick,
        position="positioned",
        placement="right",
        alignment="middle",
        doneLoading=true, 
        draggable=true, 
        fullscreenable=false, 
        ...props
    } : {
        renderPopupContent: (closePopup: ()=>void) => ReactElement<any>,
        renderElementToClick: (openPopup: ()=>void) => ReactElement<any>,
        position?: "centered" | "positioned",
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
        doneLoading?: boolean,
        draggable?: boolean,
        fullscreenable?: boolean,
    }) => {

    const [showPopup, setShowPopup] = useState(false);
    const close = () => setShowPopup(false);
    const open = () => setShowPopup(true);

    // useEffect(() => {
    //     if (draggable && popupRef.current !== null) {
    //         makeDraggable(popupRef.current)
    //     };
    // }, [popupRef])

    const loading = <div className="loading">
        <p>Loading...</p>
    </div>;
        
    let innerPopupContent = <section 
        className={combineClassNamePropAndString({className: `popup`, props: props})}>
        
        { doneLoading ? renderPopupContent(close) : loading }
    </section>;

    if (position === "centered") {
        return <>
            {/* <NestablePopup floatingElement={innerPopupContent} > 
            </NestablePopup> */}
        </>;
    } 
    else if (position === "positioned") {
        const positioning: UseFloatingOptions = {
            open: showPopup,
            onOpenChange: setShowPopup,
            placement: `${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement,
            // middleware: [
            //     offset(({rects}) => {
            //         return (
            //         -rects.floating.width / 2
            //         );
            //     }),
            //     shift()],
        };
        const dismissOptions: UseDismissProps = {
            outsidePress: true,
            referencePress: true,
            bubbles: false,
        }
    
        return <PositionedPopupAndReferenceElement
            popupElement={innerPopupContent}
            popupPositioningOptions={positioning}
            dismissPopupOptions={dismissOptions}
            renderRef={(ref: any, props: any) => {
                return <div 
                    ref={ref.setReference}
                    className={combineClassNamePropAndString({className: "popup-anchor", props: props})}
                    {...props}
                >
                    { renderElementToClick(open) } 
                </div> 
            }}
        /> 
    }
});

export const ContextMenuPopup = observer((
    {   
        header,
        labelsAndClickCallbacks,
        renderAnchorElementToClick,
        placement,
        alignment,
        ...props
    } : {
        header: ReactElement<"any">,
        labelsAndClickCallbacks: {
            label: string,
            content: ReactElement<any>, 
            onClick: () => void 
        }[],
        renderAnchorElementToClick: (openPopup: ()=>void) => ReactElement<any>,
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
    }
) => {
    return <PopupOnClick
        renderElementToClick={renderAnchorElementToClick}
        renderPopupContent={(close) => <>
        { header }
        <ul>
            { labelsAndClickCallbacks.map(labelAndCallback => 
            <li key={labelAndCallback.label}>
                <button
                        onClick={labelAndCallback.onClick}
                        aria-label={labelAndCallback.label} 
                        title={labelAndCallback.label}
                        className={combineClassNamePropAndString({className: `item`, props: props})} 
                        > 
                        { labelAndCallback.content }
                    </button>
            </li>
        )}
        </ul>
        </>
        }
        placement={placement}
        alignment={alignment}
        {...{className: "context-menu"}}> 
    </PopupOnClick>
})
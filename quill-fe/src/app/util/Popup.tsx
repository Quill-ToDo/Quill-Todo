import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    ForwardRefRenderFunction, 
    ReactElement, 
    LegacyRef,
} from "react";
import { combineClassNamePropAndString } from '@/app/util/jsTools';

import { FloatingUiAttachedPopup, FloatingUiPersistentPopupAnchor } from "../3rd-party/FloatingUiHelpers";
import "./popup.css"
import { ReferenceType } from "@floating-ui/react";

export const POPUP_CLASS = "popup";
export const POPUP_ANCHOR_CLASS = "popup-anchor";

// Positioning options that will be used to calculate popup position
export type PopupPositioningConfig = {
    draggable?: boolean,
    position?: "centered" | "positioned",
    placement?: "left" | "bottom" | "right" | "top" | "centered" | "auto",
    alignment?: "start" | "middle" | "end",
    useDragHandle?: boolean,
    popupMargin?: number,
    closeWhenClickOutside?: boolean,
}

export type PopupAnchorRenderMethods = {
    popupRenderMethod: PopupRenderMethod,
    anchorRenderMethod: AnchorRenderMethod,
}

export type PopupParams = {
    closePopup: (callback?: any) => any,
} & ComponentPropsWithoutRef<any>;

export type PopupRenderMethod = ForwardRefRenderFunction<any, PopupParams>;

export type AnchorRenderMethod = ForwardRefRenderFunction<any, {
    openPopup: (callback?: any) => any,
} & ComponentPropsWithoutRef<any>>;

/**
 * Given a render method for an anchor element, the content to popup, 
 * and popup configuration options, return the anchor ref element to be rendered
 * with popup listners attached.
 * If the anchor element is unmounted, the popup will as well. If this is not desired behavior, 
 * use PersistentPopupOnClick instead.
 * 
 * # renderPopUpContent requirements:
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied that will serve as the container for the popup
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.closePopup()` somewhere to close popup if desired  
 * 
 *  If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class passed in "dragHandleClass" to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return button element 
 * - apply passed ref to button element
 * - spread props in props.anchorProps to button element (as first parameter so they can be overridden if desired)
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.openPopup()` in an onClick method on returned button  
 * 
 * @returns the rendered anchor element for the popup
 */
export const AttachedPopupOnClick = observer((
    // helper to serve as an interface between Quill and any
    // 3rd party libraries.
    {   
        position="positioned",
        placement="auto",
        alignment="middle",
        draggable=false, 
        useDragHandle=false,
        closeWhenClickOutside=true,
        popupRenderMethod,
        anchorRenderMethod,
    } : PopupPositioningConfig & PopupAnchorRenderMethods) => {
        return <FloatingUiAttachedPopup 
            popupRenderMethod={popupRenderMethod}
            anchorRenderMethod={anchorRenderMethod}
            position={position}
            placement={placement}
            alignment={alignment}
            draggable={draggable}
            useDragHandle={useDragHandle}
            closeWhenClickOutside={closeWhenClickOutside}
        />;
});

/**
 * Given the content to popup and popup configuration options, mount a popup to the DOM. 
 * This popup version returns a reference that an anchor element can use for positioning, but 
 * the popup will stay mounted even if the reference anchor element is unmounted from the DOM.
 * If the popup should dismount when an anchor element is, use AttachedPopupOnClick instead.
 * Also returns an open method to call when it should open the popup and a close
 * method to use in child popup content or as desired to close the popup.
 * 
 * # renderPopUpContent requirements:
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied that will serve as the container for the popup
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.closePopup()` somewhere to close popup if desired  
 * 
 *  If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class passed in "dragHandleClass" to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return element with forwarded ref and props applied
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString( "your-class-name", props.anchorProps)}` to include passed classNames.
 * - call `props.openPopup()` somewhere to open popup  
 * 
 * @returns setup methods to get and set the popup content
 */
export const AnchorWithPersistentPopupAttached = observer((
    {   
        position="positioned",
        placement="right",
        alignment="middle",
        draggable=false, 
        useDragHandle=false,
        closeWhenClickOutside=true,
        popupRenderMethod,
        anchorRenderMethod, 
    }: PopupPositioningConfig & PopupAnchorRenderMethods) => {
        // Dont accept component props here because would be unclear if its for anchor or popup.
        // pass component props in the render methods for anchor or popup
        // Popup helper to serve as an interface between Quill and
        // 3rd party libraries.
        // Use context to hold the popup content so that it may persist even when the anchor element
        // is unmounteds from the dom

        return <FloatingUiPersistentPopupAnchor 
            popupRenderMethod={popupRenderMethod}
            anchorRenderMethod={anchorRenderMethod}
            position={position}
            placement={placement}
            alignment={alignment}
            draggable={draggable}
            useDragHandle={useDragHandle}
            closeWhenClickOutside={closeWhenClickOutside}
        />;
        
        // return <Suspense fallback={popupRenderMethod({closePopup: () => {}}, forwardedPopupRef)} 
        // >
            // return <FloatingUiPersistentPopupAnchor 
            //     popupRenderMethod={popupRenderMethod}
            //     anchorRenderMethod={anchorRenderMethod}
            //     position={position}
            //     placement={placement}
            //     alignment={alignment}
            //     draggable={draggable}
            //     useDragHandle={useDragHandle}
            //     closeWhenClickOutside={closeWhenClickOutside}
            // />
        // </Suspense>;
});


/**
 * Simple popup menu containing a list of clickable items. Add the property:
 * aria-haspopup="menu"
 * to the element returned by renderElementToClick for accessibility.
 */
export const ContextMenuPopup = observer((
    {   
        labelsAndClickCallbacks,
        renderElementToClick,
        header,
        placement="right",
        alignment="middle",
        ...passedProps
    } : {
        labelsAndClickCallbacks: {
            label: string, // Accessibility, the name
            content: ReactElement<any>,  // Content to render inside <li> and button. ex: <>{ICONS.TRASH}<p>Delete</p></>
            onClick: () => void, 
            visible: boolean, // Should this element appear in the content menu?
        }[],
        renderElementToClick: AnchorRenderMethod, // Must stay a callback
        header?: ReactElement<"any">, // Optional header content for the context menu
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
    }
) => {
    return <AttachedPopupOnClick
        anchorRenderMethod={renderElementToClick}
        popupRenderMethod={({closePopup, ...props}, ref) => 
            <div 
              ref={ref as LegacyRef<HTMLDivElement>}
              {...props}
              {...passedProps}
              className={(combineClassNamePropAndString(`context-menu ${props.className ? props.className : ""}`, passedProps))}
            >
                <menu
                    role="menu"
                >
                    { header }
                    <ul>
                        { labelsAndClickCallbacks.filter(labelAndCallback => labelAndCallback.visible)
                        .map(labelAndCallback =>

                        <li key={labelAndCallback.label}>
                            <button
                                    onClick={() => {
                                        labelAndCallback.onClick(); 
                                        closePopup( );
                                    }}
                                    aria-labelledby={labelAndCallback.label} 
                                    title={labelAndCallback.label}
                                    className={`item`} 
                                    > 
                                    { labelAndCallback.content }
                                </button>
                        </li>
                    )}
                    </ul>
                </menu>
            </div>
        }
        placement={placement}
        alignment={alignment}
        > 
    </AttachedPopupOnClick>
})


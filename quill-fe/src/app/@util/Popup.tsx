import { observer } from "mobx-react-lite";
import { ReactElement } from "react";
import { combineClassNamePropAndString } from "./constants";
import { FloatingUiPopupImplementation } from "../3rd-party/FloatingUiHelpers";
import "./popup.css"

export type RenderPopUpContent = ({
    closePopup, 
    dragHandleProps
}: {
    closePopup: ()=>void,
    dragHandleProps?: any,
}) => ReactElement<any>;

export type PopupParams = {
    renderPopupContent: RenderPopUpContent,
    renderElementToClick: (openPopup: ()=>void) => ReactElement<any>,
    position?: "centered" | "positioned",
    placement?: "left" | "bottom" | "right" | "top" | "centered",
    alignment?: "start" | "middle" | "end",
    doneLoading?: boolean,
    draggable?: boolean,
    useDragHandle?: boolean,
    fullscreenable?: boolean
}

/**
 * Popup helper to serve as an interface between Quill and any
 * 3rd party libraries.
 * Given a render prop, the item to popup, 
 * and Floating UI configuration options, return
 * the anchor ref element to be rendered. Subscribe to
 * wider popup context and show popup when the state
 * value specified in UseFloatingOptions is called.
 * 
 * If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class DRAGGABLE_HANDLE_CLASS to specify which element should be used as the handle.
 * 
 * @returns the rendered anchor element for the popup
 */
export const PopupOnClick = observer((
    {   
        position="positioned",
        placement="right",
        alignment="middle",
        doneLoading=true, 
        draggable=false, 
        fullscreenable=false,
        useDragHandle=false, 
        ...props
    } : PopupParams) => {
        const defaultProps = {
            position: position,
            placement: placement,
            alignment: alignment,
            doneLoading: doneLoading,
            draggable: draggable,
            useDragHandle: useDragHandle,
        }

        return <FloatingUiPopupImplementation 
            {...props}
            {...defaultProps}
        />;
});

/**
 * Simple popup menu containing a list of clickable items.
 */
export const ContextMenuPopup = observer((
    {   
        labelsAndClickCallbacks,
        renderAnchorElementToClick,
        header,
        placement="right",
        alignment="middle",
        ...props
    } : {
        labelsAndClickCallbacks: {
            label: string, // Accessibility, the name
            content: ReactElement<any>,  // Content to render inside <li> and button. ex: <>{ICONS.TRASH}<p>Delete</p></>
            onClick: () => void, 
            visible: boolean, // Should this element appear in the content menu?
        }[],
        renderAnchorElementToClick: (openPopup: ()=>void) => ReactElement<any>, // Must stay a callback
        header?: ReactElement<"any">, // Optional header content for the context menu
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
    }
) => {
    return <PopupOnClick
        renderElementToClick={renderAnchorElementToClick}
        renderPopupContent={({closePopup}) => <>
        { header }
        <ul>
            { labelsAndClickCallbacks.filter(labelAndCallback => labelAndCallback.visible)
            .map(labelAndCallback =>

            <li key={labelAndCallback.label}>
                <button
                        onClick={() => {labelAndCallback.onClick(); closePopup();}}
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